from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from database import get_db
from models import (
    User, Profile, Booking, BookingPayment, ArtistAvailability,
    BookingStatus, BookingPaymentType, BookingPaymentStatus, Notification,
    SystemSetting
)
from schemas import (
    BookingCreate, BookingStatusUpdate, BookingResponse,
    BookingDetailResponse, BookingPaymentResponse, BookingPriceCalculation
)
from auth import get_current_active_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

PLATFORM_FEE_DEFAULT = 3000
ADDON_DEFAULTS = {"accommodation": 5000, "transport": 3000, "security": 4000}


def _get_setting(db: Session, key: str, default: str) -> str:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return row.value if row else default


def get_platform_fee(db: Session) -> float:
    try:
        return float(_get_setting(db, "platform_fee", str(PLATFORM_FEE_DEFAULT)))
    except (ValueError, TypeError):
        return float(PLATFORM_FEE_DEFAULT)


def get_addon_prices(db: Session) -> dict:
    return {
        "accommodation": float(_get_setting(db, "accommodation_price", str(ADDON_DEFAULTS["accommodation"]))),
        "transport": float(_get_setting(db, "transport_price", str(ADDON_DEFAULTS["transport"]))),
        "security": float(_get_setting(db, "security_price", str(ADDON_DEFAULTS["security"]))),
    }


def calculate_pricing(
    artist_fee: float,
    platform_fee: float,
    accommodation_selected: bool = False,
    accommodation_price: float = 0,
    transport_selected: bool = False,
    transport_price: float = 0,
    security_selected: bool = False,
    security_price: float = 0,
) -> dict:
    acc_price = max(float(accommodation_price), 0) if accommodation_selected else 0
    trn_price = max(float(transport_price), 0) if transport_selected else 0
    sec_price = max(float(security_price), 0) if security_selected else 0

    selected_addon_total = acc_price + trn_price + sec_price

    total = artist_fee + platform_fee + selected_addon_total
    advance = (artist_fee * 0.5) + platform_fee + selected_addon_total
    remaining = total - advance

    return {
        "artist_fee": artist_fee,
        "platform_fee": platform_fee,
        "accommodation_selected": accommodation_selected,
        "accommodation_price": acc_price,
        "transport_selected": transport_selected,
        "transport_price": trn_price,
        "security_selected": security_selected,
        "security_price": sec_price,
        "total_amount": round(total, 2),
        "advance_amount": round(advance, 2),
        "remaining_amount": round(remaining, 2),
    }


def enrich_booking(booking: Booking, db: Session) -> dict:
    """Add artist/organizer profile data to booking response"""
    data = {
        "id": booking.id,
        "organizer_id": booking.organizer_id,
        "artist_id": booking.artist_id,
        "event_date": booking.event_date,
        "event_type": booking.event_type,
        "location": booking.location,
        "duration": booking.duration,
        "audience_size": booking.audience_size,
        "event_details": booking.event_details,
        "artist_fee": booking.artist_fee,
        "platform_fee": booking.platform_fee,
        # Add-ons
        "accommodation_selected": booking.accommodation_selected or False,
        "accommodation_price": booking.accommodation_price or 0,
        "transport_selected": booking.transport_selected or False,
        "transport_price": booking.transport_price or 0,
        "security_selected": booking.security_selected or False,
        "security_price": booking.security_price or 0,
        # Totals
        "total_amount": booking.total_amount,
        "advance_amount": booking.advance_amount or 0,
        "advance_paid": booking.advance_paid,
        "remaining_amount": booking.remaining_amount,
        "status": booking.status,
        "payment_status": booking.payment_status or "unpaid",
        "organizer_completed": booking.organizer_completed,
        "artist_completed": booking.artist_completed,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
    }
    artist_profile = db.query(Profile).filter(Profile.user_id == booking.artist_id).first()
    organizer_profile = db.query(Profile).filter(Profile.user_id == booking.organizer_id).first()
    organizer_user = db.query(User).filter(User.id == booking.organizer_id).first()
    
    if artist_profile:
        data["artist_name"] = artist_profile.name
        data["artist_category"] = artist_profile.category
        data["artist_location"] = artist_profile.location
        data["artist_rating"] = artist_profile.average_rating
    if organizer_profile:
        data["organizer_name"] = organizer_profile.name
    if organizer_user:
        data["organizer_email"] = organizer_user.email
    return data


# ─── Price Calculator ──────────────────────────────────────────────
@router.get("/calculate-price")
def get_price_calculation(
    artist_id: int,
    accommodation_selected: bool = False,
    transport_selected: bool = False,
    security_selected: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate booking price for an artist, optionally with add-ons"""
    profile = db.query(Profile).filter(Profile.user_id == artist_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Artist profile not found")
    
    artist_fee = profile.min_price or 0
    pf = get_platform_fee(db)
    addons = get_addon_prices(db)

    pricing = calculate_pricing(
        artist_fee,
        pf,
        accommodation_selected=accommodation_selected,
        accommodation_price=addons["accommodation"] if accommodation_selected else 0,
        transport_selected=transport_selected,
        transport_price=addons["transport"] if transport_selected else 0,
        security_selected=security_selected,
        security_price=addons["security"] if security_selected else 0,
    )
    pricing["default_addon_prices"] = addons
    return pricing


# ─── Get default add-on prices ────────────────────────────────────
@router.get("/addon-prices")
def get_addon_prices_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return the current default add-on prices"""
    return get_addon_prices(db)


# ─── Create Booking ────────────────────────────────────────────────
@router.post("")
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a booking request (organizers only)"""
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Only organizers can book artists")
    
    # Validate artist
    artist = db.query(User).filter(User.id == booking_data.artist_id).first()
    if not artist or artist.role != "artist":
        raise HTTPException(status_code=404, detail="Artist not found")
    
    if booking_data.artist_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book yourself")
    
    # Strip timezone info for comparison (DB stores naive UTC datetimes)
    event_date = booking_data.event_date.replace(tzinfo=None) if booking_data.event_date.tzinfo else booking_data.event_date
    
    if event_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Event date must be in the future")
    
    # Check double-booking (same date for same artist)
    event_date_only = event_date.date()
    existing = db.query(Booking).filter(
        Booking.artist_id == booking_data.artist_id,
        func.date(Booking.event_date) == event_date_only,
        Booking.status.in_([
            BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED
        ])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Artist is already booked for this date")
    
    # Check artist availability block
    blocked = db.query(ArtistAvailability).filter(
        ArtistAvailability.artist_id == booking_data.artist_id,
        func.date(ArtistAvailability.blocked_date) == event_date_only
    ).first()
    if blocked:
        raise HTTPException(status_code=400, detail="Artist has blocked this date")
    
    # ── SERVER-SIDE PRICING (never trust frontend totals) ──
    profile = db.query(Profile).filter(Profile.user_id == booking_data.artist_id).first()
    artist_fee = profile.min_price if profile and profile.min_price else 0

    acc_selected = bool(booking_data.accommodation_selected)
    trn_selected = bool(booking_data.transport_selected)
    sec_selected = bool(booking_data.security_selected)

    pf = get_platform_fee(db)
    addon_defaults = get_addon_prices(db)

    pricing = calculate_pricing(
        artist_fee,
        pf,
        accommodation_selected=acc_selected,
        accommodation_price=addon_defaults["accommodation"] if acc_selected else 0,
        transport_selected=trn_selected,
        transport_price=addon_defaults["transport"] if trn_selected else 0,
        security_selected=sec_selected,
        security_price=addon_defaults["security"] if sec_selected else 0,
    )

    # Prevent negative / invalid pricing
    if pricing["artist_fee"] < 0 or pricing["total_amount"] < 0:
        raise HTTPException(status_code=400, detail="Invalid pricing calculated")
    
    new_booking = Booking(
        organizer_id=current_user.id,
        artist_id=booking_data.artist_id,
        event_date=event_date,
        event_type=booking_data.event_type,
        location=booking_data.location,
        duration=booking_data.duration,
        audience_size=booking_data.audience_size,
        event_details=booking_data.event_details,
        artist_fee=pricing["artist_fee"],
        platform_fee=pricing["platform_fee"],
        accommodation_selected=pricing["accommodation_selected"],
        accommodation_price=pricing["accommodation_price"],
        transport_selected=pricing["transport_selected"],
        transport_price=pricing["transport_price"],
        security_selected=pricing["security_selected"],
        security_price=pricing["security_price"],
        total_amount=pricing["total_amount"],
        advance_amount=pricing["advance_amount"],
        advance_paid=0,
        remaining_amount=pricing["total_amount"],
        status=BookingStatus.PENDING,
        payment_status="unpaid",
    )
    
    db.add(new_booking)
    db.flush()
    
    # Notify artist
    notification = Notification(
        user_id=booking_data.artist_id,
        title="New Booking Request",
        message=f"You have a new booking request for {booking_data.event_type} on {event_date.strftime('%b %d, %Y')}",
        type="booking",
        link=f"/bookings"
    )
    db.add(notification)
    db.commit()
    db.refresh(new_booking)
    
    return enrich_booking(new_booking, db)


# ─── List Bookings ────────────────────────────────────────────────
@router.get("")
def get_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all bookings for current user (as organizer or artist)"""
    if current_user.role == "admin":
        query = db.query(Booking)
    else:
        query = db.query(Booking).filter(
            or_(
                Booking.organizer_id == current_user.id,
                Booking.artist_id == current_user.id
            )
        )
    
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    return [enrich_booking(b, db) for b in bookings]


# ─── Get Single Booking ───────────────────────────────────────────
@router.get("/{booking_id}")
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific booking with full details"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if (booking.organizer_id != current_user.id and 
        booking.artist_id != current_user.id and 
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return enrich_booking(booking, db)


# ─── Accept Booking (Artist) ──────────────────────────────────────
@router.put("/{booking_id}/accept")
def accept_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Artist accepts a booking — moves to awaiting_payment"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.artist_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the artist can accept")
    
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not in pending status")
    
    booking.status = BookingStatus.AWAITING_PAYMENT
    booking.updated_at = datetime.utcnow()
    
    # Notify organizer
    notification = Notification(
        user_id=booking.organizer_id,
        title="Booking Accepted!",
        message=f"Your booking has been accepted. Please pay the advance to confirm.",
        type="booking",
        link="/bookings"
    )
    db.add(notification)
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Reject Booking (Artist) ──────────────────────────────────────
@router.put("/{booking_id}/reject")
def reject_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Artist rejects a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.artist_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the artist can reject")
    
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not in pending status")
    
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    
    notification = Notification(
        user_id=booking.organizer_id,
        title="Booking Declined",
        message=f"Unfortunately, the artist declined your booking request.",
        type="booking",
        link="/bookings"
    )
    db.add(notification)
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Pay Advance (Organizer) ──────────────────────────────────────
@router.post("/{booking_id}/pay-advance")
def pay_advance(
    booking_id: int,
    payment_method: str = Query("upi"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Organizer initiates advance payment — waits for admin confirmation if UPI"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the organizer can pay")
    
    if booking.status not in (BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT):
        raise HTTPException(status_code=400, detail="Booking is not awaiting payment")
    
    existing_pending = db.query(BookingPayment).filter(
        BookingPayment.booking_id == booking_id,
        BookingPayment.payment_type == BookingPaymentType.ADVANCE,
        BookingPayment.status == BookingPaymentStatus.PENDING,
    ).first()

    if existing_pending:
        booking.payment_status = "payment_pending"
        booking.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(booking)
        result = enrich_booking(booking, db)
        result["payment_method"] = payment_method
        result["transaction_id"] = existing_pending.transaction_id
        result["advance_amount_due"] = existing_pending.amount
        return result

    pricing = calculate_pricing(
        booking.artist_fee,
        booking.platform_fee,
        accommodation_selected=booking.accommodation_selected,
        accommodation_price=booking.accommodation_price,
        transport_selected=booking.transport_selected,
        transport_price=booking.transport_price,
        security_selected=booking.security_selected,
        security_price=booking.security_price,
    )
    advance_amount = pricing["advance_amount"]
    
    txn_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"

    payment = BookingPayment(
        booking_id=booking.id,
        payment_type=BookingPaymentType.ADVANCE,
        amount=advance_amount,
        status=BookingPaymentStatus.PENDING,
        transaction_id=txn_id,
        paid_at=None,
    )
    db.add(payment)

    booking.payment_status = "payment_pending"
    booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    result = enrich_booking(booking, db)
    result["payment_method"] = payment_method
    result["transaction_id"] = txn_id
    result["advance_amount_due"] = advance_amount
    return result


# ─── Admin confirms payment → booking confirmed ──────────────────
@router.post("/{booking_id}/confirm-payment")
def confirm_payment(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatus.CONFIRMED and booking.payment_status == "advance_paid":
        raise HTTPException(status_code=400, detail="Advance already confirmed for this booking")

    pending_payment = db.query(BookingPayment).filter(
        BookingPayment.booking_id == booking_id,
        BookingPayment.payment_type == BookingPaymentType.ADVANCE,
        BookingPayment.status == BookingPaymentStatus.PENDING,
    ).first()

    advance_amount = booking.advance_amount or (booking.total_amount * 0.5)

    if pending_payment:
        pending_payment.status = BookingPaymentStatus.PAID
        pending_payment.paid_at = datetime.utcnow()
        advance_amount = pending_payment.amount
    else:
        payment = BookingPayment(
            booking_id=booking.id,
            payment_type=BookingPaymentType.ADVANCE,
            amount=advance_amount,
            status=BookingPaymentStatus.PAID,
            transaction_id=f"ADM_{uuid.uuid4().hex[:12].upper()}",
            paid_at=datetime.utcnow(),
        )
        db.add(payment)

    booking.advance_paid = advance_amount
    booking.advance_amount = advance_amount
    booking.remaining_amount = booking.total_amount - advance_amount
    booking.status = BookingStatus.CONFIRMED
    booking.payment_status = "advance_paid"
    booking.updated_at = datetime.utcnow()

    existing_avail = db.query(ArtistAvailability).filter(
        ArtistAvailability.booking_id == booking.id
    ).first()
    if not existing_avail:
        db.add(ArtistAvailability(
            artist_id=booking.artist_id,
            blocked_date=booking.event_date,
            booking_id=booking.id,
        ))

    artist_profile = db.query(Profile).filter(Profile.user_id == booking.artist_id).first()
    if artist_profile:
        artist_profile.total_hires = (artist_profile.total_hires or 0) + 1

    db.add(Notification(
        user_id=booking.artist_id,
        title="Booking Confirmed!",
        message=f"Advance payment received. Your booking for {booking.event_type} on {booking.event_date.strftime('%b %d, %Y')} is confirmed.",
        type="booking", link="/bookings",
    ))
    db.add(Notification(
        user_id=booking.organizer_id,
        title="Payment Confirmed!",
        message=f"Your payment has been verified by admin. Booking for {booking.event_type} is confirmed.",
        type="payment", link="/bookings",
    ))
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Admin confirms remaining payment ────────────────────────────
@router.post("/{booking_id}/confirm-remaining")
def confirm_remaining_payment(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    remaining = (booking.total_amount or 0) - (booking.advance_paid or 0)
    if remaining <= 0:
        raise HTTPException(status_code=400, detail="No remaining amount due")

    if booking.payment_status == "fully_paid":
        raise HTTPException(status_code=400, detail="Already fully paid")

    payment = BookingPayment(
        booking_id=booking.id,
        payment_type=BookingPaymentType.FINAL,
        amount=remaining,
        status=BookingPaymentStatus.PAID,
        transaction_id=f"REM_{uuid.uuid4().hex[:12].upper()}",
        paid_at=datetime.utcnow(),
    )
    db.add(payment)

    booking.remaining_amount = 0
    booking.payment_status = "fully_paid"
    booking.updated_at = datetime.utcnow()

    db.add(Notification(
        user_id=booking.organizer_id,
        title="Remaining Payment Confirmed",
        message=f"Your remaining payment of ₹{remaining:,.0f} for {booking.event_type} has been verified.",
        type="payment", link="/bookings",
    ))
    db.add(Notification(
        user_id=booking.artist_id,
        title="Full Payment Received",
        message=f"Full payment for your booking ({booking.event_type}) has been confirmed.",
        type="payment", link="/bookings",
    ))
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Invoice generation ──────────────────────────────────────────
@router.get("/{booking_id}/invoice")
def get_invoice_data(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if (booking.organizer_id != current_user.id
            and booking.artist_id != current_user.id
            and current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorised")

    organizer = db.query(User).filter(User.id == booking.organizer_id).first()
    artist_prof = db.query(Profile).filter(Profile.user_id == booking.artist_id).first()
    org_prof = db.query(Profile).filter(Profile.user_id == booking.organizer_id).first()

    payments = db.query(BookingPayment).filter(
        BookingPayment.booking_id == booking_id,
        BookingPayment.status == BookingPaymentStatus.PAID,
    ).all()

    addon_total = sum(filter(None, [
        booking.accommodation_price if booking.accommodation_selected else 0,
        booking.transport_price if booking.transport_selected else 0,
        booking.security_price if booking.security_selected else 0,
    ]))

    return {
        "invoice_number": f"CL-INV-{booking.id:06d}",
        "booking_id": booking.id,
        "date": (booking.created_at or datetime.utcnow()).strftime("%d %b %Y"),
        "event_date": booking.event_date.strftime("%d %b %Y") if booking.event_date else "",
        "event_type": booking.event_type,
        "location": booking.location,
        "duration": booking.duration,

        "organizer_name": org_prof.name if org_prof else (organizer.email if organizer else ""),
        "organizer_email": organizer.email if organizer else "",
        "artist_name": artist_prof.name if artist_prof else "",
        "artist_category": artist_prof.category if artist_prof else "",

        "artist_fee": booking.artist_fee,
        "platform_fee": booking.platform_fee,
        "accommodation_selected": booking.accommodation_selected or False,
        "accommodation_price": booking.accommodation_price or 0,
        "transport_selected": booking.transport_selected or False,
        "transport_price": booking.transport_price or 0,
        "security_selected": booking.security_selected or False,
        "security_price": booking.security_price or 0,
        "addon_total": addon_total,
        "total_amount": booking.total_amount,
        "advance_paid": booking.advance_paid or 0,
        "remaining_amount": booking.remaining_amount or 0,

        "status": booking.status.value if booking.status else "",
        "payment_status": booking.payment_status or "",
        "payments": [
            {
                "type": p.payment_type.value if p.payment_type else "",
                "amount": p.amount,
                "transaction_id": p.transaction_id,
                "paid_at": p.paid_at.strftime("%d %b %Y %H:%M") if p.paid_at else "",
            }
            for p in payments
        ],
    }


# ─── Pay Remaining (Organizer) ────────────────────────────────────
@router.post("/{booking_id}/pay-remaining")
def pay_remaining(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Organizer pays remaining amount after event completion"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the organizer can pay")
    
    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Booking must be confirmed or completed to pay remaining")
    
    if booking.remaining_amount <= 0:
        raise HTTPException(status_code=400, detail="No remaining amount to pay")
    
    remaining = booking.remaining_amount
    payment = BookingPayment(
        booking_id=booking.id,
        payment_type=BookingPaymentType.FINAL,
        amount=remaining,
        status=BookingPaymentStatus.PAID,
        transaction_id=f"TXN_{uuid.uuid4().hex[:12].upper()}",
        paid_at=datetime.utcnow()
    )
    db.add(payment)
    
    booking.advance_paid = booking.advance_paid + remaining
    booking.remaining_amount = 0
    booking.payment_status = "fully_paid"
    booking.updated_at = datetime.utcnow()
    
    notification = Notification(
        user_id=booking.artist_id,
        title="Final Payment Received!",
        message=f"Final payment of ₹{remaining:,.0f} received for {booking.event_type}.",
        type="booking",
        link="/bookings"
    )
    db.add(notification)
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Cancel Booking (Organizer) ───────────────────────────────────
@router.put("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Organizer cancels a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the organizer can cancel")
    
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")
    
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    
    # Remove availability block
    db.query(ArtistAvailability).filter(
        ArtistAvailability.booking_id == booking.id
    ).delete()
    
    notification = Notification(
        user_id=booking.artist_id,
        title="Booking Cancelled",
        message=f"The organizer has cancelled the booking for {booking.event_type}.",
        type="booking",
        link="/bookings"
    )
    db.add(notification)
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Mark Completed (Either party) ────────────────────────────────
@router.put("/{booking_id}/complete")
def mark_completed(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark event as completed. Both parties must confirm."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Booking must be confirmed to complete")
    
    if current_user.id == booking.organizer_id:
        booking.organizer_completed = True
    elif current_user.id == booking.artist_id:
        booking.artist_completed = True
    elif current_user.role == "admin":
        booking.organizer_completed = True
        booking.artist_completed = True
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If both confirmed, complete only when final payment is already settled.
    if booking.organizer_completed and booking.artist_completed:
        if (booking.remaining_amount or 0) > 0 or booking.payment_status != "fully_paid":
            raise HTTPException(
                status_code=400,
                detail="Final payment must be confirmed before completing the booking",
            )
        booking.status = BookingStatus.COMPLETED

        # Notify both
        for uid in [booking.organizer_id, booking.artist_id]:
            notification = Notification(
                user_id=uid,
                title="Booking Completed!",
                message=f"The booking for {booking.event_type} has been marked as completed.",
                type="booking",
                link="/bookings"
            )
            db.add(notification)
    else:
        # Notify the other party
        other_id = booking.artist_id if current_user.id == booking.organizer_id else booking.organizer_id
        notification = Notification(
            user_id=other_id,
            title="Completion Confirmation Needed",
            message=f"The other party has marked the booking as completed. Please confirm.",
            type="booking",
            link="/bookings"
        )
        db.add(notification)
    
    booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Dispute Booking ──────────────────────────────────────────────
@router.put("/{booking_id}/dispute")
def dispute_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Raise a dispute on a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if current_user.id not in [booking.organizer_id, booking.artist_id] and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status not in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Cannot dispute this booking")
    
    booking.status = BookingStatus.DISPUTED
    booking.updated_at = datetime.utcnow()
    
    # Notify admin(s)
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            title="Booking Dispute Raised",
            message=f"A dispute has been raised on booking #{booking.id}.",
            type="booking",
            link="/bookings"
        )
        db.add(notification)
    
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Admin: Update Status ─────────────────────────────────────────
@router.put("/{booking_id}/admin-status")
def admin_update_status(
    booking_id: int,
    update: BookingStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Admin can set any booking status"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if update.status == BookingStatus.CONFIRMED:
        advance_paid = db.query(BookingPayment).filter(
            BookingPayment.booking_id == booking_id,
            BookingPayment.payment_type == BookingPaymentType.ADVANCE,
            BookingPayment.status == BookingPaymentStatus.PAID,
        ).first()
        if not advance_paid:
            raise HTTPException(status_code=400, detail="Advance payment must be successful before confirmation")

    if update.status == BookingStatus.COMPLETED:
        final_paid = db.query(BookingPayment).filter(
            BookingPayment.booking_id == booking_id,
            BookingPayment.payment_type == BookingPaymentType.FINAL,
            BookingPayment.status == BookingPaymentStatus.PAID,
        ).first()
        if not final_paid and (booking.remaining_amount or 0) > 0:
            raise HTTPException(status_code=400, detail="Final payment must be confirmed before completion")

    booking.status = update.status
    booking.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    return enrich_booking(booking, db)


# ─── Artist Earnings ──────────────────────────────────────────────
@router.get("/artist/earnings")
def get_artist_earnings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get earnings summary for an artist"""
    if current_user.role not in ["artist", "admin"]:
        raise HTTPException(status_code=403, detail="Artists only")
    
    completed = db.query(Booking).filter(
        Booking.artist_id == current_user.id,
        Booking.status == BookingStatus.COMPLETED
    ).all()
    
    confirmed = db.query(Booking).filter(
        Booking.artist_id == current_user.id,
        Booking.status == BookingStatus.CONFIRMED
    ).all()
    
    awaiting = db.query(Booking).filter(
        Booking.artist_id == current_user.id,
        Booking.status == BookingStatus.AWAITING_PAYMENT
    ).all()
    
    total_earned = sum(b.artist_fee for b in completed)
    pending_payout = (
        sum(b.artist_fee for b in confirmed) +
        sum(b.artist_fee for b in awaiting)
    )
    total_bookings = db.query(Booking).filter(
        Booking.artist_id == current_user.id
    ).count()
    
    return {
        "total_earned": total_earned,
        "pending_payout": pending_payout,
        "completed_bookings": len(completed),
        "active_bookings": len(confirmed),
        "total_bookings": total_bookings,
    }


# ─── Artist Availability ──────────────────────────────────────────
@router.get("/artist/availability/{artist_id}")
def get_artist_availability(
    artist_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get blocked dates for an artist"""
    blocked = db.query(ArtistAvailability).filter(
        ArtistAvailability.artist_id == artist_id
    ).all()
    
    # Also get confirmed booking dates
    booked = db.query(Booking).filter(
        Booking.artist_id == artist_id,
        Booking.status.in_([
            BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED
        ])
    ).all()
    
    blocked_dates = [b.blocked_date.isoformat() for b in blocked]
    booked_dates = [b.event_date.isoformat() for b in booked]
    
    all_blocked = list(set(blocked_dates + booked_dates))
    return {"blocked_dates": all_blocked}


@router.post("/artist/block-date")
def block_date(
    date: str,  # ISO format date string
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Artist blocks a date"""
    if current_user.role not in ["artist", "admin"]:
        raise HTTPException(status_code=403, detail="Artists only")
    
    try:
        blocked_date = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    existing = db.query(ArtistAvailability).filter(
        ArtistAvailability.artist_id == current_user.id,
        func.date(ArtistAvailability.blocked_date) == blocked_date.date()
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Date already blocked")
    
    availability = ArtistAvailability(
        artist_id=current_user.id,
        blocked_date=blocked_date
    )
    db.add(availability)
    db.commit()
    return {"message": "Date blocked successfully"}


# ─── Booking Payments List ────────────────────────────────────────
@router.get("/{booking_id}/payments")
def get_booking_payments(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all payments for a specific booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if (booking.organizer_id != current_user.id and
        booking.artist_id != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    payments = db.query(BookingPayment).filter(
        BookingPayment.booking_id == booking_id
    ).order_by(BookingPayment.created_at.desc()).all()
    
    return [{
        "id": p.id,
        "booking_id": p.booking_id,
        "payment_type": p.payment_type,
        "amount": p.amount,
        "status": p.status,
        "transaction_id": p.transaction_id,
        "created_at": p.created_at,
        "paid_at": p.paid_at,
    } for p in payments]


# ─── Booking context for chat ─────────────────────────────────────
@router.get("/context/{user_id}")
def get_booking_context(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get active booking context between current user and another user"""
    booking = db.query(Booking).filter(
        or_(
            and_(Booking.organizer_id == current_user.id, Booking.artist_id == user_id),
            and_(Booking.organizer_id == user_id, Booking.artist_id == current_user.id),
        ),
        Booking.status.in_([
            BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED
        ])
    ).order_by(Booking.created_at.desc()).first()
    
    if not booking:
        return {"has_booking": False}
    
    return {
        "has_booking": True,
        "booking_id": booking.id,
        "event_type": booking.event_type,
        "event_date": booking.event_date.isoformat(),
        "location": booking.location,
        "status": booking.status.value,
        "is_confirmed": booking.status == BookingStatus.CONFIRMED,
    }


# ─── Artist Analytics (user-facing) ───────────────────────────────
@router.get("/analytics/artist")
def my_artist_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["artist", "admin"]:
        raise HTTPException(status_code=403, detail="Artists only")

    bookings = db.query(Booking).filter(Booking.artist_id == current_user.id).all()
    total = len(bookings)
    completed = sum(1 for b in bookings if b.status == BookingStatus.COMPLETED)
    cancelled = sum(1 for b in bookings if b.status == BookingStatus.CANCELLED)
    confirmed = sum(1 for b in bookings if b.status == BookingStatus.CONFIRMED)
    success_rate = round((completed / total * 100), 1) if total else 0
    cancel_rate = round((cancelled / total * 100), 1) if total else 0

    prof = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    now = datetime.utcnow()
    monthly = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_bk = [b for b in bookings
                     if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
                     and b.created_at and b.created_at.month == m and b.created_at.year == y]
        rev = sum((b.artist_fee or 0) for b in month_bk)
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        monthly.append({"month": labels[m-1], "earnings": float(rev)})

    return {
        "total_bookings": total, "completed": completed, "confirmed": confirmed,
        "cancelled": cancelled, "success_rate": success_rate,
        "cancellation_rate": cancel_rate,
        "response_time": prof.response_time_avg if prof else 0,
        "profile_views": prof.total_hires if prof else 0,
        "total_earnings": sum((b.artist_fee or 0) for b in bookings
                              if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
        "monthly_earnings": monthly,
    }


# ─── Organizer Spending Insights (user-facing) ────────────────────
@router.get("/analytics/organizer")
def my_organizer_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Organizers only")

    bookings = db.query(Booking).filter(Booking.organizer_id == current_user.id).all()
    active = [b for b in bookings if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]]
    total_spend = sum((b.total_amount or 0) for b in active)

    now = datetime.utcnow()
    monthly = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_bk = [b for b in active if b.created_at and b.created_at.month == m and b.created_at.year == y]
        spend = sum((b.total_amount or 0) for b in month_bk)
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        monthly.append({"month": labels[m-1], "spend": float(spend)})

    cat_map = {}
    for b in active:
        prof = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        cat = prof.category if prof else "Other"
        cat_map[cat] = cat_map.get(cat, 0) + 1
    fav_cats = sorted([{"category": k, "count": v} for k, v in cat_map.items()],
                       key=lambda x: x["count"], reverse=True)[:5]

    return {
        "total_spend": float(total_spend),
        "total_bookings": len(bookings),
        "confirmed_bookings": len(active),
        "booking_frequency": round(len(bookings) / max(1, 12), 1),
        "monthly_spend": monthly,
        "favorite_categories": fav_cats,
    }

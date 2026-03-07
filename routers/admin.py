from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import Optional
from database import get_db
from models import (
    User, Profile, Gig, Payment, Review, Application,
    Booking, BookingPayment, BookingStatus, BookingPaymentType, BookingPaymentStatus,
    Dispute, DisputeStatus, ResolutionType, SystemSetting, AuditLog,
    ArtistAvailability, Notification, Payout, PayoutStatus
)
from auth import require_role
from datetime import datetime
import json
import io
import csv
import uuid

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Helpers ────────────────────────────────────────────────────────

def log_action(db: Session, admin_id: int, action_type: str,
               affected_entity: str, entity_id: int = None, metadata: dict = None):
    entry = AuditLog(
        admin_id=admin_id,
        action_type=action_type,
        affected_entity=affected_entity,
        entity_id=entity_id,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(entry)


def get_setting(db: Session, key: str, default: str = "0") -> str:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return row.value if row else default


def get_setting_float(db: Session, key: str, default: float = 0) -> float:
    try:
        return float(get_setting(db, key, str(default)))
    except (ValueError, TypeError):
        return default


def get_setting_bool(db: Session, key: str, default: bool = True) -> bool:
    return get_setting(db, key, str(default)).lower() in ("true", "1", "yes")


# ══════════════════════════════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════════════════════════════

@router.get("/dashboard")
def get_dashboard(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).filter(User.is_deleted == False).count()
    total_artists = db.query(User).filter(User.role == "artist", User.is_deleted == False).count()
    total_organizers = db.query(User).filter(User.role == "organizer", User.is_deleted == False).count()
    verified_users = db.query(User).filter(User.is_verified == True, User.is_deleted == False).count()

    total_bookings = db.query(Booking).count()
    confirmed_bookings = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).count()

    total_revenue = db.query(func.coalesce(func.sum(BookingPayment.amount), 0)).filter(
        BookingPayment.status == BookingPaymentStatus.PAID
    ).scalar()

    platform_fees = db.query(func.coalesce(func.sum(Booking.platform_fee), 0)).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).scalar()

    addon_revenue = db.query(
        func.coalesce(func.sum(
            func.coalesce(Booking.accommodation_price, 0) +
            func.coalesce(Booking.transport_price, 0) +
            func.coalesce(Booking.security_price, 0)
        ), 0)
    ).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).scalar()

    pending_disputes = db.query(Dispute).filter(
        Dispute.status.in_([DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW])
    ).count()

    pending_payouts = db.query(func.coalesce(func.sum(Booking.remaining_amount), 0)).filter(
        Booking.status == BookingStatus.CONFIRMED,
        Booking.remaining_amount > 0,
    ).scalar()

    # Monthly revenue for chart (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        now = datetime.utcnow()
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        rev = db.query(func.coalesce(func.sum(BookingPayment.amount), 0)).filter(
            BookingPayment.status == BookingPaymentStatus.PAID,
            extract("month", BookingPayment.paid_at) == m,
            extract("year", BookingPayment.paid_at) == y,
        ).scalar()
        monthly_revenue.append({"month": f"{y}-{m:02d}", "revenue": float(rev)})

    # Monthly bookings for chart
    monthly_bookings = []
    for i in range(5, -1, -1):
        now = datetime.utcnow()
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        cnt = db.query(Booking).filter(
            extract("month", Booking.created_at) == m,
            extract("year", Booking.created_at) == y,
        ).count()
        monthly_bookings.append({"month": f"{y}-{m:02d}", "count": cnt})

    # Recent bookings
    recent = db.query(Booking).order_by(Booking.created_at.desc()).limit(10).all()
    recent_list = []
    for b in recent:
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        ou = db.query(User).filter(User.id == b.organizer_id).first()
        recent_list.append({
            "id": b.id,
            "artist_name": ap.name if ap else None,
            "organizer_email": ou.email if ou else None,
            "event_type": b.event_type,
            "event_date": b.event_date.isoformat() if b.event_date else None,
            "total_amount": b.total_amount,
            "status": b.status.value if b.status else None,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })

    return {
        "total_users": total_users,
        "total_artists": total_artists,
        "total_organizers": total_organizers,
        "verified_users": verified_users,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_revenue": float(total_revenue),
        "platform_fees": float(platform_fees),
        "addon_revenue": float(addon_revenue),
        "pending_disputes": pending_disputes,
        "pending_payouts": float(pending_payouts),
        "monthly_revenue": monthly_revenue,
        "monthly_bookings": monthly_bookings,
        "recent_bookings": recent_list,
    }


# ══════════════════════════════════════════════════════════════════
#  USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════

@router.get("/users")
def list_users(
    role: Optional[str] = None,
    verified: Optional[bool] = None,
    active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.is_deleted == False)
    if role:
        query = query.filter(User.role == role)
    if verified is not None:
        query = query.filter(User.is_verified == verified)
    if active is not None:
        query = query.filter(User.is_active == active)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (User.email.ilike(pattern)) |
            (User.first_name.ilike(pattern)) |
            (User.last_name.ilike(pattern)) |
            (User.username.ilike(pattern))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for u in users:
        prof = db.query(Profile).filter(Profile.user_id == u.id).first()
        booking_count = db.query(Booking).filter(
            (Booking.organizer_id == u.id) | (Booking.artist_id == u.id)
        ).count()
        results.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "username": u.username,
            "role": u.role.value if u.role else None,
            "is_verified": u.is_verified,
            "is_active": u.is_active,
            "name": prof.name if prof else (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.email,
            "total_bookings": booking_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"total": total, "page": page, "limit": limit, "users": results}


@router.put("/users/{user_id}/verify")
def verify_user(
    user_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    log_action(db, admin.id, "verify_user", "user", user_id)
    db.commit()
    return {"message": "User verified"}


@router.put("/users/{user_id}/suspend")
def suspend_user(
    user_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot suspend another admin")
    user.is_active = False
    log_action(db, admin.id, "suspend_user", "user", user_id)
    db.commit()
    return {"message": "User suspended"}


@router.put("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    log_action(db, admin.id, "activate_user", "user", user_id)
    db.commit()
    return {"message": "User activated"}


@router.delete("/users/{user_id}")
def soft_delete_user(
    user_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete an admin account")
    user.is_deleted = True
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    log_action(db, admin.id, "delete_user", "user", user_id)
    db.commit()
    return {"message": "User soft-deleted"}


# ══════════════════════════════════════════════════════════════════
#  BOOKING MANAGEMENT
# ══════════════════════════════════════════════════════════════════

def _calc_platform_revenue(b):
    """Platform revenue = platform_fee + selected add-on totals."""
    addon = 0
    if b.accommodation_selected:
        addon += (b.accommodation_price or 0)
    if b.transport_selected:
        addon += (b.transport_price or 0)
    if b.security_selected:
        addon += (b.security_price or 0)
    return (b.platform_fee or 0) + addon


@router.get("/bookings")
def list_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_status: Optional[str] = None,
    artist_search: Optional[str] = None,
    organizer_search: Optional[str] = None,
    city: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    revenue_min: Optional[float] = None,
    revenue_max: Optional[float] = None,
    sort_by: Optional[str] = Query(None),
    sort_dir: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)

    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if payment_status:
        query = query.filter(Booking.payment_status == payment_status)
    if city:
        query = query.filter(Booking.location.ilike(f"%{city}%"))
    if date_from:
        try:
            query = query.filter(Booking.event_date >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Booking.event_date <= datetime.fromisoformat(date_to))
        except ValueError:
            pass
    if revenue_min is not None:
        query = query.filter(Booking.total_amount >= revenue_min)
    if revenue_max is not None:
        query = query.filter(Booking.total_amount <= revenue_max)

    if artist_search:
        artist_ids = [p.user_id for p in
                      db.query(Profile.user_id).filter(Profile.name.ilike(f"%{artist_search}%")).all()]
        if artist_ids:
            query = query.filter(Booking.artist_id.in_(artist_ids))
        else:
            query = query.filter(False)

    if organizer_search:
        org_ids = [u.id for u in
                   db.query(User.id).filter(
                       (User.email.ilike(f"%{organizer_search}%")) |
                       (User.first_name.ilike(f"%{organizer_search}%")) |
                       (User.last_name.ilike(f"%{organizer_search}%"))
                   ).all()]
        prof_ids = [p.user_id for p in
                    db.query(Profile.user_id).filter(Profile.name.ilike(f"%{organizer_search}%")).all()]
        all_ids = list(set(org_ids + prof_ids))
        if all_ids:
            query = query.filter(Booking.organizer_id.in_(all_ids))
        else:
            query = query.filter(False)

    sort_col = {
        "event_date": Booking.event_date,
        "total_amount": Booking.total_amount,
        "created_at": Booking.created_at,
        "platform_fee": Booking.platform_fee,
    }.get(sort_by, Booking.created_at)

    if sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    bookings = query.offset((page - 1) * limit).limit(limit).all()

    results = []
    for b in bookings:
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        ou = db.query(User).filter(User.id == b.organizer_id).first()
        op = db.query(Profile).filter(Profile.user_id == b.organizer_id).first()
        plat_rev = _calc_platform_revenue(b)
        audit_count = db.query(func.count(AuditLog.id)).filter(
            AuditLog.affected_entity == "booking",
            AuditLog.entity_id == b.id,
        ).scalar()

        results.append({
            "id": b.id,
            "organizer_id": b.organizer_id,
            "organizer_email": ou.email if ou else None,
            "organizer_name": op.name if op else (ou.email if ou else None),
            "artist_id": b.artist_id,
            "artist_name": ap.name if ap else None,
            "event_date": b.event_date.isoformat() if b.event_date else None,
            "event_type": b.event_type,
            "location": b.location,
            "artist_fee": b.artist_fee,
            "platform_fee": b.platform_fee,
            "platform_revenue": plat_rev,
            "accommodation_selected": b.accommodation_selected or False,
            "accommodation_price": b.accommodation_price or 0,
            "transport_selected": b.transport_selected or False,
            "transport_price": b.transport_price or 0,
            "security_selected": b.security_selected or False,
            "security_price": b.security_price or 0,
            "total_amount": b.total_amount,
            "advance_amount": b.advance_amount or 0,
            "advance_paid": b.advance_paid,
            "remaining_amount": b.remaining_amount,
            "status": b.status.value if b.status else None,
            "payment_status": b.payment_status or "unpaid",
            "audit_actions": audit_count,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "bookings": results}


@router.get("/bookings/{booking_id}")
def get_booking_detail(
    booking_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
    ou = db.query(User).filter(User.id == b.organizer_id).first()
    op = db.query(Profile).filter(Profile.user_id == b.organizer_id).first()
    payments = db.query(BookingPayment).filter(BookingPayment.booking_id == b.id).order_by(BookingPayment.created_at).all()

    addon_total = 0
    if b.accommodation_selected:
        addon_total += (b.accommodation_price or 0)
    if b.transport_selected:
        addon_total += (b.transport_price or 0)
    if b.security_selected:
        addon_total += (b.security_price or 0)

    plat_rev = _calc_platform_revenue(b)
    audit_count = db.query(func.count(AuditLog.id)).filter(
        AuditLog.affected_entity == "booking", AuditLog.entity_id == b.id,
    ).scalar()

    return {
        "id": b.id,
        "organizer_id": b.organizer_id,
        "organizer_email": ou.email if ou else None,
        "organizer_name": op.name if op else None,
        "artist_id": b.artist_id,
        "artist_name": ap.name if ap else None,
        "event_date": b.event_date.isoformat() if b.event_date else None,
        "event_type": b.event_type,
        "location": b.location,
        "duration": b.duration,
        "audience_size": b.audience_size,
        "event_details": b.event_details,
        "artist_fee": b.artist_fee,
        "platform_fee": b.platform_fee,
        "platform_revenue": plat_rev,
        "accommodation_selected": b.accommodation_selected or False,
        "accommodation_price": b.accommodation_price or 0,
        "transport_selected": b.transport_selected or False,
        "transport_price": b.transport_price or 0,
        "security_selected": b.security_selected or False,
        "security_price": b.security_price or 0,
        "addon_total": addon_total,
        "total_amount": b.total_amount,
        "advance_amount": b.advance_amount or 0,
        "advance_paid": b.advance_paid,
        "remaining_amount": b.remaining_amount,
        "status": b.status.value if b.status else None,
        "payment_status": b.payment_status or "unpaid",
        "organizer_completed": b.organizer_completed,
        "artist_completed": b.artist_completed,
        "audit_actions": audit_count,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
        "payments": [{
            "id": p.id,
            "type": p.payment_type.value if p.payment_type else None,
            "amount": p.amount,
            "status": p.status.value if p.status else None,
            "transaction_id": p.transaction_id,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        } for p in payments],
    }


@router.put("/bookings/{booking_id}/status")
def admin_override_status(
    booking_id: int,
    new_status: str = Query(...),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old = booking.status.value if booking.status else None
    try:
        booking.status = BookingStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

    if new_status == "confirmed" and old != "confirmed":
        avail = db.query(ArtistAvailability).filter(
            ArtistAvailability.booking_id == booking.id
        ).first()
        if not avail:
            db.add(ArtistAvailability(
                artist_id=booking.artist_id,
                blocked_date=booking.event_date,
                booking_id=booking.id,
            ))
    if new_status == "cancelled":
        db.query(ArtistAvailability).filter(ArtistAvailability.booking_id == booking.id).delete()

    booking.updated_at = datetime.utcnow()
    log_action(db, admin.id, "override_booking_status", "booking", booking_id,
               {"old_status": old, "new_status": new_status})
    db.commit()
    return {"message": f"Status changed to {new_status}"}


@router.put("/bookings/{booking_id}/cancel")
def admin_cancel_booking(
    booking_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    db.query(ArtistAvailability).filter(ArtistAvailability.booking_id == booking.id).delete()
    log_action(db, admin.id, "cancel_booking", "booking", booking_id)

    for uid in [booking.organizer_id, booking.artist_id]:
        db.add(Notification(
            user_id=uid, title="Booking Cancelled by Admin",
            message=f"Booking #{booking.id} has been cancelled by an administrator.",
            type="booking", link="/bookings",
        ))
    db.commit()
    return {"message": "Booking cancelled"}


@router.put("/bookings/{booking_id}/complete")
def admin_complete_booking(
    booking_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.organizer_completed = True
    booking.artist_completed = True
    booking.status = BookingStatus.COMPLETED
    booking.updated_at = datetime.utcnow()
    log_action(db, admin.id, "complete_booking", "booking", booking_id)
    db.commit()
    return {"message": "Booking marked completed"}


@router.post("/bookings/{booking_id}/refund")
def admin_issue_refund(
    booking_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.advance_paid <= 0:
        raise HTTPException(status_code=400, detail="No payments to refund")

    refund_payment = BookingPayment(
        booking_id=booking.id,
        payment_type=BookingPaymentType.ADVANCE,
        amount=-booking.advance_paid,
        status=BookingPaymentStatus.REFUNDED,
        transaction_id=f"REF_{uuid.uuid4().hex[:12].upper()}",
        paid_at=datetime.utcnow(),
    )
    db.add(refund_payment)

    booking.remaining_amount = 0
    booking.advance_paid = 0
    booking.payment_status = "refunded"
    booking.status = BookingStatus.CANCELLED
    booking.updated_at = datetime.utcnow()
    db.query(ArtistAvailability).filter(ArtistAvailability.booking_id == booking.id).delete()

    log_action(db, admin.id, "issue_refund", "booking", booking_id,
               {"refund_amount": float(refund_payment.amount)})

    db.add(Notification(
        user_id=booking.organizer_id, title="Refund Issued",
        message=f"A refund has been issued for booking #{booking.id}.",
        type="payment", link="/bookings",
    ))
    db.commit()
    return {"message": "Refund issued"}


# ══════════════════════════════════════════════════════════════════
#  PAYMENT MANAGEMENT
# ══════════════════════════════════════════════════════════════════

@router.get("/payments")
def list_payments(
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(BookingPayment)
    if status_filter:
        query = query.filter(BookingPayment.status == status_filter)
    if payment_type:
        query = query.filter(BookingPayment.payment_type == payment_type)

    total = query.count()
    payments = query.order_by(BookingPayment.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for p in payments:
        b = db.query(Booking).filter(Booking.id == p.booking_id).first()
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first() if b else None
        ou = db.query(User).filter(User.id == b.organizer_id).first() if b else None
        results.append({
            "id": p.id,
            "booking_id": p.booking_id,
            "payment_type": p.payment_type.value if p.payment_type else None,
            "amount": p.amount,
            "status": p.status.value if p.status else None,
            "transaction_id": p.transaction_id,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "artist_name": ap.name if ap else None,
            "organizer_email": ou.email if ou else None,
        })
    return {"total": total, "page": page, "limit": limit, "payments": results}


@router.get("/payments/export")
def export_payments_csv(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    payments = db.query(BookingPayment).order_by(BookingPayment.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Payment ID", "Booking ID", "Type", "Amount", "Status",
        "Transaction ID", "Artist", "Organizer Email", "Paid At", "Created At",
    ])
    for p in payments:
        b = db.query(Booking).filter(Booking.id == p.booking_id).first()
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first() if b else None
        ou = db.query(User).filter(User.id == b.organizer_id).first() if b else None
        writer.writerow([
            p.id, p.booking_id,
            p.payment_type.value if p.payment_type else "",
            p.amount,
            p.status.value if p.status else "",
            p.transaction_id or "",
            ap.name if ap else "",
            ou.email if ou else "",
            p.paid_at.isoformat() if p.paid_at else "",
            p.created_at.isoformat() if p.created_at else "",
        ])

    output.seek(0)
    log_action(db, admin.id, "export_payments", "payment")
    db.commit()
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments_report.csv"},
    )


# ══════════════════════════════════════════════════════════════════
#  PRICING CONTROL (database-backed system_settings)
# ══════════════════════════════════════════════════════════════════

@router.get("/pricing")
def get_pricing(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    settings = db.query(SystemSetting).all()
    return {s.key: {"value": s.value, "description": s.description} for s in settings}


@router.put("/pricing")
def update_pricing(
    updates: dict,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    allowed_keys = {
        "platform_fee", "accommodation_price", "transport_price", "security_price",
        "accommodation_enabled", "transport_enabled", "security_enabled",
        "cancellation_policy",
    }
    changed = {}
    for key, value in updates.items():
        if key not in allowed_keys:
            continue
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            old_val = setting.value
            setting.value = str(value)
            setting.updated_by = admin.id
            setting.updated_at = datetime.utcnow()
            changed[key] = {"old": old_val, "new": str(value)}
        else:
            db.add(SystemSetting(key=key, value=str(value), updated_by=admin.id))
            changed[key] = {"old": None, "new": str(value)}

    if changed:
        log_action(db, admin.id, "update_pricing", "system_settings", metadata=changed)
    db.commit()
    return {"message": "Pricing updated", "changed": changed}


# ══════════════════════════════════════════════════════════════════
#  DISPUTE MANAGEMENT
# ══════════════════════════════════════════════════════════════════

@router.get("/disputes")
def list_disputes(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Dispute)
    if status_filter:
        query = query.filter(Dispute.status == status_filter)

    total = query.count()
    disputes = query.order_by(Dispute.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for d in disputes:
        b = db.query(Booking).filter(Booking.id == d.booking_id).first()
        raiser = db.query(User).filter(User.id == d.raised_by).first()
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first() if b else None
        results.append({
            "id": d.id,
            "booking_id": d.booking_id,
            "raised_by_email": raiser.email if raiser else None,
            "reason": d.reason,
            "description": d.description,
            "evidence_url": d.evidence_url,
            "status": d.status.value if d.status else None,
            "resolution_type": d.resolution_type.value if d.resolution_type else None,
            "resolution_notes": d.resolution_notes,
            "artist_name": ap.name if ap else None,
            "total_amount": b.total_amount if b else 0,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "disputes": results}


@router.get("/disputes/{dispute_id}")
def get_dispute_detail(
    dispute_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    d = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")

    b = db.query(Booking).filter(Booking.id == d.booking_id).first()
    raiser = db.query(User).filter(User.id == d.raised_by).first()
    resolver = db.query(User).filter(User.id == d.resolved_by).first() if d.resolved_by else None

    booking_data = None
    if b:
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        ou = db.query(User).filter(User.id == b.organizer_id).first()
        addon_total = sum(filter(None, [
            b.accommodation_price if b.accommodation_selected else 0,
            b.transport_price if b.transport_selected else 0,
            b.security_price if b.security_selected else 0,
        ]))
        booking_data = {
            "id": b.id, "artist_name": ap.name if ap else None,
            "organizer_email": ou.email if ou else None,
            "event_type": b.event_type,
            "artist_fee": b.artist_fee, "platform_fee": b.platform_fee,
            "addon_total": addon_total,
            "total_amount": b.total_amount,
            "advance_paid": b.advance_paid, "remaining_amount": b.remaining_amount,
            "status": b.status.value if b.status else None,
        }

    return {
        "id": d.id, "booking_id": d.booking_id,
        "raised_by_email": raiser.email if raiser else None,
        "reason": d.reason, "description": d.description,
        "evidence_url": d.evidence_url,
        "status": d.status.value if d.status else None,
        "resolution_type": d.resolution_type.value if d.resolution_type else None,
        "resolution_notes": d.resolution_notes,
        "resolved_by_email": resolver.email if resolver else None,
        "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
        "booking": booking_data,
    }


@router.put("/disputes/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: int,
    resolution_notes: str = Query(...),
    action: str = Query(...),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    d = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")

    d.resolution_notes = resolution_notes
    d.resolved_by = admin.id
    d.status = DisputeStatus.RESOLVED
    d.resolved_at = datetime.utcnow()
    d.updated_at = datetime.utcnow()

    res_type_map = {"refund": ResolutionType.REFUND, "partial": ResolutionType.PARTIAL, "release": ResolutionType.RELEASE}
    if action in res_type_map:
        d.resolution_type = res_type_map[action]

    booking = db.query(Booking).filter(Booking.id == d.booking_id).first()
    if booking:
        if action == "refund":
            if booking.advance_paid > 0:
                db.add(BookingPayment(
                    booking_id=booking.id, payment_type=BookingPaymentType.ADVANCE,
                    amount=-booking.advance_paid, status=BookingPaymentStatus.REFUNDED,
                    transaction_id=f"REF_{uuid.uuid4().hex[:12].upper()}",
                    paid_at=datetime.utcnow(),
                ))
                booking.advance_paid = 0
                booking.remaining_amount = 0
                booking.payment_status = "refunded"
            booking.status = BookingStatus.CANCELLED
            db.query(ArtistAvailability).filter(ArtistAvailability.booking_id == booking.id).delete()
        elif action == "partial":
            refund_amt = booking.advance_paid * 0.5 if booking.advance_paid > 0 else 0
            if refund_amt > 0:
                db.add(BookingPayment(
                    booking_id=booking.id, payment_type=BookingPaymentType.ADVANCE,
                    amount=-refund_amt, status=BookingPaymentStatus.REFUNDED,
                    transaction_id=f"PREF_{uuid.uuid4().hex[:12].upper()}",
                    paid_at=datetime.utcnow(),
                ))
                booking.advance_paid = booking.advance_paid - refund_amt
                booking.payment_status = "partial_refund"
            booking.status = BookingStatus.CANCELLED
            db.query(ArtistAvailability).filter(ArtistAvailability.booking_id == booking.id).delete()
        elif action == "release":
            booking.status = BookingStatus.COMPLETED
            booking.organizer_completed = True
            booking.artist_completed = True
        elif action == "close":
            booking.status = BookingStatus.CONFIRMED
        booking.updated_at = datetime.utcnow()

    log_action(db, admin.id, "resolve_dispute", "dispute", dispute_id,
               {"action": action, "resolution_type": action, "notes": resolution_notes})
    db.commit()
    return {"message": f"Dispute resolved with action: {action}"}


# ══════════════════════════════════════════════════════════════════
#  REPORTING
# ══════════════════════════════════════════════════════════════════

@router.get("/reports/revenue")
def revenue_report(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    rows = db.query(
        extract("year", BookingPayment.paid_at).label("year"),
        extract("month", BookingPayment.paid_at).label("month"),
        func.sum(BookingPayment.amount).label("total"),
    ).filter(
        BookingPayment.status == BookingPaymentStatus.PAID,
        BookingPayment.paid_at.isnot(None),
    ).group_by("year", "month").order_by("year", "month").all()

    return [{"year": int(r.year), "month": int(r.month), "revenue": float(r.total)} for r in rows]


@router.get("/reports/top-artists")
def top_artists_report(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    rows = db.query(
        Booking.artist_id,
        func.count(Booking.id).label("booking_count"),
        func.sum(Booking.artist_fee).label("total_revenue"),
    ).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).group_by(Booking.artist_id).order_by(func.count(Booking.id).desc()).limit(limit).all()

    results = []
    for r in rows:
        prof = db.query(Profile).filter(Profile.user_id == r.artist_id).first()
        results.append({
            "artist_id": r.artist_id,
            "name": prof.name if prof else "Unknown",
            "category": prof.category if prof else None,
            "booking_count": r.booking_count,
            "total_revenue": float(r.total_revenue or 0),
            "rating": prof.average_rating if prof else 0,
        })
    return results


@router.get("/reports/categories")
def category_report(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    rows = db.query(
        Profile.category,
        func.count(Booking.id).label("booking_count"),
    ).join(Booking, Booking.artist_id == Profile.user_id).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).group_by(Profile.category).order_by(func.count(Booking.id).desc()).all()

    return [{"category": r.category, "booking_count": r.booking_count} for r in rows]


@router.get("/reports/addons")
def addon_revenue_report(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    confirmed = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    ).all()
    acc = sum((b.accommodation_price or 0) for b in confirmed if b.accommodation_selected)
    trn = sum((b.transport_price or 0) for b in confirmed if b.transport_selected)
    sec = sum((b.security_price or 0) for b in confirmed if b.security_selected)
    return {
        "accommodation": {"count": sum(1 for b in confirmed if b.accommodation_selected), "revenue": acc},
        "transport": {"count": sum(1 for b in confirmed if b.transport_selected), "revenue": trn},
        "security": {"count": sum(1 for b in confirmed if b.security_selected), "revenue": sec},
        "total": acc + trn + sec,
    }


# ══════════════════════════════════════════════════════════════════
#  FINANCE DASHBOARD
# ══════════════════════════════════════════════════════════════════

@router.get("/finance")
def finance_dashboard(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """Comprehensive finance analytics — all calculations are backend-validated."""
    now = datetime.utcnow()
    active_statuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]

    active_bookings = db.query(Booking).filter(
        Booking.status.in_(active_statuses)
    ).all()

    # ── Aggregate stats ──
    total_platform_fee = sum((b.platform_fee or 0) for b in active_bookings)

    total_addon = sum(
        ((b.accommodation_price or 0) if b.accommodation_selected else 0) +
        ((b.transport_price or 0) if b.transport_selected else 0) +
        ((b.security_price or 0) if b.security_selected else 0)
        for b in active_bookings
    )

    total_platform_revenue = total_platform_fee + total_addon

    # Current month revenue
    current_month_bookings = [
        b for b in active_bookings
        if b.created_at and b.created_at.month == now.month and b.created_at.year == now.year
    ]
    monthly_revenue = sum(
        (b.platform_fee or 0) +
        (((b.accommodation_price or 0) if b.accommodation_selected else 0) +
         ((b.transport_price or 0) if b.transport_selected else 0) +
         ((b.security_price or 0) if b.security_selected else 0))
        for b in current_month_bookings
    )

    # Pending payouts = remaining amounts on confirmed (not yet completed) bookings
    pending_payouts = sum(
        (b.remaining_amount or 0)
        for b in active_bookings
        if b.status == BookingStatus.CONFIRMED and (b.remaining_amount or 0) > 0
    )

    # Completed payouts = advance_paid on completed bookings (money already released)
    completed_payouts = sum(
        (b.advance_paid or 0)
        for b in active_bookings
        if b.status == BookingStatus.COMPLETED
    )

    # Refunds issued
    refund_rows = db.query(BookingPayment).filter(
        BookingPayment.status == BookingPaymentStatus.REFUNDED,
    ).all()
    refunds_issued = sum(abs(r.amount or 0) for r in refund_rows)

    net_earnings = total_platform_revenue - refunds_issued

    # ── Monthly revenue trend (last 12 months) ──
    monthly_trend = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_bookings = [
            b for b in active_bookings
            if b.created_at and b.created_at.month == m and b.created_at.year == y
        ]
        rev = sum(
            (b.platform_fee or 0) +
            (((b.accommodation_price or 0) if b.accommodation_selected else 0) +
             ((b.transport_price or 0) if b.transport_selected else 0) +
             ((b.security_price or 0) if b.security_selected else 0))
            for b in month_bookings
        )
        month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        monthly_trend.append({
            "month": f"{y}-{m:02d}",
            "label": f"{month_names[m-1]} {y}",
            "revenue": float(rev),
        })

    # ── Revenue by city ──
    city_map = {}
    for b in active_bookings:
        city = (b.location or "Unknown").strip()
        plat = (b.platform_fee or 0)
        addon = (
            ((b.accommodation_price or 0) if b.accommodation_selected else 0) +
            ((b.transport_price or 0) if b.transport_selected else 0) +
            ((b.security_price or 0) if b.security_selected else 0)
        )
        city_map[city] = city_map.get(city, 0) + plat + addon
    revenue_by_city = sorted(
        [{"city": c, "revenue": float(v)} for c, v in city_map.items()],
        key=lambda x: x["revenue"], reverse=True,
    )[:15]

    # ── Revenue by category ──
    cat_map = {}
    for b in active_bookings:
        prof = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        cat = prof.category if prof else "Uncategorized"
        plat = (b.platform_fee or 0)
        addon = (
            ((b.accommodation_price or 0) if b.accommodation_selected else 0) +
            ((b.transport_price or 0) if b.transport_selected else 0) +
            ((b.security_price or 0) if b.security_selected else 0)
        )
        cat_map[cat] = cat_map.get(cat, 0) + plat + addon
    revenue_by_category = sorted(
        [{"category": c, "revenue": float(v)} for c, v in cat_map.items()],
        key=lambda x: x["revenue"], reverse=True,
    )

    return {
        "total_platform_revenue": float(total_platform_revenue),
        "monthly_revenue": float(monthly_revenue),
        "platform_fee_collected": float(total_platform_fee),
        "addon_margins_collected": float(total_addon),
        "pending_payouts": float(pending_payouts),
        "completed_payouts": float(completed_payouts),
        "refunds_issued": float(refunds_issued),
        "net_earnings": float(net_earnings),
        "monthly_trend": monthly_trend,
        "revenue_by_city": revenue_by_city,
        "revenue_by_category": revenue_by_category,
    }


# ══════════════════════════════════════════════════════════════════
#  AUDIT LOGS
# ══════════════════════════════════════════════════════════════════

@router.get("/audit-logs")
def list_audit_logs(
    action_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for l in logs:
        adm = db.query(User).filter(User.id == l.admin_id).first()
        results.append({
            "id": l.id,
            "admin_email": adm.email if adm else None,
            "action_type": l.action_type,
            "affected_entity": l.affected_entity,
            "entity_id": l.entity_id,
            "metadata": json.loads(l.metadata_json) if l.metadata_json else None,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "logs": results}


# ══════════════════════════════════════════════════════════════════
#  ADVANCED ANALYTICS
# ══════════════════════════════════════════════════════════════════

@router.get("/analytics")
def admin_analytics(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    active_statuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
    all_bookings = db.query(Booking).all()
    active_bookings = [b for b in all_bookings if b.status in active_statuses]

    total_bookings = len(all_bookings)
    confirmed_or_completed = len(active_bookings)
    conversion_rate = round((confirmed_or_completed / total_bookings * 100), 1) if total_bookings else 0

    avg_value = round(sum(b.total_amount or 0 for b in active_bookings) / len(active_bookings), 2) if active_bookings else 0

    addon_bookings = sum(1 for b in active_bookings
                         if b.accommodation_selected or b.transport_selected or b.security_selected)
    addon_rate = round((addon_bookings / len(active_bookings) * 100), 1) if active_bookings else 0

    # Top booked artists
    artist_counts = {}
    for b in active_bookings:
        artist_counts[b.artist_id] = artist_counts.get(b.artist_id, 0) + 1
    top_artists = sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_artists_data = []
    for aid, cnt in top_artists:
        prof = db.query(Profile).filter(Profile.user_id == aid).first()
        rev = sum((b.artist_fee or 0) for b in active_bookings if b.artist_id == aid)
        top_artists_data.append({
            "artist_id": aid, "name": prof.name if prof else "Unknown",
            "category": prof.category if prof else None,
            "bookings": cnt, "revenue": float(rev),
            "rating": prof.average_rating if prof else 0,
        })

    # Most active organizers
    org_counts = {}
    for b in all_bookings:
        org_counts[b.organizer_id] = org_counts.get(b.organizer_id, 0) + 1
    top_orgs = sorted(org_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_orgs_data = []
    for oid, cnt in top_orgs:
        u = db.query(User).filter(User.id == oid).first()
        prof = db.query(Profile).filter(Profile.user_id == oid).first()
        spend = sum((b.total_amount or 0) for b in all_bookings if b.organizer_id == oid and b.status in active_statuses)
        top_orgs_data.append({
            "organizer_id": oid,
            "name": prof.name if prof else (u.email.split("@")[0] if u else "Unknown"),
            "email": u.email if u else None,
            "bookings": cnt, "total_spend": float(spend),
        })

    # Revenue by region
    region_map = {}
    for b in active_bookings:
        loc = (b.location or "Unknown").strip()
        region_map[loc] = region_map.get(loc, 0) + (b.total_amount or 0)
    revenue_by_region = sorted(
        [{"region": k, "revenue": float(v)} for k, v in region_map.items()],
        key=lambda x: x["revenue"], reverse=True,
    )[:15]

    # Revenue by month (12 months)
    now = datetime.utcnow()
    monthly = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_bk = [b for b in active_bookings
                     if b.created_at and b.created_at.month == m and b.created_at.year == y]
        rev = sum((b.total_amount or 0) for b in month_bk)
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        monthly.append({"month": f"{y}-{m:02d}", "label": f"{labels[m-1]} {y}", "revenue": float(rev)})

    return {
        "total_bookings": total_bookings,
        "conversion_rate": conversion_rate,
        "average_booking_value": avg_value,
        "addon_attachment_rate": addon_rate,
        "top_artists": top_artists_data,
        "top_organizers": top_orgs_data,
        "revenue_by_region": revenue_by_region,
        "revenue_by_month": monthly,
    }


# ══════════════════════════════════════════════════════════════════
#  ARTIST & ORGANIZER ANALYTICS (for their dashboards)
# ══════════════════════════════════════════════════════════════════

@router.get("/analytics/artist/{artist_id}")
def artist_analytics(
    artist_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    bookings = db.query(Booking).filter(Booking.artist_id == artist_id).all()
    total = len(bookings)
    completed = sum(1 for b in bookings if b.status == BookingStatus.COMPLETED)
    cancelled = sum(1 for b in bookings if b.status == BookingStatus.CANCELLED)
    success_rate = round((completed / total * 100), 1) if total else 0
    cancel_rate = round((cancelled / total * 100), 1) if total else 0

    prof = db.query(Profile).filter(Profile.user_id == artist_id).first()
    resp_time = prof.response_time_avg if prof else 0

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
        monthly.append({"month": f"{labels[m-1]}", "earnings": float(rev)})

    return {
        "total_bookings": total, "completed": completed, "cancelled": cancelled,
        "success_rate": success_rate, "cancellation_rate": cancel_rate,
        "response_time": resp_time,
        "total_earnings": sum((b.artist_fee or 0) for b in bookings if b.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
        "monthly_earnings": monthly,
    }


@router.get("/analytics/organizer/{organizer_id}")
def organizer_analytics(
    organizer_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    bookings = db.query(Booking).filter(Booking.organizer_id == organizer_id).all()
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
        monthly.append({"month": f"{labels[m-1]}", "spend": float(spend)})

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


# ══════════════════════════════════════════════════════════════════
#  USER-FACING ANALYTICS (no admin role required)
# ══════════════════════════════════════════════════════════════════


# ══════════════════════════════════════════════════════════════════
#  PAYOUT TRACKING
# ══════════════════════════════════════════════════════════════════

@router.get("/payouts")
def list_payouts(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Payout)
    if status_filter:
        query = query.filter(Payout.payout_status == status_filter)

    total = query.count()
    payouts = query.order_by(Payout.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for p in payouts:
        prof = db.query(Profile).filter(Profile.user_id == p.artist_id).first()
        results.append({
            "id": p.id, "booking_id": p.booking_id, "artist_id": p.artist_id,
            "artist_name": prof.name if prof else None,
            "total_artist_fee": p.total_artist_fee, "advance_paid": p.advance_paid,
            "remaining_paid": p.remaining_paid, "payout_status": p.payout_status.value if p.payout_status else None,
            "payout_date": p.payout_date.isoformat() if p.payout_date else None,
            "transaction_id": p.transaction_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return {"total": total, "page": page, "limit": limit, "payouts": results}


@router.get("/payouts/summary")
def payout_summary(
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    all_payouts = db.query(Payout).all()
    pending = [p for p in all_payouts if p.payout_status == PayoutStatus.PENDING]
    paid = [p for p in all_payouts if p.payout_status == PayoutStatus.PAID]

    active_statuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
    active_bookings = db.query(Booking).filter(Booking.status.in_(active_statuses)).all()
    total_platform_margin = sum(
        (b.platform_fee or 0) +
        (((b.accommodation_price or 0) if b.accommodation_selected else 0) +
         ((b.transport_price or 0) if b.transport_selected else 0) +
         ((b.security_price or 0) if b.security_selected else 0))
        for b in active_bookings
    )

    return {
        "pending_count": len(pending),
        "pending_total": sum(p.total_artist_fee for p in pending),
        "paid_count": len(paid),
        "paid_total": sum(p.total_artist_fee for p in paid),
        "platform_margin": float(total_platform_margin),
    }


@router.post("/payouts/{booking_id}/release")
def release_payout(
    booking_id: int,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing = db.query(Payout).filter(Payout.booking_id == booking_id, Payout.payout_status == PayoutStatus.PAID).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payout already released")

    payout = db.query(Payout).filter(Payout.booking_id == booking_id).first()
    if payout:
        payout.payout_status = PayoutStatus.PAID
        payout.payout_date = datetime.utcnow()
        payout.remaining_paid = booking.remaining_amount or 0
        payout.transaction_id = f"PO_{uuid.uuid4().hex[:12].upper()}"
    else:
        payout = Payout(
            booking_id=booking_id, artist_id=booking.artist_id,
            total_artist_fee=booking.artist_fee or 0,
            advance_paid=booking.advance_paid or 0,
            remaining_paid=booking.remaining_amount or 0,
            payout_status=PayoutStatus.PAID,
            payout_date=datetime.utcnow(),
            transaction_id=f"PO_{uuid.uuid4().hex[:12].upper()}",
        )
        db.add(payout)

    log_action(db, admin.id, "release_payout", "payout", booking_id,
               {"artist_id": booking.artist_id, "amount": float(booking.artist_fee or 0)})
    db.commit()
    return {"message": "Payout released"}


# ══════════════════════════════════════════════════════════════════
#  REPORT EXPORTS
# ══════════════════════════════════════════════════════════════════

@router.get("/reports/export/bookings")
def export_bookings_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if date_from:
        try:
            query = query.filter(Booking.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Booking.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    bookings = query.order_by(Booking.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking ID", "Organizer", "Artist", "Event Date", "Event Type",
        "Location", "Artist Fee", "Platform Fee", "Add-ons", "Total",
        "Advance Paid", "Remaining", "Status", "Payment Status", "Created At",
    ])
    for b in bookings:
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        ou = db.query(User).filter(User.id == b.organizer_id).first()
        addon = sum(filter(None, [
            b.accommodation_price if b.accommodation_selected else 0,
            b.transport_price if b.transport_selected else 0,
            b.security_price if b.security_selected else 0,
        ]))
        writer.writerow([
            b.id, ou.email if ou else "", ap.name if ap else "",
            b.event_date.isoformat() if b.event_date else "", b.event_type or "",
            b.location or "", b.artist_fee, b.platform_fee, addon, b.total_amount,
            b.advance_paid, b.remaining_amount,
            b.status.value if b.status else "", b.payment_status or "",
            b.created_at.isoformat() if b.created_at else "",
        ])

    output.seek(0)
    log_action(db, admin.id, "export_bookings", "booking")
    db.commit()
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings_report.csv"},
    )


@router.get("/reports/export/revenue")
def export_revenue_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
    )
    if date_from:
        try:
            query = query.filter(Booking.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Booking.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    bookings = query.order_by(Booking.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking ID", "Artist", "Location", "Category", "Artist Fee",
        "Platform Fee", "Addon Revenue", "Total Revenue", "Platform Margin",
        "Status", "Date",
    ])
    for b in bookings:
        ap = db.query(Profile).filter(Profile.user_id == b.artist_id).first()
        addon = sum(filter(None, [
            b.accommodation_price if b.accommodation_selected else 0,
            b.transport_price if b.transport_selected else 0,
            b.security_price if b.security_selected else 0,
        ]))
        margin = (b.platform_fee or 0) + addon
        writer.writerow([
            b.id, ap.name if ap else "", b.location or "",
            ap.category if ap else "", b.artist_fee, b.platform_fee,
            addon, b.total_amount, margin,
            b.status.value if b.status else "",
            b.created_at.isoformat() if b.created_at else "",
        ])

    output.seek(0)
    log_action(db, admin.id, "export_revenue", "report")
    db.commit()
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=revenue_report.csv"},
    )


@router.get("/reports/export/disputes")
def export_disputes_csv(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    query = db.query(Dispute)
    if date_from:
        try:
            query = query.filter(Dispute.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Dispute.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    disputes = query.order_by(Dispute.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Dispute ID", "Booking ID", "Raised By", "Reason", "Description",
        "Status", "Resolution Type", "Resolution Notes", "Created At", "Resolved At",
    ])
    for d in disputes:
        raiser = db.query(User).filter(User.id == d.raised_by).first()
        writer.writerow([
            d.id, d.booking_id, raiser.email if raiser else "",
            d.reason or "", d.description or "",
            d.status.value if d.status else "",
            d.resolution_type.value if d.resolution_type else "",
            d.resolution_notes or "",
            d.created_at.isoformat() if d.created_at else "",
            d.resolved_at.isoformat() if d.resolved_at else "",
        ])

    output.seek(0)
    log_action(db, admin.id, "export_disputes", "dispute")
    db.commit()
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=disputes_report.csv"},
    )

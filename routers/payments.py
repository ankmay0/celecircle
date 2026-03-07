from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Payment, Gig, Application, PaymentStatus, ApplicationStatus
from schemas import PaymentCreate, PaymentResponse
from auth import get_current_active_user, require_role
from payment_service import (
    create_payment_intent, confirm_payment, release_payment,
    refund_payment, create_mock_payment_intent
)
import os
from datetime import datetime

router = APIRouter(prefix="/api/payments", tags=["payments"])

USE_MOCK_PAYMENTS = os.getenv("USE_MOCK_PAYMENTS", "true").lower() == "true"

@router.post("", response_model=dict)
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(require_role(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    """Create payment intent for a gig (escrow)"""
    gig = db.query(Gig).filter(Gig.id == payment_data.gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create payment for this gig"
        )
    
    # Check if application is accepted
    application = db.query(Application).filter(
        Application.gig_id == payment_data.gig_id,
        Application.artist_id == payment_data.artist_id,
        Application.status == ApplicationStatus.ACCEPTED
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No accepted application found for this gig and artist"
        )
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(Payment.gig_id == payment_data.gig_id).first()
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already exists for this gig"
        )
    
    # Create payment intent
    metadata = {
        "gig_id": str(payment_data.gig_id),
        "organizer_id": str(current_user.id),
        "artist_id": str(payment_data.artist_id)
    }
    
    if USE_MOCK_PAYMENTS:
        payment_intent = create_mock_payment_intent(payment_data.amount, metadata)
    else:
        payment_intent = create_payment_intent(payment_data.amount, metadata=metadata)
    
    # Create payment record
    new_payment = Payment(
        gig_id=payment_data.gig_id,
        organizer_id=current_user.id,
        artist_id=payment_data.artist_id,
        amount=payment_data.amount,
        status=PaymentStatus.PENDING,
        stripe_payment_intent_id=payment_intent["payment_intent_id"]
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return {
        "payment_id": new_payment.id,
        "client_secret": payment_intent["client_secret"],
        "payment_intent_id": payment_intent["payment_intent_id"]
    }

@router.post("/{payment_id}/confirm")
def confirm_payment_endpoint(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirm payment (move from pending to paid)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to confirm this payment"
        )
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not in pending status"
        )
    
    if not USE_MOCK_PAYMENTS:
        try:
            confirm_payment(payment.stripe_payment_intent_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment confirmation failed: {str(e)}"
            )
    
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Payment confirmed successfully"}

@router.post("/{payment_id}/release")
def release_payment_endpoint(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Release payment to artist (after event completion)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to release this payment"
        )
    
    if payment.status != PaymentStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment must be in paid status to release"
        )
    
    if not USE_MOCK_PAYMENTS:
        try:
            release_payment(payment.stripe_payment_intent_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment release failed: {str(e)}"
            )
    
    payment.status = PaymentStatus.RELEASED
    payment.released_at = datetime.utcnow()
    
    # Update artist stats
    from models import Profile
    profile = db.query(Profile).filter(Profile.user_id == payment.artist_id).first()
    if profile:
        profile.total_hires += 1
        from ai_service import calculate_ai_score
        profile.ai_score = calculate_ai_score(profile, db)
    
    db.commit()
    
    return {"message": "Payment released successfully"}

@router.post("/{payment_id}/refund")
def refund_payment_endpoint(
    payment_id: int,
    amount: float = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Refund payment (full or partial)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to refund this payment"
        )
    
    if payment.status not in [PaymentStatus.PAID, PaymentStatus.RELEASED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment cannot be refunded in current status"
        )
    
    if not USE_MOCK_PAYMENTS:
        try:
            refund_result = refund_payment(payment.stripe_payment_intent_id, amount)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Refund failed: {str(e)}"
            )
    
    payment.status = PaymentStatus.REFUNDED
    payment.refunded_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Payment refunded successfully"}

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment details"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.organizer_id != current_user.id and payment.artist_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this payment"
        )
    
    return payment

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List payments for current user"""
    if current_user.role == "organizer":
        payments = db.query(Payment).filter(Payment.organizer_id == current_user.id).all()
    elif current_user.role == "artist":
        payments = db.query(Payment).filter(Payment.artist_id == current_user.id).all()
    else:  # admin
        payments = db.query(Payment).all()
    
    return payments


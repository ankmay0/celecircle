from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Review, Gig, Payment, PaymentStatus, Profile
from schemas import ReviewCreate, ReviewResponse
from auth import get_current_active_user, require_role
from ai_service import moderate_review, calculate_ai_score
from sqlalchemy import func

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.post("", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(require_role(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    """Create a review for an artist after event completion"""
    # Verify gig exists and belongs to organizer
    gig = db.query(Gig).filter(Gig.id == review_data.gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to review this gig"
        )
    
    # Verify payment was released (event completed)
    payment = db.query(Payment).filter(
        Payment.gig_id == review_data.gig_id,
        Payment.artist_id == review_data.artist_id,
        Payment.status == PaymentStatus.RELEASED
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review until payment is released (event completed)"
        )
    
    # Check if review already exists
    existing_review = db.query(Review).filter(
        Review.gig_id == review_data.gig_id,
        Review.organizer_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review already exists for this gig"
        )
    
    # AI moderation
    is_verified = moderate_review(review_data.comment or "", review_data.rating)
    
    new_review = Review(
        gig_id=review_data.gig_id,
        artist_id=review_data.artist_id,
        organizer_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        is_verified=is_verified
    )
    
    db.add(new_review)
    
    # Update artist profile stats
    profile = db.query(Profile).filter(Profile.user_id == review_data.artist_id).first()
    if profile:
        # Recalculate average rating
        avg_rating_result = db.query(func.avg(Review.rating)).filter(
            Review.artist_id == review_data.artist_id,
            Review.is_verified == True
        ).scalar()
        
        profile.average_rating = avg_rating_result or 0.0
        profile.total_reviews = db.query(Review).filter(
            Review.artist_id == review_data.artist_id,
            Review.is_verified == True
        ).count()
        
        # Recalculate AI score
        profile.ai_score = calculate_ai_score(profile, db)
    
    db.commit()
    db.refresh(new_review)
    
    return new_review

@router.get("/artist/{artist_id}", response_model=List[ReviewResponse])
def get_artist_reviews(
    artist_id: int,
    verified_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all reviews for an artist"""
    query = db.query(Review).filter(Review.artist_id == artist_id)
    
    if verified_only:
        query = query.filter(Review.is_verified == True)
    
    reviews = query.order_by(Review.created_at.desc()).all()
    return reviews

@router.get("/gig/{gig_id}", response_model=ReviewResponse)
def get_gig_review(
    gig_id: int,
    db: Session = Depends(get_db)
):
    """Get review for a specific gig"""
    review = db.query(Review).filter(Review.gig_id == gig_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review

@router.get("", response_model=List[ReviewResponse])
def list_reviews(
    artist_id: int = None,
    organizer_id: int = None,
    verified_only: bool = True,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List reviews with optional filters"""
    query = db.query(Review)
    
    if artist_id:
        query = query.filter(Review.artist_id == artist_id)
    if organizer_id:
        query = query.filter(Review.organizer_id == organizer_id)
    if verified_only:
        query = query.filter(Review.is_verified == True)
    
    reviews = query.order_by(Review.created_at.desc()).limit(limit).all()
    return reviews


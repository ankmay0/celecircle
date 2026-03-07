from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, Gig, Application, GigStatus, ApplicationStatus
from schemas import (
    GigCreate, GigUpdate, GigResponse,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse
)
from auth import get_current_active_user, require_role
from ai_service import recommend_artists, recommend_gigs
from datetime import datetime

router = APIRouter(prefix="/api/gigs", tags=["gigs"])

@router.post("", response_model=GigResponse)
def create_gig(
    gig_data: GigCreate,
    current_user: User = Depends(require_role(["organizer", "admin"])),
    db: Session = Depends(get_db)
):
    """Create a new gig/event posting"""
    new_gig = Gig(
        organizer_id=current_user.id,
        **gig_data.dict()
    )
    db.add(new_gig)
    db.commit()
    db.refresh(new_gig)
    
    return new_gig

@router.get("", response_model=List[GigResponse])
def list_gigs(
    category: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[GigStatus] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all gigs with optional filters"""
    query = db.query(Gig)
    
    if category:
        query = query.filter(Gig.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(Gig.location.ilike(f"%{location}%"))
    if status:
        query = query.filter(Gig.status == status)
    else:
        query = query.filter(Gig.status == GigStatus.OPEN)
    
    gigs = query.order_by(Gig.event_date.asc()).limit(limit).all()
    return gigs

@router.get("/{gig_id}", response_model=GigResponse)
def get_gig(gig_id: int, db: Session = Depends(get_db)):
    """Get a specific gig by ID"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    return gig

@router.put("/{gig_id}", response_model=GigResponse)
def update_gig(
    gig_id: int,
    gig_data: GigUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a gig (only organizer or admin)"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this gig"
        )
    
    update_data = gig_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gig, field, value)
    
    gig.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(gig)
    
    return gig

@router.delete("/{gig_id}")
def delete_gig(
    gig_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a gig"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this gig"
        )
    
    db.delete(gig)
    db.commit()
    
    return {"message": "Gig deleted successfully"}

@router.post("/{gig_id}/applications", response_model=ApplicationResponse)
def apply_to_gig(
    gig_id: int,
    application_data: ApplicationCreate,
    current_user: User = Depends(require_role(["artist"])),
    db: Session = Depends(get_db)
):
    """Apply to a gig"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.status != GigStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gig is not open for applications"
        )
    
    # Check if already applied
    existing = db.query(Application).filter(
        Application.gig_id == gig_id,
        Application.artist_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied to this gig"
        )
    
    new_application = Application(
        gig_id=gig_id,
        artist_id=current_user.id,
        proposal=application_data.proposal,
        quote=application_data.quote
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    return new_application

@router.get("/{gig_id}/applications", response_model=List[ApplicationResponse])
def get_gig_applications(
    gig_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get applications for a gig (only organizer or admin)"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    if gig.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applications"
        )
    
    applications = db.query(Application).filter(Application.gig_id == gig_id).all()
    return applications

@router.put("/applications/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update application status (accept/reject)"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    gig = db.query(Gig).filter(Gig.id == application.gig_id).first()
    
    # Organizer can accept/reject, artist can withdraw
    if application_data.status == ApplicationStatus.WITHDRAWN:
        if application.artist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only artist can withdraw application"
            )
    else:
        if gig.organizer_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update application status"
            )
    
    application.status = application_data.status
    application.updated_at = datetime.utcnow()
    
    # If accepted, close the gig
    if application_data.status == ApplicationStatus.ACCEPTED:
        gig.status = GigStatus.CLOSED
    
    db.commit()
    db.refresh(application)
    
    return application

@router.get("/recommendations/artists/{gig_id}")
def get_recommended_artists(
    gig_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get AI-recommended artists for a gig"""
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gig not found"
        )
    
    budget = (gig.budget_min + gig.budget_max) / 2
    recommended = recommend_artists(gig.category, gig.location, budget, db, limit)
    
    from schemas import ProfileResponse
    return recommended

@router.get("/recommendations/for-me", response_model=List[GigResponse])
def get_recommended_gigs(
    current_user: User = Depends(require_role(["artist"])),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get AI-recommended gigs for current artist"""
    from models import Profile
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create a profile first."
        )
    
    recommended = recommend_gigs(profile, db, limit)
    return recommended


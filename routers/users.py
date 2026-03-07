from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import User, Profile
from schemas import (
    ProfileCreate, ProfileUpdate, ProfileResponse,
    UserResponse
)
from auth import get_current_active_user, require_role
from ai_service import calculate_ai_score
import json
import os
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/api/users", tags=["users"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/profiles", response_model=ProfileResponse)
def create_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create profile (artist or organizer)"""
    try:
        if current_user.role not in ["artist", "organizer"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only artists and organizers can create profiles"
            )
        
        # Check if profile already exists
        existing_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists. Use update endpoint."
            )
        
        # Create profile with required fields
        profile_dict = profile_data.dict()
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        is_artist = role_value == "artist"
        min_price = profile_dict.get("min_price", 0) or 0
        # Keep backward compatibility in DB/API while using single "onwards" price model.
        max_price = min_price if is_artist else 0
        new_profile = Profile(
            user_id=current_user.id,
            name=profile_dict.get('name'),
            category=profile_dict.get('category'),
            location=profile_dict.get('location'),
            languages=profile_dict.get('languages'),
            bio=profile_dict.get('bio'),
            phone=profile_dict.get('phone'),
            min_price=min_price,
            max_price=max_price,
            experience_years=profile_dict.get('experience_years', 0) or 0
        )
        
        # Calculate AI score
        try:
            new_profile.ai_score = calculate_ai_score(new_profile, db)
        except Exception as e:
            print(f"Error calculating AI score: {e}")
            new_profile.ai_score = 0.0  # Default score if calculation fails
        
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        
        return new_profile
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating profile: {str(e)}"
        )

@router.get("/profiles/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    profile = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/profiles/me", response_model=ProfileResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    update_data = profile_data.dict(exclude_unset=True)
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    is_artist = role_value == "artist"
    
    # Handle JSON fields
    if "portfolio_videos" in update_data and update_data["portfolio_videos"]:
        update_data["portfolio_videos"] = json.dumps(update_data["portfolio_videos"])
    if "portfolio_images" in update_data and update_data["portfolio_images"]:
        update_data["portfolio_images"] = json.dumps(update_data["portfolio_images"])
    if "portfolio_links" in update_data and update_data["portfolio_links"]:
        update_data["portfolio_links"] = json.dumps(update_data["portfolio_links"])
    if "past_events" in update_data and update_data["past_events"]:
        update_data["past_events"] = json.dumps(update_data["past_events"])
    if "availability_calendar" in update_data and update_data["availability_calendar"]:
        update_data["availability_calendar"] = json.dumps(update_data["availability_calendar"])

    if is_artist:
        min_price = update_data.get("min_price", profile.min_price or 0) or 0
        update_data["min_price"] = min_price
        # Store same value for backward compatibility; UI shows only "Price onwards".
        update_data["max_price"] = min_price
    else:
        update_data["min_price"] = 0
        update_data["max_price"] = 0
    
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    profile.ai_score = calculate_ai_score(profile, db)
    
    db.commit()
    db.refresh(profile)
    
    return profile

@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    """Get a specific profile by ID"""
    profile = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.id == profile_id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.get("/profiles/user/{user_id}")
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Get a profile by user ID. Falls back to basic user info if no profile exists."""
    profile = (
        db.query(Profile)
        .options(joinedload(Profile.user))
        .filter(Profile.user_id == user_id)
        .first()
    )
    if profile:
        return profile

    # Fallback: construct a minimal response from User data
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "id": 0,
        "user_id": user.id,
        "name": user.email.split('@')[0].title(),
        "category": user.role.title() if user.role else "Member",
        "location": None,
        "languages": None,
        "bio": None,
        "phone": None,
        "profile_photo_url": user.profile_photo_url,
        "portfolio_videos": None,
        "portfolio_images": None,
        "portfolio_links": None,
        "min_price": 0,
        "max_price": 0,
        "experience_years": 0,
        "ai_score": 0.0,
        "response_time_avg": 0.0,
        "total_hires": 0,
        "total_reviews": 0,
        "average_rating": 0.0,
        "past_events": None,
        "availability_calendar": None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.created_at.isoformat() if user.created_at else None,
        "has_profile": False,
    }

@router.get("/profiles", response_model=List[ProfileResponse])
def search_profiles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Search profiles with filters and text search"""
    query = db.query(Profile).join(User).filter(
        User.is_active == True,
        User.is_verified == True,
        User.role != "admin",
    )
    
    # Text search across name, category, location, bio
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (Profile.name.ilike(search_term)) |
            (Profile.category.ilike(search_term)) |
            (Profile.location.ilike(search_term)) |
            (Profile.bio.ilike(search_term))
        )
    
    if category:
        query = query.filter(Profile.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(Profile.location.ilike(f"%{location}%"))
    if min_price:
        query = query.filter(Profile.min_price >= min_price)
    if max_price:
        query = query.filter(Profile.min_price <= max_price)
    
    profiles = query.order_by(Profile.ai_score.desc()).limit(limit).all()
    return profiles

@router.get("/search", response_model=List[dict])
def search_users(
    q: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search users and profiles by name, email, or category"""
    if not q or len(q.strip()) < 2:
        return []
    
    search_term = f"%{q.strip()}%"
    results = []
    
    # Search profiles (artists)
    profiles = db.query(Profile).join(User).filter(
        User.is_active == True,
        User.id != current_user.id,
        (User.role != "admin") if current_user.role != "admin" else True,
        (
            (Profile.name.ilike(search_term)) |
            (Profile.category.ilike(search_term)) |
            (Profile.location.ilike(search_term))
        )
    ).limit(limit).all()
    
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if user:
            results.append({
                "id": user.id,
                "user_id": user.id,
                "type": "profile",
                "name": profile.name,
                "category": profile.category,
                "location": profile.location,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, "value") else user.role,
                "is_verified": user.is_verified,
                "ai_score": profile.ai_score
            })
    
    # Search users by email if no profile matches
    if len(results) < limit:
        users = db.query(User).filter(
            User.is_active == True,
            User.id != current_user.id,
            (User.role != "admin") if current_user.role != "admin" else True,
            User.email.ilike(search_term)
        ).limit(limit - len(results)).all()
        
        for user in users:
            profile = db.query(Profile).filter(Profile.user_id == user.id).first()
            if not any(r["id"] == user.id for r in results):
                results.append({
                    "id": user.id,
                    "user_id": user.id,
                    "type": "user",
                    "name": profile.name if profile else user.email.split('@')[0],
                    "category": profile.category if profile else user.role,
                    "location": profile.location if profile else None,
                    "email": user.email,
                    "role": user.role.value if hasattr(user.role, "value") else user.role,
                    "is_verified": user.is_verified,
                    "ai_score": profile.ai_score if profile else 0
                })
    
    return results

@router.post("/profiles/upload")
async def upload_portfolio_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload portfolio file (image or video)"""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Save file
    file_ext = file.filename.split(".")[-1] if "." in file.filename else ""
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{datetime.now().timestamp()}.{file_ext}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Update profile
    file_url = f"/static/{os.path.basename(file_path)}"
    
    if file.content_type and file.content_type.startswith("image/"):
        images = json.loads(profile.portfolio_images) if profile.portfolio_images else []
        images.append(file_url)
        profile.portfolio_images = json.dumps(images)
    elif file.content_type and file.content_type.startswith("video/"):
        videos = json.loads(profile.portfolio_videos) if profile.portfolio_videos else []
        videos.append(file_url)
        profile.portfolio_videos = json.dumps(videos)
    
    profile.ai_score = calculate_ai_score(profile, db)
    db.commit()
    
    return {"message": "File uploaded successfully", "url": file_url}


@router.post("/me/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload or update the current user's profile photo."""
    # Validate content type
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Only JPG and PNG are allowed.",
        )

    # Enforce max size (5MB) while streaming
    max_size = 5 * 1024 * 1024  # 5MB
    size = 0
    contents = bytearray()

    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB.",
            )
        contents.extend(chunk)

    # Determine extension
    original_name = file.filename or ""
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in {"jpg", "jpeg", "png"}:
        # Fallback to content-type-based extension
        if file.content_type in {"image/jpeg", "image/jpg"}:
            ext = "jpg"
        elif file.content_type == "image/png":
            ext = "png"
        else:
            ext = "jpg"

    # Save under static/profile_photos with a unique filename
    profile_photo_dir = os.path.join("static", "profile_photos")
    os.makedirs(profile_photo_dir, exist_ok=True)

    filename = f"user_{current_user.id}_{uuid4().hex}.{ext}"
    file_path = os.path.join(profile_photo_dir, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/static/profile_photos/{filename}"

    # Update user record
    current_user.profile_photo_url = file_url
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile photo uploaded successfully",
        "profile_photo_url": file_url,
    }


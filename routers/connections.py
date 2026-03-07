from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Connection, Profile, Notification
from schemas import UserResponse, ProfileResponse
from auth import get_current_active_user

router = APIRouter(prefix="/api/connections", tags=["connections"])

@router.post("/{user_id}/follow", response_model=dict)
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Follow a user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(Connection).filter(
        Connection.follower_id == current_user.id,
        Connection.following_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    new_connection = Connection(
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(new_connection)
    
    # Create "New Follower" notification for the target user
    sender_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    sender_name = sender_profile.name if sender_profile else current_user.email.split('@')[0]
    
    notification = Notification(
        user_id=user_id,
        title="New Follower",
        message=f"{sender_name} started following you",
        type="NEW_FOLLOW",
        link=f"/view-profile?user_id={current_user.id}"
    )
    db.add(notification)
    
    db.commit()
    
    return {"message": "User followed successfully"}

@router.delete("/{user_id}/unfollow")
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    connection = db.query(Connection).filter(
        Connection.follower_id == current_user.id,
        Connection.following_id == user_id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    db.delete(connection)
    db.commit()
    
    return {"message": "User unfollowed successfully"}

@router.get("/followers", response_model=List[dict])
def get_followers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get users who follow current user"""
    connections = db.query(Connection).filter(
        Connection.following_id == current_user.id
    ).all()
    
    result = []
    for conn in connections:
        user = db.query(User).filter(User.id == conn.follower_id).first()
        if not user:
            continue
        profile = db.query(Profile).filter(Profile.user_id == conn.follower_id).first()
        result.append({
            "user_id": user.id,
            "email": user.email,
            "name": profile.name if profile else None,
            "category": profile.category if profile else None,
            "profile_id": profile.id if profile else None,
            "role": user.role,
            "followed_at": conn.created_at.isoformat() if conn.created_at else None
        })
    
    return result

@router.get("/following", response_model=List[dict])
def get_following(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get users that current user follows"""
    connections = db.query(Connection).filter(
        Connection.follower_id == current_user.id
    ).all()
    
    result = []
    for conn in connections:
        user = db.query(User).filter(User.id == conn.following_id).first()
        if not user:
            continue
        profile = db.query(Profile).filter(Profile.user_id == conn.following_id).first()
        result.append({
            "user_id": user.id,
            "email": user.email,
            "name": profile.name if profile else None,
            "category": profile.category if profile else None,
            "profile_id": profile.id if profile else None,
            "role": user.role,
            "followed_at": conn.created_at.isoformat() if conn.created_at else None
        })
    
    return result

@router.get("/{user_id}/status")
def get_connection_status(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if current user follows another user"""
    connection = db.query(Connection).filter(
        Connection.follower_id == current_user.id,
        Connection.following_id == user_id
    ).first()
    
    return {"is_following": connection is not None}


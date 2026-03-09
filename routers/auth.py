from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, Token, OTPRequest, OTPVerify, UserResponse
from auth import (
    get_password_hash, verify_password, create_access_token,
    generate_otp, store_otp, verify_otp, get_current_active_user
)
from datetime import datetime, timedelta
from email_service import send_otp_email
import os

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Enforce username uniqueness
    username = user_data.username.strip()
    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )

    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        is_verified=False,
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip(),
        username=username,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/check-username")
def check_username_availability(username: str, db: Session = Depends(get_db)):
    """Check if a username is valid and available"""
    username_clean = username.strip()

    # Reuse the same validation pattern as the schema
    import re

    pattern = re.compile(r"^[a-zA-Z0-9._#@]{4,30}$")
    if not pattern.match(username_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid username. Username can contain letters, numbers, and . _ # @ characters (4–30 characters, no spaces).",
        )

    exists = db.query(User).filter(User.username == username_clean).first() is not None
    return {"username": username_clean, "available": not exists}

@router.post("/request-otp")
def request_otp(otp_request: OTPRequest, db: Session = Depends(get_db)):
    """Request OTP for email verification"""
    user = db.query(User).filter(User.email == otp_request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate and store OTP
    otp = generate_otp()
    store_otp(otp_request.email, otp)
    
    # Send OTP email
    try:
        email_sent = send_otp_email(otp_request.email, otp)
    except Exception as e:
        print(f"Error sending email: {e}")
        email_sent = False
    
    # Always return OTP in development mode for easy testing
    # In production, remove the "otp" field from response
    response = {
        "message": "OTP sent to email" if email_sent else "OTP generated (check console/terminal)",
        "otp": otp,  # Always include for development - remove in production
        "dev_mode": not email_sent
    }
    
    return response

@router.post("/verify-otp")
def verify_otp_endpoint(otp_data: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and mark user as verified"""
    if not verify_otp(otp_data.email, otp_data.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    user = db.query(User).filter(User.email == otp_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified = True
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=30 * 24 * 60)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    paid_verified = (
        current_user.verification_payment_status == "approved"
        and current_user.verification_type
        and current_user.verification_expiry
        and current_user.verification_expiry > datetime.utcnow()
    )
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "verification_type": current_user.verification_type if paid_verified else None,
        "verification_payment_status": current_user.verification_payment_status,
        "verification_expiry": current_user.verification_expiry if paid_verified else None,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "username": current_user.username,
        "profile_photo_url": current_user.profile_photo_url,
    }


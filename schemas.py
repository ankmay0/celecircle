from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, GigStatus, ApplicationStatus, PaymentStatus, BookingStatus, BookingPaymentType, BookingPaymentStatus
import re

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    first_name: str
    last_name: str
    username: str

    @validator("username")
    def validate_username(cls, v: str) -> str:
        username = v.strip()
        pattern = re.compile(r"^[a-zA-Z0-9._#@]{4,30}$")
        if not pattern.match(username):
            raise ValueError(
                "Invalid username. Username can contain letters, numbers, and . _ # @ characters (4–30 characters, no spaces)."
            )
        return username

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

# User Schemas
class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_verified: bool
    verification_type: Optional[str] = None
    verification_payment_status: Optional[str] = None
    verification_expiry: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# Profile Schemas
class ProfileCreate(BaseModel):
    name: str
    category: str
    location: Optional[str] = None
    languages: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    min_price: Optional[float] = 0
    max_price: Optional[float] = 0
    experience_years: Optional[int] = 0

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    languages: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    portfolio_videos: Optional[List[str]] = None
    portfolio_images: Optional[List[str]] = None
    portfolio_links: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    experience_years: Optional[int] = None
    past_events: Optional[List[dict]] = None
    availability_calendar: Optional[dict] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    category: str
    location: Optional[str]
    languages: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    profile_photo_url: Optional[str] = None
    portfolio_videos: Optional[str]
    portfolio_images: Optional[str]
    portfolio_links: Optional[str]
    min_price: float
    max_price: float
    experience_years: int
    ai_score: float
    response_time_avg: float
    total_hires: int
    total_reviews: int
    average_rating: float
    verification_type: Optional[str] = None
    verification_expiry: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Gig Schemas
class GigCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    budget_min: float
    budget_max: float
    required_languages: Optional[str] = None
    required_experience: Optional[int] = 0

class GigUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    event_date: Optional[datetime] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    status: Optional[GigStatus] = None

class GigResponse(BaseModel):
    id: int
    organizer_id: int
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    budget_min: float
    budget_max: float
    status: GigStatus
    required_languages: Optional[str]
    required_experience: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Application Schemas
class ApplicationCreate(BaseModel):
    gig_id: int
    proposal: str
    quote: float

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationResponse(BaseModel):
    id: int
    gig_id: int
    artist_id: int
    proposal: str
    quote: float
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    gig_id: int
    artist_id: int
    amount: float

class PaymentResponse(BaseModel):
    id: int
    gig_id: int
    organizer_id: int
    artist_id: int
    amount: float
    status: PaymentStatus
    transaction_id: Optional[str]
    paid_at: Optional[datetime]
    released_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    gig_id: int
    artist_id: int
    rating: int
    comment: Optional[str] = None
    
    @validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewResponse(BaseModel):
    id: int
    gig_id: int
    artist_id: int
    organizer_id: int
    rating: int
    comment: Optional[str]
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessageCreate(BaseModel):
    receiver_id: int
    gig_id: Optional[int] = None
    message: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None  # 'image', 'video', 'file'

class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    gig_id: Optional[int]
    message: str
    is_read: bool
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Post Schemas
class PostCreate(BaseModel):
    content: str
    media_type: Optional[str] = "text"
    media_urls: Optional[List[str]] = None

class PostAuthorProfile(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None

class PostAuthor(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    verification_type: Optional[str] = None
    profile_photo_url: Optional[str] = None
    profile: Optional[PostAuthorProfile] = None

class PostResponse(BaseModel):
    id: int
    author_id: int
    content: str
    media_type: str
    media_urls: Optional[str]
    likes_count: int
    comments_count: int
    shares_count: int
    created_at: datetime
    updated_at: datetime
    author: Optional[PostAuthor] = None
    
    class Config:
        from_attributes = True

class LikeResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    author_id: int
    post_id: int
    parent_id: Optional[int]
    content: str
    likes_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Booking Schemas
class BookingCreate(BaseModel):
    artist_id: int
    event_date: datetime
    event_type: str
    location: str
    duration: Optional[str] = None
    audience_size: Optional[str] = None
    event_details: Optional[str] = None
    # Optional add-ons
    accommodation_selected: Optional[bool] = False
    accommodation_price: Optional[float] = 0
    transport_selected: Optional[bool] = False
    transport_price: Optional[float] = 0
    security_selected: Optional[bool] = False
    security_price: Optional[float] = 0

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class BookingResponse(BaseModel):
    id: int
    organizer_id: int
    artist_id: int
    event_date: datetime
    event_type: str
    location: str
    duration: Optional[str]
    audience_size: Optional[str]
    event_details: Optional[str]
    artist_fee: float
    platform_fee: float
    # Add-ons
    accommodation_selected: bool = False
    accommodation_price: float = 0
    transport_selected: bool = False
    transport_price: float = 0
    security_selected: bool = False
    security_price: float = 0
    # Totals
    total_amount: float
    advance_amount: float = 0
    advance_paid: float
    remaining_amount: float
    status: BookingStatus
    payment_status: Optional[str] = "unpaid"
    organizer_completed: bool
    artist_completed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class BookingDetailResponse(BookingResponse):
    """Extended response including artist/organizer profile info"""
    artist_name: Optional[str] = None
    artist_category: Optional[str] = None
    artist_location: Optional[str] = None
    artist_rating: Optional[float] = None
    organizer_name: Optional[str] = None
    organizer_email: Optional[str] = None

class BookingPaymentResponse(BaseModel):
    id: int
    booking_id: int
    payment_type: BookingPaymentType
    amount: float
    status: BookingPaymentStatus
    transaction_id: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class BookingPriceCalculation(BaseModel):
    artist_fee: float
    platform_fee: float
    # Add-on defaults
    accommodation_price: float = 0
    transport_price: float = 0
    security_price: float = 0
    # Totals (base — without add-ons selected)
    total_amount: float
    advance_amount: float
    remaining_amount: float

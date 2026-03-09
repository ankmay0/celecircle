from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    ARTIST = "artist"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class GigStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    RELEASED = "released"
    REFUNDED = "refunded"
    FAILED = "failed"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    AWAITING_PAYMENT = "awaiting_payment"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class BookingPaymentType(str, enum.Enum):
    ADVANCE = "advance"
    FINAL = "final"

class BookingPaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class DisputeStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    CLOSED = "closed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String(30), unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_type = Column(String, nullable=True)  # organizer_verified | celebrity_verified
    verification_payment_status = Column(String, nullable=True)  # pending | approved | rejected
    verification_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    gigs_posted = relationship("Gig", back_populates="organizer", foreign_keys="Gig.organizer_id")
    applications = relationship("Application", back_populates="artist")
    payments_sent = relationship("Payment", back_populates="organizer", foreign_keys="Payment.organizer_id")
    payments_received = relationship("Payment", back_populates="artist", foreign_keys="Payment.artist_id")
    reviews_given = relationship("Review", back_populates="organizer", foreign_keys="Review.organizer_id")
    reviews_received = relationship("Review", back_populates="artist", foreign_keys="Review.artist_id")
    chat_messages_sent = relationship("ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id")
    notifications = relationship("Notification", back_populates="user")
    posts = relationship("Post", back_populates="author", foreign_keys="Post.author_id")
    likes = relationship("Like", back_populates="user")
    comments = relationship("Comment", back_populates="author")
    connections_sent = relationship("Connection", back_populates="follower", foreign_keys="Connection.follower_id")
    connections_received = relationship("Connection", back_populates="following", foreign_keys="Connection.following_id")

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic Info
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Singer, Dancer, Actor, etc.
    location = Column(String)
    languages = Column(String)  # Comma-separated
    bio = Column(Text)
    phone = Column(String)
    
    # Portfolio
    portfolio_videos = Column(Text)  # JSON array of video URLs
    portfolio_images = Column(Text)  # JSON array of image URLs
    portfolio_links = Column(Text)  # JSON array of external links
    
    # Pricing
    min_price = Column(Float, default=0)
    max_price = Column(Float, default=0)
    
    # Experience
    experience_years = Column(Integer, default=0)
    past_events = Column(Text)  # JSON array of past events
    
    # Availability
    availability_calendar = Column(Text)  # JSON object with dates
    
    # AI Score
    ai_score = Column(Float, default=0.0)
    response_time_avg = Column(Float, default=0.0)  # in hours
    
    # Stats
    total_hires = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

    @property
    def profile_photo_url(self):
        """Convenience attribute for API responses (stored on User)."""
        return self.user.profile_photo_url if self.user else None

    @property
    def verification_type(self):
        if not self.user:
            return None
        expiry = self.user.verification_expiry
        if (
            self.user.verification_type
            and self.user.verification_payment_status == "approved"
            and expiry
            and expiry > datetime.utcnow()
        ):
            return self.user.verification_type
        return None

    @property
    def verification_expiry(self):
        if not self.user:
            return None
        expiry = self.user.verification_expiry
        if (
            self.user.verification_type
            and self.user.verification_payment_status == "approved"
            and expiry
            and expiry > datetime.utcnow()
        ):
            return expiry
        return None

class Gig(Base):
    __tablename__ = "gigs"
    
    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    location = Column(String, nullable=False)
    event_date = Column(DateTime, nullable=False)
    budget_min = Column(Float, nullable=False)
    budget_max = Column(Float, nullable=False)
    status = Column(SQLEnum(GigStatus), default=GigStatus.DRAFT)
    
    # Requirements
    required_languages = Column(String)  # Comma-separated
    required_experience = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organizer = relationship("User", back_populates="gigs_posted", foreign_keys=[organizer_id])
    applications = relationship("Application", back_populates="gig", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="gig", uselist=False)

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    proposal = Column(Text, nullable=False)
    quote = Column(Float, nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    gig = relationship("Gig", back_populates="applications")
    artist = relationship("User", back_populates="applications")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), unique=True, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Payment Gateway Info
    stripe_payment_intent_id = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    
    # Timestamps
    paid_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    gig = relationship("Gig", back_populates="payment")
    organizer = relationship("User", back_populates="payments_sent", foreign_keys=[organizer_id])
    artist = relationship("User", back_populates="payments_received", foreign_keys=[artist_id])

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    is_verified = Column(Boolean, default=False)  # AI verification
    is_moderated = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    artist = relationship("User", back_populates="reviews_received", foreign_keys=[artist_id])
    organizer = relationship("User", back_populates="reviews_given", foreign_keys=[organizer_id])

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=True)
    
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    attachment_url = Column(String, nullable=True)
    attachment_type = Column(String, nullable=True)  # 'image', 'video', 'file'
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship("User", back_populates="chat_messages_sent", foreign_keys=[sender_id])

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # application, payment, message, review, etc.
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    media_type = Column(String, default="text")  # text, image, video, carousel
    media_urls = Column(Text)  # JSON array of URLs
    
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="posts", foreign_keys=[author_id])
    likes_rel = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments_rel = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes_rel")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # For replies
    
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments_rel")
    parent = relationship("Comment", remote_side=[id], backref="replies")

class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    follower = relationship("User", back_populates="connections_sent", foreign_keys=[follower_id])
    following = relationship("User", back_populates="connections_received", foreign_keys=[following_id])

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    event_date = Column(DateTime, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    duration = Column(String)  # e.g. "2 hours", "Full Day"
    audience_size = Column(String, nullable=True)  # Optional
    event_details = Column(Text, nullable=True)
    
    # Pricing
    artist_fee = Column(Float, nullable=False, default=0)
    platform_fee = Column(Float, nullable=False, default=3000)  # Fixed ₹3000
    
    # Optional add-ons
    accommodation_selected = Column(Boolean, default=False)
    accommodation_price = Column(Float, default=0)
    transport_selected = Column(Boolean, default=False)
    transport_price = Column(Float, default=0)
    security_selected = Column(Boolean, default=False)
    security_price = Column(Float, default=0)
    
    # Calculated totals (server-authoritative)
    total_amount = Column(Float, nullable=False, default=0)
    advance_amount = Column(Float, nullable=False, default=0)
    advance_paid = Column(Float, default=0)
    remaining_amount = Column(Float, default=0)
    
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.PENDING, index=True)
    payment_status = Column(String, default="unpaid", index=True)
    
    # Completion tracking
    organizer_completed = Column(Boolean, default=False)
    artist_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    organizer = relationship("User", foreign_keys=[organizer_id])
    artist = relationship("User", foreign_keys=[artist_id])
    booking_payments = relationship("BookingPayment", back_populates="booking", cascade="all, delete-orphan")
    payouts = relationship("Payout", foreign_keys="Payout.booking_id")


class BookingPayment(Base):
    __tablename__ = "booking_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    
    payment_type = Column(SQLEnum(BookingPaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(BookingPaymentStatus), default=BookingPaymentStatus.PENDING)
    transaction_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    booking = relationship("Booking", back_populates="booking_payments")


class ArtistAvailability(Base):
    __tablename__ = "artist_availability"
    
    id = Column(Integer, primary_key=True, index=True)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_date = Column(DateTime, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    artist = relationship("User", foreign_keys=[artist_id])


class ResolutionType(str, enum.Enum):
    REFUND = "refund"
    PARTIAL = "partial"
    RELEASE = "release"


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    raised_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    evidence_url = Column(String, nullable=True)
    status = Column(SQLEnum(DisputeStatus), default=DisputeStatus.OPEN)
    resolution_type = Column(SQLEnum(ResolutionType), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", foreign_keys=[booking_id])
    raiser = relationship("User", foreign_keys=[raised_by])
    resolver = relationship("User", foreign_keys=[resolved_by])


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    updater = relationship("User", foreign_keys=[updated_by])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False, index=True)
    affected_entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    admin = relationship("User", foreign_keys=[admin_id])


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    artist_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    total_artist_fee = Column(Float, nullable=False, default=0)
    advance_paid = Column(Float, nullable=False, default=0)
    remaining_paid = Column(Float, nullable=False, default=0)
    payout_status = Column(SQLEnum(PayoutStatus), default=PayoutStatus.PENDING)
    payout_date = Column(DateTime, nullable=True)
    transaction_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", foreign_keys=[booking_id])
    artist = relationship("User", foreign_keys=[artist_id])

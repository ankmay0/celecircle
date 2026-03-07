from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# PostgreSQL Database Configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "celelink_db")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import (
        User, Profile, Gig, Application, Payment, Review,
        ChatMessage, Notification, Post, Like, Comment, Connection,
        Booking, BookingPayment, ArtistAvailability,
        Dispute, SystemSetting, AuditLog, Payout
    )
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        # User columns
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;"))

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username "
                "ON users (username) WHERE username IS NOT NULL;"
            )
        )

        # Booking add-on & pricing columns
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accommodation_selected BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accommodation_price FLOAT DEFAULT 0;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transport_selected BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transport_price FLOAT DEFAULT 0;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS security_selected BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS security_price FLOAT DEFAULT 0;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_amount FLOAT DEFAULT 0;"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'unpaid';"))

        conn.execute(text("ALTER TABLE bookings ALTER COLUMN event_details DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE bookings ALTER COLUMN audience_size DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE bookings ALTER COLUMN duration DROP NOT NULL;"))

        # Dispute new columns
        conn.execute(text("ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_type VARCHAR;"))
        conn.execute(text("ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;"))

        # Performance indices
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_payment_status ON bookings (payment_status);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_created_at ON bookings (created_at);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_artist_id ON bookings (artist_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_organizer_id ON bookings (organizer_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_event_date ON bookings (event_date);"))

        # Seed default system settings if table is empty
        existing = conn.execute(text("SELECT COUNT(*) FROM system_settings")).scalar()
        if existing == 0:
            conn.execute(text(
                "INSERT INTO system_settings (key, value, description) VALUES "
                "('platform_fee', '3000', 'Fixed platform & support fee per booking'),"
                "('accommodation_price', '5000', 'Default accommodation add-on price'),"
                "('transport_price', '3000', 'Default transport add-on price'),"
                "('security_price', '4000', 'Default security add-on price'),"
                "('accommodation_enabled', 'true', 'Enable accommodation add-on'),"
                "('transport_enabled', 'true', 'Enable transport add-on'),"
                "('security_enabled', 'true', 'Enable security add-on'),"
                "('cancellation_policy', 'Cancellations must be made 48 hours before the event for a full refund.', 'Cancellation policy text'),"
                "('tax_percentage', '0', 'Tax percentage applied to bookings (future-ready)')"
            ))
        else:
            has_tax = conn.execute(text("SELECT COUNT(*) FROM system_settings WHERE key='tax_percentage'")).scalar()
            if not has_tax:
                conn.execute(text(
                    "INSERT INTO system_settings (key, value, description) VALUES "
                    "('tax_percentage', '0', 'Tax percentage applied to bookings (future-ready)')"
                ))

        conn.commit()
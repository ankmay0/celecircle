from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()


def _build_database_url() -> str:
    """Resolve database URL from env with SQLite as dev default."""
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        if explicit_url.startswith("postgres://"):
            return explicit_url.replace("postgres://", "postgresql+psycopg://", 1)
        if explicit_url.startswith("postgresql://"):
            return explicit_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return explicit_url

    db_engine = os.getenv("DB_ENGINE", "sqlite").strip().lower()
    if db_engine == "postgresql" or db_engine == "postgres":
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "celelink_db")
        return f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    sqlite_path = os.getenv("SQLITE_PATH", "./celelink.db")
    if sqlite_path.startswith("sqlite:///"):
        return sqlite_path
    return f"sqlite:///{sqlite_path}"


SQLALCHEMY_DATABASE_URL = _build_database_url()
IS_SQLITE = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

DEFAULT_SYSTEM_SETTINGS = [
    ("platform_fee", "3000", "Fixed platform & support fee per booking"),
    ("accommodation_price", "5000", "Default accommodation add-on price"),
    ("transport_price", "3000", "Default transport add-on price"),
    ("security_price", "4000", "Default security add-on price"),
    ("accommodation_enabled", "true", "Enable accommodation add-on"),
    ("transport_enabled", "true", "Enable transport add-on"),
    ("security_enabled", "true", "Enable security add-on"),
    (
        "cancellation_policy",
        "Cancellations must be made 48 hours before the event for a full refund.",
        "Cancellation policy text",
    ),
    ("tax_percentage", "0", "Tax percentage applied to bookings (future-ready)"),
]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _seed_default_system_settings(conn):
    for key, value, description in DEFAULT_SYSTEM_SETTINGS:
        exists = conn.execute(
            text("SELECT COUNT(*) FROM system_settings WHERE key = :key"),
            {"key": key},
        ).scalar()
        if not exists:
            conn.execute(
                text(
                    "INSERT INTO system_settings (key, value, description) "
                    "VALUES (:key, :value, :description)"
                ),
                {"key": key, "value": value, "description": description},
            )


def _sqlite_add_column_if_missing(conn, table_name: str, column_name: str, ddl: str):
    existing_columns = {
        row[1]
        for row in conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    }
    if column_name not in existing_columns:
        conn.execute(text(ddl))


def _migrate_sqlite_schema(conn):
    # Upgrade existing SQLite databases created from older schemas.
    _sqlite_add_column_if_missing(conn, "users", "first_name", "ALTER TABLE users ADD COLUMN first_name VARCHAR")
    _sqlite_add_column_if_missing(conn, "users", "last_name", "ALTER TABLE users ADD COLUMN last_name VARCHAR")
    _sqlite_add_column_if_missing(conn, "users", "username", "ALTER TABLE users ADD COLUMN username VARCHAR(30)")
    _sqlite_add_column_if_missing(conn, "users", "profile_photo_url", "ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR")
    _sqlite_add_column_if_missing(conn, "users", "is_deleted", "ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT 0")
    _sqlite_add_column_if_missing(conn, "users", "deleted_at", "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP")

    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "accommodation_selected",
        "ALTER TABLE bookings ADD COLUMN accommodation_selected BOOLEAN DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "accommodation_price",
        "ALTER TABLE bookings ADD COLUMN accommodation_price FLOAT DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "transport_selected",
        "ALTER TABLE bookings ADD COLUMN transport_selected BOOLEAN DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "transport_price",
        "ALTER TABLE bookings ADD COLUMN transport_price FLOAT DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "security_selected",
        "ALTER TABLE bookings ADD COLUMN security_selected BOOLEAN DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "security_price",
        "ALTER TABLE bookings ADD COLUMN security_price FLOAT DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "advance_amount",
        "ALTER TABLE bookings ADD COLUMN advance_amount FLOAT DEFAULT 0",
    )
    _sqlite_add_column_if_missing(
        conn,
        "bookings",
        "payment_status",
        "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR DEFAULT 'unpaid'",
    )

    _sqlite_add_column_if_missing(
        conn,
        "disputes",
        "resolution_type",
        "ALTER TABLE disputes ADD COLUMN resolution_type VARCHAR",
    )
    _sqlite_add_column_if_missing(
        conn,
        "disputes",
        "resolved_at",
        "ALTER TABLE disputes ADD COLUMN resolved_at TIMESTAMP",
    )

    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_username ON users (username)"))
    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username "
            "ON users (username) WHERE username IS NOT NULL"
        )
    )
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_payment_status ON bookings (payment_status)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_created_at ON bookings (created_at)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_artist_id ON bookings (artist_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_organizer_id ON bookings (organizer_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_event_date ON bookings (event_date)"))

def init_db():
    from models import (
        User, Profile, Gig, Application, Payment, Review,
        ChatMessage, Notification, Post, Like, Comment, Connection,
        Booking, BookingPayment, ArtistAvailability,
        Dispute, SystemSetting, AuditLog, Payout
    )
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        if engine.dialect.name == "sqlite":
            _migrate_sqlite_schema(conn)
            _seed_default_system_settings(conn)
            conn.commit()
            return

        if engine.dialect.name != "postgresql":
            return

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

        _seed_default_system_settings(conn)

        conn.commit()

from database import engine
from sqlalchemy import text

if __name__ == "__main__":
    with engine.connect() as conn:
        # Delete related records first to avoid foreign key violations
        # Order matters: delete child tables before parent tables
        
        print("Deleting related records...")
        
        # Delete in order of dependencies
        conn.execute(text("DELETE FROM booking_payments;"))
        conn.execute(text("DELETE FROM artist_availability;"))
        conn.execute(text("DELETE FROM bookings;"))
        conn.execute(text("DELETE FROM comments;"))
        conn.execute(text("DELETE FROM likes;"))
        conn.execute(text("DELETE FROM posts;"))
        conn.execute(text("DELETE FROM notifications;"))
        conn.execute(text("DELETE FROM chat_messages;"))
        conn.execute(text("DELETE FROM reviews;"))
        conn.execute(text("DELETE FROM payments;"))
        conn.execute(text("DELETE FROM applications;"))
        conn.execute(text("DELETE FROM gigs;"))
        conn.execute(text("DELETE FROM connections;"))
        conn.execute(text("DELETE FROM profiles;"))
        
        print("Deleting users...")
        conn.execute(text("DELETE FROM users;"))
        
        conn.commit()
        print("Success! All users and related records deleted successfully.")
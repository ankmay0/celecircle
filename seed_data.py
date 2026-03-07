"""
Seed data script for CeleLink
Run this to populate the database with sample data
"""
from database import SessionLocal, init_db
from models import User, Profile, Gig, Application, Payment, Review
from auth import get_password_hash
from datetime import datetime, timedelta, timezone
import json
import sys

def seed_data():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@celelink.com").first()
        if existing_admin:
            print("Database already has seed data. Skipping seed creation.")
            print("If you want to recreate, delete celelink.db and run again.")
            return
        
        # Create admin user
        admin = User(
            email="admin@celelink.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_verified=True,
            is_active=True
        )
        db.add(admin)
        db.commit()
        
        # Create sample artists
        artists_data = [
            {
                "email": "singer@example.com",
                "name": "Priya Sharma",
                "category": "Singer",
                "location": "Mumbai, India",
                "languages": "Hindi, English",
                "bio": "Professional playback singer with 10+ years of experience",
                "min_price": 5000,
                "max_price": 50000,
                "experience_years": 10
            },
            {
                "email": "dancer@example.com",
                "name": "Raj Kumar",
                "category": "Dancer",
                "location": "Delhi, India",
                "languages": "Hindi, English, Punjabi",
                "bio": "Bollywood choreographer and dancer",
                "min_price": 3000,
                "max_price": 30000,
                "experience_years": 8
            },
            {
                "email": "actor@example.com",
                "name": "Amit Verma",
                "category": "Actor",
                "location": "Bangalore, India",
                "languages": "Hindi, English, Kannada",
                "bio": "Theater and film actor",
                "min_price": 10000,
                "max_price": 100000,
                "experience_years": 15
            }
        ]
        
        artists = []
        for artist_data in artists_data:
            user = User(
                email=artist_data["email"],
                hashed_password=get_password_hash("password123"),
                role="artist",
                is_verified=True,
                is_active=True
            )
            db.add(user)
            db.flush()
            
            profile = Profile(
                user_id=user.id,
                name=artist_data["name"],
                category=artist_data["category"],
                location=artist_data["location"],
                languages=artist_data["languages"],
                bio=artist_data["bio"],
                min_price=artist_data["min_price"],
                max_price=artist_data["max_price"],
                experience_years=artist_data["experience_years"],
                portfolio_images=json.dumps(["https://via.placeholder.com/400"]),
                ai_score=75.0,
                total_hires=5,
                total_reviews=3,
                average_rating=4.5
            )
            db.add(profile)
            artists.append(user)
        
        # Create sample organizers
        organizers_data = [
            {
                "email": "organizer1@example.com",
                "name": "Event Pro"
            },
            {
                "email": "organizer2@example.com",
                "name": "Wedding Planners Inc"
            }
        ]
        
        organizers = []
        for org_data in organizers_data:
            user = User(
                email=org_data["email"],
                hashed_password=get_password_hash("password123"),
                role="organizer",
                is_verified=True,
                is_active=True
            )
            db.add(user)
            organizers.append(user)
        
        db.commit()
        
        # Create sample gigs
        gigs_data = [
            {
                "organizer_id": organizers[0].id,
                "title": "Wedding Singer Needed",
                "description": "Looking for a professional singer for a wedding ceremony in Mumbai. Must know Hindi and English songs.",
                "category": "Singer",
                "location": "Mumbai, India",
                "event_date": datetime.now(timezone.utc) + timedelta(days=30),
                "budget_min": 10000,
                "budget_max": 30000,
                "status": "open"
            },
            {
                "organizer_id": organizers[1].id,
                "title": "Corporate Event - Dance Performance",
                "description": "Need a dance troupe for a corporate event. Bollywood style preferred.",
                "category": "Dancer",
                "location": "Delhi, India",
                "event_date": datetime.now(timezone.utc) + timedelta(days=45),
                "budget_min": 15000,
                "budget_max": 40000,
                "status": "open"
            }
        ]
        
        gigs = []
        for gig_data in gigs_data:
            gig = Gig(**gig_data)
            db.add(gig)
            gigs.append(gig)
        
        db.commit()
        
        print("Seed data created successfully!")
        print(f"   - Admin: admin@celelink.com / admin123")
        print(f"   - Artists: {len(artists)} created")
        print(f"   - Organizers: {len(organizers)} created")
        print(f"   - Gigs: {len(gigs)} created")
        print("\nAll users password: password123")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating seed data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_data()


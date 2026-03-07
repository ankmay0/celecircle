import json
from typing import List, Dict
from sqlalchemy.orm import Session
from models import Profile, Review, Application, User
from datetime import datetime, timedelta

def calculate_ai_score(profile: Profile, db: Session) -> float:
    """
    Calculate AI-generated artist score based on:
    - Number of hires
    - Ratings & reviews
    - Profile completeness
    - Response time
    """
    score = 0.0
    max_score = 100.0
    
    # 1. Profile Completeness (30 points)
    completeness = 0
    if profile.name:
        completeness += 1
    if profile.category:
        completeness += 1
    if profile.location:
        completeness += 1
    if profile.bio:
        completeness += 1
    if profile.phone:
        completeness += 1
    if profile.portfolio_images or profile.portfolio_videos:
        completeness += 2
    if profile.min_price > 0 and profile.max_price > 0:
        completeness += 1
    if profile.experience_years > 0:
        completeness += 1
    
    completeness_score = (completeness / 9) * 30
    score += completeness_score
    
    # 2. Ratings & Reviews (30 points)
    if profile.total_reviews > 0:
        rating_score = (profile.average_rating / 5.0) * 30
        # Bonus for number of reviews (up to 5 points)
        review_bonus = min(profile.total_reviews / 10, 5)
        score += rating_score + review_bonus
    else:
        # New artists get base score
        score += 5
    
    # 3. Number of Hires (25 points)
    if profile.total_hires > 0:
        hire_score = min(profile.total_hires * 2.5, 25)
        score += hire_score
    else:
        score += 2
    
    # 4. Response Time (15 points)
    if profile.response_time_avg > 0:
        # Faster response = higher score
        # 0-2 hours = 15 points, 2-12 hours = 10 points, 12-24 hours = 5 points, >24 hours = 0
        if profile.response_time_avg <= 2:
            response_score = 15
        elif profile.response_time_avg <= 12:
            response_score = 10
        elif profile.response_time_avg <= 24:
            response_score = 5
        else:
            response_score = 0
        score += response_score
    else:
        score += 5  # Default for new users
    
    return min(score, max_score)

def update_response_time(profile: Profile, db: Session, response_hours: float):
    """Update average response time"""
    if profile.response_time_avg == 0:
        profile.response_time_avg = response_hours
    else:
        # Weighted average
        profile.response_time_avg = (profile.response_time_avg * 0.7) + (response_hours * 0.3)
    db.commit()

def moderate_review(review_text: str, rating: int) -> bool:
    """
    Simple AI moderation for reviews.
    In production, use NLP models or external APIs.
    """
    if not review_text:
        return rating >= 3  # Allow ratings without text if >= 3
    
    # Basic checks
    review_lower = review_text.lower()
    
    # Check for spam patterns
    spam_words = ["spam", "test", "fake", "scam"]
    if any(word in review_lower for word in spam_words):
        return False
    
    # Check for minimum length
    if len(review_text.strip()) < 10 and rating == 5:
        return False  # Suspicious: very short 5-star review
    
    # Check for excessive repetition
    words = review_text.split()
    if len(words) > 0:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.3:
            return False  # Too repetitive
    
    return True

def recommend_artists(gig_category: str, location: str, budget: float, db: Session, limit: int = 10) -> List[Profile]:
    """
    Recommend artists to organizers based on:
    - Category match
    - Location proximity
    - Budget fit
    - AI score
    """
    # Base query
    query = db.query(Profile).join(User).filter(
        User.is_active == True,
        User.is_verified == True,
        User.role == "artist"
    )
    
    # Filter by category
    if gig_category:
        query = query.filter(Profile.category.ilike(f"%{gig_category}%"))
    
    # Filter by budget
    query = query.filter(
        Profile.min_price <= budget,
        Profile.max_price >= budget
    )
    
    profiles = query.all()
    
    # Score each profile
    scored_profiles = []
    for profile in profiles:
        score = profile.ai_score
        
        # Location bonus (simple string matching, use geocoding in production)
        if location and profile.location:
            if location.lower() in profile.location.lower() or profile.location.lower() in location.lower():
                score += 10
        
        # Category exact match bonus
        if profile.category.lower() == gig_category.lower():
            score += 15
        
        scored_profiles.append((score, profile))
    
    # Sort by score and return top results
    scored_profiles.sort(key=lambda x: x[0], reverse=True)
    return [profile for _, profile in scored_profiles[:limit]]

def recommend_gigs(artist_profile: Profile, db: Session, limit: int = 10) -> List:
    """
    Recommend gigs to artists based on:
    - Category match
    - Location
    - Budget fit
    - Date (upcoming)
    """
    from models import Gig, GigStatus
    
    # Base query
    query = db.query(Gig).filter(
        Gig.status == GigStatus.OPEN,
        Gig.event_date > datetime.utcnow()
    )
    
    # Filter by category
    if artist_profile.category:
        query = query.filter(Gig.category.ilike(f"%{artist_profile.category}%"))
    
    # Filter by budget
    if artist_profile.min_price > 0 and artist_profile.max_price > 0:
        query = query.filter(
            Gig.budget_min <= artist_profile.max_price,
            Gig.budget_max >= artist_profile.min_price
        )
    
    gigs = query.order_by(Gig.event_date.asc()).limit(limit * 2).all()
    
    # Score and rank
    scored_gigs = []
    for gig in gigs:
        score = 50  # Base score
        
        # Category exact match
        if gig.category.lower() == artist_profile.category.lower():
            score += 30
        
        # Location match
        if artist_profile.location and gig.location:
            if artist_profile.location.lower() in gig.location.lower():
                score += 20
        
        # Budget fit
        if artist_profile.min_price > 0:
            budget_fit = (gig.budget_min + gig.budget_max) / 2
            if artist_profile.min_price <= budget_fit <= artist_profile.max_price:
                score += 20
        
        # Time proximity (sooner events get slight bonus)
        days_until = (gig.event_date - datetime.utcnow()).days
        if 7 <= days_until <= 30:
            score += 10
        
        scored_gigs.append((score, gig))
    
    scored_gigs.sort(key=lambda x: x[0], reverse=True)
    return [gig for _, gig in scored_gigs[:limit]]


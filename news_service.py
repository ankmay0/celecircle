"""
News service to fetch real news articles from NewsAPI
"""
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta

# NewsAPI configuration
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
NEWS_API_BASE_URL = "https://newsapi.org/v2"

# Fallback topics mapping for entertainment industry
TOPIC_KEYWORDS = {
    "Entertainment industry trends": ["entertainment", "music industry", "film industry", "celebrity"],
    "Top gig opportunities": ["gig", "event", "concert", "performance", "booking"],
    "Artist success stories": ["artist", "musician", "singer", "performer", "success"],
    "Industry insights": ["entertainment business", "music business", "show business", "industry"]
}

def get_news_by_topic(topic: str, limit: int = 10) -> List[Dict]:
    """
    Fetch news articles for a given topic
    
    Args:
        topic: The news topic/title
        limit: Maximum number of articles to return
        
    Returns:
        List of news articles with title, description, url, publishedAt, source
    """
    if not NEWS_API_KEY:
        # Return mock data if API key is not configured
        return get_mock_news(topic, limit)
    
    try:
        # Map topic to search keywords
        keywords = TOPIC_KEYWORDS.get(topic, [topic.lower()])
        query = " OR ".join(keywords[:3])  # Use first 3 keywords
        
        # Calculate date range (last 7 days)
        from_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        # Make API request
        url = f"{NEWS_API_BASE_URL}/everything"
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "from": from_date,
            "pageSize": limit,
            "apiKey": NEWS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("status") == "ok" and data.get("articles"):
            articles = []
            for article in data["articles"][:limit]:
                if article.get("title") and article.get("url"):
                    articles.append({
                        "title": article.get("title", ""),
                        "description": article.get("description", ""),
                        "url": article.get("url", ""),
                        "publishedAt": article.get("publishedAt", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "imageUrl": article.get("urlToImage", "")
                    })
            return articles
        else:
            return get_mock_news(topic, limit)
            
    except requests.exceptions.RequestException as e:
        print(f"Error fetching news from API: {e}")
        return get_mock_news(topic, limit)
    except Exception as e:
        print(f"Unexpected error in news service: {e}")
        return get_mock_news(topic, limit)

def get_mock_news(topic: str, limit: int = 10) -> List[Dict]:
    """
    Return mock news data when API is not available
    """
    mock_articles = {
        "Entertainment industry trends": [
            {
                "title": "Entertainment Industry Sees Record Growth in 2024",
                "description": "The entertainment industry continues to expand with new opportunities for artists and performers.",
                "url": "https://example.com/news/entertainment-growth",
                "publishedAt": datetime.now().isoformat(),
                "source": "Entertainment Weekly",
                "imageUrl": ""
            },
            {
                "title": "Digital Platforms Transform Artist Discovery",
                "description": "New platforms are revolutionizing how artists are discovered and booked for events.",
                "url": "https://example.com/news/digital-platforms",
                "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
                "source": "Music Business News",
                "imageUrl": ""
            }
        ],
        "Top gig opportunities": [
            {
                "title": "Summer Festival Season Brings Thousands of Gig Opportunities",
                "description": "Festival organizers are actively seeking talented performers for the upcoming season.",
                "url": "https://example.com/news/festival-gigs",
                "publishedAt": datetime.now().isoformat(),
                "source": "Gig Finder",
                "imageUrl": ""
            },
            {
                "title": "Corporate Events Drive Demand for Live Performers",
                "description": "Companies are increasingly hiring artists for corporate events and team building.",
                "url": "https://example.com/news/corporate-events",
                "publishedAt": (datetime.now() - timedelta(hours=3)).isoformat(),
                "source": "Event Industry News",
                "imageUrl": ""
            }
        ],
        "Artist success stories": [
            {
                "title": "Independent Artist Lands Major Festival Headlining Spot",
                "description": "An independent artist's journey from local gigs to headlining major festivals.",
                "url": "https://example.com/news/artist-success",
                "publishedAt": datetime.now().isoformat(),
                "source": "Artist Spotlight",
                "imageUrl": ""
            },
            {
                "title": "How Social Media Helped This Performer Build a Career",
                "description": "A performer shares how strategic social media use led to booking opportunities.",
                "url": "https://example.com/news/social-media-success",
                "publishedAt": (datetime.now() - timedelta(hours=5)).isoformat(),
                "source": "Performer Magazine",
                "imageUrl": ""
            }
        ],
        "Industry insights": [
            {
                "title": "The Future of Live Entertainment: Trends to Watch",
                "description": "Industry experts share insights on emerging trends in live entertainment.",
                "url": "https://example.com/news/future-entertainment",
                "publishedAt": datetime.now().isoformat(),
                "source": "Industry Insider",
                "imageUrl": ""
            },
            {
                "title": "Pricing Strategies for Independent Artists",
                "description": "How to price your services competitively while maintaining profitability.",
                "url": "https://example.com/news/pricing-strategies",
                "publishedAt": (datetime.now() - timedelta(hours=6)).isoformat(),
                "source": "Artist Business Guide",
                "imageUrl": ""
            }
        ]
    }
    
    # Return mock articles for the topic, or generic ones if topic not found
    articles = mock_articles.get(topic, [
        {
            "title": f"Latest Updates on {topic}",
            "description": f"Stay informed about the latest developments in {topic}.",
            "url": "https://example.com/news/latest",
            "publishedAt": datetime.now().isoformat(),
            "source": "CeleCircle News",
            "imageUrl": ""
        }
    ])
    
    return articles[:limit]

def format_news_date(date_string: str) -> str:
    """
    Format ISO date string to human-readable format
    """
    try:
        dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "Just now"
    except:
        return "Recently"

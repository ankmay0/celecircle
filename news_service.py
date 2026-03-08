"""
News service to fetch real news articles from GNews.
"""
import os
import requests
from typing import List, Dict
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# GNews configuration
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY") or os.getenv("NEWS_API_KEY", "")
GNEWS_API_BASE_URL = "https://gnews.io/api/v4"
DEFAULT_NEWS_TOPIC = "Odisha Ollywood entertainment industry"

# Topic mapping focused on India, Odisha and Ollywood.
TOPIC_QUERIES = {
    "Odisha Ollywood entertainment industry": "(Ollywood OR Odisha) AND (cinema OR film OR entertainment OR celebrity)",
    "Entertainment industry trends": "(India entertainment industry) AND (Odisha OR Ollywood OR Bollywood)",
    "Top gig opportunities": "(India events OR live shows OR concert bookings) AND (Odisha OR Bhubaneswar)",
    "Artist success stories": "(Ollywood artist OR Odisha singer OR Odisha actor) AND success",
    "Industry insights": "(Ollywood industry OR Odisha film industry) AND insights",
}

def _resolve_query(topic: str) -> str:
    resolved_topic = (topic or "").strip() or DEFAULT_NEWS_TOPIC
    return TOPIC_QUERIES.get(resolved_topic, resolved_topic)

def _normalize_article(article: Dict) -> Dict:
    source = article.get("source") or {}
    return {
        "title": article.get("title", ""),
        "description": article.get("description") or article.get("content", ""),
        "url": article.get("url", ""),
        "publishedAt": article.get("publishedAt", ""),
        "source": source.get("name", "Unknown"),
        "imageUrl": article.get("image", "")
    }

def _fetch_gnews_search(query: str, limit: int) -> List[Dict]:
    url = f"{GNEWS_API_BASE_URL}/search"
    params = {
        "q": query,
        "lang": "en",
        "country": "in",
        "max": min(max(limit, 1), 50),
        "sortby": "publishedAt",
        "token": GNEWS_API_KEY,
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    return data.get("articles") or []

def _fetch_gnews_top_headlines(limit: int) -> List[Dict]:
    url = f"{GNEWS_API_BASE_URL}/top-headlines"
    params = {
        "category": "entertainment",
        "lang": "en",
        "country": "in",
        "max": min(max(limit, 1), 50),
        "token": GNEWS_API_KEY,
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    return data.get("articles") or []

def get_news_by_topic(topic: str, limit: int = 10) -> List[Dict]:
    """
    Fetch news articles for a given topic
    
    Args:
        topic: The news topic/title
        limit: Maximum number of articles to return
        
    Returns:
        List of news articles with title, description, url, publishedAt, source
    """
    if not GNEWS_API_KEY:
        # Return mock data if API key is not configured
        return get_mock_news(topic, limit)
    
    try:
        query = _resolve_query(topic)
        candidate_queries = [
            query,
            "Ollywood Odisha cinema",
            "Odisha entertainment",
            "India entertainment celebrity",
        ]
        resolved_topic = (topic or "").strip()
        if resolved_topic:
            candidate_queries.append(resolved_topic)

        articles: List[Dict] = []
        seen_urls = set()

        for candidate in candidate_queries:
            if not candidate:
                continue
            try:
                fetched = _fetch_gnews_search(candidate, min(limit * 3, 50))
            except requests.exceptions.RequestException:
                continue

            for raw in fetched:
                if not raw.get("title") or not raw.get("url"):
                    continue
                if raw["url"] in seen_urls:
                    continue
                seen_urls.add(raw["url"])
                articles.append(_normalize_article(raw))
                if len(articles) >= limit:
                    return articles

        # If search gives sparse results, broaden with India entertainment headlines.
        if len(articles) < limit:
            try:
                headlines = _fetch_gnews_top_headlines(min(limit * 3, 50))
                for raw in headlines:
                    if not raw.get("title") or not raw.get("url"):
                        continue
                    if raw["url"] in seen_urls:
                        continue
                    seen_urls.add(raw["url"])
                    articles.append(_normalize_article(raw))
                    if len(articles) >= limit:
                        break
            except requests.exceptions.RequestException:
                pass

        if articles:
            return articles[:limit]

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
        "Odisha Ollywood entertainment industry": [
            {
                "title": "Ollywood Production Activity Rises Across Odisha",
                "description": "Regional studios and creators report stronger release pipelines and audience growth in Odisha.",
                "url": "https://example.com/news/ollywood-production-growth",
                "publishedAt": datetime.now().isoformat(),
                "source": "Odisha Entertainment Desk",
                "imageUrl": ""
            },
            {
                "title": "Bhubaneswar Events Circuit Drives Demand for Performers",
                "description": "Event planners in Odisha highlight increased demand for local artists and live entertainment talent.",
                "url": "https://example.com/news/bhubaneswar-events-demand",
                "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
                "source": "India Events Watch",
                "imageUrl": ""
            }
        ],
        "Entertainment industry trends": [
            {
                "title": "India Entertainment Markets Expand with Regional Growth",
                "description": "Analysts see stronger momentum from regional film and creator ecosystems including Odisha.",
                "url": "https://example.com/news/india-entertainment-regional-growth",
                "publishedAt": datetime.now().isoformat(),
                "source": "Entertainment Weekly India",
                "imageUrl": ""
            },
            {
                "title": "Digital Platforms Accelerate Ollywood Artist Discovery",
                "description": "Creators and producers in Odisha are using social platforms to grow reach and bookings.",
                "url": "https://example.com/news/ollywood-digital-platforms",
                "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
                "source": "Creator Economy India",
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
    resolved_topic = (topic or "").strip() or DEFAULT_NEWS_TOPIC
    articles = mock_articles.get(resolved_topic, [
        {
            "title": f"Latest Updates on {resolved_topic}",
            "description": f"Stay informed about the latest developments in {resolved_topic}.",
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

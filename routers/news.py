"""
News router for fetching and displaying news articles
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from news_service import get_news_by_topic, format_news_date
import json

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/topics")
def get_news_topics():
    """Get list of available news topics"""
    return {
        "topics": [
            "Odisha Ollywood entertainment industry",
            "Entertainment industry trends",
            "Top gig opportunities",
            "Artist success stories",
            "Industry insights"
        ]
    }

@router.get("/articles")
def get_news_articles(
    topic: str = Query(
        "Odisha Ollywood entertainment industry",
        description="News topic to fetch articles for",
    ),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of articles to return")
):
    """
    Fetch news articles for a specific topic
    
    Args:
        topic: The news topic (e.g., "Entertainment industry trends")
        limit: Maximum number of articles (1-50)
    
    Returns:
        List of news articles with formatted dates
    """
    try:
        articles = get_news_by_topic(topic, limit)
        
        # Format dates for frontend
        formatted_articles = []
        for article in articles:
            formatted_article = article.copy()
            formatted_article["formattedDate"] = format_news_date(article.get("publishedAt", ""))
            formatted_articles.append(formatted_article)
        
        return {
            "topic": topic,
            "articles": formatted_articles,
            "count": len(formatted_articles)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching news: {str(e)}"
        )

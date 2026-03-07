import html
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import requests
from sqlalchemy.orm import Session

from models import CelebrityNews, SystemSetting

GNEWS_ENDPOINT = "https://gnews.io/api/v4/top-headlines"
FETCH_INTERVAL_HOURS = 6

GNEWS_TOP_HEADLINES_PARAMS = {
    "category": "entertainment",
    "country": "in",
    "lang": "en",
    "max": 15,
}

INCLUDE_KEYWORDS = [
    "bollywood",
    "tollywood",
    "kollywood",
    "sandalwood",
    "ollywood",
    "odia film",
    "odisha film",
    "indian actor",
    "indian actress",
    "indian singer",
    "hindi film",
    "tamil film",
    "telugu film",
    "malayalam film",
    "kannada film",
    "ott india",
    "netflix india",
    "amazon prime india",
    "filmfare",
    "iifa",
    "national awards",
    "indian cinema",
    "bhubaneswar",
    "cuttack",
    "odisha",
    "odia music",
]

EXCLUDE_KEYWORDS = [
    "us election",
    "uk politics",
    "war",
    "parliament",
    "government policy",
    "stock market",
    "international conflict",
    "crime",
]

ENTERTAINMENT_CONTEXT = [
    "film",
    "cinema",
    "actor",
    "actress",
    "singer",
    "movie",
    "bollywood",
    "tollywood",
    "kollywood",
    "sandalwood",
    "ollywood",
    "odia",
    "odisha",
]

ODISHA_KEYWORDS = [
    "ollywood",
    "odisha",
    "odia",
    "bhubaneswar",
    "cuttack",
]


def _clean_text(value: str, max_len: int = 600) -> str:
    if not value:
        return ""
    text = html.unescape(str(value))
    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len]


def _parse_published_at(value: str):
    if not value:
        return None
    raw = str(value).strip()
    try:
        if raw.endswith("Z"):
            raw = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except Exception:
        return None


def _valid_url(value: str) -> bool:
    if not value:
        return False
    v = str(value).strip().lower()
    return v.startswith("http://") or v.startswith("https://")


def _is_odisha_related(title: str) -> bool:
    t = (title or "").lower()
    return any(k in t for k in ODISHA_KEYWORDS)


def _detect_region(title: str) -> str:
    return "odisha" if _is_odisha_related(title) else "india"


def _is_crime_entertainment_related(title: str) -> bool:
    t = (title or "").lower()
    return "crime" in t and any(ctx in t for ctx in ENTERTAINMENT_CONTEXT)


def _is_relevant_title(title: str) -> bool:
    t = (title or "").lower()
    if not any(k in t for k in INCLUDE_KEYWORDS):
        return False
    for ex in EXCLUDE_KEYWORDS:
        if ex in t:
            if ex == "crime" and _is_crime_entertainment_related(t):
                continue
            return False
    return True


def _get_setting(db: Session, key: str) -> SystemSetting:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if row:
        return row
    row = SystemSetting(
        key=key,
        value="",
        description="CeleNews internal setting",
    )
    db.add(row)
    db.flush()
    return row


def _get_setting_bool(db: Session, key: str, default: bool) -> bool:
    row = _get_setting(db, key)
    raw = (row.value or "").strip().lower()
    if raw in {"true", "1", "yes", "y", "on"}:
        return True
    if raw in {"false", "0", "no", "n", "off"}:
        return False
    return default


def _should_fetch(db: Session, force: bool = False) -> bool:
    if force:
        return True
    setting = _get_setting(db, "cele_news_last_fetch_time")
    if not setting.value:
        return True
    try:
        last_fetch = datetime.fromisoformat(setting.value)
    except Exception:
        return True
    return datetime.utcnow() - last_fetch >= timedelta(hours=FETCH_INTERVAL_HOURS)


def _update_last_fetch(db: Session) -> None:
    setting = _get_setting(db, "cele_news_last_fetch_time")
    setting.value = datetime.utcnow().isoformat()
    setting.updated_at = datetime.utcnow()


def _time_ago(dt):
    if not dt:
        return "Recently"
    diff = datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    hrs = diff.seconds // 3600
    if hrs > 0:
        return f"{hrs}h ago"
    mins = diff.seconds // 60
    if mins > 0:
        return f"{mins}m ago"
    return "Just now"


def fetch_celebrity_news(db: Session, force: bool = False) -> Dict:
    if not _should_fetch(db, force=force):
        return {"ok": True, "fetched": False, "reason": "cached"}

    api_key = os.getenv("GNEWS_API_KEY", "").strip()
    if not api_key:
        return {"ok": False, "fetched": False, "reason": "missing_api_key"}

    inserted = 0
    skipped_relevance = 0
    skipped_invalid = 0
    skipped_duplicates = 0
    # Keep auto-approve support from system settings (defaults true).
    auto_approve = _get_setting_bool(db, "auto_approve_news", True)

    try:
        params = dict(GNEWS_TOP_HEADLINES_PARAMS)
        params["apikey"] = api_key
        response = requests.get(GNEWS_ENDPOINT, params=params, timeout=20)
        response.raise_for_status()
        payload = response.json()
        articles = payload.get("articles", []) if isinstance(payload, dict) else []
        if not isinstance(articles, list):
            articles = []

        for article in articles:
            if not isinstance(article, dict):
                skipped_invalid += 1
                continue

            title = _clean_text(article.get("title", ""), max_len=255)
            description = _clean_text(article.get("description", ""), max_len=1200)
            image_url = _clean_text(article.get("image", ""), max_len=500)
            article_url = _clean_text(article.get("url", ""), max_len=500)
            source_data = article.get("source", {}) or {}
            source_name = _clean_text(source_data.get("name", "GNews"), max_len=120)
            published_at = _parse_published_at(article.get("publishedAt"))

            if not title or not _valid_url(article_url):
                skipped_invalid += 1
                continue
            if image_url and not _valid_url(image_url):
                image_url = ""
            if not _is_relevant_title(title):
                skipped_relevance += 1
                continue

            existing = db.query(CelebrityNews).filter(CelebrityNews.article_url == article_url).first()
            if existing:
                skipped_duplicates += 1
                continue

            db.add(
                CelebrityNews(
                    title=title,
                    description=description,
                    image_url=image_url or None,
                    source=source_name or "GNews",
                    article_url=article_url,
                    region=_detect_region(title),
                    published_at=published_at,
                    is_approved=auto_approve,
                    is_featured=_is_odisha_related(title),
                )
            )
            inserted += 1

        _update_last_fetch(db)
        db.commit()
        return {
            "ok": True,
            "fetched": True,
            "inserted": inserted,
            "skipped_relevance": skipped_relevance,
            "skipped_invalid": skipped_invalid,
            "skipped_duplicates": skipped_duplicates,
        }
    except Exception as exc:
        db.rollback()
        return {"ok": False, "fetched": True, "reason": str(exc)}


def serialize_news_item(item: CelebrityNews) -> Dict:
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description or "",
        "image_url": item.image_url or "",
        "source": item.source or "Unknown",
        "article_url": item.article_url,
        "region": item.region or "india",
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "is_featured": bool(item.is_featured),
        "time_ago": _time_ago(item.published_at or item.created_at),
    }


def get_approved_news(db: Session, limit: int = 5) -> List[Dict]:
    rows = (
        db.query(CelebrityNews)
        .filter(CelebrityNews.is_approved == True)
        .order_by(CelebrityNews.is_featured.desc(), CelebrityNews.published_at.desc(), CelebrityNews.created_at.desc())
        .limit(limit)
        .all()
    )
    return [serialize_news_item(r) for r in rows]


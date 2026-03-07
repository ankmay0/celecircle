from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import CelebrityNews, User
from services.news_service import fetch_celebrity_news, get_approved_news, serialize_news_item

router = APIRouter(prefix="/api/news", tags=["news"])


class ModerationUpdate(BaseModel):
    approved: bool


class FeatureUpdate(BaseModel):
    featured: bool


class HeadlineUpdate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)


@router.get("/sidebar")
def get_sidebar_news(
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    articles = get_approved_news(db, limit=limit)
    return {"articles": articles, "count": len(articles)}


@router.get("/articles")
def get_public_news(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    articles = get_approved_news(db, limit=limit)
    return {"articles": articles, "count": len(articles)}


@router.get("/admin/articles")
def admin_list_news(
    status: str = Query("all", pattern="^(all|approved|pending|featured)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    query = db.query(CelebrityNews)
    if status == "approved":
        query = query.filter(CelebrityNews.is_approved == True)
    elif status == "pending":
        query = query.filter(CelebrityNews.is_approved == False)
    elif status == "featured":
        query = query.filter(CelebrityNews.is_approved == True, CelebrityNews.is_featured == True)

    rows = query.order_by(CelebrityNews.is_featured.desc(), CelebrityNews.published_at.desc(), CelebrityNews.created_at.desc()).all()
    return {"articles": [serialize_news_item(r) | {"is_approved": bool(r.is_approved)} for r in rows]}


@router.post("/admin/fetch")
def admin_fetch_news(
    force: bool = Query(True),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    result = fetch_celebrity_news(db, force=force)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("reason", "Failed to fetch news"))
    return result


@router.put("/admin/articles/{article_id}/approve")
def admin_approve_news(
    article_id: int,
    payload: ModerationUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    row = db.query(CelebrityNews).filter(CelebrityNews.id == article_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    row.is_approved = payload.approved
    if not payload.approved:
        row.is_featured = False
    row.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Updated"}


@router.put("/admin/articles/{article_id}/feature")
def admin_feature_news(
    article_id: int,
    payload: FeatureUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    row = db.query(CelebrityNews).filter(CelebrityNews.id == article_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    if not row.is_approved and payload.featured:
        raise HTTPException(status_code=400, detail="Approve article before featuring")
    row.is_featured = payload.featured
    row.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Updated"}


@router.put("/admin/articles/{article_id}/headline")
def admin_edit_headline(
    article_id: int,
    payload: HeadlineUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    row = db.query(CelebrityNews).filter(CelebrityNews.id == article_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    row.title = payload.title.strip()
    row.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Updated"}


@router.delete("/admin/articles/{article_id}")
def admin_delete_news(
    article_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    row = db.query(CelebrityNews).filter(CelebrityNews.id == article_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(row)
    db.commit()
    return {"message": "Deleted"}

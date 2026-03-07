from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import User, Post, Like, Comment, Connection, Profile
from schemas import PostResponse, CommentCreate, CommentResponse
from auth import get_current_active_user
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api/posts", tags=["posts"])

UPLOAD_DIR = "uploads/posts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=PostResponse)
async def create_post(
    content: str = Form(""),
    media_type: str = Form("text"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    files: List[UploadFile] = File(None)
):
    """Create a new post"""
    media_urls = []
    
    if files:
        for file in files:
            if file.filename:
                file_ext = file.filename.split(".")[-1] if "." in file.filename else ""
                timestamp = datetime.now().timestamp()
                file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{timestamp}_{file.filename}")
                
                with open(file_path, "wb") as f:
                    content_data = await file.read()
                    f.write(content_data)
                
                media_urls.append(f"/uploads/posts/{os.path.basename(file_path)}")
    
    new_post = Post(
        author_id=current_user.id,
        content=content or "",
        media_type=media_type,
        media_urls=json.dumps(media_urls) if media_urls else None
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return new_post

@router.get("", response_model=List[PostResponse])
def get_feed(
    limit: int = 20,
    offset: int = 0,
    media_type: Optional[str] = None,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get feed posts (from connections and own posts)
    Can filter by media_type (image, video, text) and user_id
    """
    query = db.query(Post)
    
    # Filter by user if specified
    if user_id:
        query = query.filter(Post.author_id == user_id)
    else:
        # Get users that current user follows
        following_ids = [c.following_id for c in db.query(Connection).filter(
            Connection.follower_id == current_user.id
        ).all()]
        following_ids.append(current_user.id)  # Include own posts
        
        # If no connections, show all posts
        if len(following_ids) > 1:
            query = query.filter(Post.author_id.in_(following_ids))
    
    # Filter by media type if specified
    if media_type:
        query = query.filter(Post.media_type == media_type)
    
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    # Add author info to each post
    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        post_dict = {
            "id": post.id,
            "author_id": post.author_id,
            "content": post.content,
            "media_type": post.media_type,
            "media_urls": post.media_urls,
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "shares_count": post.shares_count,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "author": {
                "id": author.id,
                "email": author.email,
                "first_name": author.first_name,
                "last_name": author.last_name,
                "profile": None
            }
        }
        profile = db.query(Profile).filter(Profile.user_id == author.id).first()
        if profile:
            post_dict["author"]["profile"] = {
                "name": profile.name,
                "category": profile.category
            }
        result.append(post_dict)
    
    return result

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get a specific post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@router.post("/{post_id}/like")
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Like or unlike a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        post.likes_count -= 1
        action = "unliked"
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.add(new_like)
        post.likes_count += 1
        action = "liked"
    
    db.commit()
    return {"message": f"Post {action}", "likes_count": post.likes_count}

@router.get("/{post_id}/likes", response_model=List[dict])
def get_post_likes(post_id: int, db: Session = Depends(get_db)):
    """Get users who liked a post"""
    likes = db.query(Like).filter(Like.post_id == post_id).all()
    return [{"user_id": like.user_id, "created_at": like.created_at} for like in likes]

@router.post("/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a comment on a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = Comment(
        author_id=current_user.id,
        post_id=post_id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    
    db.add(new_comment)
    post.comments_count += 1
    db.commit()
    db.refresh(new_comment)
    
    return new_comment

@router.get("/{post_id}/comments", response_model=List[dict])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    """Get comments for a post"""
    comments = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.parent_id == None  # Top-level comments only
    ).order_by(Comment.created_at.asc()).all()
    
    result = []
    for comment in comments:
        author = db.query(User).filter(User.id == comment.author_id).first()
        comment_dict = {
            "id": comment.id,
            "author_id": comment.author_id,
            "post_id": comment.post_id,
            "parent_id": comment.parent_id,
            "content": comment.content,
            "likes_count": comment.likes_count,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "author": {
                "id": author.id,
                "email": author.email,
                "first_name": author.first_name,
                "last_name": author.last_name,
                "profile": None
            }
        }
        profile = db.query(Profile).filter(Profile.user_id == author.id).first()
        if profile:
            comment_dict["author"]["profile"] = {
                "name": profile.name,
                "category": profile.category
            }
        result.append(comment_dict)
    
    return result

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a comment"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    comment.post.comments_count -= 1
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from database import get_db
from models import User, Profile, ChatMessage, Notification
from schemas import ChatMessageCreate, ChatMessageResponse, NotificationResponse
from auth import get_current_active_user
from datetime import datetime
import os, uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("", response_model=ChatMessageResponse)
def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a chat message"""
    # Verify receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        gig_id=message_data.gig_id,
        message=message_data.message,
        attachment_url=message_data.attachment_url,
        attachment_type=message_data.attachment_type
    )
    
    db.add(new_message)
    
    db.commit()
    db.refresh(new_message)
    
    return new_message

CHAT_UPLOAD_DIR = "uploads/chat"
ALLOWED_EXTENSIONS = {
    # Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    # Videos
    '.mp4', '.mov', '.webm',
    # Documents
    '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'
}

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
VIDEO_EXTS = {'.mp4', '.mov', '.webm'}

@router.post("/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file for chat attachment. Returns the URL and detected type."""
    os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

    # Validate extension
    _, ext = os.path.splitext(file.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Supported: images, videos, pdf, docx."
        )

    # Determine attachment type
    if ext in IMAGE_EXTS:
        attachment_type = "image"
    elif ext in VIDEO_EXTS:
        attachment_type = "video"
    else:
        attachment_type = "file"

    # Save with unique name
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(CHAT_UPLOAD_DIR, unique_name)
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/{file_path.replace(os.sep, '/')}"

    return {
        "url": file_url,
        "type": attachment_type,
        "filename": file.filename,
        "size": len(contents)
    }

@router.get("/conversations/{user_id}", response_model=List[ChatMessageResponse])
def get_conversation(
    user_id: int,
    gig_id: int = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get conversation between current user and another user"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot get conversation with yourself"
        )
    
    query = db.query(ChatMessage).filter(
        ((ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == user_id)) |
        ((ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == current_user.id))
    )
    
    if gig_id:
        query = query.filter(ChatMessage.gig_id == gig_id)
    
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    
    # Mark messages as read
    for message in messages:
        if message.receiver_id == current_user.id and not message.is_read:
            message.is_read = True
    
    db.commit()
    
    return messages

@router.get("/conversations")
def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all conversations for current user"""
    # Get all unique users that current user has chatted with
    sent_messages = db.query(ChatMessage.receiver_id).filter(
        ChatMessage.sender_id == current_user.id
    ).distinct().all()
    
    received_messages = db.query(ChatMessage.sender_id).filter(
        ChatMessage.receiver_id == current_user.id
    ).distinct().all()
    
    user_ids = set([m[0] for m in sent_messages] + [m[0] for m in received_messages])
    
    conversations = []
    for user_id in user_ids:
        last_message = db.query(ChatMessage).filter(
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == user_id)) |
            ((ChatMessage.sender_id == user_id) & (ChatMessage.receiver_id == current_user.id))
        ).order_by(ChatMessage.created_at.desc()).first()
        
        if last_message:
            other_user = db.query(User).filter(User.id == user_id).first()
            other_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.sender_id == user_id,
                ChatMessage.receiver_id == current_user.id,
                ChatMessage.is_read == False
            ).count()
            
            conversations.append({
                "user_id": user_id,
                "user_email": other_user.email if other_user else None,
                "user_name": other_profile.name if other_profile else (other_user.email.split('@')[0] if other_user else 'Unknown'),
                "user_category": other_profile.category if other_profile else (other_user.role if other_user else ''),
                "user_role": other_user.role if other_user else '',
                "last_message": last_message.message,
                "last_message_time": last_message.created_at.isoformat() if last_message.created_at else None,
                "unread_count": unread_count
            })
    
    conversations.sort(key=lambda x: x["last_message_time"], reverse=True)
    return conversations

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return notifications

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    updated_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": f"{updated_count} notification(s) marked as read", "count": updated_count}


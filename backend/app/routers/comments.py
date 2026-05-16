from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Comment, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/relics", tags=["comments"])


class AddCommentBody(BaseModel):
    text: str


class CommentOut(BaseModel):
    id: int
    user_id: int
    relic_id: str
    username: str
    text: str
    likes: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/{relic_id}/comments", response_model=list[CommentOut])
def list_comments(
    relic_id: str,
    db: Session = Depends(get_db),
):
    return (
        db.query(Comment)
        .filter(Comment.relic_id == relic_id)
        .order_by(Comment.created_at.desc())
        .all()
    )


@router.post("/{relic_id}/comments", response_model=CommentOut)
def add_comment(
    relic_id: str,
    body: AddCommentBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = Comment(
        user_id=current_user.id,
        relic_id=relic_id,
        relic_name="",
        username=current_user.username,
        text=body.text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/{relic_id}/comments/{comment_id}/like", response_model=CommentOut)
def like_comment(
    relic_id: str,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.relic_id == relic_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.likes = (comment.likes or 0) + 1
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{relic_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    relic_id: str,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.relic_id == relic_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")
    db.delete(comment)
    db.commit()
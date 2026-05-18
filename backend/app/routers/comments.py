from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.database import get_db
from app.db.models import Comment, CommentLike, User
from app.routers.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/relics", tags=["comments"])

MAX_COMMENT_LENGTH = 2000


class AddCommentBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_COMMENT_LENGTH)


class CommentOut(BaseModel):
    id: int
    user_id: int
    relic_id: str
    username: str
    text: str
    likes: int
    liked_by_me: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


def _comment_to_out(comment: Comment, liked_ids: set[int]) -> CommentOut:
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        relic_id=comment.relic_id,
        username=comment.username,
        text=comment.text,
        likes=comment.likes or 0,
        liked_by_me=comment.id in liked_ids,
        created_at=comment.created_at,
    )


def _delete_comment_record(db: Session, comment: Comment) -> None:
    db.query(CommentLike).filter(CommentLike.comment_id == comment.id).delete()
    db.delete(comment)


@router.get("/{relic_id}/comments", response_model=list[CommentOut])
def list_comments(
    relic_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    comments = (
        db.query(Comment)
        .filter(Comment.relic_id == relic_id)
        .order_by(Comment.created_at.desc())
        .all()
    )
    liked_ids: set[int] = set()
    if current_user and comments:
        comment_ids = [c.id for c in comments]
        rows = (
            db.query(CommentLike.comment_id)
            .filter(
                CommentLike.user_id == current_user.id,
                CommentLike.comment_id.in_(comment_ids),
            )
            .all()
        )
        liked_ids = {row[0] for row in rows}
    return [_comment_to_out(c, liked_ids) for c in comments]


@router.post("/{relic_id}/comments", response_model=CommentOut)
def add_comment(
    relic_id: str,
    body: AddCommentBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    if len(text) > MAX_COMMENT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Comment must be at most {MAX_COMMENT_LENGTH} characters")
    comment = Comment(
        user_id=current_user.id,
        relic_id=relic_id,
        relic_name="",
        username=current_user.username,
        text=text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_to_out(comment, set())


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
    if comment.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot like your own comment")
    existing = (
        db.query(CommentLike)
        .filter(
            CommentLike.user_id == current_user.id,
            CommentLike.comment_id == comment_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already liked this comment")
    db.add(CommentLike(user_id=current_user.id, comment_id=comment_id))
    comment.likes = (comment.likes or 0) + 1
    db.commit()
    db.refresh(comment)
    return _comment_to_out(comment, {comment_id})


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
    _delete_comment_record(db, comment)
    db.commit()

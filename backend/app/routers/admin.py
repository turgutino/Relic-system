from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Comment, CommentLike, Favorite, History, User
from app.routers.auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


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


class StatsOut(BaseModel):
    total_users: int
    total_favorites: int
    total_history: int
    total_comments: int


def _admin_count(db: Session) -> int:
    return db.query(User).filter(User.is_admin.is_(True)).count()


def _delete_user_data(db: Session, user_id: int) -> None:
    comment_ids = [
        row[0]
        for row in db.query(Comment.id).filter(Comment.user_id == user_id).all()
    ]
    if comment_ids:
        db.query(CommentLike).filter(CommentLike.comment_id.in_(comment_ids)).delete(
            synchronize_session=False
        )
    db.query(Comment).filter(Comment.user_id == user_id).delete(synchronize_session=False)
    db.query(CommentLike).filter(CommentLike.user_id == user_id).delete(synchronize_session=False)
    db.query(Favorite).filter(Favorite.user_id == user_id).delete(synchronize_session=False)
    db.query(History).filter(History.user_id == user_id).delete(synchronize_session=False)


def _delete_comment_record(db: Session, comment: Comment) -> None:
    db.query(CommentLike).filter(CommentLike.comment_id == comment.id).delete(
        synchronize_session=False
    )
    db.delete(comment)


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}/ban", response_model=UserOut)
def toggle_ban(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/make-admin", response_model=UserOut)
def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own admin role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove the last admin")
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin and _admin_count(db) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin")
    _delete_user_data(db, user_id)
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/comments", response_model=list[CommentOut])
def list_comments(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(Comment).order_by(Comment.created_at.desc()).all()


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    _delete_comment_record(db, comment)
    db.commit()


@router.get("/stats", response_model=StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return StatsOut(
        total_users=db.query(User).count(),
        total_favorites=db.query(Favorite).count(),
        total_history=db.query(History).count(),
        total_comments=db.query(Comment).count(),
    )

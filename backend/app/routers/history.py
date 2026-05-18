from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import History, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users/me/history", tags=["history"])


class AddHistoryBody(BaseModel):
    relic_id: str
    relic_name: str
    relic_image_url: str = ""


class HistoryOut(BaseModel):
    id: int
    relic_id: str
    relic_name: str
    relic_image_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[HistoryOut])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(History)
        .filter(History.user_id == current_user.id)
        .order_by(History.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("", response_model=HistoryOut)
def add_history(
    body: AddHistoryBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(History)
        .filter(
            History.user_id == current_user.id,
            History.relic_id == body.relic_id,
        )
        .first()
    )
    if existing:
        existing.created_at = datetime.utcnow()
        existing.relic_name = body.relic_name
        existing.relic_image_url = body.relic_image_url
        db.commit()
        db.refresh(existing)
        return existing
    entry = History(
        user_id=current_user.id,
        relic_id=body.relic_id,
        relic_name=body.relic_name,
        relic_image_url=body.relic_image_url,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(History).filter(History.user_id == current_user.id).delete()
    db.commit()
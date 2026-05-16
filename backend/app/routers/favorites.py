from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Favorite, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users/me/favorites", tags=["favorites"])


class AddFavoriteBody(BaseModel):
    relic_id: str
    relic_name: str
    relic_image_url: str = ""


class FavoriteOut(BaseModel):
    id: int
    relic_id: str
    relic_name: str
    relic_image_url: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=list[FavoriteOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.post("", response_model=FavoriteOut)
def add_favorite(
    body: AddFavoriteBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.relic_id == body.relic_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already in favorites")
    fav = Favorite(
        user_id=current_user.id,
        relic_id=body.relic_id,
        relic_name=body.relic_name,
        relic_image_url=body.relic_image_url,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{relic_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    relic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.relic_id == relic_id,
        )
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
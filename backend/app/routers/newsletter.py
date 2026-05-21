import re
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Subscriber
from app.limiter import limiter

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class SubscribeBody(BaseModel):
    email: str


@router.post("/subscribe")
@limiter.limit("3/hour")
def subscribe(request: Request, body: SubscribeBody, db: Session = Depends(get_db)):
    if not EMAIL_REGEX.match(body.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    existing = db.query(Subscriber).filter(Subscriber.email == body.email).first()
    if existing:
        return {"ok": True, "already": True}

    new_sub = Subscriber(email=body.email)
    db.add(new_sub)
    db.commit()
    return {"ok": True}

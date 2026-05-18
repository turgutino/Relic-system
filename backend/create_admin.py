import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal, engine
from app.db.models import Base, User
from app.db.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()
username = "admin"
email = "admin@relic.com"
password = "admin123456"

existing = db.query(User).filter(User.username == username).first()
if existing:
    existing.is_admin = True
    db.commit()
    print(f"User '{username}' updated to admin.")
else:
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        is_admin=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    print(f"Admin user '{username}' created.")

db.close()
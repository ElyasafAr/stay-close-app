# -*- coding: utf-8 -*-
"""
מערכת אימות (Authentication) לאפליקציית Stay Close
תומך ב-Google OAuth והתחברות עם שם משתמש וסיסמה
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User

# הגדרות JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 ימים

# הגדרות הצפנת סיסמאות
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

# Database helper functions
def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID from database"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email from database"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username from database"""
    return db.query(User).filter(User.username == username).first()

def hash_password(password: str) -> str:
    """מצפין סיסמה"""
    # bcrypt מוגבל ל-72 bytes, אז נחתוך את הסיסמה אם היא ארוכה מדי
    # נשתמש ב-UTF-8 encoding כדי לחשב את האורך הנכון
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # חיתוך ל-72 bytes
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """בודק סיסמה"""
    # חיתוך הסיסמה ל-72 bytes (כמו ב-hash_password) כדי שיתאים
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        plain_password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """יוצר JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """בודק ומחזיר את נתוני המשתמש מה-token"""
    token = credentials.credentials
    
    # ניסיון אימות Firebase token קודם
    try:
        from firebase_config import verify_firebase_token
        firebase_user = verify_firebase_token(token)
        # אם זה Firebase token, נחפש את המשתמש במערכת שלנו
        email = firebase_user.get("email")
        uid = firebase_user.get("user_id")
        
        # Search in database by email
        user = get_user_by_email(db, email)
        if user:
            return {
                "user_id": user.id,
                "email": user.email,
                "username": user.username
            }
    except (ImportError, HTTPException):
        # Firebase לא מוגדר או token לא תקין - ננסה JWT
        pass
    except Exception:
        # שגיאה אחרת - ננסה JWT
        pass
    
    # ניסיון אימות JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token לא תקין")
        
        # Verify user exists in database
        user = get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token לא תקין או פג תוקף")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """מחזיר את המשתמש הנוכחי"""
    return verify_token(credentials, db)

def register_user(username: str, email: str, password: str, db: Session) -> dict:
    """רושם משתמש חדש"""
    print(f"🔵 [AUTH] register_user called: username={username}, email={email}")
    
    # בדיקה אם שם המשתמש כבר קיים
    existing_user = get_user_by_username(db, username)
    if existing_user:
        print(f"❌ [AUTH] Username already exists: {username}")
        raise HTTPException(status_code=400, detail="שם משתמש כבר קיים")
    
    # בדיקה אם האימייל כבר רשום
    existing_user = get_user_by_email(db, email)
    if existing_user:
        print(f"❌ [AUTH] Email already registered: {email}")
        raise HTTPException(status_code=400, detail="אימייל כבר רשום")
    
    # יצירת משתמש חדש
    user_id = hashlib.sha256(f"{username}{email}{datetime.now()}".encode()).hexdigest()[:16]
    print(f"🔵 [AUTH] Generated user_id: {user_id}")
    hashed_password = hash_password(password)
    print(f"✅ [AUTH] Password hashed")
    
    # Create user in database
    db_user = User(
        id=user_id,
        username=username,
        email=email,
        password_hash=hashed_password,
        created_at=datetime.now()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"✅ [AUTH] User saved to database: user_id={user_id}")
    return {"user_id": user_id, "username": username, "email": email}

def authenticate_user(username: str, password: str, db: Session) -> Optional[dict]:
    """מאמת משתמש עם שם משתמש וסיסמה"""
    print(f"🔵 [AUTH] authenticate_user called: username={username}")
    
    # Try to find user by username or email
    user = get_user_by_username(db, username)
    if not user:
        user = get_user_by_email(db, username)
    
    if not user:
        print(f"❌ [AUTH] No matching user found")
        return None
    
    print(f"✅ [AUTH] User found, verifying password...")
    if user.password_hash and verify_password(password, user.password_hash):
        print(f"✅ [AUTH] Password verified successfully")
        return {
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }
    else:
        print(f"❌ [AUTH] Password verification failed")
        return None

def create_or_get_google_user(google_user_info: dict, db: Session) -> dict:
    """יוצר או מחזיר משתמש Google"""
    email = google_user_info.get("email")
    
    # חיפוש משתמש קיים לפי אימייל
    user = get_user_by_email(db, email)
    if user:
        return {
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }
    
    # יצירת משתמש חדש
    username = google_user_info.get("name", email.split("@")[0])
    user_id = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()[:16]
    
    db_user = User(
        id=user_id,
        username=username,
        email=email,
        password_hash=None,  # Google users don't have local password
        created_at=datetime.now()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "user_id": user_id,
        "username": username,
        "email": email
    }

def create_or_get_firebase_user(firebase_user_info: dict, db: Session) -> dict:
    """יוצר או מחזיר משתמש Firebase"""
    print(f"🔵 [AUTH] create_or_get_firebase_user called")
    print(f"📋 [AUTH] Firebase user info: {firebase_user_info}")
    
    email = firebase_user_info.get("email")
    uid = firebase_user_info.get("user_id")  # Firebase UID
    
    print(f"🔍 [AUTH] Looking for user: email={email}, uid={uid}")
    
    if not email or not uid:
        print(f"❌ [AUTH] Missing email or UID: email={email}, uid={uid}")
        raise HTTPException(status_code=400, detail="Firebase user info missing email or UID")
    
    # חיפוש משתמש קיים לפי אימייל
    user = get_user_by_email(db, email)
    if user:
        print(f"✅ [AUTH] Existing user found: user_id={user.id}")
        return {
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }
    
    # יצירת משתמש חדש
    print(f"🔵 [AUTH] Creating new Firebase user...")
    username = firebase_user_info.get("name", email.split('@')[0])
    user_id = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()[:16]
    
    print(f"✅ [AUTH] Generated user_id: {user_id}, username: {username}")
    
    db_user = User(
        id=user_id,
        username=username,
        email=email,
        password_hash=None,  # Firebase users don't have local password
        created_at=datetime.now()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"✅ [AUTH] New Firebase user saved: user_id={user_id}")
    return {
        "user_id": user_id,
        "username": username,
        "email": email
    }


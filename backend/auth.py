# -*- coding: utf-8 -*-
"""
מערכת אימות (Authentication) לאפליקציית Stay Close
תומך ב-Google OAuth והתחברות עם שם משתמש וסיסמה
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models import User
from database import get_db
from encryption import encrypt_for_storage, hash_for_lookup, decrypt, encrypt

# הגדרות JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 ימים

# הגדרות הצפנת סיסמאות
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """מצפין סיסמה"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """בודק סיסמה"""
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

def verify_token(credentials: HTTPAuthorizationCredentials, db: Session) -> dict:
    """בודק ומחזיר את נתוני המשתמש מה-token תוך שימוש בבסיס הנתונים"""
    token = credentials.credentials
    
    # ניסיון אימות Firebase token קודם
    try:
        from firebase_config import verify_firebase_token
        firebase_user = verify_firebase_token(token)
        # אם זה Firebase token, נחפש את המשתמש בבסיס הנתונים
        email = firebase_user.get("email")
        if email:
            email_hash = hash_for_lookup(email)
            user = db.query(User).filter(User.email_hash == email_hash).first()
            if user:
                return {
                    "user_id": user.id,
                    "email": email,
                    "username": decrypt(user.username_encrypted)
                }
    except (ImportError, HTTPException):
        # Firebase לא מוגדר או token לא תקין - ננסה JWT
        pass
    except Exception as e:
        print(f"Firebase token verification error in verify_token: {e}")
        pass
    
    # ניסיון אימות JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token לא תקין")
            
        # בדיקה שהמשתמש קיים בבסיס הנתונים
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="משתמש לא נמצא")
            
        return {
            "user_id": user_id, 
            "email": decrypt(user.email_encrypted),
            "username": decrypt(user.username_encrypted)
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token לא תקין או פג תוקף")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """מחזיר את המשתמש הנוכחי תוך שימוש בבסיס הנתונים"""
    # Import here to avoid circular dependency if needed, but it should be fine at top
    return verify_token(credentials, db)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """מחזיר את המשתמש הנוכחי אם קיים, אחרת None"""
    if not credentials or not credentials.credentials:
        return None
    try:
        return verify_token(credentials, db)
    except:
        return None

def register_user(username: str, email: str, password: str, db: Session) -> dict:
    """רושם משתמש חדש בבסיס הנתונים"""
    username_hash, username_encrypted = encrypt_for_storage(username)
    email_hash, email_encrypted = encrypt_for_storage(email)
    
    # בדיקה אם שם המשתמש כבר קיים
    existing_user = db.query(User).filter(User.username_hash == username_hash).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="שם משתמש כבר קיים")
        
    existing_email = db.query(User).filter(User.email_hash == email_hash).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="אימייל כבר רשום")
    
    # יצירת מזהה ייחודי
    user_id = hashlib.sha256(f"{username}{email}{datetime.now()}".encode()).hexdigest()[:16]
    hashed_password = hash_password(password)
    
    new_user = User(
        id=user_id,
        username_hash=username_hash,
        username_encrypted=username_encrypted,
        email_hash=email_hash,
        email_encrypted=email_encrypted,
        password_hash=hashed_password,
        subscription_status='trial',
        trial_started_at=datetime.utcnow()
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"user_id": user_id, "username": username, "email": email}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"שגיאה בשמירת המשתמש: {str(e)}")

def authenticate_user(username: str, password: str, db: Session) -> Optional[dict]:
    """מאמת משתמש עם שם משתמש/אימייל וסיסמה"""
    # נרמול וחיפוש לפי האש
    username_hash = hash_for_lookup(username)
    
    # חיפוש לפי שם משתמש
    user = db.query(User).filter(User.username_hash == username_hash).first()
    
    # אם לא נמצא, חיפוש לפי אימייל
    if not user:
        user = db.query(User).filter(User.email_hash == username_hash).first()
        
    if not user or not user.password_hash:
        return None
        
    if verify_password(password, user.password_hash):
        return {
            "user_id": user.id,
            "username": decrypt(user.username_encrypted),
            "email": decrypt(user.email_encrypted)
        }
    return None

def create_or_get_google_user(google_user_info: dict, db: Session) -> dict:
    """יוצר או מחזיר משתמש Google בבסיס הנתונים"""
    email = google_user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google user info missing email")
        
    email_hash = hash_for_lookup(email)
    
    # חיפוש משתמש קיים לפי אימייל
    user = db.query(User).filter(User.email_hash == email_hash).first()
    
    if user:
        return {
            "user_id": user.id,
            "username": decrypt(user.username_encrypted),
            "email": email
        }
    
    # יצירת משתמש חדש
    username = google_user_info.get("name", email.split("@")[0])
    username_hash, username_encrypted = encrypt_for_storage(username)
    email_hash, email_encrypted = encrypt_for_storage(email)
    
    user_id = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()[:16]
    
    new_user = User(
        id=user_id,
        username_hash=username_hash,
        username_encrypted=username_encrypted,
        email_hash=email_hash,
        email_encrypted=email_encrypted,
        password_hash=None, # OAuth users don't have local password
        subscription_status='trial',
        trial_started_at=datetime.utcnow()
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "user_id": user_id,
            "username": username,
            "email": email
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"שגיאה בשמירת משתמש Google: {str(e)}")

def create_or_get_firebase_user(firebase_user_info: dict, db: Session) -> dict:
    """יוצר או מחזיר משתמש Firebase בבסיס הנתונים"""
    email = firebase_user_info.get("email")
    uid = firebase_user_info.get("user_id")  # Firebase UID
    
    if not email or not uid:
        raise HTTPException(status_code=400, detail="Firebase user info missing email or UID")
    
    email_hash = hash_for_lookup(email)
    
    # חיפוש משתמש קיים לפי אימייל
    user = db.query(User).filter(User.email_hash == email_hash).first()
    
    if user:
        return {
            "user_id": user.id,
            "username": decrypt(user.username_encrypted),
            "email": email
        }
    
    # יצירת משתמש חדש
    username = firebase_user_info.get("name", email.split('@')[0])
    username_hash, username_encrypted = encrypt_for_storage(username)
    email_hash, email_encrypted = encrypt_for_storage(email)
    
    # משתמשים ב-UID של Firebase כמזהה המשתמש שלנו אם אפשר, או מייצרים חדש
    user_id = uid[:16] if len(uid) >= 16 else hashlib.sha256(uid.encode()).hexdigest()[:16]
    
    new_user = User(
        id=user_id,
        username_hash=username_hash,
        username_encrypted=username_encrypted,
        email_hash=email_hash,
        email_encrypted=email_encrypted,
        password_hash=None, # Firebase users don't have local password
        subscription_status='trial',
        trial_started_at=datetime.utcnow()
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "user_id": user_id,
            "username": username,
            "email": email
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"שגיאה בשמירת משתמש Firebase: {str(e)}")


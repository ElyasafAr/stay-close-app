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

# הגדרות JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 ימים

# הגדרות הצפנת סיסמאות
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

# קובץ לשמירת משתמשים
USERS_FILE = "users.json"

def load_users_from_file() -> Dict:
    """טוען משתמשים מקובץ JSON"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"שגיאה בטעינת משתמשים: {e}")
            return {}
    return {}

def save_users_to_file(users: Dict):
    """שומר משתמשים לקובץ JSON"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"שגיאה בשמירת משתמשים: {e}")

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

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """בודק ומחזיר את נתוני המשתמש מה-token"""
    token = credentials.credentials
    
    # ניסיון אימות Firebase token קודם
    try:
        from firebase_config import verify_firebase_token
        firebase_user = verify_firebase_token(token)
        # אם זה Firebase token, נחפש את המשתמש במערכת שלנו
        users = load_users_from_file()
        user_id = None
        
        # חיפוש לפי firebase_uid או email
        for uid, user_data in users.items():
            if user_data.get("firebase_uid") == firebase_user.get("firebase_uid"):
                user_id = uid
                break
            elif user_data.get("email") == firebase_user.get("email") and user_data.get("auth_provider") == "firebase":
                user_id = uid
                break
        
        if user_id:
            return {
                "user_id": user_id,
                "email": firebase_user.get("email"),
                "username": users[user_id].get("username", firebase_user.get("name", ""))
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
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token לא תקין או פג תוקף")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """מחזיר את המשתמש הנוכחי"""
    return verify_token(credentials)

def register_user(username: str, email: str, password: str) -> dict:
    """רושם משתמש חדש"""
    print(f"🔵 [AUTH] register_user called: username={username}, email={email}")
    users = load_users_from_file()
    print(f"📊 [AUTH] Current users count: {len(users)}")
    
    # בדיקה אם שם המשתמש כבר קיים
    for user_id, user_data in users.items():
        if user_data.get("username") == username:
            print(f"❌ [AUTH] Username already exists: {username}")
            raise HTTPException(status_code=400, detail="שם משתמש כבר קיים")
        if user_data.get("email") == email:
            print(f"❌ [AUTH] Email already registered: {email}")
            raise HTTPException(status_code=400, detail="אימייל כבר רשום")
    
    # יצירת משתמש חדש
    user_id = hashlib.sha256(f"{username}{email}{datetime.now()}".encode()).hexdigest()[:16]
    print(f"🔵 [AUTH] Generated user_id: {user_id}")
    hashed_password = hash_password(password)
    print(f"✅ [AUTH] Password hashed")
    
    users[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.now().isoformat(),
        "auth_provider": "local"
    }
    
    save_users_to_file(users)
    print(f"✅ [AUTH] User saved to file: user_id={user_id}")
    return {"user_id": user_id, "username": username, "email": email}

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """מאמת משתמש עם שם משתמש וסיסמה"""
    print(f"🔵 [AUTH] authenticate_user called: username={username}")
    users = load_users_from_file()
    print(f"📊 [AUTH] Checking against {len(users)} users")
    
    for user_id, user_data in users.items():
        user_username = user_data.get("username")
        user_email = user_data.get("email")
        print(f"🔍 [AUTH] Checking user: user_id={user_id}, username={user_username}, email={user_email}")
        
        if user_username == username or user_email == username:
            print(f"✅ [AUTH] Username/email match found, verifying password...")
            if verify_password(password, user_data.get("hashed_password", "")):
                print(f"✅ [AUTH] Password verified successfully")
                return {
                    "user_id": user_id,
                    "username": user_data.get("username"),
                    "email": user_data.get("email")
                }
            else:
                print(f"❌ [AUTH] Password verification failed")
        else:
            print(f"⏭️ [AUTH] Username/email mismatch, continuing...")
    
    print(f"❌ [AUTH] No matching user found")
    return None

def create_or_get_google_user(google_user_info: dict) -> dict:
    """יוצר או מחזיר משתמש Google"""
    users = load_users_from_file()
    email = google_user_info.get("email")
    
    # חיפוש משתמש קיים לפי אימייל
    for user_id, user_data in users.items():
        if user_data.get("email") == email:
            return {
                "user_id": user_id,
                "username": user_data.get("username", email.split("@")[0]),
                "email": email
            }
    
    # יצירת משתמש חדש
    username = google_user_info.get("name", email.split("@")[0])
    user_id = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()[:16]
    
    users[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "created_at": datetime.now().isoformat(),
        "auth_provider": "google",
        "google_id": google_user_info.get("sub")
    }
    
    save_users_to_file(users)
    return {
        "user_id": user_id,
        "username": username,
        "email": email
    }

def create_or_get_firebase_user(firebase_user_info: dict) -> dict:
    """יוצר או מחזיר משתמש Firebase"""
    print(f"🔵 [AUTH] create_or_get_firebase_user called")
    print(f"📋 [AUTH] Firebase user info: {firebase_user_info}")
    
    users = load_users_from_file()
    email = firebase_user_info.get("email")
    uid = firebase_user_info.get("user_id")  # Firebase UID
    
    print(f"🔍 [AUTH] Looking for user: email={email}, uid={uid}")
    
    if not email or not uid:
        print(f"❌ [AUTH] Missing email or UID: email={email}, uid={uid}")
        raise HTTPException(status_code=400, detail="Firebase user info missing email or UID")
    
    print(f"📊 [AUTH] Checking against {len(users)} existing users")
    
    # חיפוש משתמש קיים לפי UID או אימייל
    for user_id, user_data in users.items():
        existing_uid = user_data.get("firebase_uid")
        existing_email = user_data.get("email")
        existing_provider = user_data.get("auth_provider")
        
        print(f"🔍 [AUTH] Checking user: user_id={user_id}, firebase_uid={existing_uid}, email={existing_email}, provider={existing_provider}")
        
        if existing_uid == uid or (existing_email == email and existing_provider == "firebase"):
            print(f"✅ [AUTH] Existing user found: user_id={user_id}")
            return {
                "user_id": user_id,
                "username": user_data.get("username", email.split("@")[0]),
                "email": email
            }
    
    # יצירת משתמש חדש
    print(f"🔵 [AUTH] Creating new Firebase user...")
    username = firebase_user_info.get("name", email.split('@')[0])
    user_id = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()[:16]
    
    print(f"✅ [AUTH] Generated user_id: {user_id}, username: {username}")
    
    users[user_id] = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": "",  # Firebase users don't have local password
        "created_at": datetime.now().isoformat(),
        "auth_provider": "firebase",
        "firebase_uid": uid
    }
    
    save_users_to_file(users)
    print(f"✅ [AUTH] New Firebase user saved: user_id={user_id}")
    return {
        "user_id": user_id,
        "username": username,
        "email": email
    }


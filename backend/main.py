# -*- coding: utf-8 -*-
"""
שרת Backend לאפליקציית Stay Close
משתמש ב-FastAPI ליצירת API endpoints
"""

import sys

# בדיקה שהגרסה היא Python 3
if sys.version_info < (3, 7):
    raise RuntimeError("האפליקציה דורשת Python 3.7 או גרסה חדשה יותר. גרסה נוכחית: {}".format(sys.version))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv
from auth import (
    register_user, authenticate_user, create_access_token,
    get_current_user, create_or_get_google_user, create_or_get_firebase_user, verify_token
)

# טעינת משתני סביבה מקובץ .env
load_dotenv()

app = FastAPI(
    title="Stay Close API",
    description="API לאפליקציית Stay Close",
    version="1.0.0"
)

# הגדרת CORS כדי לאפשר גישה מה-frontend
# במצב פיתוח - מאפשרים את כל ה-localhost ports
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]

# אם יש משתנה סביבה, נוסיף אותו גם
if os.getenv("FRONTEND_URL"):
    frontend_url = os.getenv("FRONTEND_URL")
    allowed_origins.append(frontend_url)
    # אם ה-URL לא מכיל https://, נוסיף אותו
    if not frontend_url.startswith("http"):
        allowed_origins.append(f"https://{frontend_url}")
        allowed_origins.append(f"http://{frontend_url}")

# הוספת Railway Frontend URLs
# נוסיף את ה-Frontend URL של Railway ישירות
allowed_origins.append("https://stay-close-app-front-production.up.railway.app")
allowed_origins.append("http://stay-close-app-front-production.up.railway.app")

# לוגים לבדיקה
print(f"[CORS] Allowed origins: {allowed_origins}")

# CORS configuration
# When allow_credentials=True, cannot use allow_origins=["*"]
# Must specify exact origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Use the list we built above
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Log CORS configuration
print(f"[CORS] CORS middleware configured")
print(f"[CORS] Allowed origins: {allowed_origins}")
print(f"[CORS] Allow credentials: True")
print(f"[CORS] Allow methods: GET, POST, PUT, DELETE, OPTIONS, PATCH")

# Explicit OPTIONS handler for preflight requests (backup)
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {
        "message": "OK",
        "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allowed_origins": allowed_origins
    }

# מודלים לנתונים
class Contact(BaseModel):
    """מודל ליצירת קשר"""
    id: Optional[int] = None
    user_id: Optional[str] = None  # ID של המשתמש
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

class ContactCreate(BaseModel):
    """מודל ליצירת קשר חדש"""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

# מודלים לאימות
class UserRegister(BaseModel):
    """מודל לרישום משתמש"""
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    """מודל להתחברות"""
    username: str  # יכול להיות שם משתמש או אימייל
    password: str

class GoogleAuthRequest(BaseModel):
    """מודל לאימות Google"""
    token: str  # Google ID token

class FirebaseAuthRequest(BaseModel):
    """מודל לאימות Firebase"""
    token: str  # Firebase ID token

class MessageRequest(BaseModel):
    """מודל לבקשת יצירת הודעה"""
    contact_id: int
    message_type: str  # 'birthday', 'holiday', 'checkin', 'custom'
    tone: str  # 'friendly', 'formal', 'casual', 'warm'
    additional_context: Optional[str] = None
    language: str = "he"  # עברית או אנגלית

# מודלים להתראות
class Reminder(BaseModel):
    """מודל להתראה"""
    id: Optional[int] = None
    user_id: Optional[str] = None
    contact_id: int
    interval_type: str  # 'hours' או 'days'
    interval_value: int  # מספר השעות/ימים
    last_triggered: Optional[datetime] = None
    next_trigger: Optional[datetime] = None
    enabled: bool = True
    created_at: Optional[datetime] = None

class ReminderCreate(BaseModel):
    """מודל ליצירת התראה חדשה"""
    contact_id: int
    interval_type: str  # 'hours' או 'days'
    interval_value: int
    enabled: bool = True

# קובץ לשמירת נתונים
CONTACTS_FILE = "contacts.json"
REMINDERS_FILE = "reminders.json"

# מאגר נתונים - נטען מ-JSON file
contacts_db: List[Contact] = []
reminders_db: List[Reminder] = []

def load_contacts_from_file(user_id: Optional[str] = None):
    """טוען אנשי קשר מקובץ JSON (לפי משתמש אם צוין)"""
    global contacts_db
    if os.path.exists(CONTACTS_FILE):
        try:
            with open(CONTACTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # המרת created_at מ-string ל-datetime
                for item in data:
                    if item.get('created_at') and isinstance(item['created_at'], str):
                        try:
                            item['created_at'] = datetime.fromisoformat(item['created_at'])
                        except:
                            item['created_at'] = None
                # סינון לפי משתמש אם צוין
                if user_id:
                    data = [item for item in data if item.get('user_id') == user_id]
                contacts_db = [Contact(**item) for item in data]
                print(f"✅ נטענו {len(contacts_db)} אנשי קשר מקובץ JSON")
        except Exception as e:
            print(f"⚠️ שגיאה בטעינת קובץ: {e}")
            contacts_db = []
    else:
        contacts_db = []
        print("ℹ️ קובץ contacts.json לא קיים - מתחיל עם רשימה ריקה")

def save_contacts_to_file():
    """שומר אנשי קשר לקובץ JSON"""
    try:
        # המרה ל-dict עבור JSON
        data = []
        for contact in contacts_db:
            contact_dict = {
                "id": contact.id,
                "user_id": contact.user_id,  # שמירת user_id
                "name": contact.name,
                "email": contact.email,
                "phone": contact.phone,
                "notes": contact.notes,
                "created_at": contact.created_at.isoformat() if contact.created_at else None
            }
            data.append(contact_dict)
        
        with open(CONTACTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 נשמרו {len(contacts_db)} אנשי קשר לקובץ JSON")
    except Exception as e:
        print(f"❌ שגיאה בשמירת קובץ: {e}")

def load_reminders_from_file(user_id: Optional[str] = None):
    """טוען התראות מקובץ JSON (לפי משתמש אם צוין)"""
    global reminders_db
    if os.path.exists(REMINDERS_FILE):
        try:
            with open(REMINDERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # המרת תאריכים מ-string ל-datetime
                for item in data:
                    for date_field in ['last_triggered', 'next_trigger', 'created_at']:
                        if item.get(date_field) and isinstance(item[date_field], str):
                            try:
                                item[date_field] = datetime.fromisoformat(item[date_field])
                            except:
                                item[date_field] = None
                # סינון לפי משתמש אם צוין
                if user_id:
                    data = [item for item in data if item.get('user_id') == user_id]
                reminders_db = [Reminder(**item) for item in data]
                print(f"✅ נטענו {len(reminders_db)} התראות מקובץ JSON")
        except Exception as e:
            print(f"⚠️ שגיאה בטעינת קובץ התראות: {e}")
            reminders_db = []
    else:
        reminders_db = []
        print("ℹ️ קובץ reminders.json לא קיים - מתחיל עם רשימה ריקה")

def save_reminders_to_file():
    """שומר התראות לקובץ JSON"""
    try:
        data = []
        for reminder in reminders_db:
            reminder_dict = {
                "id": reminder.id,
                "user_id": reminder.user_id,
                "contact_id": reminder.contact_id,
                "interval_type": reminder.interval_type,
                "interval_value": reminder.interval_value,
                "last_triggered": reminder.last_triggered.isoformat() if reminder.last_triggered else None,
                "next_trigger": reminder.next_trigger.isoformat() if reminder.next_trigger else None,
                "enabled": reminder.enabled,
                "created_at": reminder.created_at.isoformat() if reminder.created_at else None
            }
            data.append(reminder_dict)
        
        with open(REMINDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 נשמרו {len(reminders_db)} התראות לקובץ JSON")
    except Exception as e:
        print(f"❌ שגיאה בשמירת קובץ התראות: {e}")

def calculate_next_trigger(reminder: Reminder) -> datetime:
    """מחשב את זמן ההתראה הבאה"""
    now = datetime.now()
    if reminder.interval_type == 'hours':
        delta = timedelta(hours=reminder.interval_value)
    else:  # days
        delta = timedelta(days=reminder.interval_value)
    
    if reminder.last_triggered:
        return reminder.last_triggered + delta
    else:
        return now + delta

# טעינת נתונים בעת הפעלת השרת
load_contacts_from_file()
load_reminders_from_file()

@app.get("/")
async def root():
    return {"message": "ברוכים הבאים ל-Stay Close API", "version": "1.0.0"}

# ========== CONTACTS ENDPOINTS ==========

@app.get("/api/contacts", response_model=List[Contact])
async def get_contacts(current_user: dict = Depends(get_current_user)):
    """קבלת רשימת כל אנשי הקשר של המשתמש הנוכחי"""
    user_id = current_user["user_id"]
    user_contacts = [c for c in contacts_db if c.user_id == user_id]
    return user_contacts

@app.get("/api/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: int, current_user: dict = Depends(get_current_user)):
    """קבלת איש קשר ספציפי לפי ID"""
    user_id = current_user["user_id"]
    contact = next((c for c in contacts_db if c.id == contact_id and c.user_id == user_id), None)
    if not contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    return contact

@app.post("/api/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate, current_user: dict = Depends(get_current_user)):
    """יצירת איש קשר חדש (של המשתמש הנוכחי)"""
    user_id = current_user["user_id"]
    new_id = max([c.id for c in contacts_db], default=0) + 1
    new_contact = Contact(
        id=new_id,
        user_id=user_id,
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        notes=contact.notes,
        created_at=datetime.now()
    )
    contacts_db.append(new_contact)
    save_contacts_to_file()  # שמירה אוטומטית
    return new_contact

@app.put("/api/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: int, contact: ContactCreate, current_user: dict = Depends(get_current_user)):
    """עדכון איש קשר קיים"""
    user_id = current_user["user_id"]
    index = next((i for i, c in enumerate(contacts_db) if c.id == contact_id and c.user_id == user_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    updated_contact = Contact(
        id=contact_id,
        user_id=user_id,
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        notes=contact.notes,
        created_at=contacts_db[index].created_at
    )
    contacts_db[index] = updated_contact
    save_contacts_to_file()  # שמירה אוטומטית
    return updated_contact

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(contact_id: int, current_user: dict = Depends(get_current_user)):
    """מחיקת איש קשר"""
    user_id = current_user["user_id"]
    index = next((i for i, c in enumerate(contacts_db) if c.id == contact_id and c.user_id == user_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    contacts_db.pop(index)
    save_contacts_to_file()  # שמירה אוטומטית
    
    # מחיקת כל ההתראות הקשורות לאיש קשר זה
    reminders_db[:] = [r for r in reminders_db if not (r.contact_id == contact_id and r.user_id == user_id)]
    save_reminders_to_file()
    
    return {"message": "איש קשר נמחק בהצלחה"}

# ========== REMINDERS ENDPOINTS ==========

@app.get("/api/reminders", response_model=List[Reminder])
async def get_reminders(current_user: dict = Depends(get_current_user)):
    """קבלת רשימת כל ההתראות של המשתמש הנוכחי"""
    user_id = current_user["user_id"]
    user_reminders = [r for r in reminders_db if r.user_id == user_id]
    return user_reminders

@app.get("/api/reminders/{reminder_id}", response_model=Reminder)
async def get_reminder(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """קבלת התראה ספציפית לפי ID"""
    user_id = current_user["user_id"]
    reminder = next((r for r in reminders_db if r.id == reminder_id and r.user_id == user_id), None)
    if not reminder:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    return reminder

@app.post("/api/reminders", response_model=Reminder)
async def create_reminder(reminder: ReminderCreate, current_user: dict = Depends(get_current_user)):
    """יצירת התראה חדשה"""
    user_id = current_user["user_id"]
    
    # בדיקה שאיש הקשר קיים ושייך למשתמש
    contact = next((c for c in contacts_db if c.id == reminder.contact_id and c.user_id == user_id), None)
    if not contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    new_id = max([r.id for r in reminders_db], default=0) + 1
    now = datetime.now()
    next_trigger = calculate_next_trigger(Reminder(
        id=None,
        user_id=user_id,
        contact_id=reminder.contact_id,
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        last_triggered=None,
        next_trigger=None,
        enabled=reminder.enabled,
        created_at=now
    ))
    
    new_reminder = Reminder(
        id=new_id,
        user_id=user_id,
        contact_id=reminder.contact_id,
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        last_triggered=None,
        next_trigger=next_trigger,
        enabled=reminder.enabled,
        created_at=now
    )
    reminders_db.append(new_reminder)
    save_reminders_to_file()
    return new_reminder

@app.put("/api/reminders/{reminder_id}", response_model=Reminder)
async def update_reminder(reminder_id: int, reminder: ReminderCreate, current_user: dict = Depends(get_current_user)):
    """עדכון התראה קיימת"""
    user_id = current_user["user_id"]
    index = next((i for i, r in enumerate(reminders_db) if r.id == reminder_id and r.user_id == user_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    
    old_reminder = reminders_db[index]
    next_trigger = calculate_next_trigger(Reminder(
        id=reminder_id,
        user_id=user_id,
        contact_id=reminder.contact_id,
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        last_triggered=old_reminder.last_triggered,
        next_trigger=None,
        enabled=reminder.enabled,
        created_at=old_reminder.created_at
    ))
    
    updated_reminder = Reminder(
        id=reminder_id,
        user_id=user_id,
        contact_id=reminder.contact_id,
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        last_triggered=old_reminder.last_triggered,
        next_trigger=next_trigger,
        enabled=reminder.enabled,
        created_at=old_reminder.created_at
    )
    reminders_db[index] = updated_reminder
    save_reminders_to_file()
    return updated_reminder

@app.delete("/api/reminders/{reminder_id}")
async def delete_reminder(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """מחיקת התראה"""
    user_id = current_user["user_id"]
    index = next((i for i, r in enumerate(reminders_db) if r.id == reminder_id and r.user_id == user_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    
    reminders_db.pop(index)
    save_reminders_to_file()
    return {"message": "התראה נמחקה בהצלחה"}

@app.get("/api/reminders/check", response_model=List[Reminder])
async def check_reminders(current_user: dict = Depends(get_current_user)):
    """בודק אילו התראות צריכות להתפעל עכשיו"""
    user_id = current_user["user_id"]
    now = datetime.now()
    triggered_reminders = []
    
    for reminder in reminders_db:
        if (reminder.user_id == user_id and 
            reminder.enabled and 
            reminder.next_trigger and 
            reminder.next_trigger <= now):
            triggered_reminders.append(reminder)
            # עדכון זמן ההתראה הבאה
            reminder.last_triggered = now
            reminder.next_trigger = calculate_next_trigger(reminder)
    
    if triggered_reminders:
        save_reminders_to_file()
    
    return triggered_reminders

# ========== MESSAGES ENDPOINTS ==========

@app.post("/api/messages/generate")
async def generate_message(request: MessageRequest, current_user: dict = Depends(get_current_user)):
    """יצירת הודעה מותאמת אישית באמצעות AI"""
    user_id = current_user["user_id"]
    
    # בדיקה שאיש הקשר קיים ושייך למשתמש
    contact = next((c for c in contacts_db if c.id == request.contact_id and c.user_id == user_id), None)
    if not contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    # קבלת מפתח API
    api_key = os.getenv("XAI_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="מפתח API לא מוגדר. אנא הגדר XAI_API_KEY או GROQ_API_KEY בקובץ .env")
    
    # בניית ה-prompt
    prompt = f"""צור הודעה בעברית {request.message_type} עבור {contact.name}.
טון: {request.tone}
"""
    if contact.notes:
        prompt += f"הערות: {contact.notes}\n"
    if request.additional_context:
        prompt += f"הקשר נוסף: {request.additional_context}\n"
    
    prompt += "\nהודעה קצרה, חמה ואישית."
    
    try:
        # קריאה ל-xAI API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "grok-4-1-fast-reasoning",
            "messages": [
                {
                    "role": "system",
                    "content": "אתה עוזר אישי ליצירת הודעות חמות ואישיות בעברית."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            error_data = response.text
            try:
                error_json = response.json()
                if isinstance(error_json, dict) and error_json.get("error"):
                    error_data = str(error_json["error"])
            except:
                pass
            
            print(f"❌ xAI API error: {error_data}")
            raise HTTPException(status_code=500, detail=f"שגיאה ביצירת הודעה: {error_data}")
        
        result = response.json()
        message = result["choices"][0]["message"]["content"]
        
        return {
            "message": message,
            "contact_name": contact.name,
            "message_type": request.message_type,
            "tone": request.tone
        }
        
    except requests.exceptions.RequestException as e:
        print(f"❌ שגיאת רשת: {e}")
        raise HTTPException(status_code=500, detail=f"שגיאה בחיבור ל-API: {str(e)}")
    except Exception as e:
        import traceback
        print(f"❌ שגיאה כללית: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירת הודעה: {str(e)}")

# ========== AUTH ENDPOINTS ==========

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """רישום משתמש חדש"""
    print(f"🔵 [BACKEND] Registration request received: username={user_data.username}, email={user_data.email}")
    try:
        user = register_user(user_data.username, user_data.email, user_data.password)
        print(f"✅ [BACKEND] User registered successfully: user_id={user['user_id']}")
        access_token = create_access_token(data={"sub": user["user_id"], "email": user["email"]})
        print(f"✅ [BACKEND] Access token created: token_length={len(access_token)}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException as e:
        print(f"❌ [BACKEND] Registration failed: {e.detail}")
        raise
    except Exception as e:
        print(f"❌ [BACKEND] Registration error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"שגיאה ברישום: {str(e)}")

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    """התחברות עם שם משתמש וסיסמה"""
    print(f"🔵 [BACKEND] Login request received: username={user_data.username}")
    try:
        user = authenticate_user(user_data.username, user_data.password)
        if not user:
            print(f"❌ [BACKEND] Login failed: Invalid credentials for username={user_data.username}")
            raise HTTPException(status_code=400, detail="שם משתמש או סיסמה שגויים")
        print(f"✅ [BACKEND] User authenticated: user_id={user['user_id']}, email={user.get('email')}")
        access_token = create_access_token(data={"sub": user["user_id"], "email": user["email"]})
        print(f"✅ [BACKEND] Access token created: token_length={len(access_token)}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [BACKEND] Login error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"שגיאה בהתחברות: {str(e)}")

@app.post("/api/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """התחברות דרך Google OAuth"""
    try:
        google_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={request.token}"
        response = requests.get(google_url, timeout=10)

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google token לא תקין")

        google_user_info = response.json()
        user = create_or_get_google_user(google_user_info)
        access_token = create_access_token(data={"sub": user["user_id"], "email": user["email"]})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה באימות Google: {str(e)}")

@app.post("/api/auth/firebase")
async def firebase_auth(request: FirebaseAuthRequest):
    """התחברות דרך Firebase Authentication"""
    print(f"🔵 [BACKEND] Firebase auth request received: token_length={len(request.token) if request.token else 0}")
    try:
        from firebase_config import verify_firebase_token
        
        print(f"🔵 [BACKEND] Verifying Firebase token...")
        # אימות Firebase token
        firebase_user_info = verify_firebase_token(request.token)
        print(f"✅ [BACKEND] Firebase token verified: email={firebase_user_info.get('email')}, uid={firebase_user_info.get('user_id')}")
        
        print(f"🔵 [BACKEND] Creating or getting user...")
        # יצירה או קבלת משתמש במערכת שלנו
        user = create_or_get_firebase_user(firebase_user_info)
        print(f"✅ [BACKEND] User ready: user_id={user['user_id']}, username={user.get('username')}, email={user.get('email')}")
        
        print(f"🔵 [BACKEND] Creating JWT token...")
        # יצירת JWT token (לשימוש ב-API שלנו)
        access_token = create_access_token(data={"sub": user["user_id"], "email": user["email"]})
        print(f"✅ [BACKEND] Access token created: token_length={len(access_token)}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except ImportError as e:
        print(f"❌ [BACKEND] Firebase import error: {str(e)}")
        raise HTTPException(status_code=500, detail="Firebase לא מוגדר. אנא הגדר FIREBASE_SERVICE_ACCOUNT_KEY_PATH או FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
    except HTTPException as e:
        print(f"❌ [BACKEND] Firebase auth HTTP error: {e.detail}")
        raise
    except Exception as e:
        print(f"❌ [BACKEND] Firebase auth error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"שגיאה באימות Firebase: {str(e)}")
    except ImportError:
        raise HTTPException(status_code=500, detail="Firebase לא מוגדר. אנא הגדר FIREBASE_SERVICE_ACCOUNT_KEY_PATH או FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"שגיאה באימות Firebase: {str(e)}")

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """קבלת פרטי המשתמש הנוכחי"""
    return current_user

@app.get("/api/health")
async def health_check():
    """Health check endpoint ל-Railway"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000)) # Use PORT environment variable for Railway
    uvicorn.run(app, host="0.0.0.0", port=port)

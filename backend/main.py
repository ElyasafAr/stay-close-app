# -*- coding: utf-8 -*-
"""
שרת Backend לאפליקציית Stay Close
משתמש ב-FastAPI ליצירת API endpoints
"""

import sys

# בדיקה שהגרסה היא Python 3
if sys.version_info < (3, 7):
    raise RuntimeError("האפליקציה דורשת Python 3.7 או גרסה חדשה יותר. גרסה נוכחית: {}".format(sys.version))

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta, timezone
import pytz
import requests
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db, init_db, SessionLocal
from models import User, Contact as DBContact, Reminder as DBReminder, PushToken
from auth import (
    register_user, authenticate_user, create_access_token,
    get_current_user, create_or_get_google_user, create_or_get_firebase_user, verify_token
)
from encryption import encrypt, decrypt
import threading
import schedule
import time
from push_notifications import send_push_notification

# טעינת משתני סביבה מקובץ .env
load_dotenv()

app = FastAPI(
    title="Stay Close API",
    description="API לאפליקציית Stay Close",
    version="1.0.0"
)

# Background Job - בודק התראות ושולח Push Notifications
def check_and_send_reminders():
    """Background Job - בודק התראות כל דקה ושולח Push Notifications"""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        print(f"🔍 [BACKGROUND] Checking reminders at {now}")
        
        # מצא כל ההתראות שצריכות להתפעל
        all_reminders = db.query(DBReminder).filter(
            DBReminder.enabled == True
        ).all()
        
        print(f"🔍 [BACKGROUND] Found {len(all_reminders)} enabled reminders")
        
        triggered_count = 0
        for db_reminder in all_reminders:
            print(f"🔍 [BACKGROUND] Checking reminder {db_reminder.id}: type={db_reminder.reminder_type}, next_trigger={db_reminder.next_trigger}, scheduled_datetime={db_reminder.scheduled_datetime}")
            reminder_type = db_reminder.reminder_type or 'recurring'
            should_trigger = False
            
            if reminder_type == 'one_time':
                # התראה חד-פעמית
                if (db_reminder.scheduled_datetime and 
                    db_reminder.scheduled_datetime <= now and 
                    not db_reminder.one_time_triggered):
                    should_trigger = True
                    print(f"✅ [BACKGROUND] One-time reminder {db_reminder.id} should trigger (scheduled: {db_reminder.scheduled_datetime}, now: {now})")
                    db_reminder.one_time_triggered = True
                    db_reminder.last_triggered = now
                else:
                    print(f"⏭️ [BACKGROUND] One-time reminder {db_reminder.id} not ready: scheduled={db_reminder.scheduled_datetime}, triggered={db_reminder.one_time_triggered}")
            else:
                # התראות אחרות
                if db_reminder.next_trigger and db_reminder.next_trigger <= now:
                    should_trigger = True
                    print(f"✅ [BACKGROUND] Reminder {db_reminder.id} should trigger (next_trigger: {db_reminder.next_trigger}, now: {now})")
                    db_reminder.last_triggered = now
                else:
                    print(f"⏭️ [BACKGROUND] Reminder {db_reminder.id} not ready: next_trigger={db_reminder.next_trigger}, now={now}")
                    
                    # Parse weekdays if needed
                    weekdays = None
                    if db_reminder.weekdays:
                        try:
                            weekdays = json.loads(db_reminder.weekdays)
                        except (json.JSONDecodeError, TypeError):
                            weekdays = None
                    
                    # Calculate next trigger
                    db_reminder.next_trigger = calculate_next_trigger_advanced(
                        reminder_type=reminder_type,
                        interval_type=db_reminder.interval_type,
                        interval_value=db_reminder.interval_value,
                        scheduled_datetime=db_reminder.scheduled_datetime,
                        weekdays=weekdays,
                        specific_time=db_reminder.specific_time,
                        last_triggered=now,
                        user_timezone=db_reminder.timezone or 'Asia/Jerusalem'
                    )
            
            if should_trigger:
                triggered_count += 1
                
                # קבל את איש הקשר
                contact = db.query(DBContact).filter(DBContact.id == db_reminder.contact_id).first()
                if not contact:
                    continue
                
                # בניית טקסט התראה
                reminder_text = ''
                if reminder_type == 'one_time':
                    reminder_text = 'תאריך ספציפי'
                elif reminder_type == 'recurring':
                    if db_reminder.interval_type == 'hours':
                        interval_text = f'{db_reminder.interval_value} שעות'
                    else:
                        interval_text = f'{db_reminder.interval_value} ימים'
                    reminder_text = f'כל {interval_text}'
                elif reminder_type == 'weekly':
                    weekday_names = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
                    if weekdays:
                        days = ', '.join([weekday_names[d] for d in weekdays])
                    else:
                        days = ''
                    time_part = f' בשעה {db_reminder.specific_time}' if db_reminder.specific_time else ''
                    reminder_text = f'{days}{time_part}'
                elif reminder_type == 'daily':
                    reminder_text = f'כל יום בשעה {db_reminder.specific_time or "12:00"}'
                
                # מצא Push Tokens של המשתמש
                push_tokens = db.query(PushToken).filter(
                    PushToken.user_id == db_reminder.user_id
                ).all()
                
                # שלח Push Notification לכל ה-tokens
                contact_name = decrypt(contact.name_encrypted)
                for push_token in push_tokens:
                    send_push_notification(
                        push_token=push_token.token,
                        title="זמן לשלוח הודעה! 💌",
                        body=f"הגיע הזמן לשלוח הודעה ל-{contact_name}\n({reminder_text})",
                        data={
                            "reminder_id": db_reminder.id,
                            "contact_id": contact.id,
                            "contact_name": contact_name
                        }
                    )
        
        if triggered_count > 0:
            db.commit()
            print(f"✅ [BACKGROUND] Processed {triggered_count} reminders and sent push notifications")
        else:
            print(f"ℹ️ [BACKGROUND] No reminders to trigger at {now}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ [BACKGROUND] Error checking reminders: {e}")
        import traceback
        print(traceback.format_exc())
    finally:
        db.close()

def background_job_loop():
    """לולאה של Background Job"""
    schedule.every(1).minutes.do(check_and_send_reminders)
    print("✅ [BACKGROUND] Background job started - checking reminders every minute")
    while True:
        schedule.run_pending()
        time.sleep(1)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database when application starts"""
    try:
        init_db()
        print("✅ [STARTUP] Database initialized successfully")
    except Exception as e:
        print(f"⚠️ [STARTUP] Database initialization warning: {e}")
        print("   Application will continue, but database operations may fail")
    
    # Start Background Job
    try:
        thread = threading.Thread(target=background_job_loop, daemon=True)
        thread.start()
        print("✅ [STARTUP] Background job thread started")
    except Exception as e:
        print(f"⚠️ [STARTUP] Failed to start background job: {e}")

# הגדרת CORS כדי לאפשר גישה מה-frontend
# במצב פיתוח - מאפשרים את כל ה-localhost ports
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    # Capacitor Android/iOS
    "https://localhost",
    "capacitor://localhost",
    "http://localhost",
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

# Additional middleware to ensure CORS headers are always set
# This MUST be added BEFORE the CORS middleware to work correctly
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Ensure CORS headers are always present"""
    origin = request.headers.get("origin")
    
    response = await call_next(request)
    
    # Always add CORS headers if origin is provided and in allowed list
    if origin:
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
            print(f"[CORS] Added headers for origin: {origin}")
        else:
            print(f"[CORS] Origin not allowed: {origin}")
            print(f"[CORS] Allowed origins: {allowed_origins}")
    
    return response

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

# FastAPI CORS middleware handles OPTIONS requests automatically
# No need for explicit handler

# מודלים לנתונים
class Contact(BaseModel):
    """מודל ליצירת קשר"""
    id: Optional[int] = None
    user_id: Optional[str] = None  # ID של המשתמש
    name: str
    default_tone: Optional[str] = 'friendly'  # טון ברירת מחדל להודעות
    created_at: Optional[datetime] = None

class ContactCreate(BaseModel):
    """מודל ליצירת קשר חדש"""
    name: str
    default_tone: Optional[str] = 'friendly'  # טון ברירת מחדל להודעות

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
    message_type: str  # 'custom', 'checkin', 'birthday', 'holiday', 'congratulations', 'thank_you', 'apology', 'support', 'invitation', 'thinking_of_you', 'anniversary', 'get_well', 'new_job', 'graduation', 'achievement', 'encouragement', 'condolences', 'farewell', 'new_beginning', 'special_thanks', 'moving', 'wedding', 'pregnancy', 'birth', 'promotion', 'retirement', 'reunion', 'appreciation', 'miss_you', 'good_luck', 'celebration'
    tone: str  # 'friendly', 'warm', 'casual', 'formal', 'humorous', 'professional', 'intimate', 'supportive', 'enthusiastic', 'gentle', 'confident', 'playful', 'sincere', 'optimistic', 'empathetic', 'encouraging', 'grateful'
    additional_context: Optional[str] = None
    language: str = "he"  # עברית או אנגלית

# מודלים להתראות
class Reminder(BaseModel):
    """מודל להתראה"""
    id: Optional[int] = None
    user_id: Optional[str] = None
    contact_id: int
    reminder_type: str = 'recurring'  # 'one_time', 'recurring', 'weekly', 'daily'
    interval_type: Optional[str] = None  # 'hours' או 'days' - רק ל-recurring
    interval_value: Optional[int] = None  # מספר השעות/ימים - רק ל-recurring
    scheduled_datetime: Optional[datetime] = None  # תאריך ושעה ספציפיים - רק ל-one_time
    weekdays: Optional[List[int]] = None  # [0,2,4] - ימים בשבוע - רק ל-weekly
    specific_time: Optional[str] = None  # "14:30" - שעה ספציפית - ל-weekly ו-daily
    timezone: Optional[str] = None  # "Asia/Jerusalem" - timezone של המשתמש
    one_time_triggered: Optional[bool] = False  # האם התראה חד-פעמית הופעלה
    last_triggered: Optional[datetime] = None
    next_trigger: Optional[datetime] = None
    enabled: bool = True
    created_at: Optional[datetime] = None

class ReminderCreate(BaseModel):
    """מודל ליצירת התראה חדשה"""
    contact_id: int
    reminder_type: str = 'recurring'  # 'one_time', 'recurring', 'weekly', 'daily'
    interval_type: Optional[str] = None  # 'hours' או 'days' - רק ל-recurring
    interval_value: Optional[int] = None  # מספר השעות/ימים - רק ל-recurring
    scheduled_datetime: Optional[datetime] = None  # תאריך ושעה ספציפיים - רק ל-one_time
    weekdays: Optional[List[int]] = None  # [0,2,4] - ימים בשבוע - רק ל-weekly
    specific_time: Optional[str] = None  # "14:30" - שעה ספציפית - ל-weekly ו-daily
    timezone: Optional[str] = None  # "Asia/Jerusalem" - timezone של המשתמש
    enabled: Optional[bool] = True

# Database functions - using PostgreSQL instead of JSON files
def get_contacts_from_db(db: Session, user_id: str) -> List[DBContact]:
    """Get all contacts for a user from PostgreSQL"""
    return db.query(DBContact).filter(DBContact.user_id == user_id).all()

def get_contact_by_id(db: Session, contact_id: int, user_id: str) -> Optional[DBContact]:
    """Get a specific contact by ID (ensuring it belongs to the user)"""
    return db.query(DBContact).filter(
        DBContact.id == contact_id,
        DBContact.user_id == user_id
    ).first()

def get_reminders_from_db(db: Session, user_id: str) -> List[DBReminder]:
    """Get all reminders for a user from PostgreSQL"""
    return db.query(DBReminder).filter(DBReminder.user_id == user_id).all()

def get_reminder_by_id(db: Session, reminder_id: int, user_id: str) -> Optional[DBReminder]:
    """Get a specific reminder by ID (ensuring it belongs to the user)"""
    return db.query(DBReminder).filter(
        DBReminder.id == reminder_id,
        DBReminder.user_id == user_id
    ).first()

def calculate_next_trigger(interval_type: str, interval_value: int, last_triggered: Optional[datetime] = None) -> datetime:
    """מחשב את זמן ההתראה הבאה (ל-recurring בלבד - תאימות לאחור)"""
    now = datetime.now(timezone.utc)
    if interval_type == 'hours':
        delta = timedelta(hours=interval_value)
    else:  # days
        delta = timedelta(days=interval_value)
    
    if last_triggered:
        return last_triggered + delta
    else:
        return now + delta

def calculate_next_trigger_advanced(
    reminder_type: str,
    interval_type: Optional[str] = None,
    interval_value: Optional[int] = None,
    scheduled_datetime: Optional[datetime] = None,
    weekdays: Optional[List[int]] = None,
    specific_time: Optional[str] = None,
    last_triggered: Optional[datetime] = None,
    user_timezone: Optional[str] = None
) -> Optional[datetime]:
    """
    מחשב את זמן ההתראה הבאה לפי סוג ההתראה
    """
    now = datetime.now(timezone.utc)
    
    if reminder_type == 'one_time':
        # התראה חד-פעמית - מחזיר את התאריך הספציפי
        if scheduled_datetime and scheduled_datetime > now:
            return scheduled_datetime
        return None  # אם התאריך כבר עבר
    
    elif reminder_type == 'recurring':
        # התראה חזרתית - כמו עכשיו
        if not interval_type or not interval_value:
            return None
        
        if interval_type == 'hours':
            delta = timedelta(hours=interval_value)
        else:  # days
            delta = timedelta(days=interval_value)
        
        if last_triggered:
            return last_triggered + delta
        else:
            return now + delta
    
    elif reminder_type == 'weekly':
        # התראה שבועית - יום/ימים קבועים בשבוע בשעה מסוימת
        if not weekdays or not specific_time:
            return None
        
        # פרסור שעה
        try:
            hour, minute = map(int, specific_time.split(':'))
        except (ValueError, AttributeError):
            return None
        
        # המרת השעה מ-timezone של המשתמש ל-UTC
        if user_timezone:
            try:
                tz = pytz.timezone(user_timezone)
                # יצירת datetime בשעה המקומית של המשתמש
                local_now = datetime.now(tz)
                # חישוב התאריך הבא בשעה המקומית
                local_next = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if local_next <= local_now:
                    local_next += timedelta(days=1)
                # המרה ל-UTC
                next_date = local_next.astimezone(timezone.utc).replace(tzinfo=None)
                next_date = pytz.UTC.localize(next_date)
            except Exception as e:
                print(f"⚠️ [CALC] Error converting timezone {user_timezone}: {e}, using UTC")
                # Fallback to UTC
                current_weekday = now.weekday()
                days_ahead = None
                for weekday in sorted(weekdays):
                    if weekday > current_weekday:
                        days_ahead = weekday - current_weekday
                        break
                if days_ahead is None:
                    days_ahead = (7 - current_weekday) + min(weekdays)
                next_date = (now + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
                if next_date <= now:
                    days_ahead += 7
                    next_date = (now + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
        else:
            # Fallback to UTC if no timezone provided
            current_weekday = now.weekday()
            days_ahead = None
            for weekday in sorted(weekdays):
                if weekday > current_weekday:
                    days_ahead = weekday - current_weekday
                    break
            if days_ahead is None:
                days_ahead = (7 - current_weekday) + min(weekdays)
            next_date = (now + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_date <= now:
                days_ahead += 7
                next_date = (now + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        return next_date
    
    elif reminder_type == 'daily':
        # התראה יומית - כל יום בשעה מסוימת
        if not specific_time:
            return None
        
        # פרסור שעה
        try:
            hour, minute = map(int, specific_time.split(':'))
            print(f"🔍 [CALC] Daily reminder: specific_time={specific_time}, parsed hour={hour}, minute={minute}, timezone={user_timezone}")
        except (ValueError, AttributeError):
            print(f"❌ [CALC] Failed to parse specific_time: {specific_time}")
            return None
        
        # המרת השעה מ-timezone של המשתמש ל-UTC
        if user_timezone:
            try:
                tz = pytz.timezone(user_timezone)
                # יצירת datetime בשעה המקומית של המשתמש
                local_now = datetime.now(tz)
                # חישוב התאריך הבא בשעה המקומית
                local_next = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if local_next <= local_now:
                    local_next += timedelta(days=1)
                # המרה ל-UTC
                next_datetime = local_next.astimezone(timezone.utc).replace(tzinfo=None)
                next_datetime = pytz.UTC.localize(next_datetime)
                print(f"🔍 [CALC] Daily: local_now={local_now}, local_next={local_next}, UTC next={next_datetime}")
            except Exception as e:
                print(f"⚠️ [CALC] Error converting timezone {user_timezone}: {e}, using UTC")
                # Fallback to UTC
                next_datetime = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                if next_datetime <= now:
                    next_datetime = (now + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)
        else:
            # Fallback to UTC if no timezone provided
            next_datetime = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            print(f"🔍 [CALC] Daily: now={now}, next_datetime (today)={next_datetime} (no timezone)")
            if next_datetime <= now:
                next_datetime = (now + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)
                print(f"🔍 [CALC] Daily: hour passed, using tomorrow: {next_datetime}")
        
        return next_datetime
    
    return None

# Database is initialized on startup via startup_event
# No need to load from JSON files anymore

@app.get("/")
async def root():
    return {"message": "ברוכים הבאים ל-Stay Close API", "version": "1.0.0"}

# ========== CONTACTS ENDPOINTS ==========

@app.get("/api/contacts", response_model=List[Contact])
async def get_contacts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """קבלת רשימת כל אנשי הקשר של המשתמש הנוכחי"""
    user_id = current_user["user_id"]
    db_contacts = get_contacts_from_db(db, user_id)
    # Convert SQLAlchemy models to Pydantic models (decrypt name)
    return [Contact(
        id=c.id,
        user_id=c.user_id,
        name=decrypt(c.name_encrypted),
        default_tone=c.default_tone,
        created_at=c.created_at
    ) for c in db_contacts]

@app.get("/api/contacts/{contact_id}", response_model=Contact)
async def get_contact(
    contact_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """קבלת איש קשר ספציפי לפי ID"""
    user_id = current_user["user_id"]
    db_contact = get_contact_by_id(db, contact_id, user_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    # Convert SQLAlchemy model to Pydantic model (decrypt name)
    return Contact(
        id=db_contact.id,
        user_id=db_contact.user_id,
        name=decrypt(db_contact.name_encrypted),
        default_tone=db_contact.default_tone,
        created_at=db_contact.created_at
    )

@app.post("/api/contacts", response_model=Contact)
async def create_contact(
    contact: ContactCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """יצירת איש קשר חדש (של המשתמש הנוכחי)"""
    user_id = current_user["user_id"]
    
    # Encrypt the contact name
    name_encrypted = encrypt(contact.name)
    
    # Create new contact in database with encrypted name
    db_contact = DBContact(
        user_id=user_id,
        name_encrypted=name_encrypted,
        default_tone=contact.default_tone or 'friendly',
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    
    print(f"✅ [DATABASE] Created contact {db_contact.id} for user {user_id}")
    # Convert SQLAlchemy model to Pydantic model (return original name)
    return Contact(
        id=db_contact.id,
        user_id=db_contact.user_id,
        name=contact.name,  # Return original name, not encrypted
        default_tone=db_contact.default_tone,
        created_at=db_contact.created_at
    )

@app.put("/api/contacts/{contact_id}", response_model=Contact)
async def update_contact(
    contact_id: int,
    contact: ContactCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """עדכון איש קשר קיים"""
    user_id = current_user["user_id"]
    
    # Get existing contact
    db_contact = get_contact_by_id(db, contact_id, user_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    # Update contact fields (encrypt name)
    db_contact.name_encrypted = encrypt(contact.name)
    db_contact.default_tone = contact.default_tone or 'friendly'
    
    db.commit()
    db.refresh(db_contact)
    
    print(f"✅ [DATABASE] Updated contact {contact_id} for user {user_id}")
    # Convert SQLAlchemy model to Pydantic model (return original name)
    return Contact(
        id=db_contact.id,
        user_id=db_contact.user_id,
        name=contact.name,  # Return original name, not encrypted
        default_tone=db_contact.default_tone,
        created_at=db_contact.created_at
    )

@app.delete("/api/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """מחיקת איש קשר"""
    user_id = current_user["user_id"]
    
    # Get contact to delete
    db_contact = get_contact_by_id(db, contact_id, user_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    # Delete contact (cascade will delete related reminders automatically)
    db.delete(db_contact)
    db.commit()
    
    print(f"✅ [DATABASE] Deleted contact {contact_id} for user {user_id}")
    return {"message": "איש קשר נמחק בהצלחה"}

# ========== REMINDERS ENDPOINTS ==========

# IMPORTANT: /api/reminders/check must be defined BEFORE /api/reminders/{reminder_id}
# Otherwise FastAPI will try to match "check" as a reminder_id and cause 422 errors
@app.get("/api/reminders/check")
async def check_reminders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """בודק אילו התראות צריכות להתפעל עכשיו"""
    print(f"🔍 [CHECK] Endpoint called - starting check_reminders")
    try:
        user_id = current_user["user_id"]
        now = datetime.now(timezone.utc)
        print(f"🔍 [CHECK] Checking reminders for user {user_id} at {now}")
        
        # Get all enabled reminders for user
        # For one_time: check scheduled_datetime and one_time_triggered
        # For others: check next_trigger
        all_reminders = db.query(DBReminder).filter(
            DBReminder.user_id == user_id,
            DBReminder.enabled == True
        ).all()
        
        triggered_reminders = []
        for db_reminder in all_reminders:
            reminder_type = db_reminder.reminder_type or 'recurring'
            
            # Check if reminder should trigger
            should_trigger = False
            
            if reminder_type == 'one_time':
                # One-time reminder: check scheduled_datetime and one_time_triggered
                if db_reminder.scheduled_datetime and not db_reminder.one_time_triggered:
                    # Check if scheduled time has passed (with 1 minute tolerance)
                    time_diff = (now - db_reminder.scheduled_datetime).total_seconds()
                    if -60 <= time_diff <= 60:  # Within 1 minute window
                        should_trigger = True
            else:
                # Recurring, weekly, or daily: check next_trigger
                if db_reminder.next_trigger:
                    # Check if next_trigger time has passed (with 1 minute tolerance)
                    time_diff = (now - db_reminder.next_trigger).total_seconds()
                    if -60 <= time_diff <= 60:  # Within 1 minute window
                        should_trigger = True
            
            if should_trigger:
                print(f"✅ [CHECK] Reminder {db_reminder.id} should trigger (type={reminder_type})")
                
                # Get contact info for notification
                contact = get_contact_by_id(db, db_reminder.contact_id, user_id)
                if not contact:
                    print(f"⚠️ [CHECK] Contact {db_reminder.contact_id} not found for reminder {db_reminder.id}")
                    continue
                
                # Send push notification
                contact_name = decrypt(contact.name_encrypted)
                push_tokens = db.query(PushToken).filter(PushToken.user_id == user_id).all()
                if push_tokens:
                    notification_title = f"תזכורת: {contact_name}"
                    notification_body = f"זמן להתקשר ל-{contact_name}!"
                    
                    for push_token in push_tokens:
                        send_push_notification(
                            push_token.token,
                            notification_title,
                            notification_body,
                            data={"reminder_id": db_reminder.id, "contact_id": contact.id}
                        )
                else:
                    print(f"⚠️ [CHECK] No push tokens found for user {user_id}")
                
                # Update reminder
                if reminder_type == 'one_time':
                    db_reminder.one_time_triggered = True
                    db_reminder.next_trigger = None
                else:
                    # Calculate next trigger
                    # Parse weekdays from JSON if exists
                    weekdays = None
                    if db_reminder.weekdays:
                        try:
                            weekdays = json.loads(db_reminder.weekdays)
                        except (json.JSONDecodeError, TypeError):
                            weekdays = None
                    
                    # Use stored timezone or default to None
                    user_timezone = db_reminder.timezone
                    
                    next_trigger = calculate_next_trigger_advanced(
                        reminder_type=reminder_type,
                        interval_type=db_reminder.interval_type,
                        interval_value=db_reminder.interval_value,
                        scheduled_datetime=db_reminder.scheduled_datetime,
                        weekdays=weekdays,
                        specific_time=db_reminder.specific_time,
                        last_triggered=now,
                        user_timezone=user_timezone
                    )
                    db_reminder.last_triggered = now
                    db_reminder.next_trigger = next_trigger
                
                # Create Reminder object for response
                try:
                    # Parse weekdays from JSON string if exists
                    weekdays = None
                    if db_reminder.weekdays:
                        try:
                            weekdays = json.loads(db_reminder.weekdays)
                        except (json.JSONDecodeError, TypeError):
                            weekdays = None
                    
                    reminder_obj = Reminder(
                        id=db_reminder.id,
                        user_id=db_reminder.user_id,
                        contact_id=db_reminder.contact_id,
                        reminder_type=reminder_type,
                        interval_type=db_reminder.interval_type,
                        interval_value=db_reminder.interval_value,
                        scheduled_datetime=db_reminder.scheduled_datetime,
                        weekdays=weekdays,
                        specific_time=db_reminder.specific_time,
                        one_time_triggered=db_reminder.one_time_triggered or False,
                        timezone=db_reminder.timezone,
                        last_triggered=db_reminder.last_triggered,
                        next_trigger=db_reminder.next_trigger,
                        enabled=db_reminder.enabled,
                        created_at=db_reminder.created_at
                    )
                    
                    triggered_reminders.append(reminder_obj)
                except Exception as e:
                    print(f"❌ [CHECK] Error creating Reminder object: {e}")
                    print(f"   Reminder ID: {db_reminder.id}, Type: {reminder_type}")
                    print(f"   Reminder data: id={db_reminder.id}, contact_id={db_reminder.contact_id}, enabled={db_reminder.enabled}")
                    print(f"   scheduled_datetime={db_reminder.scheduled_datetime}, next_trigger={db_reminder.next_trigger}")
                    print(f"   last_triggered={db_reminder.last_triggered}, created_at={db_reminder.created_at}")
                    import traceback
                    traceback.print_exc()
                    # Don't raise - just skip this reminder and continue
                    continue
        
        if triggered_reminders:
            db.commit()
            print(f"✅ [DATABASE] Updated {len(triggered_reminders)} triggered reminders for user {user_id}")
        
        # Validate that all reminders have required fields before returning
        for r in triggered_reminders:
            if r.contact_id is None:
                print(f"⚠️ [CHECK] Warning: Reminder {r.id} has None contact_id")
        
        # Try to serialize manually to catch validation errors
        try:
            # Convert to dict to test serialization - use model_dump for Pydantic v2 compatibility
            result = [r.model_dump() if hasattr(r, 'model_dump') else r.dict() for r in triggered_reminders]
            print(f"✅ [CHECK] Serialization test passed: {len(result)} reminders")
        except Exception as e:
            print(f"❌ [CHECK] Serialization test failed: {e}")
            import traceback
            traceback.print_exc()
            # Return empty list instead of raising error - better UX
            return []
        
        print(f"✅ [CHECK] Returning {len(triggered_reminders)} triggered reminders")
        # Convert to dict to avoid serialization issues
        result = []
        for r in triggered_reminders:
            try:
                result.append(r.model_dump() if hasattr(r, 'model_dump') else r.dict())
            except Exception as e:
                print(f"⚠️ [CHECK] Error serializing reminder {r.id}: {e}")
                continue
        
        return result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ [CHECK] Error in check_reminders: {e}")
        import traceback
        traceback.print_exc()
        # Return 422 with detailed error message for validation errors
        error_detail = str(e)
        if "validation" in error_detail.lower() or "pydantic" in error_detail.lower():
            raise HTTPException(status_code=422, detail=f"Validation error: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error checking reminders: {error_detail}")

@app.get("/api/reminders", response_model=List[Reminder])
async def get_reminders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """קבלת רשימת כל ההתראות של המשתמש הנוכחי"""
    user_id = current_user["user_id"]
    db_reminders = get_reminders_from_db(db, user_id)
    # Convert SQLAlchemy models to Pydantic models
    result = []
    for r in db_reminders:
        # Parse weekdays from JSON string if exists
        weekdays = None
        if r.weekdays:
            try:
                weekdays = json.loads(r.weekdays)
            except (json.JSONDecodeError, TypeError):
                weekdays = None
        
        result.append(Reminder(
            id=r.id,
            user_id=r.user_id,
            contact_id=r.contact_id,
            reminder_type=r.reminder_type or 'recurring',
            interval_type=r.interval_type,
            interval_value=r.interval_value,
            scheduled_datetime=r.scheduled_datetime,
            weekdays=weekdays,
            specific_time=r.specific_time,
            one_time_triggered=r.one_time_triggered or False,
            last_triggered=r.last_triggered,
            next_trigger=r.next_trigger,
            enabled=r.enabled,
            created_at=r.created_at
        ))
    return result

@app.get("/api/reminders/{reminder_id}", response_model=Reminder)
async def get_reminder(
    reminder_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """קבלת התראה ספציפית לפי ID"""
    user_id = current_user["user_id"]
    db_reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    
    # Parse weekdays from JSON string if exists
    weekdays = None
    if db_reminder.weekdays:
        try:
            weekdays = json.loads(db_reminder.weekdays)
        except (json.JSONDecodeError, TypeError):
            weekdays = None
    
    # Convert SQLAlchemy model to Pydantic model
    return Reminder(
        id=db_reminder.id,
        user_id=db_reminder.user_id,
        contact_id=db_reminder.contact_id,
        reminder_type=db_reminder.reminder_type or 'recurring',
        interval_type=db_reminder.interval_type,
        interval_value=db_reminder.interval_value,
        scheduled_datetime=db_reminder.scheduled_datetime,
        weekdays=weekdays,
        specific_time=db_reminder.specific_time,
        timezone=db_reminder.timezone,
        one_time_triggered=db_reminder.one_time_triggered or False,
        last_triggered=db_reminder.last_triggered,
        next_trigger=db_reminder.next_trigger,
        enabled=db_reminder.enabled,
        created_at=db_reminder.created_at
    )

@app.post("/api/reminders", response_model=Reminder)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """יצירת התראה חדשה"""
    user_id = current_user["user_id"]
    
    # בדיקה שאיש הקשר קיים ושייך למשתמש
    contact = get_contact_by_id(db, reminder.contact_id, user_id)
    if not contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    # Calculate next trigger using advanced function
    now = datetime.now(timezone.utc)
    user_timezone = reminder.timezone or 'Asia/Jerusalem'  # Default to Israel timezone
    print(f"🔍 [CREATE] Calculating next_trigger: type={reminder.reminder_type}, specific_time={reminder.specific_time}, timezone={user_timezone}, now={now}")
    next_trigger = calculate_next_trigger_advanced(
        reminder_type=reminder.reminder_type or 'recurring',
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        scheduled_datetime=reminder.scheduled_datetime,
        weekdays=reminder.weekdays,
        specific_time=reminder.specific_time,
        last_triggered=None,
        user_timezone=user_timezone
    )
    print(f"✅ [CREATE] Calculated next_trigger: {next_trigger}")
    
    # Convert weekdays list to JSON string
    weekdays_json = None
    if reminder.weekdays:
        weekdays_json = json.dumps(reminder.weekdays)
    
    # Create new reminder in database
    db_reminder = DBReminder(
        user_id=user_id,
        contact_id=reminder.contact_id,
        reminder_type=reminder.reminder_type or 'recurring',
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        scheduled_datetime=reminder.scheduled_datetime,
        weekdays=weekdays_json,
        specific_time=reminder.specific_time,
        timezone=user_timezone,  # שמירת ה-timezone של המשתמש
        one_time_triggered=False,
        last_triggered=None,
        next_trigger=next_trigger,
        enabled=reminder.enabled if reminder.enabled is not None else True,
        created_at=now
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    
    print(f"✅ [DATABASE] Created reminder {db_reminder.id} for user {user_id}")
    
    # Parse weekdays for response
    weekdays_parsed = None
    if db_reminder.weekdays:
        try:
            weekdays_parsed = json.loads(db_reminder.weekdays)
        except (json.JSONDecodeError, TypeError):
            weekdays_parsed = None
    
    # Convert SQLAlchemy model to Pydantic model
    return Reminder(
        id=db_reminder.id,
        user_id=db_reminder.user_id,
        contact_id=db_reminder.contact_id,
        reminder_type=db_reminder.reminder_type or 'recurring',
        interval_type=db_reminder.interval_type,
        interval_value=db_reminder.interval_value,
        scheduled_datetime=db_reminder.scheduled_datetime,
        weekdays=weekdays_parsed,
        specific_time=db_reminder.specific_time,
        one_time_triggered=db_reminder.one_time_triggered or False,
        last_triggered=db_reminder.last_triggered,
        next_trigger=db_reminder.next_trigger,
        enabled=db_reminder.enabled,
        created_at=db_reminder.created_at
    )

@app.put("/api/reminders/{reminder_id}", response_model=Reminder)
async def update_reminder(
    reminder_id: int,
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """עדכון התראה קיימת"""
    user_id = current_user["user_id"]
    
    # Get existing reminder
    db_reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    
    # Calculate next trigger using advanced function
    now = datetime.now(timezone.utc)
    user_timezone = reminder.timezone or db_reminder.timezone or 'Asia/Jerusalem'
    print(f"🔍 [UPDATE] Calculating next_trigger for reminder {reminder_id}: type={reminder.reminder_type}, specific_time={reminder.specific_time}, timezone={user_timezone}, now={now}")
    next_trigger = calculate_next_trigger_advanced(
        reminder_type=reminder.reminder_type or 'recurring',
        interval_type=reminder.interval_type,
        interval_value=reminder.interval_value,
        scheduled_datetime=reminder.scheduled_datetime,
        weekdays=reminder.weekdays,
        specific_time=reminder.specific_time,
        last_triggered=db_reminder.last_triggered,
        user_timezone=user_timezone
    )
    print(f"✅ [UPDATE] Calculated next_trigger: {next_trigger}")
    
    # Convert weekdays list to JSON string
    weekdays_json = None
    if reminder.weekdays:
        weekdays_json = json.dumps(reminder.weekdays)
    
    # Update reminder fields
    db_reminder.contact_id = reminder.contact_id
    db_reminder.reminder_type = reminder.reminder_type or 'recurring'
    db_reminder.interval_type = reminder.interval_type
    db_reminder.interval_value = reminder.interval_value
    db_reminder.scheduled_datetime = reminder.scheduled_datetime
    db_reminder.weekdays = weekdays_json
    db_reminder.specific_time = reminder.specific_time
    db_reminder.timezone = reminder.timezone
    db_reminder.next_trigger = next_trigger
    db_reminder.enabled = reminder.enabled if reminder.enabled is not None else True
    
    db.commit()
    db.refresh(db_reminder)
    
    print(f"✅ [DATABASE] Updated reminder {reminder_id} for user {user_id}")
    
    # Parse weekdays for response
    weekdays_parsed = None
    if db_reminder.weekdays:
        try:
            weekdays_parsed = json.loads(db_reminder.weekdays)
        except (json.JSONDecodeError, TypeError):
            weekdays_parsed = None
    
    # Convert SQLAlchemy model to Pydantic model
    return Reminder(
        id=db_reminder.id,
        user_id=db_reminder.user_id,
        contact_id=db_reminder.contact_id,
        reminder_type=db_reminder.reminder_type or 'recurring',
        interval_type=db_reminder.interval_type,
        interval_value=db_reminder.interval_value,
        scheduled_datetime=db_reminder.scheduled_datetime,
        weekdays=weekdays_parsed,
        specific_time=db_reminder.specific_time,
        one_time_triggered=db_reminder.one_time_triggered or False,
        last_triggered=db_reminder.last_triggered,
        next_trigger=db_reminder.next_trigger,
        enabled=db_reminder.enabled,
        created_at=db_reminder.created_at
    )

@app.delete("/api/reminders/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """מחיקת התראה"""
    user_id = current_user["user_id"]
    
    # Get reminder to delete
    db_reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not db_reminder:
        raise HTTPException(status_code=404, detail="התראה לא נמצאה")
    
    # Delete reminder
    db.delete(db_reminder)
    db.commit()
    
    print(f"✅ [DATABASE] Deleted reminder {reminder_id} for user {user_id}")
    return {"message": "התראה נמחקה בהצלחה"}

# ========== PUSH TOKENS ENDPOINTS ==========

class PushTokenCreate(BaseModel):
    """מודל ליצירת Push Token"""
    token: str  # JSON string של Push subscription
    device_info: Optional[dict] = None

@app.post("/api/push-tokens")
async def register_push_token(
    push_token: PushTokenCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """רישום Push Token למשתמש"""
    user_id = current_user["user_id"]
    
    # בדוק אם Token כבר קיים
    existing_token = db.query(PushToken).filter(
        PushToken.token == push_token.token
    ).first()
    
    if existing_token:
        # עדכן את ה-user_id אם שונה
        if existing_token.user_id != user_id:
            existing_token.user_id = user_id
        # עדכן device_info
        if push_token.device_info:
            existing_token.device_info = json.dumps(push_token.device_info)
        existing_token.updated_at = datetime.now(timezone.utc)
        db.commit()
        print(f"✅ [PUSH] Updated push token for user {user_id}")
        return {"message": "Push token עודכן בהצלחה"}
    
    # יצירת Push Token חדש
    device_info_json = None
    if push_token.device_info:
        device_info_json = json.dumps(push_token.device_info)
    
    db_push_token = PushToken(
        user_id=user_id,
        token=push_token.token,
        device_info=device_info_json,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(db_push_token)
    db.commit()
    db.refresh(db_push_token)
    
    print(f"✅ [PUSH] Registered push token for user {user_id}")
    return {"message": "Push token נרשם בהצלחה", "id": db_push_token.id}

@app.delete("/api/push-tokens/{token_id}")
async def delete_push_token(
    token_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """מחיקת Push Token"""
    user_id = current_user["user_id"]
    
    # Get token to delete
    db_token = db.query(PushToken).filter(
        PushToken.id == token_id,
        PushToken.user_id == user_id
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=404, detail="Push token לא נמצא")
    
    # Delete token
    db.delete(db_token)
    db.commit()
    
    print(f"✅ [PUSH] Deleted push token {token_id} for user {user_id}")
    return {"message": "Push token נמחק בהצלחה"}

# ========== REMINDERS CHECK ENDPOINT ==========
# NOTE: This endpoint is now defined above, before /api/reminders/{reminder_id}
# to prevent FastAPI from matching "check" as a reminder_id parameter

# ========== MESSAGES ENDPOINTS ==========

@app.post("/api/messages/generate")
async def generate_message(
    request: MessageRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """יצירת הודעה מותאמת אישית באמצעות AI"""
    user_id = current_user["user_id"]
    
    # בדיקה שאיש הקשר קיים ושייך למשתמש
    contact = get_contact_by_id(db, request.contact_id, user_id)
    if not contact:
        raise HTTPException(status_code=404, detail="איש קשר לא נמצא")
    
    # Decrypt contact name for display
    contact_name = decrypt(contact.name_encrypted)
    
    # קבלת מפתח API
    api_key = os.getenv("XAI_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="מפתח API לא מוגדר. אנא הגדר XAI_API_KEY או GROQ_API_KEY בקובץ .env")
    
    # בניית ה-prompt
    # Use contact's default tone if no tone specified in request
    tone = request.tone or contact.default_tone or 'friendly'
    
    # Translate message type to Hebrew for better AI understanding
    message_type_hebrew = {
        'custom': 'מותאם אישית',
        'checkin': 'בודק איך אתה',
        'birthday': 'יום הולדת',
        'holiday': 'חג',
        'congratulations': 'ברכות',
        'thank_you': 'תודה',
        'apology': 'התנצלות',
        'support': 'תמיכה ועידוד',
        'invitation': 'הזמנה',
        'thinking_of_you': 'חושב עליך',
        'anniversary': 'יום נישואים/יום שנה',
        'get_well': 'החלמה מהירה',
        'new_job': 'ברכות על עבודה חדשה',
        'graduation': 'סיום לימודים',
        'achievement': 'ברכה על הישג',
        'encouragement': 'עידוד',
        'condolences': 'ניחומים',
        'farewell': 'פרידה',
        'new_beginning': 'התחלה חדשה',
        'special_thanks': 'תודה מיוחדת',
        'moving': 'ברכה על מעבר דירה',
        'wedding': 'ברכה על נישואים',
        'pregnancy': 'ברכה על היריון',
        'birth': 'ברכה על לידה',
        'promotion': 'ברכה על קידום',
        'retirement': 'ברכה על פרישה',
        'reunion': 'ברכה על מפגש',
        'appreciation': 'הערכה',
        'miss_you': 'מתגעגע',
        'good_luck': 'מזל טוב',
        'celebration': 'ברכה על חגיגה'
    }.get(request.message_type, request.message_type)
    
    prompt = f"""צור הודעה בעברית מסוג {message_type_hebrew} עבור {contact_name}.
טון: {tone}
"""
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
            "contact_name": contact_name,
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
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """רישום משתמש חדש"""
    print(f"🔵 [BACKEND] Registration request received: username={user_data.username}, email={user_data.email}")
    try:
        user = register_user(user_data.username, user_data.email, user_data.password, db)
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
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """התחברות עם שם משתמש וסיסמה"""
    print(f"🔵 [BACKEND] Login request received: username={user_data.username}")
    try:
        user = authenticate_user(user_data.username, user_data.password, db)
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
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """התחברות דרך Google OAuth"""
    try:
        google_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={request.token}"
        response = requests.get(google_url, timeout=10)

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google token לא תקין")

        google_user_info = response.json()
        user = create_or_get_google_user(google_user_info, db)
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
async def firebase_auth(request: FirebaseAuthRequest, db: Session = Depends(get_db)):
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
        user = create_or_get_firebase_user(firebase_user_info, db)
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

@app.get("/api/push/vapid-public-key")
async def get_vapid_public_key():
    """
    Endpoint זה נשמר לצורך תאימות לאחור.
    עכשיו אנחנו משתמשים ב-Firebase Cloud Messaging (FCM) ולא צריך VAPID keys.
    """
    # FCM לא צריך VAPID keys - Firebase מנהל את זה אוטומטית
    return {
        "message": "Using Firebase Cloud Messaging (FCM). No VAPID key needed.",
        "useFCM": True
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint ל-Railway"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000)) # Use PORT environment variable for Railway
    uvicorn.run(app, host="0.0.0.0", port=port)

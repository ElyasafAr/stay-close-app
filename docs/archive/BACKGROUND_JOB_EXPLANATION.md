# 🔧 Background Job - הסבר מפורט

## ❓ מה זה Background Job?

**Background Job = תהליך שרץ על השרת (Backend), לא על הלקוח!**

זה **לא** קומפוננטה של הלקוח - זה חלק מה-Backend.

---

## 🏗️ איפה כל דבר רץ?

### Backend (השרת):
```
┌─────────────────────────────────────┐
│  FastAPI Server                     │
│  ┌───────────────────────────────┐ │
│  │  API Endpoints                 │ │
│  │  - /api/contacts               │ │
│  │  - /api/reminders              │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Background Job               │ │ ← זה רץ כאן!
│  │  - בודק התראות כל דקה        │ │
│  │  - שולח Push Notifications    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Frontend (הדפדפן):
```
┌─────────────────────────────────────┐
│  Browser                            │
│  ┌───────────────────────────────┐ │
│  │  React App                     │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Service Worker                │ │ ← זה רץ כאן
│  │  - מקבל Push Notifications     │ │
│  │  - מציג התראות                │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔄 מי עושה מה?

### Background Job (השרת):
- ✅ רץ על השרת (Backend)
- ✅ בודק התראות כל דקה
- ✅ שולח Push Notifications
- ✅ לא תלוי בדפדפן

### Service Worker (הדפדפן):
- ✅ רץ בדפדפן (Frontend)
- ✅ מקבל Push Notifications
- ✅ מציג התראות
- ✅ לא בודק כלום - רק מקבל

---

## 📦 איפה זה נמצא בקוד?

### Background Job (Backend):
```
backend/
├── main.py              # FastAPI app
├── scheduler.py         # ← Background Job כאן!
└── send_push.py         # שליחת Push Notifications
```

### Service Worker (Frontend):
```
public/
└── sw.js                # ← Service Worker כאן
```

---

## 🚀 איך מתקינים Background Job?

### אפשרות 1: Python `schedule` (פשוט)

**קובץ: `backend/scheduler.py`**
```python
import schedule
import time
from datetime import datetime
from database import SessionLocal
from models import Reminder
from send_push import send_push_notification

def check_and_send_reminders():
    """בודק התראות ושולח Push Notifications"""
    db = SessionLocal()
    try:
        now = datetime.now()
        
        # מצא התראות שצריכות להתפעל
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_trigger <= now
        ).all()
        
        for reminder in reminders:
            # שלח Push Notification
            send_push_notification(reminder)
            
            # עדכן next_trigger
            reminder.next_trigger = calculate_next_trigger(...)
        
        db.commit()
    finally:
        db.close()

# הרץ כל דקה
schedule.every(1).minutes.do(check_and_send_reminders)

# לולאה אינסופית
if __name__ == '__main__':
    while True:
        schedule.run_pending()
        time.sleep(1)
```

**איך להריץ:**
```bash
# אפשרות 1: תהליך נפרד
python backend/scheduler.py

# אפשרות 2: חלק מ-main.py (מומלץ)
# נוסיף את זה ל-main.py
```

---

### אפשרות 2: חלק מ-FastAPI (מומלץ!)

**קובץ: `backend/main.py`**
```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import threading

# Background Job
def background_job():
    """Background Job - בודק התראות כל דקה"""
    import schedule
    import time
    
    def check_reminders():
        # בדוק ושלח התראות
        pass
    
    schedule.every(1).minutes.do(check_reminders)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # התחל Background Job כשהשרת מתחיל
    thread = threading.Thread(target=background_job, daemon=True)
    thread.start()
    yield
    # ניקוי בעת סגירה

app = FastAPI(lifespan=lifespan)
```

**יתרונות:**
- ✅ רץ אוטומטית כשהשרת מתחיל
- ✅ לא צריך תהליך נפרד
- ✅ פשוט לניהול

---

### אפשרות 3: Celery (מקצועי)

**קובץ: `backend/celery_app.py`**
```python
from celery import Celery

app = Celery('reminders')

@app.task
def check_reminders():
    # בדוק ושלח התראות
    pass

# הרץ כל דקה
app.conf.beat_schedule = {
    'check-reminders': {
        'task': 'check_reminders',
        'schedule': 60.0,  # כל 60 שניות
    },
}
```

**איך להריץ:**
```bash
# Worker
celery -A celery_app worker --loglevel=info

# Scheduler
celery -A celery_app beat --loglevel=info
```

**יתרונות:**
- ✅ מקצועי
- ✅ יכול לרוץ על שרת נפרד
- ✅ יותר מורכב

---

## 🎯 המלצה: FastAPI Lifespan

**הכי פשוט - חלק מ-main.py:**

```python
# backend/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
import threading
import schedule
import time

def check_and_send_reminders():
    """Background Job - בודק התראות כל דקה"""
    # קוד בדיקה ושליחה
    pass

def background_job_loop():
    """לולאה של Background Job"""
    schedule.every(1).minutes.do(check_and_send_reminders)
    while True:
        schedule.run_pending()
        time.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # התחל Background Job
    thread = threading.Thread(target=background_job_loop, daemon=True)
    thread.start()
    print("✅ Background Job started")
    yield
    # ניקוי בעת סגירה

app = FastAPI(lifespan=lifespan)
```

**יתרונות:**
- ✅ רץ אוטומטית
- ✅ חלק מה-FastAPI app
- ✅ פשוט לניהול
- ✅ עובד ב-Railway/Heroku

---

## 📊 איפה זה רץ?

### Railway/Heroku:
```
┌─────────────────────────────────────┐
│  Railway Server                     │
│  ┌───────────────────────────────┐ │
│  │  FastAPI Process               │ │
│  │  ├── API Endpoints             │ │
│  │  └── Background Job Thread     │ │ ← רץ כאן!
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**זה רץ על השרת - לא על המחשב שלך!**

---

## 🔍 איך זה עובד בפועל?

### 1. השרת מתחיל:
```
FastAPI starts → Background Job Thread starts → רץ כל דקה
```

### 2. כל דקה:
```
Background Job → בדוק התראות → שלח Push → עדכן next_trigger
```

### 3. Push Notification:
```
Background Job → FCM → Service Worker → מציג התראה
```

---

## ⚙️ איך מתקינים?

### שלב 1: הוסף את הקוד ל-main.py
```python
# נוסיף Background Job
```

### שלב 2: הוסף dependencies
```bash
pip install schedule
```

### שלב 3: השרת רץ אוטומטית
```
Railway/Heroku → מתחיל FastAPI → Background Job מתחיל
```

**אין צורך להתקין משהו ידנית - זה חלק מה-Backend!**

---

## 🎯 סיכום

### Background Job:
- ✅ רץ על השרת (Backend)
- ✅ חלק מה-FastAPI app
- ✅ מתחיל אוטומטית
- ✅ לא צריך להתקין משהו ידנית

### Service Worker:
- ✅ רץ בדפדפן (Frontend)
- ✅ מתקין אוטומטית כשפותחים את האפליקציה
- ✅ מקבל Push Notifications

**הם עובדים יחד:**
- Background Job (שרת) → בודק ושולח
- Service Worker (דפדפן) → מקבל ומציג

---

## 📝 מה צריך לעשות?

1. ✅ להוסיף Background Job ל-`backend/main.py`
2. ✅ להוסיף `schedule` ל-`requirements.txt`
3. ✅ לכתוב את הפונקציה `check_and_send_reminders()`
4. ✅ זה הכל! רץ אוטומטית

**האם תרצה שאתחיל לממש את זה?**


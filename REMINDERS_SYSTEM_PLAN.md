# 📋 תכנית מערכת התראות משופרת - Stay Close App

**תאריך:** 2025-12-11  
**סטטוס:** תכנון - לא לממש עדיין

---

## 🎯 מטרות

לשדרג את מערכת ההתראות כדי לתמוך ב:
1. **התראה חד-פעמית** - תאריך ושעה ספציפיים
2. **התראה חזרתית** - כל X שעות או כל X ימים
3. **התראה שבועית** - יום/ימים קבועים בשבוע בשעה מסוימת
4. **התראה יומית** - כל יום בשעה מסוימת

---

## 📊 ניתוח המצב הנוכחי

### מה קיים כרגע:
- ✅ מודל `Reminder` ב-PostgreSQL עם `interval_type` ('hours'/'days') ו-`interval_value`
- ✅ טופס בסיסי ב-`ReminderModal.tsx` - רק תדירות (שעות/ימים)
- ✅ בדיקה תקופתית ב-`ReminderChecker.tsx` - כל דקה
- ✅ Browser Notifications API - עובד
- ✅ Backend endpoints - CRUD מלא

### מה חסר:
- ❌ תאריך ושעה ספציפיים
- ❌ בחירת ימים בשבוע
- ❌ בחירת שעה ספציפית
- ❌ הבחנה בין התראה חד-פעמית לחזרתית
- ❌ UI מתאים לכל סוג התראה

---

## 🗄️ שינויים במודל הנתונים

### 1. עדכון מודל `Reminder` ב-`backend/models.py`

**שדות חדשים להוסיף:**
```python
# סוג התראה
reminder_type = Column(String, nullable=False, default='recurring')
# ערכים אפשריים: 'one_time', 'recurring', 'weekly', 'daily'

# תאריך ושעה ספציפיים (להתראה חד-פעמית)
scheduled_datetime = Column(DateTime(timezone=True), nullable=True)

# ימים בשבוע (להתראה שבועית) - JSON array: [0,2,4] = ראשון, שלישי, חמישי
# 0=ראשון, 1=שני, 2=שלישי, 3=רביעי, 4=חמישי, 5=שישי, 6=שבת
weekdays = Column(Text, nullable=True)  # JSON: "[0,2,4]"

# שעה ספציפית (להתראות יומיות/שבועיות) - בפורמט "HH:MM"
specific_time = Column(String, nullable=True)  # "14:30"

# האם ההתראה חד-פעמית הופעלה (להתראות חד-פעמיות)
one_time_triggered = Column(Boolean, default=False, nullable=False)
```

**שדות קיימים לשמור:**
- `interval_type` - ישמש להתראות חזרתיות (hours/days)
- `interval_value` - ישמש להתראות חזרתיות
- `next_trigger` - זמן ההתראה הבאה (מחושב אוטומטית)
- `last_triggered` - זמן ההפעלה האחרונה
- `enabled` - האם ההתראה פעילה

**מיגרציה:**
- יצירת Alembic migration להוספת השדות החדשים
- ערך ברירת מחדל: `reminder_type='recurring'` (תואם למצב הנוכחי)
- שדות חדשים יהיו `nullable=True` כדי לא לשבור התראות קיימות

---

## 🎨 שינויים ב-UI (Frontend)

### 1. עדכון `ReminderModal.tsx`

**מבנה הטופס החדש:**

```
┌─────────────────────────────────────┐
│  סוג התראה:                         │
│  ○ חד-פעמית (תאריך ושעה ספציפיים)  │
│  ○ חזרתית (כל X שעות/ימים)         │
│  ○ שבועית (יום/ימים קבועים)        │
│  ○ יומית (כל יום בשעה מסוימת)      │
└─────────────────────────────────────┘
```

**תצוגה דינמית לפי סוג:**

#### א. התראה חד-פעמית:
- Date picker - בחירת תאריך
- Time picker - בחירת שעה
- שדה: `scheduled_datetime`

#### ב. התראה חזרתית (המצב הנוכחי):
- Number input - מספר
- Select - שעות/ימים
- שדות: `interval_type`, `interval_value`

#### ג. התראה שבועית:
- Multi-select checkboxes - ימים בשבוע
  - ☐ ראשון
  - ☐ שני
  - ☐ שלישי
  - ☐ רביעי
  - ☐ חמישי
  - ☐ שישי
  - ☐ שבת
- Time picker - שעה
- שדות: `weekdays` (JSON array), `specific_time`

#### ד. התראה יומית:
- Time picker - שעה
- שדה: `specific_time`

**קומפוננטות חדשות:**
- `ReminderTypeSelector` - בחירת סוג התראה
- `OneTimeReminderForm` - טופס להתראה חד-פעמית
- `RecurringReminderForm` - טופס להתראה חזרתית (קיים, לשפר)
- `WeeklyReminderForm` - טופס להתראה שבועית
- `DailyReminderForm` - טופס להתראה יומית

### 2. עדכון `services/reminders.ts`

**Interface חדש:**
```typescript
export type ReminderType = 'one_time' | 'recurring' | 'weekly' | 'daily'

export interface Reminder {
  id: number
  user_id?: string
  contact_id: number
  reminder_type: ReminderType
  // שדות קיימים (עבור recurring)
  interval_type?: 'hours' | 'days'
  interval_value?: number
  // שדות חדשים
  scheduled_datetime?: string  // ISO datetime string
  weekdays?: number[]  // [0,2,4] = ראשון, שלישי, חמישי
  specific_time?: string  // "14:30"
  one_time_triggered?: boolean
  // שדות קיימים
  last_triggered?: string
  next_trigger?: string
  enabled: boolean
  created_at?: string
}

export interface ReminderCreate {
  contact_id: number
  reminder_type: ReminderType
  interval_type?: 'hours' | 'days'
  interval_value?: number
  scheduled_datetime?: string
  weekdays?: number[]
  specific_time?: string
  enabled?: boolean
}
```

### 3. עדכון תצוגת התראות ב-`app/contacts/page.tsx`

**תצוגה משופרת:**
- הצגת סוג ההתראה (חד-פעמית/חזרתית/שבועית/יומית)
- הצגת זמן ההתראה הבאה בפורמט קריא
- הצגת ימים בשבוע (להתראות שבועיות)
- הצגת שעה (להתראות יומיות/שבועיות)

---

## ⚙️ שינויים ב-Backend

### 1. עדכון `backend/models.py`

**מודל חדש:**
```python
class Reminder(Base):
    __tablename__ = "reminders"
    
    # שדות קיימים
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    interval_type = Column(String, nullable=True)  # 'hours' or 'days' - רק ל-recurring
    interval_value = Column(Integer, nullable=True)  # רק ל-recurring
    last_triggered = Column(DateTime(timezone=True), nullable=True)
    next_trigger = Column(DateTime(timezone=True), nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # שדות חדשים
    reminder_type = Column(String, nullable=False, default='recurring')  # 'one_time', 'recurring', 'weekly', 'daily'
    scheduled_datetime = Column(DateTime(timezone=True), nullable=True)  # להתראה חד-פעמית
    weekdays = Column(Text, nullable=True)  # JSON array: "[0,2,4]"
    specific_time = Column(String, nullable=True)  # "14:30"
    one_time_triggered = Column(Boolean, default=False, nullable=False)  # האם התראה חד-פעמית הופעלה
```

### 2. עדכון `backend/main.py`

#### א. עדכון Pydantic Models:
```python
class Reminder(BaseModel):
    id: int
    user_id: Optional[str] = None
    contact_id: int
    reminder_type: str  # 'one_time', 'recurring', 'weekly', 'daily'
    interval_type: Optional[str] = None  # 'hours' or 'days'
    interval_value: Optional[int] = None
    scheduled_datetime: Optional[datetime] = None
    weekdays: Optional[List[int]] = None  # [0,2,4]
    specific_time: Optional[str] = None  # "14:30"
    one_time_triggered: Optional[bool] = False
    last_triggered: Optional[datetime] = None
    next_trigger: Optional[datetime] = None
    enabled: bool
    created_at: Optional[datetime] = None

class ReminderCreate(BaseModel):
    contact_id: int
    reminder_type: str
    interval_type: Optional[str] = None
    interval_value: Optional[int] = None
    scheduled_datetime: Optional[datetime] = None
    weekdays: Optional[List[int]] = None
    specific_time: Optional[str] = None
    enabled: Optional[bool] = True
```

#### ב. פונקציה חדשה: `calculate_next_trigger_advanced()`

**לוגיקה לפי סוג התראה:**

```python
def calculate_next_trigger_advanced(
    reminder_type: str,
    interval_type: Optional[str] = None,
    interval_value: Optional[int] = None,
    scheduled_datetime: Optional[datetime] = None,
    weekdays: Optional[List[int]] = None,
    specific_time: Optional[str] = None,
    last_triggered: Optional[datetime] = None
) -> Optional[datetime]:
    """
    מחשב את זמן ההתראה הבאה לפי סוג ההתראה
    """
    now = datetime.now()
    
    if reminder_type == 'one_time':
        # התראה חד-פעמית - מחזיר את התאריך הספציפי
        if scheduled_datetime and scheduled_datetime > now:
            return scheduled_datetime
        return None  # אם התאריך כבר עבר
    
    elif reminder_type == 'recurring':
        # התראה חזרתית - כמו עכשיו
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
        hour, minute = map(int, specific_time.split(':'))
        
        # מציאת היום הבא מהרשימה
        current_weekday = now.weekday()  # 0=ראשון, 6=שבת
        days_ahead = None
        
        # חיפוש היום הקרוב ביותר
        for weekday in sorted(weekdays):
            if weekday > current_weekday:
                days_ahead = weekday - current_weekday
                break
        
        # אם לא מצאנו, ניקח את היום הראשון בשבוע הבא
        if days_ahead is None:
            days_ahead = (7 - current_weekday) + min(weekdays)
        
        # חישוב התאריך
        next_date = now + timedelta(days=days_ahead)
        next_datetime = next_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # אם השעה כבר עברה היום והתאריך הוא היום, ניקח את היום הבא
        if next_datetime <= now:
            days_ahead += 7
            next_date = now + timedelta(days=days_ahead)
            next_datetime = next_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        return next_datetime
    
    elif reminder_type == 'daily':
        # התראה יומית - כל יום בשעה מסוימת
        if not specific_time:
            return None
        
        # פרסור שעה
        hour, minute = map(int, specific_time.split(':'))
        
        # חישוב התאריך הבא
        next_datetime = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        # אם השעה כבר עברה היום, ניקח מחר
        if next_datetime <= now:
            next_datetime += timedelta(days=1)
        
        return next_datetime
    
    return None
```

#### ג. עדכון Endpoints:

**`POST /api/reminders`:**
- וולידציה לפי `reminder_type`
- חישוב `next_trigger` עם `calculate_next_trigger_advanced()`
- שמירה ב-DB

**`PUT /api/reminders/{reminder_id}`:**
- עדכון כל השדות החדשים
- חישוב מחדש של `next_trigger`

**`GET /api/reminders/check`:**
- בדיקה של כל סוגי ההתראות:
  - `one_time`: `scheduled_datetime <= now` ו-`one_time_triggered == False`
  - `recurring`: `next_trigger <= now`
  - `weekly`: `next_trigger <= now`
  - `daily`: `next_trigger <= now`
- עדכון `one_time_triggered = True` להתראות חד-פעמיות
- חישוב `next_trigger` הבא (למעט חד-פעמיות)

---

## 🔄 לוגיקת הפעלה

### 1. התראה חד-פעמית:
- **הפעלה:** כאשר `scheduled_datetime <= now` ו-`one_time_triggered == False`
- **אחרי הפעלה:** `one_time_triggered = True`, `enabled = False` (אופציונלי - אפשר להשאיר enabled)
- **next_trigger:** `None` (לא רלוונטי)

### 2. התראה חזרתית:
- **הפעלה:** כאשר `next_trigger <= now`
- **אחרי הפעלה:** `last_triggered = now`, `next_trigger = calculate_next_trigger_advanced(...)`
- **המשך:** ממשיכה לפעול עד ש-`enabled = False`

### 3. התראה שבועית:
- **הפעלה:** כאשר `next_trigger <= now`
- **אחרי הפעלה:** `last_triggered = now`, `next_trigger = calculate_next_trigger_advanced(...)` (יום הבא מהרשימה)
- **המשך:** ממשיכה לפעול עד ש-`enabled = False`

### 4. התראה יומית:
- **הפעלה:** כאשר `next_trigger <= now`
- **אחרי הפעלה:** `last_triggered = now`, `next_trigger = calculate_next_trigger_advanced(...)` (מחר באותה שעה)
- **המשך:** ממשיכה לפעול עד ש-`enabled = False`

---

## 🧪 בדיקות נדרשות

### Unit Tests:
1. `calculate_next_trigger_advanced()` - כל סוג התראה
2. וולידציה של שדות לפי `reminder_type`
3. חישוב נכון של `next_trigger` לכל סוג

### Integration Tests:
1. יצירת התראה חד-פעמית ובדיקה שהיא מופעלת בזמן
2. יצירת התראה שבועית ובדיקה שהיא מופעלת ביום הנכון
3. יצירת התראה יומית ובדיקה שהיא מופעלת כל יום
4. בדיקה שהתראות חד-פעמיות לא מופעלות פעמיים

---

## 📝 מיגרציה

### 1. יצירת Alembic Migration:
```bash
alembic revision -m "add_advanced_reminder_fields"
```

### 2. תוכן המיגרציה:
```python
def upgrade():
    op.add_column('reminders', sa.Column('reminder_type', sa.String(), nullable=False, server_default='recurring'))
    op.add_column('reminders', sa.Column('scheduled_datetime', sa.DateTime(timezone=True), nullable=True))
    op.add_column('reminders', sa.Column('weekdays', sa.Text(), nullable=True))
    op.add_column('reminders', sa.Column('specific_time', sa.String(), nullable=True))
    op.add_column('reminders', sa.Column('one_time_triggered', sa.Boolean(), nullable=False, server_default='false'))
    
    # עדכון התראות קיימות
    op.execute("UPDATE reminders SET reminder_type = 'recurring' WHERE reminder_type IS NULL")

def downgrade():
    op.drop_column('reminders', 'one_time_triggered')
    op.drop_column('reminders', 'specific_time')
    op.drop_column('reminders', 'weekdays')
    op.drop_column('reminders', 'scheduled_datetime')
    op.drop_column('reminders', 'reminder_type')
```

---

## 🎯 סדר ביצוע (כשנתחיל לממש)

### שלב 1: Backend
1. ✅ עדכון מודל `Reminder` ב-`models.py`
2. ✅ יצירת Alembic migration
3. ✅ עדכון Pydantic models ב-`main.py`
4. ✅ כתיבת `calculate_next_trigger_advanced()`
5. ✅ עדכון endpoints (create, update, check)
6. ✅ בדיקות

### שלב 2: Frontend - Types & Services
1. ✅ עדכון `services/reminders.ts` - interfaces
2. ✅ עדכון API calls

### שלב 3: Frontend - UI
1. ✅ עדכון `ReminderModal.tsx` - טופס חדש
2. ✅ יצירת קומפוננטות משנה (OneTimeForm, WeeklyForm, וכו')
3. ✅ עדכון תצוגת התראות ב-`contacts/page.tsx`
4. ✅ תרגומים ב-`i18n/he.json`

### שלב 4: בדיקות & Polish
1. ✅ בדיקות end-to-end
2. ✅ תיקון באגים
3. ✅ שיפור UX

---

## 📌 הערות חשובות

1. **תאימות לאחור:** התראות קיימות ימשיכו לעבוד (reminder_type='recurring')
2. **וולידציה:** לוודא שכל שדה נדרש לפי `reminder_type` קיים
3. **Timezone:** כל התאריכים ב-UTC עם timezone support
4. **Performance:** `check_reminders` רץ כל דקה - לוודא שהוא יעיל
5. **Notifications:** Browser Notifications API כבר עובד - רק לשפר את הטקסט

---

## ✅ סיכום

תכנית זו מספקת:
- ✅ תמיכה בהתראה חד-פעמית (תאריך ושעה)
- ✅ תמיכה בהתראה חזרתית (כל X שעות/ימים) - קיים, רק לשפר
- ✅ תמיכה בהתראה שבועית (יום/ימים קבועים)
- ✅ תמיכה בהתראה יומית (כל יום בשעה מסוימת)
- ✅ תאימות לאחור עם התראות קיימות
- ✅ UI אינטואיטיבי ונוח

**מוכן להתחיל לממש?** 🚀


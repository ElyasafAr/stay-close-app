# 🗄️ מדריך מעבר ל-PostgreSQL

## 📋 סקירה כללית

מדריך זה מסביר איך להעביר את האפליקציה מ-JSON files ל-PostgreSQL database.

---

## ✅ מה כבר מוכן

1. ✅ **Dependencies** - נוספו ל-`requirements.txt`:
   - `sqlalchemy==2.0.23`
   - `psycopg2-binary==2.9.9`
   - `alembic==1.12.1`

2. ✅ **Database Connection** - `backend/database.py`
   - חיבור ל-PostgreSQL
   - Session management
   - Auto-detect DATABASE_URL from Railway

3. ✅ **Models** - `backend/models.py`
   - User model
   - Contact model
   - Reminder model
   - Relationships between models

4. ✅ **Migration Script** - `backend/migrate_to_postgresql.py`
   - מעביר נתונים מ-JSON ל-PostgreSQL
   - בטוח - לא מוחק נתונים קיימים

---

## 🚀 שלב 1: יצירת PostgreSQL Database ב-Railway

### א. יצירת Database Service

1. היכנס ל-Railway Dashboard
2. בחר את הפרויקט שלך
3. לחץ **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway ייצור database אוטומטית

### ב. קבלת Connection String

1. לחץ על ה-PostgreSQL Service
2. עבור ל-**"Variables"** tab
3. מצא את `DATABASE_URL`
4. העתק את הערך (נראה כך: `postgresql://postgres:password@host:port/railway`)

**⚠️ חשוב:** Railway מוסיף את `DATABASE_URL` אוטומטית ל-Backend Service, אז לא צריך להעתיק ידנית!

---

## 🔧 שלב 2: עדכון Backend Service

### א. בדיקת Environment Variables

1. Backend Service → **Settings** → **Variables**
2. ודא שיש `DATABASE_URL` (Railway מוסיף אותו אוטומטית)
3. אם אין - הוסף ידנית מה-PostgreSQL Service

### ב. התקנת Dependencies

Railway יתקין אוטומטית את ה-dependencies החדשים מ-`requirements.txt` בעת ה-deploy הבא.

---

## 📦 שלב 3: הרצת Migration (מקומי)

**⚠️ הערה:** אם אין לך נתונים חשובים ב-JSON, אפשר לדלג על זה - ה-database יתחיל ריק.

### א. התקנת Dependencies מקומית

```bash
cd backend
pip install -r requirements.txt
```

### ב. הגדרת DATABASE_URL מקומית

צור `backend/.env` והוסף:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stayclose
```

או אם יש לך PostgreSQL מקומי:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stayclose
```

### ג. הרצת Migration

```bash
cd backend
python migrate_to_postgresql.py
```

הסקריפט:
- יוצר את ה-tables ב-PostgreSQL
- מעביר נתונים מ-JSON files
- לא מוחק נתונים קיימים (אם יש)

---

## 🔄 שלב 4: עדכון הקוד

**⚠️ זה השלב הבא - עדיין לא עשיתי את זה!**

צריך לעדכן:
1. `backend/main.py` - להשתמש ב-PostgreSQL במקום JSON
2. `backend/auth.py` - להשתמש ב-PostgreSQL במקום JSON

---

## 🧪 שלב 5: בדיקה

### א. בדיקה מקומית

1. הרץ את השרת: `python backend/main.py`
2. בדוק שה-tables נוצרו ב-PostgreSQL
3. נסה ליצור contact חדש
4. בדוק שהוא נשמר ב-PostgreSQL

### ב. בדיקה ב-Railway

1. דחוף את הקוד ל-GitHub
2. Railway יעשה deploy אוטומטי
3. בדוק את ה-Logs - אמור לראות:
   ```
   ✅ [DATABASE] Database tables created successfully
   ```
4. נסה ליצור contact חדש דרך האפליקציה
5. בדוק שהוא נשמר ב-PostgreSQL

---

## 📝 מה עוד צריך לעשות

### 1. עדכון main.py

צריך להחליף:
- `load_contacts_from_file()` → `get_contacts_from_db()`
- `save_contacts_to_file()` → `save_contact_to_db()`
- `contacts_db` list → PostgreSQL queries

### 2. עדכון auth.py

צריך להחליף:
- `load_users_from_file()` → `get_user_from_db()`
- `save_users_to_file()` → `save_user_to_db()`
- `users` dict → PostgreSQL queries

### 3. הוספת init_db() ל-main.py

בתחילת השרת, קרא ל-`init_db()` כדי ליצור את ה-tables.

---

## 🔍 בדיקת נתונים ב-PostgreSQL

### דרך Railway Dashboard

1. PostgreSQL Service → **"Query"** tab
2. הרץ queries:
   ```sql
   SELECT * FROM users;
   SELECT * FROM contacts;
   SELECT * FROM reminders;
   ```

### דרך psql (מקומי)

```bash
psql -h localhost -U postgres -d stayclose
```

```sql
\dt  -- רשימת tables
SELECT * FROM users;
SELECT * FROM contacts;
SELECT * FROM reminders;
```

---

## ⚠️ הערות חשובות

1. **Backup JSON Files** - לפני migration, שמור backup של:
   - `backend/contacts.json`
   - `backend/reminders.json`
   - `backend/users.json`

2. **Data Integrity** - ה-migration script לא מוחק נתונים קיימים, אבל כדאי לבדוק.

3. **Rollback** - אם משהו לא עובד, אפשר לחזור ל-JSON files (רק צריך לעדכן את הקוד בחזרה).

---

## 🎯 סיכום

✅ **מה מוכן:**
- Dependencies נוספו
- Database connection מוכן
- Models מוגדרים
- Migration script מוכן

⏳ **מה עוד צריך:**
- עדכון main.py
- עדכון auth.py
- בדיקות

---

## 📚 משאבים

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [FastAPI + SQLAlchemy Tutorial](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)





# מעבר ל-PostgreSQL - TODO

## 📝 הערה חשובה

**כרגע הנתונים נשמרים ב-JSON file (`contacts.json`)**

**בהמשך צריך לעבור ל-PostgreSQL!**

---

## 🎯 מה צריך לעשות בעתיד

### 1. התקנת ספריות
```bash
pip install sqlalchemy psycopg2-binary alembic
```

### 2. יצירת מודל SQLAlchemy
- יצירת `models.py` עם מודל Contact
- הגדרת connection ל-PostgreSQL

### 3. עדכון main.py
- החלפת `contacts_db` ב-queries ל-PostgreSQL
- הסרת שמירה ב-JSON
- הוספת migrations עם Alembic

### 4. הגדרת Database
- שימוש ב-DATABASE_URL מ-env
- חיבור ל-PostgreSQL (Railway או מקומי)

---

## 📌 זכור!

- ✅ כרגע: JSON file
- ⏳ בהמשך: PostgreSQL
- 🔗 כבר מוגדר ב-docker-compose.yml

---

## קישורים שימושיים

- PostgreSQL on Railway: https://railway.app
- SQLAlchemy docs: https://docs.sqlalchemy.org
- FastAPI + SQLAlchemy: https://fastapi.tiangolo.com/tutorial/sql-databases/


# Backend - Stay Close API

שרת Backend לאפליקציית Stay Close, בנוי עם FastAPI.

## דרישות

- **Python 3.7+** (מומלץ Python 3.11+)
- pip (מנהל חבילות Python)

## התקנה

```bash
# בדיקת גרסת Python
python3 --version  # או python --version

# בדיקת תאימות
python3 check_python.py  # או python check_python.py

# התקנת תלויות
pip3 install -r requirements.txt  # או pip install -r requirements.txt
```

## הרצה

```bash
# הרצה ישירה
python3 main.py  # או python main.py

# או עם uvicorn
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

השרת ירוץ על `http://localhost:8000`

## בדיקות

```bash
# בדיקת גרסת Python
python3 check_python.py

# הרצת בדיקות
pytest
# או
python3 -m pytest
```

## API Endpoints

- `GET /` - עמוד ראשי
- `GET /api/contacts` - קבלת כל אנשי הקשר
- `GET /api/contacts/{id}` - קבלת איש קשר ספציפי
- `POST /api/contacts` - יצירת איש קשר חדש
- `PUT /api/contacts/{id}` - עדכון איש קשר
- `DELETE /api/contacts/{id}` - מחיקת איש קשר
- `GET /api/health` - בדיקת תקינות השרת
- `POST /api/messages/generate` - יצירת הודעה עם AI

## שמירת נתונים

### כרגע: JSON File
הנתונים נשמרים בקובץ `contacts.json` בתיקיית `backend/`.

- ✅ נתונים נשמרים גם אחרי כיבוי השרת
- ✅ טעינה אוטומטית בעת הפעלת השרת
- ✅ שמירה אוטומטית בכל שינוי

### בהמשך: PostgreSQL
ראה `DATABASE_MIGRATION.md` לפרטים על מעבר ל-PostgreSQL.

## הערות

- כל הקוד כתוב ב-Python 3
- משתמש ב-type hints (Python 3.5+)
- משתמש ב-async/await (Python 3.7+)
- כל ההערות בעברית

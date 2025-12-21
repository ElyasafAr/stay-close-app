# מדריך דיפלוי - Stay Close

מדריך זה מסביר כיצד לפרוס את אפליקציית Stay Close בסביבות שונות.

## דרישות מוקדמות

- Node.js 18+ (עבור Frontend)
- **Python 3.7+ (חובה!)** - מומלץ Python 3.11+ (עבור Backend)
- PostgreSQL (אופציונלי - ניתן להשתמש ב-SQLite לבדיקות)

### בדיקת גרסת Python

```bash
python3 --version  # או python --version
```

אם הגרסה נמוכה מ-3.7, יש לעדכן את Python.

## דיפלוי מקומי

### Frontend

```bash
# התקנת תלויות
npm install

# הרצה במצב פיתוח
npm run dev

# בניית גרסת Production
npm run build

# הרצת גרסת Production
npm start
```

### Backend

```bash
cd backend

# בדיקת גרסת Python (חובה Python 3.7+)
python3 --version  # או python --version
python3 check_python.py  # או python check_python.py

# התקנת תלויות
pip3 install -r requirements.txt  # או pip install -r requirements.txt

# הרצת השרת
python3 main.py  # או python main.py

# או עם uvicorn ישירות
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# או
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**חשוב:** האפליקציה דורשת Python 3.7 או גרסה חדשה יותר. מומלץ Python 3.11+.

## דיפלוי עם Docker

### הרצה עם Docker Compose

```bash
# בנייה והרצה של כל השירותים
docker-compose up --build

# הרצה ברקע
docker-compose up -d

# עצירת השירותים
docker-compose down
```

האפליקציה תהיה זמינה ב:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

## דיפלוי ל-Production

### Vercel (Frontend)

1. התקן את Vercel CLI:
```bash
npm i -g vercel
```

2. דיפלוי:
```bash
vercel
```

3. הגדר משתני סביבה ב-Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` - כתובת ה-API

### Railway / Heroku (Backend)

#### Railway

1. התחבר ל-Railway
2. צור פרויקט חדש
3. הוסף את קובץ `backend/requirements.txt`
4. הגדר משתני סביבה:
   - `DATABASE_URL` (אם משתמשים ב-PostgreSQL)

#### Heroku

```bash
# התקן Heroku CLI
heroku login

# צור אפליקציה
cd backend
heroku create stay-close-api

# דיפלוי
git push heroku main
```

### Docker Hub

```bash
# בניית Image
docker build -t stay-close-frontend .
docker build -t stay-close-backend ./backend

# העלאה ל-Docker Hub
docker tag stay-close-frontend username/stay-close-frontend
docker tag stay-close-backend username/stay-close-backend
docker push username/stay-close-frontend
docker push username/stay-close-backend
```

## משתני סביבה

צור קובץ `.env.local` (או `.env` ב-production) עם המשתנים הבאים:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

## בדיקות לפני דיפלוי

```bash
# Frontend
npm run lint
npm test
npm run build

# Backend
cd backend

# בדיקת גרסת Python
python3 check_python.py  # או python check_python.py

# הרצת בדיקות
pytest
# או
python3 -m pytest
```

## הערות חשובות

1. **בטיחות**: ודא שכל המשתנים הרגישים נמצאים ב-Environment Variables ולא בקוד
2. **CORS**: ודא שה-CORS מוגדר נכון ב-Backend עבור הדומיין של ה-Frontend
3. **Database**: בחר מסד נתונים מתאים (PostgreSQL מומלץ ל-Production)
4. **HTTPS**: השתמש ב-HTTPS ב-Production

## תמיכה

לשאלות או בעיות, אנא פתח Issue ב-GitHub.


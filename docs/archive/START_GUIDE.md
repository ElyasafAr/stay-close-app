# מדריך הפעלה - Stay Close

## 🚀 הפעלת הפרויקט

### 1️⃣ Backend (Python/FastAPI)

**פורט:** `8000`

**הפעלה:**
```bash
cd backend
python3 main.py
```

**או עם uvicorn:**
```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**בדיקה שהשרת רץ:**
- פתח בדפדפן: http://localhost:8000
- אמור לראות: `{"message":"ברוכים הבאים ל-Stay Close API","version":"1.0.0"}`
- או: http://localhost:8000/api/health

---

### 2️⃣ Frontend (Next.js/React)

**פורט:** `3000` (או 3001, 3002 אם 3000 תפוס)

**הפעלה:**
```bash
npm run dev
```

**בדיקה שהשרת רץ:**
- פתח בדפדפן: http://localhost:3000 (או הפורט שהשרת מציג)
- אמור לראות את עמוד הבית

---

## 📋 סדר הפעלה מומלץ

### שלב 1: הפעל את הבקאנד
```bash
# טרמינל 1
cd backend
python3 main.py
```

**המתן עד שתראה:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### שלב 2: הפעל את הפרונט
```bash
# טרמינל 2 (חדש)
npm run dev
```

**המתן עד שתראה:**
```
✓ Ready in X ms
- Local: http://localhost:300X
```

### שלב 3: בדוק שהכל עובד
1. פתח http://localhost:300X (הפורט שהפרונט מציג)
2. פתח http://localhost:8000/api/health (בדיקת בקאנד)

---

## 🔍 בדיקות

### בדיקת Backend:
```bash
# בדוק שהשרת רץ
curl http://localhost:8000

# בדוק health endpoint
curl http://localhost:8000/api/health

# בדוק contacts endpoint
curl http://localhost:8000/api/contacts
```

### בדיקת Frontend:
- פתח http://localhost:300X בדפדפן
- בדוק את הקונסול (F12) - אין שגיאות
- בדוק את Network tab - בקשות ל-backend עוברות

---

## ⚙️ משתני סביבה

### Backend (.env בתיקיית backend/):
```env
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env בשורש הפרויקט):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐛 פתרון בעיות

### Backend לא עובד:
1. בדוק ש-Python 3.7+ מותקן: `python3 --version`
2. התקן תלויות: `pip3 install -r requirements.txt`
3. בדוק שהפורט 8000 פנוי

### Frontend לא עובד:
1. מחק `.next`: `Remove-Item -Recurse -Force .next`
2. התקן תלויות: `npm install`
3. הפעל מחדש: `npm run dev`

### CORS errors:
- ודא שה-backend רץ
- ודא שה-CORS מוגדר נכון ב-backend (כבר מוגדר)

---

## 📝 סיכום

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000 (או 3001/3002)
- **Backend API:** http://localhost:8000/api/*
- **Frontend App:** http://localhost:300X

**חשוב:** הפעל את הבקאנד לפני הפרונט!


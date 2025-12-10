# Stay Close - אפליקציית קרבה

> אפליקציה מודרנית לניהול קשרים וקרבה עם אנשים חשובים בחייך, עם תמיכה ב-AI ליצירת הודעות מעוצבות.

## 🚀 התחלה מהירה

### להירשם לאפליקציה:

1. פתח את האפליקציה (מקומי או ב-Railway)
2. לחץ על **"הירשם"**
3. מלא: אימייל, שם משתמש, סיסמה
4. לחץ **"הירשם"** - ותועבר אוטומטית!

📖 **מדריך מפורט:** [`REGISTRATION_GUIDE.md`](./REGISTRATION_GUIDE.md)

### Deploy ל-Railway:

📖 **מדריך מלא:** [`RAILWAY_DEPLOY.md`](./RAILWAY_DEPLOY.md)

**סיכום מהיר:**
1. דחוף את הקוד ל-Git
2. צור פרויקט ב-Railway
3. הוסף משתני סביבה
4. צור Domains
5. בדוק!

---

# Stay Close - אפליקציית קרבה

אפליקציה לניהול קשרים וקרבה עם אנשים חשובים בחייך.

## תכונות

- ✅ ממשק בעברית מלאה - כל הטקסטים, כפתורים, והודעות בעברית
- ✅ תמיכה ב-RTL (ימין לשמאל) - ממשק מלא מימין לשמאל
- ✅ מסך ראשי עם ניווט - עמוד בית עם קישורים למסכים שונים
- ✅ מסך הגדרות עם שמירה מקומית - שמירת העדפות ב-Local Storage
- ✅ ניהול אנשי קשר - יצירה, קריאה, עדכון, ומחיקה של אנשי קשר
- ✅ Backend API עם FastAPI - API מלא עם CRUD operations
- ✅ עיצוב מודרני וידידותי - UI נקי עם תמיכה ב-Dark Mode
- ✅ בדיקות - בדיקות יחידה ואינטגרציה ל-Frontend ו-Backend

## התקנה

### Frontend

```bash
npm install
npm run dev
```

האפליקציה תרוץ על `http://localhost:3000`

### Backend

```bash
cd backend

# בדיקת גרסת Python (חובה Python 3.7+)
python3 --version  # או python --version

# התקנת תלויות
pip3 install -r requirements.txt  # או pip install -r requirements.txt

# הרצת השרת
python3 main.py  # או python main.py
```

השרת ירוץ על `http://localhost:8000`

**חשוב:** האפליקציה דורשת Python 3.7 או גרסה חדשה יותר.

## מבנה הפרויקט

```
.
├── app/              # אפליקציית Next.js (דפים וקומפוננטות)
├── backend/          # שרת FastAPI
├── components/       # קומפוננטות משותפות
├── services/         # שירותים (API, וכו')
├── state/           # ניהול מצב (State Management)
└── i18n/            # קבצי תרגום
    └── he.json      # תרגומים בעברית
```

## בדיקות

### Frontend
```bash
npm test
```

### Backend
```bash
cd backend

# בדיקת גרסת Python לפני הרצת בדיקות
python3 check_python.py  # או python check_python.py

# הרצת בדיקות
pytest
# או
python3 -m pytest
```

## דיפלוי

ראה את הקובץ `DEPLOYMENT.md` למדריך מפורט על דיפלוי.

### דיפלוי מהיר עם Docker
```bash
docker-compose up --build
```

## פיתוח

הפרויקט בנוי עם:
- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: FastAPI, Python 3.11+
- **Styling**: CSS Modules
- **i18n**: מערכת תרגום מותאמת אישית
- **Testing**: Jest, React Testing Library, pytest

## מסכים זמינים

- `/` - עמוד בית
- `/contacts` - ניהול אנשי קשר
- `/settings` - הגדרות
- `/about` - אודות

## משתני סביבה

צור קובץ `.env.local` עם:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

ראה `env.example` לדוגמה.

## רישיון

MIT

## סיכום

הפרויקט הושלם בהצלחה לפי תוכנית העבודה ב-`cursor_todo_plan.md`. כל המשימות בוצעו:
- ✅ מבנה הפרויקט
- ✅ מסך ראשי
- ✅ מסך הגדרות
- ✅ לוגיקה ראשית
- ✅ בדיקות
- ✅ UI/UX עם RTL
- ✅ הכנה לדיפלוי

ראה `PROJECT_SUMMARY.md` לפרטים נוספים.


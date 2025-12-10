# 📋 מסמך העברת משמרת - Stay Close App

## 🎯 סקירה כללית

**Stay Close** היא אפליקציית ווב מודרנית בעברית לניהול קשרים אישיים וקרבה עם אנשים חשובים בחיים. האפליקציה מאפשרת למשתמשים לנהל אנשי קשר, ליצור הודעות מותאמות אישית באמצעות AI, ולהגדיר התראות תקופתיות לשליחת הודעות.

### מצב נוכחי
✅ **אפליקציה פונקציונלית ומוכנה לשימוש**
- Frontend: Next.js 14 עם TypeScript
- Backend: FastAPI (Python 3.11+)
- אחסון: JSON files (עם תכנון לעבור ל-PostgreSQL)
- אימות: JWT + Google OAuth
- AI: xAI API (Grok-4-1-fast-reasoning)

---

## 🏗️ ארכיטקטורה

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Icons**: react-icons (Material Design)
- **State Management**: React Hooks + LocalStorage
- **i18n**: Custom hook (`useTranslation`)

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Authentication**: JWT (python-jose) + Google OAuth
- **Password Hashing**: bcrypt (passlib)
- **Storage**: JSON files (contacts.json, users.json, reminders.json)
- **AI Integration**: xAI API

---

## 📁 מבנה הפרויקט

```
Stay close app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout עם Header, AuthGuard
│   ├── page.tsx                  # דף בית
│   ├── globals.css               # סגנונות גלובליים
│   ├── contacts/                 # ניהול אנשי קשר
│   ├── messages/                  # יצירת הודעות AI
│   ├── settings/                 # הגדרות
│   ├── about/                    # אודות
│   └── login/                    # התחברות/רישום
│
├── components/                   # קומפוננטות React
│   ├── Header.tsx                # Header עם תפריט משתמש
│   ├── AuthGuard.tsx             # הגנה על routes
│   ├── Loading.tsx                # Spinner טעינה
│   ├── ReminderModal.tsx         # מודל להגדרת התראות
│   └── ReminderChecker.tsx       # Background service לבדיקת התראות
│
├── services/                      # שירותי API
│   ├── api.ts                    # Generic API client
│   ├── auth.ts                   # אימות משתמשים
│   ├── contacts.ts               # ניהול אנשי קשר
│   ├── reminders.ts              # ניהול התראות
│   └── notifications.ts          # Browser Notifications API
│
├── backend/                       # FastAPI Backend
│   ├── main.py                   # Main application
│   ├── auth.py                   # לוגיקת אימות
│   ├── requirements.txt          # Python dependencies
│   ├── contacts.json             # אחסון אנשי קשר
│   ├── users.json                # אחסון משתמשים
│   └── reminders.json            # אחסון התראות
│
├── i18n/                          # תרגומים
│   ├── he.json                   # תרגומים עברית
│   └── useTranslation.ts          # Hook לתרגום
│
├── state/                         # State management
│   └── useSettings.ts            # Hook להגדרות
│
└── types/                         # TypeScript definitions
    └── google.d.ts                # Google Identity Services types
```

---

## ✨ תכונות שהושלמו

### 1. אימות משתמשים
- ✅ רישום עם שם משתמש/אימייל וסיסמה
- ✅ התחברות עם שם משתמש/סיסמה
- ✅ התחברות דרך Google OAuth
- ✅ JWT tokens לניהול סשן
- ✅ הגנה על routes (AuthGuard)
- ✅ Header עם תפריט משתמש וכפתור התנתקות

### 2. ניהול אנשי קשר
- ✅ CRUD מלא (יצירה, קריאה, עדכון, מחיקה)
- ✅ אחסון ב-JSON file (contacts.json)
- ✅ הפרדה לפי משתמש (user_id)
- ✅ UI מודרני עם כרטיסים מעוצבים
- ✅ תמיכה בשדות: שם, אימייל, טלפון, הערות

### 3. יצירת הודעות AI
- ✅ אינטגרציה עם xAI API (Grok-4-1-fast-reasoning)
- ✅ יצירת הודעות מותאמות אישית
- ✅ תמיכה בסוגי הודעות: יום הולדת, חג, בדיקה, מותאם אישית
- ✅ בחירת טון: ידידותי, פורמלי, לא פורמלי, חם
- ✅ הודעות בעברית

### 4. מערכת התראות
- ✅ הגדרת התראות תקופתיות (שעות/ימים)
- ✅ בדיקה אוטומטית כל דקה
- ✅ Browser Notifications API
- ✅ תצוגת התראות פעילות על כרטיסי אנשי קשר
- ✅ עריכה ומחיקה של התראות
- ✅ מחיקה אוטומטית של התראות בעת מחיקת איש קשר

### 5. UI/UX
- ✅ עיצוב מודרני עם צבעים פסטליים
- ✅ פינות מעוגלות מאוד
- ✅ אנימציות עדינות
- ✅ RTL מלא (עברית)
- ✅ Material Rounded icons
- ✅ Responsive design
- ✅ Header עם ניווט
- ✅ Header עם תפריט משתמש

---

## 🚀 הוראות התקנה והרצה

### דרישות מערכת
- **Node.js**: 18+ (עבור Frontend)
- **Python**: 3.11+ (עבור Backend)
- **npm** או **yarn** (עבור Frontend)
- **pip3** (עבור Backend)

### התקנת Frontend

```bash
# התקנת dependencies
npm install

# הרצת שרת פיתוח
npm run dev

# בניית production
npm run build
npm start
```

השרת רץ על: `http://localhost:3002` (או פורט אחר אם 3002 תפוס)

**הערה**: Next.js יבחר פורט אוטומטית אם 3002 תפוס. בדוק את ה-console לראות על איזה פורט הוא רץ.

### התקנת Backend

```bash
cd backend

# התקנת dependencies
pip3 install -r requirements.txt

# או באמצעות הסקריפט:
python3 quick_install.bat  # Windows
# או
bash quick_install.sh      # Linux/Mac

# הרצת השרת
python3 main.py
```

השרת רץ על: `http://localhost:8000`

### משתני סביבה

צור קובץ `.env` בתיקיית `backend/`:

```env
# API Keys
XAI_API_KEY=xai-your-api-key-here
# או (legacy)
GROQ_API_KEY=your-groq-key-here

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production

# Frontend URL (לצורך CORS)
FRONTEND_URL=http://localhost:3002

# Port (אופציונלי, ברירת מחדל 8000)
PORT=8000
```

צור קובץ `.env.local` בשורש הפרויקט (עבור Frontend):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 🔑 נקודות חשובות

### 1. אחסון נתונים
- **נוכחי**: JSON files (`contacts.json`, `users.json`, `reminders.json`)
- **תכנון עתידי**: PostgreSQL (ראה `backend/DATABASE_MIGRATION.md`)
- **מיקום**: תיקיית `backend/`
- **פורמט**: UTF-8 עם JSON formatting

### 2. אימות
- **JWT Tokens**: נשמרים ב-`localStorage` כ-`auth_token`
- **User Data**: נשמר ב-`localStorage` כ-`user`
- **Token Expiry**: 30 ימים
- **Secret Key**: חייב להיות מוגדר ב-`.env` (JWT_SECRET_KEY)

### 3. API Endpoints

#### Contacts
- `GET /api/contacts` - רשימת אנשי קשר
- `GET /api/contacts/{id}` - איש קשר ספציפי
- `POST /api/contacts` - יצירת איש קשר
- `PUT /api/contacts/{id}` - עדכון איש קשר
- `DELETE /api/contacts/{id}` - מחיקת איש קשר

#### Reminders
- `GET /api/reminders` - רשימת התראות
- `GET /api/reminders/{id}` - התראה ספציפית
- `POST /api/reminders` - יצירת התראה
- `PUT /api/reminders/{id}` - עדכון התראה
- `DELETE /api/reminders/{id}` - מחיקת התראה
- `GET /api/reminders/check` - בדיקת התראות שצריכות להתפעל

#### Messages
- `POST /api/messages/generate` - יצירת הודעה AI

#### Auth
- `POST /api/auth/register` - רישום
- `POST /api/auth/login` - התחברות
- `POST /api/auth/google` - התחברות Google
- `GET /api/auth/me` - פרטי משתמש נוכחי

### 4. AI Integration
- **Provider**: xAI (api.x.ai)
- **Model**: `grok-4-1-fast-reasoning`
- **API Key**: `XAI_API_KEY` ב-`.env`
- **Fallback**: `GROQ_API_KEY` (legacy support)
- **Endpoint**: `https://api.x.ai/v1/chat/completions`
- **Temperature**: 0.7
- **Max Tokens**: 500

### 5. התראות
- **בדיקה**: כל 60 שניות (1 דקה)
- **Browser Notifications**: דורש הרשאה מהמשתמש
- **חישוב זמן הבא**: אוטומטי לפי `interval_type` ו-`interval_value`
- **עדכון**: `last_triggered` ו-`next_trigger` מתעדכנים אוטומטית

---

## ⚠️ בעיות ידועות והערות

### 1. אחסון נתונים
- ⚠️ **JSON files לא מתאימים ל-production** - צריך לעבור ל-PostgreSQL
- ⚠️ **אין גיבוי אוטומטי** - צריך להוסיף backup mechanism
- ⚠️ **Race conditions** - אפשריים בעת כתיבה מרובת משתמשים

### 2. ביצועים
- ✅ שופר לאחרונה: `router.replace` במקום `router.push` + `refresh`
- ✅ AuthGuard מותאם לביצועים
- ⚠️ בדיקת התראות כל דקה - יכול להיות כבד עם הרבה התראות

### 3. אבטחה
- ⚠️ **JWT_SECRET_KEY** - חייב להיות חזק ב-production
- ⚠️ **CORS** - מוגדר ל-localhost, צריך לעדכן ל-production
- ⚠️ **Password Hashing** - משתמש ב-bcrypt (טוב)

### 4. Google OAuth
- ⚠️ דורש הגדרת Google Client ID
- ⚠️ צריך להגדיר redirect URIs ב-Google Console
- ⚠️ משתמש ב-Google Identity Services (GSI) בצד הלקוח
- **Setup**: 
  1. צור project ב-Google Cloud Console
  2. הפעל Google+ API
  3. צור OAuth 2.0 Client ID
  4. הוסף `http://localhost:3002` ל-authorized JavaScript origins
  5. הוסף את ה-Client ID ל-`.env.local` כ-`NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 5. Browser Notifications
- ⚠️ דורש HTTPS ב-production (או localhost)
- ⚠️ לא כל הדפדפנים תומכים
- ⚠️ המשתמש צריך לאשר הרשאה
- ✅ מוגדר ב-`ReminderChecker` component
- ✅ נבדק כל 60 שניות

---

## 🔮 כיווני פיתוח עתידיים

### קצר טווח
1. **מעבר ל-PostgreSQL** - ראה `backend/DATABASE_MIGRATION.md`
2. **שיפור UI של התראות** - רשימת התראות פעילות
3. **היסטוריית הודעות** - שמירת הודעות שנשלחו
4. **תבניות הודעות** - שמירת תבניות מותאמות אישית

### בינוני טווח
1. **שליחת הודעות אמיתית** - אינטגרציה עם Email/SMS
2. **לוח שנה** - תצוגת אירועים ותאריכים חשובים
3. **סטטיסטיקות** - מעקב אחר תדירות קשר
4. **ייצוא/ייבוא** - גיבוי נתונים

### ארוך טווח
1. **אפליקציית מובייל** - React Native או PWA
2. **שיתוף** - אפשרות לשתף אנשי קשר בין משתמשים
3. **קבוצות** - ארגון אנשי קשר בקבוצות
4. **אינטגרציות** - WhatsApp, Telegram, וכו'

---

## 📚 קבצים חשובים לקריאה

1. **`cursor_todo_plan.md`** - התוכנית המקורית
2. **`backend/DATABASE_MIGRATION.md`** - תכנון מעבר ל-PostgreSQL
3. **`backend/README.md`** - הוראות Backend
4. **`RAILWAY_DEPLOY.md`** - הוראות deployment ל-Railway
5. **`REGISTRATION_GUIDE.md`** - הוראות רישום
6. **`QUICK_START.md`** - התחלה מהירה

---

## 🛠️ כלים וטכנולוגיות

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling
- **react-icons** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **python-jose** - JWT handling
- **passlib[bcrypt]** - Password hashing
- **requests** - HTTP client
- **python-dotenv** - Environment variables

### Development
- **npm** - Package manager
- **pip3** - Python package manager
- **Git** - Version control

---

## 📝 הערות פיתוח

### סגנון קוד
- **Frontend**: TypeScript עם strict mode
- **Backend**: Python 3.11+ עם type hints
- **Naming**: עברית ב-UI, אנגלית בקוד
- **Comments**: בעברית

### Git Workflow
- Main branch: `main` או `master`
- Commits: בעברית או אנגלית (לא עקבי)
- אין branches מיוחדים כרגע

### Testing
- ⚠️ **אין tests כרגע** - צריך להוסיף
- Backend: pytest (מוכן אבל לא מיושם)
- Frontend: Jest + React Testing Library (מוכן אבל לא מיושם)

---

## 🔐 אבטחה

### מה מוגן
- ✅ Passwords hashed עם bcrypt
- ✅ JWT tokens עם expiry
- ✅ CORS מוגדר
- ✅ User data separation (user_id)

### מה צריך לשפר
- ⚠️ Rate limiting
- ⚠️ Input validation חזק יותר
- ⚠️ SQL injection protection (כשעוברים ל-PostgreSQL)
- ⚠️ XSS protection
- ⚠️ CSRF protection

---

## 📞 תמיכה וסיוע

### בעיות נפוצות
1. **Backend לא עולה**: בדוק Python version (צריך 3.11+)
2. **Frontend לא קומפל**: מחק `.next` ו-`node_modules` והתקן מחדש
3. **API errors**: בדוק ש-`.env` קיים ומוגדר נכון
4. **CORS errors**: בדוק ש-`FRONTEND_URL` מוגדר ב-backend

### לוגים
- **Backend**: מודפסים ל-console
- **Frontend**: בrowser console (F12)
- **אין logging system** - צריך להוסיף

---

## 🎨 עיצוב

### צבעים
- Primary: `#a8d5e2` (כחול פסטלי)
- Secondary: `#f4a5ae` (ורוד פסטלי)
- Accent: `#ffd6a5` (כתום פסטלי)
- Success: `#a8e6cf` (ירוק פסטלי)
- Error: `#ff9a9e` (אדום פסטלי)

### טיפוגרפיה
- **Font**: Nunito (מ-Google Fonts)
- **Fallbacks**: Segoe UI, Arial Hebrew, David
- **Direction**: RTL

### Spacing
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px

### Border Radius
- **Small**: 12px
- **Medium**: 20px
- **Large**: 28px
- **Full**: 9999px

---

## 📦 Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^5.5.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

### Backend (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic[email]==2.5.0
python-multipart==0.0.6
pytest==7.4.3
httpx==0.25.2
requests==2.31.0
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
authlib==1.3.0
cryptography
bcrypt
email-validator
```

---

## 🚢 Deployment

### Railway (מוכן)
- ראה `RAILWAY_DEPLOY.md`
- יש `railway.json` files
- דורש הגדרת environment variables

### Manual
- Frontend: `npm run build` + `npm start`
- Backend: `python3 main.py` (או עם uvicorn)

---

## ✅ Checklist לפני המשך פיתוח

- [ ] בדוק שהכל עובד (frontend + backend)
- [ ] בדוק environment variables
- [ ] קרא את כל ה-MD files
- [ ] הבן את מבנה הנתונים (JSON)
- [ ] הבן את מערכת האימות
- [ ] בדוק את ה-API endpoints
- [ ] הבן את מערכת ההתראות
- [ ] בדוק את ה-AI integration

---

## 📝 סיכום

האפליקציה **פונקציונלית ומוכנה לשימוש**, עם:
- ✅ אימות משתמשים מלא
- ✅ ניהול אנשי קשר
- ✅ יצירת הודעות AI
- ✅ מערכת התראות
- ✅ UI מודרני ונוח

**הדבר החשוב ביותר**: האפליקציה משתמשת ב-JSON files לאחסון, וצריך לתכנן מעבר ל-PostgreSQL לפני deployment ל-production.

**הדבר השני הכי חשוב**: כל הקוד בעברית (UI, הודעות, comments), אבל שמות משתנים ופונקציות באנגלית.

**הדבר השלישי הכי חשוב**: כל ה-API calls דורשים JWT token ב-Header (אוטומטי דרך `services/api.ts`).

**בהצלחה! 🚀**

---

## 📎 קבצים נוספים לקריאה

- `HANDOFF_DOCUMENT.md` - המסמך הזה
- `cursor_todo_plan.md` - התוכנית המקורית
- `backend/DATABASE_MIGRATION.md` - תכנון מעבר ל-PostgreSQL
- `RAILWAY_DEPLOY.md` - הוראות deployment
- `REGISTRATION_GUIDE.md` - הוראות רישום
- `QUICK_START.md` - התחלה מהירה
- `TROUBLESHOOTING.md` - פתרון בעיות
- `env.example` - דוגמה למשתני סביבה

---

*מסמך זה נוצר ב-2024*


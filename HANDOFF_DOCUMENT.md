# 📋 מסמך העברת משמרת - Stay Close App

**תאריך:** 2025-12-11  
**סטטוס:** פרויקט פעיל - דורש המשך עבודה

---

## 🚨 בעיות דחופות - לטפל מיד!

### 1. **דפלוי נכשל - קבצים חסרים (דחוף!)**
**שגיאה:**
```
Module not found: Can't resolve '@/i18n/useTranslation'
Module not found: Can't resolve '@/services/contacts'
Module not found: Can't resolve '@/services/reminders'
Module not found: Can't resolve '@/components/Loading'
```

**סטטוס:** הקבצים קיימים מקומית ונמצאים ב-Git (אומת), אבל לא נכללים ב-build ב-Railway.

**פתרונות אפשריים (לנסות לפי סדר):**

1. **לבדוק את `.dockerignore`** ✅ נבדק - לא חוסם את הקבצים
   - הקבצים `i18n/`, `services/`, `components/` לא מופיעים ב-`.dockerignore`

2. **לוודא שהקבצים ב-Git:** ✅ נבדק - הקבצים נמצאים ב-Git
   ```powershell
   git ls-files i18n/useTranslation.ts services/contacts.ts services/reminders.ts components/Loading.tsx
   ```

3. **לבדוק את `tsconfig.json`:**
   - לוודא שיש `"baseUrl": "."` ב-`compilerOptions` ✅ קיים

4. **לבדוק את `next.config.js`:**
   - לוודא שאין הגדרות שמונעות את הקבצים

5. **לנסות לעלות מחדש עם force:**
   ```powershell
   # עדכן את push_to_git.ps1:
   $commitMessage = "Fix: Ensure all frontend files are included in build"
   # הרץ:
   .\push_to_git.ps1
   ```

6. **אם לא עובד - לבדוק את Railway build logs:**
   - אולי יש בעיה עם ה-build process
   - לבדוק אם Next.js מוצא את הקבצים בזמן build
   - לבדוק אם יש שגיאות TypeScript לפני ה-build

**הערה חשובה:** הקבצים נמצאים ב-Git ונמצאים מקומית, אבל Next.js לא מוצא אותם ב-build. זה יכול להיות:
- בעיה עם ה-build cache ב-Railway
- בעיה עם איך ש-Nixpacks בונה את הפרויקט
- צריך לנסות `npm run build` מקומית ולראות אם זה עובד

---

## 🐍 Python 3 - חשוב מאוד!

**הפרויקט משתמש ב-Python 3 בלבד!**

- **Backend:** Python 3.x
- **Dependencies:** `requirements.txt` ב-`backend/`
- **Database:** PostgreSQL עם SQLAlchemy
- **Authentication:** JWT + Firebase

**קבצים חשובים:**
- `backend/main.py` - FastAPI application
- `backend/auth.py` - Authentication logic
- `backend/database.py` - Database setup
- `backend/models.py` - SQLAlchemy models

---

## 📝 העלאה לגיט - PowerShell Script

**חשוב מאוד:** המשתמש מעדיף להשתמש בסקריפט PowerShell להעלאה לגיט!

### שימוש:
```powershell
.\push_to_git.ps1
```

### הסקריפט:
- **מיקום:** `push_to_git.ps1` (בשורש הפרויקט)
- **תפקיד:** מוסיף קבצים, עושה commit, ודוחף ל-Git
- **עדכון:** צריך לעדכן את `$commitMessage` בכל פעם

### איך לעדכן:
1. פתח את `push_to_git.ps1`
2. עדכן את `$commitMessage` בשורה ~20
3. הרץ: `.\push_to_git.ps1`

**דוגמה:**
```powershell
$commitMessage = "Fix: Add missing files to build"
```

---

## ✅ TODO - משימות שנותרו

### 1. 🚨 דפלוי נכשל - קבצים חסרים (דחוף ביותר!)
**ראה למעלה בפרק "בעיות דחופות"**

### 2. 🔔 התראות - תכנון מחדש (דחוף!)
**סטטוס:** ⏳ ממתין  
**תיאור:** כל עניין ההתראות צריך לתכנן מחדש - תאריכים, אפשרות לסקג'ולר שבועי ויומי. כרגע ההתראות לא עובדות בכלל!

**פעולות נדרשות:**
- לבדוק את `components/ReminderModal.tsx` - טופס יצירת התראות
- לבדוק את `components/ReminderChecker.tsx` - בדיקת התראות
- לבדוק את `backend/main.py` - endpoint של `check_reminders`
- להוסיף אפשרות לבחירת תאריך ספציפי
- להוסיף אפשרות לסקג'ולר שבועי (יום בשבוע קבוע)
- להוסיף אפשרות לסקג'ולר יומי (כל יום באותה שעה)
- לוודא שההתראות עובדות בפועל (Browser Notifications API)

**קבצים רלוונטיים:**
- `components/ReminderModal.tsx`
- `components/ReminderChecker.tsx`
- `backend/main.py` - endpoints `/api/reminders/*`
- `backend/models.py` - מודל `Reminder`
- `services/reminders.ts` - API calls

---

### 3. 🔐 הצפנת מסד הנתונים
**סטטוס:** ⏳ ממתין  
**תיאור:** הצפנת מסד הנתונים לגמרי - מיילים מוצפנים, שמות של אנשי קשר ופרטים מוצפנים וכו'

**פעולות נדרשות:**
- לבחור שיטת הצפנה (AES-256, Fernet, וכו')
- להצפין שדות רגישים לפני שמירה ב-PostgreSQL:
  - מיילים
  - שמות אנשי קשר
  - פרטים נוספים
- ליצור key management system (שמירת מפתחות הצפנה)
- לעדכן את `backend/models.py` ו-`backend/main.py`
- לוודא שההצפנה/פענוח עובדים נכון

**קבצים רלוונטיים:**
- `backend/models.py` - מודלים
- `backend/main.py` - endpoints
- `backend/database.py` - database setup

---

### 4. 📲 הפיכה לאפליקציית אנדרואיד
**סטטוס:** ⏳ ממתין  
**תיאור:** הפיכת הכל לאפליקצייה בחנות אנדרואיד - לבדוק האם יש דרך לעשות את זה כ-WEB APP (PWA) או צריך Native

**פעולות נדרשות:**
- לבדוק אפשרות PWA (Progressive Web App):
  - להוסיף `manifest.json`
  - להוסיף Service Worker
  - לוודא שהאפליקציה עובדת offline
- לבדוק אפשרות Native עם React Native או Capacitor
- לבדוק דרישות Google Play Store
- להחליט על הגישה הטובה ביותר (PWA vs Native)

**קבצים רלוונטיים:**
- `next.config.js` - Next.js config
- `package.json` - dependencies
- `public/` - static files (אם קיים)

---

## 📁 מבנה הפרויקט

```
Stay close app/
├── app/                    # Next.js pages (App Router)
│   ├── about/              # דף אודות
│   ├── contacts/           # דף אנשי קשר
│   ├── login/              # דף התחברות
│   ├── messages/           # דף הודעות
│   ├── settings/           # דף הגדרות
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # דף בית
├── backend/                # FastAPI backend
│   ├── main.py             # FastAPI app + endpoints
│   ├── auth.py             # Authentication
│   ├── database.py         # Database setup
│   ├── models.py           # SQLAlchemy models
│   └── requirements.txt    # Python dependencies
├── components/             # React components
│   ├── AuthGuard.tsx       # Route protection
│   ├── Header.tsx          # Navigation header
│   ├── Loading.tsx         # Loading component
│   ├── ReminderChecker.tsx # Reminder checking
│   └── ReminderModal.tsx   # Reminder form
├── services/               # API services
│   ├── api.ts              # Base API utility
│   ├── auth.ts             # Authentication
│   ├── contacts.ts          # Contacts API
│   ├── messages.ts          # Messages API
│   └── reminders.ts        # Reminders API
├── i18n/                   # Translations
│   ├── he.json             # Hebrew translations
│   └── useTranslation.ts   # Translation hook
├── state/                  # State management
│   └── useSettings.ts      # Settings hook
├── push_to_git.ps1         # Git push script (חשוב!)
└── tsconfig.json           # TypeScript config
```

---

## 🔧 טכנולוגיות

### Frontend:
- **Next.js 14.2.33** (App Router)
- **React** (TypeScript)
- **CSS Modules**
- **Firebase Auth** (Google login)

### Backend:
- **FastAPI** (Python 3)
- **PostgreSQL** (SQLAlchemy)
- **JWT** (Authentication)
- **bcrypt** (Password hashing)

### Database:
- **PostgreSQL** (Railway)
- **SQLAlchemy ORM**
- **Alembic** (Migrations)

---

## 🌐 Deployment - Railway

### Frontend:
- **URL:** `stay-close-app-front-production.up.railway.app`
- **Build:** Next.js production build
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` - Backend URL (חשוב!)

### Backend:
- **URL:** (בדוק ב-Railway)
- **Database:** PostgreSQL (Railway)
- **Environment Variables:**
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET` - JWT secret key
  - `XAI_API_KEY` - xAI API key for message generation

---

## 🐛 בעיות ידועות

1. **דפלוי נכשל** - קבצים חסרים ב-build (ראה למעלה)
2. **התראות לא עובדות** - צריך תכנון מחדש מלא
3. **שפה** - אין תמיכה באנגלית (הוסרה מהגדרות)

---

## ✅ מה עובד

1. ✅ **התחברות/הרשמה** - עובד (JWT + Firebase)
2. ✅ **אנשי קשר** - עובד (PostgreSQL)
3. ✅ **הודעות** - עובד (xAI API)
4. ✅ **Dark/Light theme** - עובד
5. ✅ **Mobile navigation** - עובד (hamburger menu)
6. ✅ **הגדרות** - עובד (theme, notifications)

---

## 📝 הערות חשובות

1. **Python 3 בלבד!** - לא להשתמש ב-Python 2
2. **PowerShell Scripts** - המשתמש מעדיף PowerShell על פני Git ישיר
3. **RTL** - האפליקציה בעברית, RTL מלא
4. **Railway Deployment** - אוטומטי מ-GitHub
5. **Database** - PostgreSQL (לא JSON files יותר!)

---

## 🔗 קבצים חשובים

- `push_to_git.ps1` - **השתמש בזה להעלאה לגיט!**
- `TODO.md` - רשימת משימות
- `backend/requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies
- `tsconfig.json` - TypeScript config (יש `baseUrl: "."`)

---

## 🚀 התחלה מהירה

1. **לבדוק דפלוי:**
   ```powershell
   .\check_deployment_status.ps1
   ```

2. **להעלות שינויים:**
   ```powershell
   .\push_to_git.ps1
   ```

3. **לבדוק Railway:**
   ```powershell
   .\check_railway_deploy.ps1
   ```

---

**בהצלחה! 🍀**

# 🚂 העלאה ל-Railway - צעד אחר צעד

תוכנית עבודה מסודרת להעלאת האפליקציה ל-Railway.

---

## 📋 סקירה כללית

**מה צריך לעשות:**
1. ✅ **Backend** - FastAPI (Python)
2. ✅ **Frontend** - Next.js (Node.js)
3. ✅ **Database** - PostgreSQL (ב-Railway)
4. ✅ **Firebase** - Authentication

**סדר העבודה:**
1. Backend קודם (כי Frontend תלוי בו)
2. Frontend אחר כך
3. Database בסוף

---

## 🎯 שלב 1: יצירת פרויקט ב-Railway

### 1.1 התחברות
1. היכנס ל-[Railway](https://railway.app)
2. לחץ **"Login"** → **"Login with GitHub"**
3. אפשר גישה ל-repositories

### 1.2 יצירת פרויקט
1. לחץ **"New Project"**
2. בחר **"Deploy from GitHub repo"**
3. בחר: `ElyasafAr/stay-close-app`
4. Railway יזהה את ה-repo

**⚠️ חשוב:** Railway **לא** יזהה אוטומטית 2 services! צריך ליצור אותם ידנית.

---

## 🔧 שלב 2: יצירת Backend Service

### 2.1 יצירת Service
1. בפרויקט החדש, לחץ **"+ New"**
2. בחר **"GitHub Repo"** (או **"Empty Service"**)
3. אם בחרת GitHub Repo, בחר שוב את `stay-close-app`
4. אם בחרת Empty Service, לחץ **"Settings"** → **"Connect Repo"** → בחר את `stay-close-app`

### 2.2 הגדרת Backend
1. לחץ על ה-Service שיצרת
2. עבור ל-**"Settings"** (⚙️)
3. הגדר:
   - **Name:** `backend` (או `stay-close-backend`)
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.3 Environment Variables - Backend
עבור ל-**"Variables"** והוסף:

```env
# API Keys
XAI_API_KEY=xai-your-key-here

# JWT
JWT_SECRET_KEY=your-very-long-secret-key-min-32-chars

# Firebase (Service Account Key - JSON)
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"..."}

# Frontend URL (יעודכן אחרי יצירת Frontend Domain)
FRONTEND_URL=https://your-frontend.railway.app
```

**📝 הערה:** `FRONTEND_URL` יעודכן אחרי שלב 4.

### 2.4 בדיקת Backend
1. לחץ **"Deploy"** (או Railway יפתח אוטומטית)
2. חכה שהבנייה מסתיימת (Build)
3. עבור ל-**"Settings"** → **"Domains"**
4. לחץ **"Generate Domain"**
5. העתק את ה-URL (לדוגמה: `backend-production.up.railway.app`)
6. פתח: `https://your-backend-url.railway.app/api/health`
7. צריך לראות: `{"status": "healthy", ...}`

**✅ אם זה עובד - מעבר לשלב 3!**

---

## 🎨 שלב 3: יצירת Frontend Service

### 3.1 יצירת Service
1. בפרויקט, לחץ **"+ New"** שוב
2. בחר **"GitHub Repo"** (או **"Empty Service"**)
3. בחר את `stay-close-app` (אותו repo!)

### 3.2 הגדרת Frontend
1. לחץ על ה-Service החדש
2. עבור ל-**"Settings"** (⚙️)
3. הגדר:
   - **Name:** `frontend` (או `stay-close-frontend`)
   - **Root Directory:** `.` (שורש הפרויקט)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### 3.3 Environment Variables - Frontend
עבור ל-**"Variables"** והוסף:

```env
# Firebase Config (6 משתנים)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend URL (מה-URL שיצרת בשלב 2.4)
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app

# Node Environment
NODE_ENV=production
```

### 3.4 יצירת Domain ל-Frontend
1. **"Settings"** → **"Domains"**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `frontend-production.up.railway.app`)

### 3.5 עדכון Backend Variables
1. חזור ל-**Backend Service**
2. **"Variables"** → עדכן:
   ```env
   FRONTEND_URL=https://your-frontend-url.railway.app
   ```
3. Railway יעשה Redeploy אוטומטית

### 3.6 עדכון Firebase
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. לחץ **"Add domain"**
3. הוסף: `your-frontend-url.railway.app` (ללא `https://`)
4. לחץ **"Add"**

### 3.7 בדיקת Frontend
1. פתח: `https://your-frontend-url.railway.app`
2. צריך לראות: דף התחברות
3. נסה "התחבר עם Google" - צריך לעבוד!

**✅ אם זה עובד - מעבר לשלב 4!**

---

## 🗄️ שלב 4: חיבור ל-PostgreSQL

### 4.1 יצירת Database
1. בפרויקט, לחץ **"+ New"**
2. בחר **"Database"** → **"Add PostgreSQL"**
3. Railway ייצור Database אוטומטית

### 4.2 קבלת Connection String
1. לחץ על ה-Database Service
2. עבור ל-**"Variables"**
3. מצא: `DATABASE_URL` (או `POSTGRES_URL`)
4. העתק את ה-URL המלא

### 4.3 עדכון Backend
1. חזור ל-**Backend Service**
2. **"Variables"** → הוסף:
   ```env
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```
3. העתק את ה-URL מה-Database Service

### 4.4 עדכון קוד Backend
**צריך לעדכן את `backend/main.py` לחיבור ל-PostgreSQL במקום JSON.**

(זה ייעשה בשלב הבא - עכשיו רק הוספנו את ה-Variable)

---

## ✅ בדיקות סופיות

### Backend
- [ ] `https://backend-url/api/health` → `{"status": "healthy"}`
- [ ] `https://backend-url/api/auth/register` → עובד

### Frontend
- [ ] `https://frontend-url` → נטען
- [ ] התחברות עם Google → עובד
- [ ] התחברות עם username/password → עובד

### Database
- [ ] Backend מתחבר ל-Database
- [ ] משתמשים נשמרים ב-Database

---

## 📚 קבצים עזר

- `FIREBASE_SETUP.md` - איך להגדיר Firebase
- `env.example` - כל ה-Variables הנדרשים
- `COMPLETE_DEPLOYMENT_GUIDE.md` - מדריך מלא

---

**מוכן להתחיל! 🚀**

אם יש בעיה בשלב כלשהו - תגיד לי ואני אעזור!


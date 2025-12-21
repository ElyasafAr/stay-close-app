# 🚂 השלבים הבאים - Railway Deployment

הקוד כבר ב-GitHub! עכשיו בואו נעלה ל-Railway.

---

## 📋 מה צריך לפני שמתחילים

### ✅ כבר יש:
- [x] קוד ב-GitHub
- [x] Firebase project (אם כבר הגדרת)
- [x] xAI API Key

### ⚠️ צריך להכין:
- [ ] Firebase Config (6 משתנים) - אם עדיין לא
- [ ] Firebase Service Account Key (JSON) - אם עדיין לא
- [ ] JWT Secret Key (צור אחד חדש)

---

## 🚀 שלב 1: התחברות ל-Railway

1. היכנס ל-[Railway](https://railway.app)
2. לחץ **"Login"** והתחבר עם **GitHub**
3. אפשר גישה ל-repositories שלך

---

## 🚀 שלב 2: יצירת פרויקט

1. לחץ **"New Project"**
2. בחר **"Deploy from GitHub repo"**
3. בחר את ה-repository: `ElyasafAr/stay-close-app`
4. Railway יזהה אוטומטית ויצור 2 Services:
   - **Backend** (Python/FastAPI)
   - **Frontend** (Next.js)

---

## ⚙️ שלב 3: הגדרת Backend Service

### 3.1 Settings
1. לחץ על **Backend Service**
2. עבור ל-**Settings**:
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3.2 Environment Variables
עבור ל-**Variables** והוסף:

```env
XAI_API_KEY=xai-your-api-key-here
JWT_SECRET_KEY=your-very-secret-jwt-key-min-32-chars-long
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account",...}
FRONTEND_URL=https://your-frontend.railway.app
```

**📝 הערה:** `FRONTEND_URL` יעודכן אחרי יצירת Domain.

---

## ⚙️ שלב 4: הגדרת Frontend Service

### 4.1 Settings
1. לחץ על **Frontend Service**
2. עבור ל-**Settings**:
   - **Root Directory:** `.` (שורש)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### 4.2 Environment Variables
עבור ל-**Variables** והוסף:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

**📝 הערה:** `NEXT_PUBLIC_API_URL` יעודכן אחרי יצירת Domain.

---

## 🌐 שלב 5: יצירת Domains

### 5.1 Backend Domain
1. Backend Service → **Settings** → **Domains**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `stay-close-backend.up.railway.app`)

### 5.2 Frontend Domain
1. Frontend Service → **Settings** → **Domains**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `stay-close-frontend.up.railway.app`)

### 5.3 עדכון Variables
**ב-Backend:**
- עדכן: `FRONTEND_URL=https://stay-close-frontend.up.railway.app`

**ב-Frontend:**
- עדכן: `NEXT_PUBLIC_API_URL=https://stay-close-backend.up.railway.app`

---

## 🔥 שלב 6: הוספת Domain ל-Firebase

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. לחץ **"Add domain"**
3. הוסף: `stay-close-frontend.up.railway.app` (ללא `https://`)
4. לחץ **"Add"**

---

## ✅ שלב 7: בדיקות

### בדיקת Backend
פתח: `https://your-backend.railway.app/api/health`
צריך לראות: `{"status": "healthy", ...}`

### בדיקת Frontend
פתח: `https://your-frontend.railway.app`
צריך לראות: דף התחברות

### בדיקת Authentication
לחץ "התחבר עם Google" - צריך לעבוד!

---

## 📚 מסמכים נוספים

- `RAILWAY_DEPLOY_STEPS.md` - מדריך מפורט מאוד
- `COMPLETE_DEPLOYMENT_GUIDE.md` - מדריך מלא
- `FIREBASE_SETUP.md` - הגדרת Firebase
- `DEPLOYMENT_CHECKLIST.md` - רשימת בדיקה

---

**מוכן להתחיל! 🚀**

אם יש לך שאלות במהלך התהליך, אני כאן לעזור!


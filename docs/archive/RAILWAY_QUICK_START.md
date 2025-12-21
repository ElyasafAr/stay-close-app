# 🚀 Quick Start - העלאה ל-Railway

מדריך מהיר וקצר להעלאת האפליקציה ל-Railway.

## ✅ לפני שמתחילים - Checklist

- [ ] הקוד ב-Git (GitHub/GitLab/Bitbucket)
- [ ] יש לך חשבון Railway (https://railway.app)
- [ ] יש לך Firebase project מוגדר (ראה `FIREBASE_SETUP.md`)
- [ ] יש לך xAI API Key
- [ ] יש לך Firebase Service Account Key (JSON)

---

## 🚀 שלבים מהירים

### 1. הכנת Git

```bash
# בדוק סטטוס
git status

# אם יש שינויים
git add .
git commit -m "Prepare for Railway deployment"
git push
```

### 2. יצירת פרויקט ב-Railway

1. היכנס ל-[Railway](https://railway.app)
2. לחץ **"New Project"**
3. בחר **"Deploy from GitHub repo"**
4. בחר את ה-repository שלך
5. Railway יזהה אוטומטית 2 services (Frontend + Backend)

### 3. הגדרת Backend Service

**Settings:**
- Root Directory: `backend`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Variables (חובה!):**
```env
XAI_API_KEY=your_xai_api_key_here
JWT_SECRET_KEY=your-very-secret-jwt-key-min-32-chars-long
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account",...}
FRONTEND_URL=https://your-frontend.railway.app
```

**📝 הערה:** `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` - העתק את כל התוכן של קובץ ה-JSON מ-Firebase (בשורה אחת).

### 4. הגדרת Frontend Service

**Settings:**
- Root Directory: `.` (שורש)
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Variables (חובה!):**
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

### 5. יצירת Domains

**Backend:**
1. Backend Service → Settings → Domains → Generate Domain
2. העתק את ה-URL (לדוגמה: `stay-close-backend.up.railway.app`)

**Frontend:**
1. Frontend Service → Settings → Domains → Generate Domain
2. העתק את ה-URL (לדוגמה: `stay-close-frontend.up.railway.app`)

### 6. עדכון Variables עם Domains

**ב-Backend:**
- עדכן: `FRONTEND_URL=https://stay-close-frontend.up.railway.app`

**ב-Frontend:**
- עדכן: `NEXT_PUBLIC_API_URL=https://stay-close-backend.up.railway.app`

### 7. הוספת Domain ל-Firebase

1. Firebase Console → Authentication → Settings → Authorized domains
2. לחץ **"Add domain"**
3. הוסף: `stay-close-frontend.up.railway.app` (או הדומיין שלך)
4. לחץ **"Add"**

### 8. בדיקה

1. פתח: `https://your-backend.railway.app/` - צריך לראות JSON response
2. פתח: `https://your-frontend.railway.app` - צריך לראות דף התחברות
3. לחץ **"התחבר עם Google"** - צריך לעבוד!

---

## 🔑 יצירת JWT Secret Key

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
-New-Guid | ForEach-Object { $_.ToString().Replace('-', '') + (Get-Random -Minimum 100000 -Maximum 999999) }
```

או השתמש ב-[RandomKeygen](https://randomkeygen.com/) - בחר "CodeIgniter Encryption Keys"

---

## 🐛 בעיות נפוצות

### Backend לא עולה
- בדוק Logs ב-Railway
- ודא שכל ה-Variables מוגדרים
- ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON` תקין (כל ה-JSON בשורה אחת)

### Frontend לא נבנה
- בדוק Logs ב-Railway
- ודא שכל ה-`NEXT_PUBLIC_FIREBASE_*` מוגדרים
- ודא ש-`NEXT_PUBLIC_API_URL` תקין

### "Domain not authorized" ב-Firebase
- ודא שהוספת את הדומיין ל-Firebase Console
- נסה לרענן את הדף

---

## 📚 מסמכים נוספים

- `COMPLETE_DEPLOYMENT_GUIDE.md` - מדריך מפורט מאוד
- `FIREBASE_SETUP.md` - הגדרת Firebase
- `RAILWAY_DEPLOY.md` - מדריך Railway מפורט

---

**בהצלחה! 🎉**


# ✅ Deployment Checklist - Railway

רשימת בדיקה מהירה לפני העלאה ל-Railway.

## 📋 לפני Deploy

### 1. Git Repository
- [ ] הפרויקט ב-Git (GitHub/GitLab/Bitbucket)
- [ ] כל השינויים commit
- [ ] כל השינויים push
- [ ] אין קבצים רגישים ב-Git (.env, serviceAccountKey.json)

### 2. Firebase Setup
- [ ] Firebase project נוצר
- [ ] Google Authentication מופעל
- [ ] Firebase config הועתק (6 משתנים)
- [ ] Service Account Key נוצר ונשמר (JSON)

### 3. API Keys
- [ ] xAI API Key מוכן
- [ ] JWT Secret Key נוצר (מינימום 32 תווים)

### 4. קבצים
- [ ] `railway.json` קיים (שורש)
- [ ] `backend/railway.json` קיים
- [ ] `.railwayignore` קיים
- [ ] `package.json` כולל `firebase`
- [ ] `backend/requirements.txt` כולל `firebase-admin`

---

## 🚂 Railway Setup

### 5. Railway Account
- [ ] חשבון Railway נוצר (https://railway.app)
- [ ] מחובר עם GitHub/GitLab

### 6. Project Creation
- [ ] פרויקט חדש נוצר ב-Railway
- [ ] Repository נוסף
- [ ] Railway זיהה 2 Services (Frontend + Backend)

### 7. Backend Service Configuration
- [ ] Root Directory: `backend`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Variables נוספו:
  - [ ] `XAI_API_KEY`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`
  - [ ] `FRONTEND_URL` (יעודכן אחרי יצירת Domain)

### 8. Frontend Service Configuration
- [ ] Root Directory: `.` (שורש)
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Variables נוספו:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `NEXT_PUBLIC_API_URL` (יעודכן אחרי יצירת Domain)
  - [ ] `NODE_ENV=production`

### 9. Domains
- [ ] Backend Domain נוצר
- [ ] Frontend Domain נוצר
- [ ] `FRONTEND_URL` עודכן ב-Backend
- [ ] `NEXT_PUBLIC_API_URL` עודכן ב-Frontend

### 10. Firebase Authorized Domains
- [ ] Domain של Frontend נוסף ל-Firebase Console
- [ ] Authentication → Settings → Authorized domains

---

## ✅ בדיקות

### 11. Backend Health Check
- [ ] פתח: `https://your-backend.railway.app/api/health`
- [ ] מקבל: `{"status": "healthy", ...}`
- [ ] אין שגיאות ב-Logs

### 12. Frontend Loading
- [ ] פתח: `https://your-frontend.railway.app`
- [ ] דף התחברות נטען
- [ ] אין שגיאות ב-Console
- [ ] אין שגיאות ב-Logs

### 13. Google Authentication
- [ ] לחץ "התחבר עם Google"
- [ ] חלון Google נפתח
- [ ] התחברות מצליחה
- [ ] המשתמש מועבר לדף הבית

### 14. Functionality
- [ ] יצירת איש קשר עובד
- [ ] יצירת הודעה AI עובד
- [ ] הגדרת התראה עובד
- [ ] התנתקות עובד

---

## 🐛 אם יש בעיות

### Backend לא עולה
1. בדוק Logs ב-Railway
2. ודא שכל ה-Variables מוגדרים
3. ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON` תקין (כל ה-JSON בשורה אחת)

### Frontend לא נבנה
1. בדוק Logs ב-Railway
2. ודא שכל ה-`NEXT_PUBLIC_FIREBASE_*` מוגדרים
3. ודא ש-`NEXT_PUBLIC_API_URL` תקין

### "Domain not authorized"
1. ודא שהוספת את הדומיין ל-Firebase
2. נסה לרענן את הדף

---

## 📝 הערות

- **Firebase Service Account Key**: העתק את כל התוכן של קובץ ה-JSON (בשורה אחת) ל-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON`
- **JWT Secret Key**: חייב להיות לפחות 32 תווים
- **Domains**: Railway יוצר domains אוטומטית - העתק אותם בדיוק

---

**מוכן? התחל עם `RAILWAY_QUICK_START.md`! 🚀**

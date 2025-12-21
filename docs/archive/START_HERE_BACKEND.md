# 🚀 התחל כאן - Backend קודם!

**למה Backend קודם?**
- Frontend תלוי ב-Backend (קורא ל-API)
- צריך את ה-URL של Backend כדי להגדיר Frontend
- יותר קל לבדוק Backend לבד

---

## ✅ לפני שמתחילים - בדוק שיש לך:

- [ ] **xAI API Key** - מפתח xAI שלך
- [ ] **JWT Secret Key** - המפתח שיש לך
- [ ] **Firebase Service Account Key** - קובץ JSON (המר ל-string)

---

## 🔧 שלב 1: המרת Firebase JSON

### אם עדיין לא המרת:
```powershell
.\convert_json_to_string.ps1 -Path "C:\path\to\your\serviceAccountKey.json"
```

**העתק את התוצאה** - תצטרך אותה בהמשך!

---

## 🚂 שלב 2: יצירת Backend Service ב-Railway

### 2.1 התחברות
1. היכנס ל-[Railway](https://railway.app)
2. התחבר עם GitHub
3. לחץ **"New Project"**
4. בחר **"Deploy from GitHub repo"**
5. בחר: `ElyasafAr/stay-close-app`

### 2.2 יצירת Backend Service
1. בפרויקט החדש, לחץ **"+ New"**
2. בחר **"Empty Service"** (או **"GitHub Repo"**)
3. אם בחרת Empty Service:
   - לחץ על ה-Service שיצרת
   - **Settings** (⚙️) → **"Connect Repo"**
   - בחר: `ElyasafAr/stay-close-app`

### 2.3 הגדרת Backend
1. לחץ על ה-Service
2. **Settings** (⚙️)
3. הגדר:
   - **Name:** `backend`
   - **Root Directory:** `backend` ⚠️ **חשוב מאוד!**
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🔑 שלב 3: הוספת Environment Variables

עבור ל-**Variables** (בתוך Settings) והוסף:

### 1. xAI API Key
```env
XAI_API_KEY=xai-your-api-key-here
```

### 2. JWT Secret Key
```env
JWT_SECRET_KEY=your-jwt-secret-key-here
```

### 3. Firebase Service Account Key
```env
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```
**📝 הערה:** זה מה שהמרת בשלב 1!

### 4. Frontend URL (placeholder)
```env
FRONTEND_URL=https://placeholder.railway.app
```
**📝 הערה:** זה יעודכן אחרי שיצרנו Frontend Domain.

---

## 🚀 שלב 4: Deploy ו-בדיקה

### 4.1 Deploy
1. Railway יתחיל Build אוטומטית
2. אם לא, לחץ **"Deploy"**
3. חכה שהבנייה מסתיימת (2-3 דקות)

### 4.2 בדיקת Logs
1. לחץ על ה-Service
2. **Deployments** → בחר את ה-Deployment האחרון
3. **View Logs**
4. בדוק אם יש שגיאות

**✅ אם אין שגיאות - מעבר לשלב הבא!**

### 4.3 יצירת Domain
1. **Settings** → **Domains**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `backend-production.up.railway.app`)

**📝 שמור את ה-URL הזה!** תצטרך אותו ל-Frontend.

### 4.4 בדיקת Health
פתח בדפדפן:
```
https://your-backend-url.railway.app/api/health
```

**צריך לראות:**
```json
{
  "status": "healthy",
  "timestamp": "2024-..."
}
```

**✅ אם זה עובד - Backend מוכן!**

---

## 🐛 פתרון בעיות

### שגיאת Build: "Module not found"
**פתרון:** וודא ש-`Root Directory` הוא `backend`

### שגיאת Start: "Port already in use"
**פתרון:** וודא ש-Start Command מכיל `--port $PORT`

### Health endpoint לא עובד
**פתרון:** 
1. בדוק Logs
2. וודא ש-`FRONTEND_URL` מוגדר (אפילו placeholder)

---

## ✅ Checklist - Backend

- [ ] Service נוצר
- [ ] Root Directory: `backend`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] כל ה-Variables הוספו:
  - [ ] `XAI_API_KEY`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`
  - [ ] `FRONTEND_URL` (placeholder)
- [ ] Build הצליח
- [ ] Domain נוצר
- [ ] Health endpoint עובד (`/api/health`)

---

## 📝 מה הלאה?

**אחרי שה-Backend עובד:**
- ✅ שלב 2: יצירת Frontend Service
- ✅ שלב 3: חיבור Firebase
- ✅ שלב 4: חיבור PostgreSQL

---

**מוכן להתחיל? 🚀**

אם יש בעיה - תגיד לי ואני אעזור!


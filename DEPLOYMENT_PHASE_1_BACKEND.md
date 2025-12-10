# 🚀 שלב 1: העלאת Backend ל-Railway

**מטרה:** להעלות את ה-Backend ל-Railway ולוודא שהוא עובד.

---

## ✅ לפני שמתחילים - מה צריך?

- [ ] **xAI API Key** - מפתח xAI API שלך
- [ ] **JWT Secret Key** - מפתח סודי (צור אחד חדש, לפחות 32 תווים)
- [ ] **Firebase Service Account Key** - קובץ JSON מ-Firebase

**📝 הערה:** אם אין לך Firebase עדיין - זה בסדר! נגדיר אותו אחר כך.

---

## 🎯 שלב 1.1: יצירת פרויקט ב-Railway

1. היכנס ל-[Railway](https://railway.app)
2. לחץ **"Login"** → **"Login with GitHub"**
3. אפשר גישה ל-repositories שלך
4. לחץ **"New Project"**
5. בחר **"Deploy from GitHub repo"**
6. בחר: `ElyasafAr/stay-close-app`

**⚠️ חשוב:** Railway **לא** יזהה אוטומטית 2 services! צריך ליצור אותם ידנית.

---

## 🔧 שלב 1.2: יצירת Backend Service

### א. יצירת Service חדש
1. בפרויקט החדש, לחץ **"+ New"**
2. בחר **"Empty Service"** (או **"GitHub Repo"** אם זה מופיע)
3. אם בחרת Empty Service:
   - לחץ על ה-Service שיצרת
   - עבור ל-**"Settings"** (⚙️)
   - לחץ **"Connect Repo"**
   - בחר: `ElyasafAr/stay-close-app`

### ב. הגדרת Backend
1. לחץ על ה-Service שיצרת
2. עבור ל-**"Settings"** (⚙️)
3. הגדר:
   - **Name:** `backend` (או `stay-close-backend`)
   - **Root Directory:** `backend` ⚠️ **חשוב מאוד!**
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

**📝 הערה:** Root Directory חייב להיות `backend` כי כל הקוד נמצא בתיקייה הזו!

---

## 🔑 שלב 1.3: הוספת Environment Variables

עבור ל-**"Variables"** (בתוך Settings) והוסף:

### 1. xAI API Key
```env
XAI_API_KEY=xai-your-api-key-here
```

### 2. JWT Secret Key
```env
JWT_SECRET_KEY=your-very-long-secret-key-minimum-32-characters-long
```

**💡 טיפ:** צור JWT Secret Key חזק:
```bash
# ב-PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3. Firebase Service Account Key (JSON)
```env
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**📝 הערה:** אם אין לך Firebase עדיין - דלג על זה. נחזור לזה אחר כך.

### 4. Frontend URL (יעודכן אחר כך)
```env
FRONTEND_URL=https://placeholder.railway.app
```

**📝 הערה:** זה יעודכן אחרי שיצרנו Frontend Domain.

---

## 🚀 שלב 1.4: Deploy ו-בדיקה

1. Railway יתחיל Build אוטומטית (אם לא, לחץ **"Deploy"**)
2. חכה שהבנייה מסתיימת (Build) - זה יכול לקחת 2-3 דקות
3. אם יש שגיאות - בדוק את ה-Logs

### בדיקת Logs
1. לחץ על ה-Service
2. עבור ל-**"Deployments"** → בחר את ה-Deployment האחרון
3. לחץ **"View Logs"**
4. בדוק אם יש שגיאות

### יצירת Domain
1. **"Settings"** → **"Domains"**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `backend-production.up.railway.app`)

### בדיקת Health
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

---

## ✅ בדיקות

- [ ] Build הצליח (ללא שגיאות)
- [ ] Health endpoint עובד (`/api/health`)
- [ ] Domain נוצר ופועל
- [ ] Logs נקיים (ללא שגיאות קריטיות)

---

## 🐛 פתרון בעיות נפוצות

### שגיאת Build: "Module not found"
**פתרון:** וודא ש-`Root Directory` הוא `backend`

### שגיאת Start: "Port already in use"
**פתרון:** וודא ש-Start Command מכיל `--port $PORT`

### Health endpoint לא עובד
**פתרון:** 
1. בדוק Logs
2. וודא ש-`FRONTEND_URL` מוגדר (אפילו placeholder)

---

## 📝 מה הלאה?

**אחרי שה-Backend עובד:**
- ✅ שלב 2: יצירת Frontend Service
- ✅ שלב 3: חיבור Firebase
- ✅ שלב 4: חיבור PostgreSQL

---

**מוכן להתחיל? 🚀**

אם יש בעיה - תגיד לי ואני אעזור!


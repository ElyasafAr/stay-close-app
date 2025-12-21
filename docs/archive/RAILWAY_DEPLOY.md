# 🚂 מדריך Deploy ל-Railway

מדריך מפורט להעלאת האפליקציה ל-Railway דרך Git.

## 📋 דרישות מוקדמות

1. **חשבון Railway** - הירשם ב: https://railway.app
2. **Git Repository** - הפרויקט צריך להיות ב-GitHub/GitLab/Bitbucket
3. **מפתחות API**:
   - `XAI_API_KEY` - מפתח xAI API (או `GROQ_API_KEY`)
   - `JWT_SECRET_KEY` - מפתח סודי ל-JWT (נוצר אוטומטית)

---

## 🚀 שלב 1: הכנת הפרויקט

### 1.1 וודא שהקוד ב-Git

```bash
# בדוק סטטוס
git status

# אם יש שינויים שלא נשמרו
git add .
git commit -m "Prepare for Railway deployment"
git push
```

### 1.2 צור קובץ `.railwayignore` (אופציונלי)

```bash
# .railwayignore
node_modules/
.next/
__pycache__/
*.pyc
.env
.env.local
*.log
```

---

## 🚂 שלב 2: יצירת פרויקט ב-Railway

### 2.1 התחברות ל-Railway

1. היכנס ל: https://railway.app
2. לחץ על **"Login"** והתחבר עם GitHub/GitLab
3. לחץ על **"New Project"**

### 2.2 הוספת Repository

1. בחר **"Deploy from GitHub repo"** (או GitLab/Bitbucket)
2. בחר את ה-repository שלך
3. Railway יזהה אוטומטית את הפרויקט

---

## ⚙️ שלב 3: הגדרת משתני סביבה

### 3.1 משתנים ל-Backend Service

ב-Railway Dashboard, עבור ל-**Variables** והוסף:

```env
# חובה - מפתח xAI API
XAI_API_KEY=your_xai_api_key_here

# חובה - מפתח JWT (צור מפתח חזק!)
JWT_SECRET_KEY=your-very-secret-jwt-key-min-32-chars

# אופציונלי - כתובת Frontend (יוגדר אוטומטית)
FRONTEND_URL=https://your-frontend.railway.app

# אופציונלי - אם יש PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 3.2 משתנים ל-Frontend Service

```env
# חובה - כתובת Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# אופציונלי
NODE_ENV=production
```

---

## 🔧 שלב 4: הגדרת Services

### 4.1 Backend Service

Railway יזהה אוטומטית שזה Python project (בגלל `requirements.txt`).

**Settings:**
- **Root Directory:** `backend`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Build Command:** (ריק - Railway יבנה אוטומטית)

### 4.2 Frontend Service

Railway יזהה אוטומטית שזה Next.js project.

**Settings:**
- **Root Directory:** `.` (שורש הפרויקט)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

---

## 📝 שלב 5: יצירת קבצי הגדרה

### 5.1 Backend - `backend/railway.json` (אופציונלי)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5.2 Frontend - `railway.json` (אופציונלי)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌐 שלב 6: הגדרת Domains

### 6.1 Backend Domain

1. ב-Railway Dashboard, עבור ל-**Settings**
2. לחץ על **"Generate Domain"** או **"Custom Domain"**
3. העתק את ה-URL (לדוגמה: `https://stay-close-backend.railway.app`)

### 6.2 Frontend Domain

1. חזור על התהליך עבור Frontend Service
2. העתק את ה-URL (לדוגמה: `https://stay-close-frontend.railway.app`)

### 6.3 עדכון משתני סביבה

עדכן את `NEXT_PUBLIC_API_URL` ב-Frontend Service:
```
NEXT_PUBLIC_API_URL=https://stay-close-backend.railway.app
```

עדכן את `FRONTEND_URL` ב-Backend Service:
```
FRONTEND_URL=https://stay-close-frontend.railway.app
```

---

## ✅ שלב 7: בדיקה

### 7.1 בדיקת Backend

פתח בדפדפן:
```
https://your-backend.railway.app/api/health
```

צריך לראות:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### 7.2 בדיקת Frontend

פתח בדפדפן:
```
https://your-frontend.railway.app
```

צריך לראות את דף ההתחברות.

---

## 🔐 שלב 8: יצירת משתמש ראשון

1. פתח את האפליקציה בדפדפן
2. לחץ על **"הירשם"**
3. מלא פרטים:
   - שם משתמש
   - אימייל
   - סיסמה (מינימום 6 תווים)
4. לחץ **"הירשם"**

---

## 🐛 פתרון בעיות

### Backend לא עובד

1. **בדוק Logs:**
   - ב-Railway Dashboard, עבור ל-**Deployments** → **View Logs**
   - חפש שגיאות

2. **בדוק משתני סביבה:**
   - ודא ש-`XAI_API_KEY` מוגדר
   - ודא ש-`JWT_SECRET_KEY` מוגדר

3. **בדוק Port:**
   - Railway משתמש ב-`$PORT` - ודא שהקוד משתמש בו

### Frontend לא עובד

1. **בדוק Build:**
   - בדוק את ה-Logs ב-Railway
   - ודא ש-`npm run build` עבר בהצלחה

2. **בדוק משתני סביבה:**
   - ודא ש-`NEXT_PUBLIC_API_URL` מוגדר נכון

3. **CORS Errors:**
   - ודא ש-`FRONTEND_URL` מוגדר ב-Backend
   - ודא שה-CORS כולל את הדומיין של Frontend

### שגיאת 401 (Unauthorized)

- ודא ש-`JWT_SECRET_KEY` מוגדר ב-Backend
- נסה להתחבר מחדש

---

## 📊 ניטור

### View Logs

ב-Railway Dashboard:
- **Deployments** → בחר deployment → **View Logs**

### Metrics

- **Metrics** → צפה ב-CPU, Memory, Network

---

## 🔄 עדכון האפליקציה

כל push ל-Git יגרום ל-Railway לבנות ולהעלות מחדש:

```bash
git add .
git commit -m "Update app"
git push
```

Railway יבנה ויעלה אוטומטית!

---

## 💰 עלויות

Railway מציע:
- **Free Tier:** $5 חינם כל חודש
- **Pro:** $20/חודש

לפרטים נוספים: https://railway.app/pricing

---

## 📞 תמיכה

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **GitHub Issues:** פתח issue ב-repository

---

## ✅ Checklist לפני Deploy

- [ ] הקוד ב-Git
- [ ] `XAI_API_KEY` מוגדר
- [ ] `JWT_SECRET_KEY` מוגדר (מפתח חזק!)
- [ ] `NEXT_PUBLIC_API_URL` מוגדר ב-Frontend
- [ ] `FRONTEND_URL` מוגדר ב-Backend
- [ ] Domains נוצרו
- [ ] בדיקת Health Check עברה
- [ ] משתמש ראשון נוצר

**בהצלחה! 🎉**


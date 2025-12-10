# 🚂 שלבים להעלאה ל-Railway - צעד אחר צעד

מדריך מעודכן עם כל השלבים להעלאת האפליקציה ל-Railway.

---

## 📋 שלב 0: הכנות

### 0.1 וודא שהקוד ב-Git

```bash
# בדוק סטטוס
git status

# אם יש שינויים שלא commit
git add .
git commit -m "Prepare for Railway deployment with Firebase"
git push
```

### 0.2 אסוף את כל ה-API Keys

אתה צריך:
- ✅ **xAI API Key** - מפתח xAI API
- ✅ **JWT Secret Key** - מפתח סודי (צור אחד חדש)
- ✅ **Firebase Config** - 6 משתנים מ-Firebase Console
- ✅ **Firebase Service Account Key** - קובץ JSON מ-Firebase

---

## 🚂 שלב 1: יצירת פרויקט ב-Railway

### 1.1 התחברות

1. היכנס ל-[Railway](https://railway.app)
2. לחץ **"Login"** והתחבר עם **GitHub** (מומלץ)
3. אפשר גישה ל-repositories שלך

### 1.2 יצירת פרויקט

1. לחץ **"New Project"**
2. בחר **"Deploy from GitHub repo"**
3. בחר את ה-repository שלך
4. Railway יזהה אוטומטית ויצור 2 Services:
   - **Backend** (Python/FastAPI)
   - **Frontend** (Next.js)

---

## ⚙️ שלב 2: הגדרת Backend Service

### 2.1 Settings

1. לחץ על **Backend Service**
2. עבור ל-**Settings**:
   - **Root Directory:** `backend`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.2 Environment Variables

עבור ל-**Variables** והוסף:

```env
# חובה - מפתח xAI API
XAI_API_KEY=xai-your-api-key-here

# חובה - מפתח JWT (צור מפתח חזק!)
JWT_SECRET_KEY=your-very-secret-jwt-key-min-32-chars-long

# חובה - Firebase Service Account Key
# העתק את כל התוכן של קובץ ה-JSON (בשורה אחת!)
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"stay-close-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# יעודכן אחרי יצירת Domain
FRONTEND_URL=https://your-frontend.railway.app
```

**📝 איך להשיג `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`:**
1. פתח את קובץ ה-JSON שירד מ-Firebase
2. העתק את כל התוכן
3. הדבק ב-Railway (בשורה אחת, בלי רווחים מיותרים)

---

## ⚙️ שלב 3: הגדרת Frontend Service

### 3.1 Settings

1. לחץ על **Frontend Service**
2. עבור ל-**Settings**:
   - **Root Directory:** `.` (שורש)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### 3.2 Environment Variables

עבור ל-**Variables** והוסף:

```env
# חובה - Firebase Config (מ-Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stay-close-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stay-close-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stay-close-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# יעודכן אחרי יצירת Domain
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# אופציונלי
NODE_ENV=production
```

**📝 איך להשיג Firebase Config:**
1. Firebase Console → Project Settings → General
2. גלול למטה ל-"Your apps"
3. לחץ על Web icon (</>)
4. העתק את כל הערכים מה-config object

---

## 🌐 שלב 4: יצירת Domains

### 4.1 Backend Domain

1. Backend Service → **Settings** → **Domains**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `stay-close-backend.up.railway.app`)

### 4.2 Frontend Domain

1. Frontend Service → **Settings** → **Domains**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL (לדוגמה: `stay-close-frontend.up.railway.app`)

### 4.3 עדכון Variables

**ב-Backend Service:**
- עדכן: `FRONTEND_URL=https://stay-close-frontend.up.railway.app`

**ב-Frontend Service:**
- עדכן: `NEXT_PUBLIC_API_URL=https://stay-close-backend.up.railway.app`

**⚠️ חשוב:** אחרי עדכון Variables, Railway יעלה מחדש את ה-Services אוטומטית.

---

## 🔥 שלב 5: הוספת Domain ל-Firebase

כשאתה מעלה לרשת, Firebase צריך לדעת שהדומיין מורשה.

1. חזור ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. עבור ל-**Authentication** → **Settings** → **Authorized domains**
4. לחץ **"Add domain"**
5. הוסף את דומיין ה-Railway של Frontend:
   - `stay-close-frontend.up.railway.app` (או הדומיין שלך)
   - **ללא** `https://` - רק הדומיין!
6. לחץ **"Add"**

---

## ✅ שלב 6: בדיקות

### 6.1 בדיקת Backend

פתח בדפדפן:
```
https://your-backend.railway.app/api/health
```

**צריך לראות:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

**אם לא עובד:**
- בדוק Logs ב-Railway (Deployments → View Logs)
- ודא שכל ה-Variables מוגדרים
- ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON` תקין

### 6.2 בדיקת Frontend

פתח בדפדפן:
```
https://your-frontend.railway.app
```

**צריך לראות:**
- ✅ דף התחברות נטען
- ✅ כפתור "התחבר עם Google" מופיע
- ✅ אין שגיאות ב-Console (F12)

**אם לא עובד:**
- בדוק Logs ב-Railway
- ודא שכל ה-`NEXT_PUBLIC_FIREBASE_*` מוגדרים
- ודא ש-`NEXT_PUBLIC_API_URL` תקין

### 6.3 בדיקת Google Authentication

1. פתח את הדף של Frontend
2. לחץ **"התחבר עם Google"**
3. צריך להופיע חלון התחברות של Google
4. בחר חשבון Google
5. צריך להתחבר בהצלחה!

**אם לא עובד:**
- ⚠️ "Domain not authorized" → ודא שהוספת את הדומיין ל-Firebase
- ⚠️ "Firebase config not found" → בדוק את ה-Environment Variables
- ⚠️ "Popup blocked" → אפשר popups בדפדפן

---

## 🔑 יצירת JWT Secret Key

אם אין לך JWT Secret Key, צור אחד:

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**או השתמש ב-[RandomKeygen](https://randomkeygen.com/):**
- בחר "CodeIgniter Encryption Keys"
- העתק אחד (מינימום 32 תווים!)

---

## 🐛 פתרון בעיות

### Backend לא עולה

1. **בדוק Logs:**
   - Railway Dashboard → Backend Service → Deployments → View Logs
   - חפש שגיאות

2. **בדוק Variables:**
   - ודא ש-`XAI_API_KEY` מוגדר
   - ודא ש-`JWT_SECRET_KEY` מוגדר (מינימום 32 תווים)
   - ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON` תקין

3. **בדוק Firebase:**
   - ודא שה-JSON שלם (כל התוכן)
   - ודא שאין רווחים מיותרים

### Frontend לא נבנה

1. **בדוק Logs:**
   - Railway Dashboard → Frontend Service → Deployments → View Logs
   - חפש שגיאות build

2. **בדוק Variables:**
   - ודא שכל ה-`NEXT_PUBLIC_FIREBASE_*` מוגדרים (6 משתנים)
   - ודא ש-`NEXT_PUBLIC_API_URL` תקין

3. **בדוק Build:**
   - ודא ש-`npm install` עבר בהצלחה
   - ודא ש-`npm run build` עבר בהצלחה

### "Domain not authorized" ב-Firebase

1. ודא שהוספת את הדומיין ל-Firebase Console
2. ודא שהדומיין מדויק (ללא `https://`)
3. נסה לרענן את הדף
4. נסה למחוק cookies ולנסות שוב

### "Invalid Firebase token" ב-Backend

1. ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON` תקין
2. ודא שההעתק-הדבק שלם (כל ה-JSON)
3. ודא שאין רווחים מיותרים או שורות חדשות

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

Railway יבנה ויעלה אוטומטית! 🚀

---

## ✅ Checklist סופי

- [ ] הקוד ב-Git וכל השינויים push
- [ ] Firebase project מוגדר
- [ ] Railway project נוצר
- [ ] Backend Service מוגדר עם כל ה-Variables
- [ ] Frontend Service מוגדר עם כל ה-Variables
- [ ] Domains נוצרו
- [ ] Variables עודכנו עם Domains
- [ ] Domain נוסף ל-Firebase
- [ ] Backend Health Check עובד
- [ ] Frontend נטען
- [ ] Google Authentication עובד

---

**מוכן! האפליקציה באוויר! 🎉**

אם יש בעיות, בדוק את ה-Logs ב-Railway או את `COMPLETE_DEPLOYMENT_GUIDE.md` למדריך מפורט יותר.


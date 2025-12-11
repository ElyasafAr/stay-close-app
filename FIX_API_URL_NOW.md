# ⚡ תיקון דחוף: Failed to fetch - API URL לא נכון

## 🎯 הבעיה
```
🌐 [API] Request: { url: 'http://localhost:8000/api/auth/firebase', ... }
❌ [API] Request error: Failed to fetch
```

**הסיבה:** `NEXT_PUBLIC_API_URL` מצביע על `localhost` במקום על ה-Railway URL!

---

## ✅ פתרון (3 דקות)

### שלב 1: מצא את ה-Backend URL
1. לך ל-**Railway Dashboard**
2. בחר את ה-**Backend Service**
3. **Settings** → **Domains**
4. **העתק את ה-URL** (לדוגמה: `https://stay-close-backend-production.up.railway.app`)

---

### שלב 2: עדכן את ה-Frontend
1. לך ל-**Frontend Service** ב-Railway
2. **Settings** → **Variables**
3. מצא את `NEXT_PUBLIC_API_URL`
4. **החלף** את הערך ל-URL של ה-Backend:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**⚠️ חשוב:**
- **לא** `http://localhost:8000`
- **לא** `http://127.0.0.1:8000`
- **כן** `https://your-backend-url.railway.app` (עם https!)

---

### שלב 3: שמור ו-Redeploy
1. לחץ **"Save"** (אם יש כפתור)
2. **Deployments** → **Redeploy** (או Railway יעשה זאת אוטומטית)
3. חכה 2-3 דקות

---

### שלב 4: בדיקה
1. רענן את האפליקציה
2. נסה להתחבר עם Google שוב
3. **אמור לעבוד!** ✅

---

## 🔍 איך לבדוק שהתיקון עבד?

### בדיקה 1: Console
1. פתח **Developer Tools** (F12)
2. **Console** tab
3. נסה להתחבר עם Google
4. חפש: `🌐 [API] Request:`
5. בדוק שה-URL הוא `https://...` ולא `http://localhost:8000`

**צריך לראות:**
```
🌐 [API] Request: { url: 'https://your-backend-url.railway.app/api/auth/firebase', ... }
```

**לא:**
```
🌐 [API] Request: { url: 'http://localhost:8000/api/auth/firebase', ... }
```

---

## 📋 Checklist

- [ ] מצאתי את ה-Backend URL ב-Railway
- [ ] עדכנתי את `NEXT_PUBLIC_API_URL` ב-Frontend Service
- [ ] המשתנה מתחיל ב-`https://`
- [ ] המשתנה לא מכיל `localhost`
- [ ] לחצתי Save (אם יש כפתור)
- [ ] עשיתי Redeploy ל-Frontend
- [ ] בדקתי את ה-Console - ה-URL נכון
- [ ] ניסיתי להתחבר עם Google - זה עובד! ✅

---

## 🚨 אם עדיין לא עובד

### אפשרות 1: בדוק שהמשתנה נשמר
- חזור ל-**Variables** ב-Railway
- ודא ש-`NEXT_PUBLIC_API_URL` עדיין מוגדר נכון
- אם לא - עדכן שוב ולחץ **Save**

### אפשרות 2: בדוק את ה-Build
- **Frontend Service** → **Deployments** → **View Logs**
- בדוק אם יש שגיאות Build
- אם יש - תקן אותן קודם

### אפשרות 3: בדוק את ה-Backend
- פתח: `https://your-backend-url.railway.app/api/health`
- צריך לראות: `{"status": "healthy", ...}`
- אם לא - Backend לא עובד

---

## 💡 למה זה קורה?

`NEXT_PUBLIC_API_URL` הוא משתנה שנבנה לתוך ה-Bundle בזמן Build.

אם הוא לא מוגדר נכון ב-Railway, הוא משתמש בערך ברירת המחדל:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

לכן צריך:
1. להגדיר אותו נכון ב-Railway
2. לעשות Redeploy כדי שהשינוי יכנס לתוך ה-Build

---

## 🎉 אחרי התיקון

ההתחברות עם Google אמורה לעבוד!

הלוגים אמורים להראות:
```
✅ [AUTH] Firebase sign-in successful
✅ [AUTH] Firebase token received
🌐 [API] Request: { url: 'https://your-backend-url.railway.app/api/auth/firebase', ... }
📥 [API] Response received: { status: 200, ok: true, ... }
✅ [AUTH] Firebase login successful
```




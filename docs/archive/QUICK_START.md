# 🚀 התחלה מהירה - Stay Close

מדריך מהיר להתחלת עבודה עם האפליקציה.

---

## 📋 מה נדרש להירשם?

### 1. גישה לאפליקציה

- **אם ב-Railway:** פתח את ה-URL שקיבלת (לדוגמה: `https://stay-close.railway.app`)
- **אם מקומי:** פתח `http://localhost:3000`

### 2. פרטים נדרשים

להרשמה תצטרך:

- ✅ **אימייל** - אימייל תקין (לא חייב להיות מאומת)
- ✅ **שם משתמש** - שם ייחודי (מינימום 3 תווים)
- ✅ **סיסמה** - מינימום 6 תווים

### 3. תהליך הרשמה

1. פתח את האפליקציה
2. לחץ על **"הירשם"** (או "אין לך חשבון? הירשם")
3. מלא את הטופס:
   - אימייל
   - שם משתמש
   - סיסמה
4. לחץ **"הירשם"**
5. תועבר אוטומטית לאפליקציה! 🎉

---

## 🔐 התחברות

אם כבר יש לך חשבון:

1. פתח את האפליקציה
2. מלא:
   - שם משתמש **או** אימייל
   - סיסמה
3. לחץ **"התחבר"**

---

## 🚂 Deploy ל-Railway - סיכום מהיר

### שלב 1: הכנה

```bash
# ודא שהקוד ב-Git
git add .
git commit -m "Ready for Railway"
git push
```

### שלב 2: יצירת פרויקט ב-Railway

1. היכנס ל: https://railway.app
2. לחץ **"New Project"**
3. בחר **"Deploy from GitHub repo"**
4. בחר את ה-repository שלך

### שלב 3: יצירת Services

Railway יזהה אוטומטית 2 services:
- **Backend** (Python/FastAPI)
- **Frontend** (Next.js)

### שלב 4: הגדרת משתני סביבה

#### Backend Service:

```env
XAI_API_KEY=your_xai_api_key_here
JWT_SECRET_KEY=your-very-secret-jwt-key-min-32-chars
FRONTEND_URL=https://your-frontend.railway.app
```

#### Frontend Service:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

### שלב 5: יצירת Domains

1. עבור לכל Service → **Settings**
2. לחץ **"Generate Domain"**
3. העתק את ה-URL
4. עדכן את משתני הסביבה בהתאם

### שלב 6: בדיקה

1. פתח את ה-Frontend URL
2. נסה להירשם
3. אם הכל עובד - סיימת! 🎉

---

## 📚 מדריכים מפורטים

- **הרשמה מפורטת:** `REGISTRATION_GUIDE.md`
- **Deploy ל-Railway:** `RAILWAY_DEPLOY.md`
- **הגדרת משתני סביבה:** `ENV_SETUP.md`

---

## ❓ בעיות נפוצות

### "שם משתמש כבר קיים"
→ נסה שם משתמש אחר

### "שגיאת חיבור לשרת"
→ בדוק שהשרת רץ (ב-Railway: בדוק Logs)

### "Token לא תקין"
→ ודא ש-`JWT_SECRET_KEY` מוגדר ב-Backend

---

**בהצלחה! 🚀**


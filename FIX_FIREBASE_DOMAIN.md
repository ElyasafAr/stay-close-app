# 🔧 תיקון: Firebase Unauthorized Domain

## 🎯 הבעיה
```
Firebase: Error (auth/unauthorized-domain)
The current domain is not authorized for OAuth operations.
Domain: stay-close-app-front-production.up.railway.app
```

## ✅ פתרון (2 דקות)

### שלב 1: לך ל-Firebase Console
1. פתח: https://console.firebase.google.com
2. בחר את הפרויקט שלך

### שלב 2: הוסף את הדומיין
1. **Authentication** (בתפריט השמאלי)
2. **Settings** (למעלה)
3. **Authorized domains** (למטה)
4. לחץ **"Add domain"**
5. הוסף: `stay-close-app-front-production.up.railway.app`
   - **ללא** `https://`
   - **רק** את הדומיין
6. לחץ **"Add"**

### שלב 3: בדיקה
1. רענן את האפליקציה
2. נסה להתחבר עם Google
3. **אמור לעבוד!** ✅

---

## 📋 רשימת Domains שצריכים להיות מוגדרים

ב-Firebase Console → Authentication → Settings → Authorized domains:

### חובה:
- ✅ `localhost` (כבר אמור להיות)
- ✅ `stay-close-app-front-production.up.railway.app` (צריך להוסיף!)

### אופציונלי (אם יש לך):
- `your-custom-domain.com`
- `www.your-custom-domain.com`

---

## ⚠️ הערות חשובות

1. **ללא `https://`** - רק את הדומיין
2. **ללא `/` בסוף** - רק את הדומיין
3. **השינויים מיידיים** - לא צריך Redeploy
4. **אם יש לך Domain מותאם אישית** - הוסף גם אותו

---

## 🔍 איך למצוא את ה-Domain שלך?

### ב-Railway:
1. **Frontend Service** → **Settings** → **Domains**
2. העתק את ה-URL (לדוגמה: `stay-close-app-front-production.up.railway.app`)
3. **ללא** `https://`

---

## ✅ Checklist

- [ ] פתחתי Firebase Console
- [ ] הלכתי ל-Authentication → Settings → Authorized domains
- [ ] הוספתי את הדומיין: `stay-close-app-front-production.up.railway.app`
- [ ] לחצתי "Add"
- [ ] רעננתי את האפליקציה
- [ ] ניסיתי להתחבר עם Google
- [ ] זה עובד! ✅

---

## 🎉 אחרי התיקון

ההתחברות עם Google אמורה לעבוד!

אם עדיין לא עובד:
1. בדוק שהדומיין נוסף נכון (ללא `https://`)
2. בדוק שאין שגיאות אחרות ב-Console
3. נסה להתחבר שוב


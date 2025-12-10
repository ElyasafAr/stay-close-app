# 🔧 תיקון package-lock.json - הוראות

## הבעיה

```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: firebase@10.14.1 from lock file
```

**הסיבה:** `package-lock.json` לא מעודכן עם `firebase`.

---

## ✅ הפתרון - הרץ את הסקריפט

### שלב 1: הרץ את הסקריפט

```powershell
.\fix_package_lock.ps1
```

**מה הסקריפט עושה:**
1. מריץ `npm install` לעדכון `package-lock.json`
2. מוסיף את הקבצים ל-Git
3. יוצר commit
4. מעלה ל-GitHub

---

## 🔄 שלב 2: Redeploy ב-Railway

אחרי שהסקריפט מסתיים:

1. היכנס ל-Railway
2. בחר את ה-**Frontend Service**
3. לחץ **"Redeploy"** או **"Deploy Latest Commit"**
4. Build אמור לעבור בהצלחה!

---

## 🐛 אם עדיין לא עובד

### אופציה A: שנה Build Command

ב-Railway → Frontend Service → Settings:
- **Build Command:** `npm install && npm run build`

זה יעבוד גם אם ה-lock file לא מעודכן.

### אופציה B: Clear Build Cache

1. Settings → **"Clear Build Cache"**
2. **Redeploy**

---

**מוכן? הרץ את הסקריפט! 🚀**


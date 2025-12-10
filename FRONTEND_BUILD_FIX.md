# 🔧 תיקון שגיאת Build - Frontend

## הבעיה

```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: firebase@10.14.1 from lock file
```

**הסיבה:** `package-lock.json` לא מעודכן עם `firebase` שהוספנו.

---

## ✅ הפתרון

### שלב 1: עדכון package-lock.json מקומית

```powershell
npm install
```

זה יעדכן את `package-lock.json` עם כל התלויות של `firebase`.

### שלב 2: העלאה ל-Git

```powershell
.\push_to_git.ps1 -Message "Fix: Update package-lock.json with firebase dependencies"
```

### שלב 3: Redeploy ב-Railway

1. חזור ל-Railway
2. Frontend Service → **"Redeploy"**
3. Build אמור לעבור בהצלחה

---

## 🔍 אם עדיין לא עובד

### אופציה A: שנה Build Command

ב-Railway → Frontend Service → Settings:
- **Build Command:** `npm install && npm run build`

זה יעבוד גם אם ה-lock file לא מעודכן.

### אופציה B: Clear Build Cache

1. Settings → **"Clear Build Cache"**
2. **Redeploy**

---

**אחרי התיקון - Build אמור לעבור! 🚀**


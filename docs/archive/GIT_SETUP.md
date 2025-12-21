# 📦 הוראות העלאה ל-Git

## ✅ מה כבר נעשה

1. ✅ Git repository אותחל
2. ✅ `.gitignore` מוגדר (קבצי בדיקה לא יועלו)
3. ✅ כל הקבצים הנדרשים נוספו
4. ✅ Commit ראשון נוצר

## 🚀 השלבים הבאים

### שלב 1: יצירת Repository ב-GitHub

1. היכנס ל-[GitHub](https://github.com)
2. לחץ על **"New repository"** (או **"+"** → **"New repository"**)
3. מלא פרטים:
   - **Repository name:** `stay-close-app` (או שם אחר)
   - **Description:** "Stay Close - אפליקציית קרבה בעברית"
   - **Visibility:** Private או Public (לפי בחירתך)
   - **אל תסמן** "Initialize with README" (כבר יש לנו)
4. לחץ **"Create repository"**

### שלב 2: חיבור ל-Remote

אחרי שיצרת את ה-repository, GitHub יראה לך הוראות. הפעל:

```bash
# הוסף את ה-remote (החלף את YOUR_USERNAME ו-YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# או עם SSH (אם יש לך SSH key):
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### שלב 3: העלאה

```bash
# העלה את הקוד
git push -u origin main

# או אם ה-branch שלך נקרא master:
# git push -u origin master
```

## 📋 מה הועלה

### ✅ קבצים שהועלו:
- כל קוד האפליקציה (Frontend + Backend)
- קבצי הגדרה (package.json, requirements.txt, וכו')
- מסמכי תיעוד (.md files)
- קבצי תצורה (tsconfig.json, next.config.js, וכו')

### ❌ קבצים שלא הועלו (ב-.gitignore):
- `node_modules/` - dependencies
- `.next/` - build files
- `__tests__/` - קבצי בדיקה
- `backend/test_*.py` - סקריפטי בדיקה
- `backend/check_*.py` - סקריפטי בדיקה
- `app/layout-backup.tsx` - קובץ גיבוי
- `app/page-simple.tsx` - קובץ זמני
- `*.env` - משתני סביבה
- `contacts.json`, `users.json`, `reminders.json` - נתונים
- `*serviceAccountKey.json` - מפתחות Firebase

## 🔍 בדיקה

אחרי ה-push, בדוק ב-GitHub:
- ✅ כל הקבצים שם
- ✅ אין קבצי בדיקה
- ✅ אין קבצים רגישים (.env, serviceAccountKey.json)

## 🚂 השלב הבא: Railway

אחרי שהקוד ב-GitHub, תוכל:
1. להתחבר ל-Railway
2. לבחור "Deploy from GitHub repo"
3. לבחור את ה-repository שלך
4. Railway יבנה ויעלה אוטומטית!

ראה `RAILWAY_DEPLOY_STEPS.md` לפרטים.

---

**מוכן! 🎉**


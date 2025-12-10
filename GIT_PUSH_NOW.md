# 🚀 העלאה מיידית ל-GitHub

הרץ את הפקודות הבאות **בסדר** בטרמינל:

```powershell
# 1. אתחל Git (אם צריך)
git init

# 2. הוסף כל הקבצים
git add .

# 3. צור commit
git commit -m "Initial commit: Stay Close App - Full stack with Firebase Auth"

# 4. הוסף remote (אם כבר קיים, תראה שגיאה - זה בסדר)
git remote add origin https://github.com/ElyasafAr/stay-close-app.git

# 5. הגדר branch ל-main
git branch -M main

# 6. העלה ל-GitHub
git push -u origin main
```

## אם יש שגיאה ב-remote add:

```powershell
# הסר את ה-remote הקיים
git remote remove origin

# הוסף שוב
git remote add origin https://github.com/ElyasafAr/stay-close-app.git
```

## אם יש שגיאת Authentication:

1. **אם זה הפעם הראשונה:**
   - GitHub יבקש ממך להתחבר
   - השתמש ב-Personal Access Token במקום סיסמה

2. **יצירת Personal Access Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token
   - בחר scope: `repo`
   - העתק את ה-token
   - השתמש בו כסיסמה ב-push

---

**אחרי שהכל עלה, בדוק ב:**
https://github.com/ElyasafAr/stay-close-app


# 🔄 Git Workflow - שימוש בסקריפטים

כל פעם שצריך להעלות משהו ל-Git, נשתמש בסקריפט PowerShell.

---

## 📝 סקריפטים זמינים

### 1. `push_to_git.ps1` - העלאה כללית
**שימוש:**
```powershell
.\push_to_git.ps1
```

**או עם הודעה מותאמת:**
```powershell
.\push_to_git.ps1 -Message "Fix: Add missing function"
```

**מה זה עושה:**
- בודק סטטוס
- מוסיף את כל השינויים
- יוצר commit
- מעלה ל-GitHub

---

### 2. `push_fix_to_git.ps1` - לתיקונים ספציפיים
**שימוש:**
```powershell
.\push_fix_to_git.ps1
```

**מה זה עושה:**
- מוסיף רק את `backend/auth.py`
- יוצר commit עם הודעה קבועה
- מעלה ל-GitHub

---

## 🚀 דוגמאות שימוש

### תיקון שגיאה
```powershell
.\push_to_git.ps1 -Message "Fix: Resolve import error"
```

### הוספת פיצ'ר
```powershell
.\push_to_git.ps1 -Message "Feature: Add new endpoint"
```

### עדכון תיעוד
```powershell
.\push_to_git.ps1 -Message "Docs: Update deployment guide"
```

---

## ✅ אחרי Push

1. **בדוק ב-GitHub:**
   - https://github.com/ElyasafAr/stay-close-app
   - וודא שהשינויים שם

2. **ב-Railway:**
   - לחץ **"Redeploy"** או **"Deploy Latest Commit"**
   - חכה שהבנייה מסתיימת

---

## 🐛 אם יש בעיה

### שגיאת Authentication
```powershell
# בדוק credentials
git config --global user.name
git config --global user.email

# או השתמש ב-Personal Access Token
```

### שגיאת Remote
```powershell
# בדוק remote
git remote -v

# אם חסר, הוסף:
git remote add origin https://github.com/ElyasafAr/stay-close-app.git
```

---

**מוכן לעבוד! 🚀**









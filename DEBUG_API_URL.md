# 🔍 דיבוג: למה API_URL עדיין localhost?

## 🎯 הבעיה
המשתנה הוגדר נכון ב-Railway, אבל הקוד עדיין משתמש ב-`localhost:8000`.

## 🔍 מה עשיתי

### 1. הוספתי לוגים לדיבוג
עדכנתי את `services/api.ts` להוסיף לוגים שיראו מה המשתנה בפועל:

```typescript
console.log('🔍 [API] Environment check:', {
  'process.env.NEXT_PUBLIC_API_URL': envApiUrl,
  'API_BASE_URL (final)': API_BASE_URL,
  'isLocalhost': API_BASE_URL.includes('localhost'),
  'isRailway': API_BASE_URL.includes('railway.app')
})
```

### 2. עדכנתי את next.config.js
הוספתי `env` כדי לוודא שמשתני הסביבה נגישים.

---

## ✅ מה לעשות עכשיו

### שלב 1: Push את השינויים
```powershell
git add services/api.ts next.config.js
git commit -m "Add debug logs for API URL"
git push origin main
```

### שלב 2: Redeploy ב-Railway
1. Railway יעשה Redeploy אוטומטית אחרי Push
2. או: **Frontend Service** → **Deployments** → **Redeploy**

### שלב 3: בדוק את הלוגים
1. רענן את האפליקציה
2. פתח **Console** (F12)
3. חפש: `🔍 [API] Environment check:`
4. **שלח לי את הלוגים** - זה יראה מה המשתנה בפועל

---

## 🔍 מה הלוגים יראו

### אם המשתנה תקין:
```javascript
🔍 [API] Environment check: {
  'process.env.NEXT_PUBLIC_API_URL': 'https://your-backend.railway.app',
  'API_BASE_URL (final)': 'https://your-backend.railway.app',
  'isLocalhost': false,
  'isRailway': true
}
```

### אם המשתנה לא תקין:
```javascript
🔍 [API] Environment check: {
  'process.env.NEXT_PUBLIC_API_URL': undefined,
  'API_BASE_URL (final)': 'http://localhost:8000',
  'isLocalhost': true,
  'isRailway': false
}
```

---

## 💡 למה זה יכול לקרות?

### אפשרות 1: המשתנה לא הוגדר בזמן Build
- `NEXT_PUBLIC_*` משתנים נבנים לתוך ה-Bundle בזמן Build
- אם המשתנה לא היה מוגדר בזמן Build - הוא לא יהיה שם
- **פתרון:** ודא שהמשתנה מוגדר לפני Build, ועשה Redeploy

### אפשרות 2: Railway לא מעביר את המשתנה
- לפעמים Railway לא מעביר משתנים נכון
- **פתרון:** בדוק שהמשתנה מופיע ב-Variables, ונסה Redeploy

### אפשרות 3: Cache של הדפדפן
- הדפדפן יכול לשמור את ה-Bundle הישן
- **פתרון:** Clear Cache (Ctrl+Shift+Delete) ורענן

---

## 📋 Checklist

- [ ] Push את השינויים ל-Git
- [ ] Railway עשה Redeploy
- [ ] רענן את האפליקציה (Ctrl+F5)
- [ ] פתח Console (F12)
- [ ] חפש: `🔍 [API] Environment check:`
- [ ] העתק את הלוגים
- [ ] שלח לי את הלוגים

---

## 🆘 אם עדיין לא עובד

**שלח לי:**
1. את הלוגים מ-`🔍 [API] Environment check:`
2. מה כתוב ב-Railway → Frontend Service → Variables → `NEXT_PUBLIC_API_URL`
3. האם עשית Redeploy אחרי העדכון?

עם המידע הזה אוכל לזהות בדיוק מה הבעיה!




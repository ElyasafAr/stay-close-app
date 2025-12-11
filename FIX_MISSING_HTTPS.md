# 🔧 תיקון: URL חסר https://

## 🎯 הבעיה
הלוגים מראים:
```
process.env.NEXT_PUBLIC_API_URL: 'stay-close-app-backend-production.up.railway.app'
url: 'stay-close-app-backend-production.up.railway.app/api/auth/firebase'
```

**הבעיה:** המשתנה לא מכיל `https://`!

זה גורם ל-URL להיות **relative**, והדפדפן מוסיף אותו ל-Frontend URL:
```
https://stay-close-app-front-production.up.railway.app/stay-close-app-backend-production.up.railway.app/api/auth/firebase
```

במקום:
```
https://stay-close-app-backend-production.up.railway.app/api/auth/firebase
```

---

## ✅ פתרון

### שלב 1: עדכן את המשתנה ב-Railway

1. Railway Dashboard → **Frontend Service**
2. **Settings** → **Variables**
3. מצא `NEXT_PUBLIC_API_URL`
4. **עדכן** את הערך כך שיתחיל ב-`https://`:

```env
NEXT_PUBLIC_API_URL=https://stay-close-app-backend-production.up.railway.app
```

**⚠️ חשוב:**
- **לא** `stay-close-app-backend-production.up.railway.app` (ללא https://)
- **כן** `https://stay-close-app-backend-production.up.railway.app` (עם https://!)

---

### שלב 2: Redeploy

1. **Frontend Service** → **Deployments**
2. לחץ **"Redeploy"**
3. חכה 2-3 דקות

---

### שלב 3: בדיקה

1. רענן את האפליקציה (Ctrl+F5)
2. פתח **Console** (F12)
3. חפש: `🔍 [API] Environment check:`
4. **צריך לראות:**
   ```javascript
   process.env.NEXT_PUBLIC_API_URL: 'https://stay-close-app-backend-production.up.railway.app'
   API_BASE_URL (final): 'https://stay-close-app-backend-production.up.railway.app'
   hasProtocol: true
   ```

---

## 🔧 מה עשיתי בקוד

עדכנתי את `services/api.ts` כדי לוודא שה-URL תמיד מתחיל ב-`https://`:

```typescript
// If the URL doesn't start with http:// or https://, add https://
if (API_BASE_URL && !API_BASE_URL.match(/^https?:\/\//)) {
  API_BASE_URL = `https://${API_BASE_URL}`
}
```

זה אומר שגם אם המשתנה לא מכיל `https://`, הקוד יוסיף אותו אוטומטית.

**אבל עדיין עדיף** להגדיר את המשתנה נכון ב-Railway!

---

## 📋 Checklist

- [ ] עדכנתי את `NEXT_PUBLIC_API_URL` ב-Railway
- [ ] המשתנה מתחיל ב-`https://`
- [ ] לחצתי Save
- [ ] עשיתי Redeploy
- [ ] בדקתי את ה-Console - `hasProtocol: true`
- [ ] ניסיתי להתחבר - זה עובד! ✅

---

## 🎉 אחרי התיקון

ההתחברות עם Google אמורה לעבוד!

הלוגים אמורים להראות:
```
🌐 [API] Request: { url: 'https://stay-close-app-backend-production.up.railway.app/api/auth/firebase', ... }
📥 [API] Response received: { status: 200, ok: true, ... }
✅ [AUTH] Firebase login successful
```




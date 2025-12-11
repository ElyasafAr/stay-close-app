# 🔑 הגדרת VAPID Keys ל-Push Notifications

## מה זה VAPID?

VAPID (Voluntary Application Server Identification) הוא פרוטוקול לזיהוי שרתים ב-Web Push Notifications.

## איך ליצור VAPID Keys?

### אפשרות 1: Python Script (מומלץ)

```bash
cd backend
python generate_vapid_keys.py
```

הסקריפט יציג את ה-keys. העתק אותם ל-Railway environment variables.

### אפשרות 2: Online Generator

1. לך ל-https://web-push-codelab.glitch.me/
2. לחץ על "Generate VAPID Keys"
3. העתק את ה-keys

### אפשרות 3: Node.js

```bash
npx web-push generate-vapid-keys
```

## הוספה ל-Railway

1. לך ל-Railway Dashboard
2. בחר את ה-Backend service
3. לך ל-Variables
4. הוסף:
   - `VAPID_PUBLIC_KEY` = ה-public key
   - `VAPID_PRIVATE_KEY` = ה-private key

## הוספה ל-.env (לפיתוח מקומי)

הוסף ל-`backend/.env`:
```
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

## בדיקה

לאחר הוספת ה-keys:
1. הפעל את השרת
2. פתח את האפליקציה בדפדפן
3. בדוק ב-Console שההתראות עובדות

## הערות חשובות

- ⚠️ **אל תחלוק את ה-Private Key!** - זה סודי!
- ✅ Public Key יכול להיות גלוי
- ✅ אפשר להשתמש באותם keys לכל הסביבות (dev/prod)


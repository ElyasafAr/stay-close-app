# הגדרת Firebase Cloud Messaging (FCM) 🔔

## סקירה כללית

עברנו מ-Web Push עם VAPID keys ל-Firebase Cloud Messaging (FCM).
FCM יותר אמין, חינמי לחלוטין, ו-Firebase כבר מוגדר בפרויקט.

## שלבים להגדרה

### שלב 1: בדיקת הגדרות Firebase Console

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט `stay-close-f8d89`
3. לך ל-**Project Settings** (גלגל שיניים)
4. בלשונית **General**, מצא את **Web apps** שלך
5. העתק את הקונפיגורציה (apiKey, authDomain, projectId, etc.)

### שלב 2: עדכון firebase-messaging-sw.js

ערוך את הקובץ `public/firebase-messaging-sw.js` ועדכן את הערכים:

```javascript
const firebaseConfig = {
  apiKey: "הערך-שלך-כאן",
  authDomain: "stay-close-f8d89.firebaseapp.com",
  projectId: "stay-close-f8d89",
  storageBucket: "stay-close-f8d89.appspot.com",
  messagingSenderId: "הערך-שלך-כאן",
  appId: "הערך-שלך-כאן"
}
```

### שלב 3: הפעלת Cloud Messaging ב-Firebase

1. ב-Firebase Console, לך ל-**Engage** -> **Cloud Messaging**
2. אם מבקשים, הפעל את Cloud Messaging API
3. ודא שיש לך Web push certificate (Firebase יוצר אוטומטית)

### שלב 4: בדיקת Environment Variables

וודא שהמשתנים הבאים מוגדרים:

#### ב-Vercel (Frontend):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### ב-Railway (Backend):
- `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` - JSON מלא של Service Account

### שלב 5: יצירת Service Account (אם חסר)

1. ב-Firebase Console -> Project Settings -> **Service accounts**
2. לחץ על **Generate new private key**
3. הורד את קובץ ה-JSON
4. העתק את כל תוכן ה-JSON כ-string ל-Railway:
   - עבור ל-Railway Dashboard
   - בחר את הפרויקט
   - לך ל-Variables
   - הוסף `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` עם כל ה-JSON

### שלב 6: Deploy

```bash
# Push changes to git
.\push_to_git.ps1
```

## בדיקה

1. פתח את האפליקציה בדפדפן
2. התחבר (Login)
3. בדוק ב-Console של הדפדפן:
   - `✅ [Firebase] Messaging initialized`
   - `✅ [Firebase] FCM token received: ...`
4. צור תזכורת לדקה הקרובה
5. חכה להתראה

## פתרון בעיות

### אין FCM token
- בדוק שהרשאות התראות מאושרות
- בדוק שה-Service Worker נטען (F12 -> Application -> Service Workers)

### התראות לא מגיעות
- בדוק את לוגים ב-Railway
- ודא ש-Firebase Service Account מוגדר נכון
- בדוק ש-Cloud Messaging מופעל ב-Firebase

### שגיאת "messaging/token-subscribe-failed"
- ודא שהקונפיגורציה ב-`firebase-messaging-sw.js` נכונה
- בדוק שה-messagingSenderId תואם

## הערות חשובות

1. **FCM חינמי לחלוטין** - אין הגבלות על כמות ההודעות
2. **לא צריך VAPID keys** - Firebase מנהל הכל אוטומטית
3. **עובד בכל הדפדפנים** - Chrome, Firefox, Edge, Safari (iOS 16.4+)



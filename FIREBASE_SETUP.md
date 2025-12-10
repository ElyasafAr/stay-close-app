# 🔥 הוראות הגדרת Firebase Authentication

## שלב 1: יצירת Firebase Project

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ על **"Add project"** (או **"יצירת פרויקט"**)
3. הזן שם לפרויקט (למשל: "stay-close-app")
4. פעל לפי ההוראות (Google Analytics - אופציונלי)

## שלב 2: הפעלת Authentication

1. בתפריט השמאלי, בחר **"Authentication"**
2. לחץ על **"Get started"**
3. בחר **"Sign-in method"** (או **"שיטת התחברות"**)
4. לחץ על **"Google"**
5. הפעל את **"Enable"**
6. בחר **"Project support email"** (אימייל התמיכה)
7. לחץ על **"Save"**

## שלב 3: קבלת Firebase Config

1. עבור ל-**Project Settings** (⚙️) בפינה השמאלית העליונה
2. בחר **"General"** tab
3. גלול למטה ל-**"Your apps"**
4. לחץ על ה-**Web icon** (</>)
5. הרשם את האפליקציה:
   - **App nickname**: "Stay Close Web"
   - **Firebase Hosting**: לא נדרש כרגע
6. לחץ על **"Register app"**
7. **העתק את ה-config object** - נראה כך:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   }
   ```

## שלב 4: קבלת Service Account Key (עבור Backend)

1. ב-Firebase Console, עבור ל-**Project Settings** → **"Service accounts"**
2. לחץ על **"Generate new private key"**
3. **שמור את הקובץ JSON** - זה חשוב מאוד!
4. **⚠️ אל תעלה את הקובץ הזה ל-Git!**

## שלב 5: הגדרת Environment Variables

### Frontend (.env.local)

צור קובץ `.env.local` בשורש הפרויקט:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Config (מה-config object שקיבלת)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Backend (backend/.env)

הוסף ל-`backend/.env`:

```env
# Firebase Service Account
# אפשרות 1: נתיב לקובץ JSON
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=path/to/serviceAccountKey.json

# אפשרות 2: JSON string ישירות (לשימוש ב-Railway/Heroku)
# FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"..."}
```

**הערה**: אם אתה משתמש ב-`FIREBASE_SERVICE_ACCOUNT_KEY_PATH`, ודא שהנתיב נכון. אם אתה משתמש ב-`FIREBASE_SERVICE_ACCOUNT_KEY_JSON`, העתק את כל התוכן של קובץ ה-JSON.

## שלב 6: התקנת Dependencies

### Frontend
```bash
npm install firebase
```

### Backend
```bash
cd backend
pip install firebase-admin
```

## שלב 7: בדיקה

1. הפעל את ה-backend:
   ```bash
   cd backend
   python3 main.py
   ```

2. הפעל את ה-frontend:
   ```bash
   npm run dev
   ```

3. פתח את הדפדפן ב-`http://localhost:3002`
4. לחץ על **"התחבר עם Google"**
5. אם הכל עובד, תראה חלון התחברות של Google

## 🔧 פתרון בעיות

### שגיאה: "Firebase לא מוגדר"
- ודא ש-`FIREBASE_SERVICE_ACCOUNT_KEY_PATH` או `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` מוגדרים ב-`backend/.env`
- ודא שהקובץ JSON קיים (אם משתמש בנתיב)

### שגיאה: "Firebase config לא מוגדר"
- ודא שכל ה-`NEXT_PUBLIC_FIREBASE_*` מוגדרים ב-`.env.local`
- ודא שהקובץ `.env.local` נמצא בשורש הפרויקט

### שגיאה: "Popup blocked"
- אפשר חלונות קופצים בדפדפן
- נסה שוב

### שגיאה: "Invalid token"
- ודא שה-Service Account Key תקין
- ודא שה-Authentication מופעל ב-Firebase Console

## ✅ Checklist

- [ ] Firebase project נוצר
- [ ] Google Authentication מופעל
- [ ] Firebase config הועתק
- [ ] Service Account Key נוצר ונשמר
- [ ] Environment variables מוגדרים (frontend + backend)
- [ ] Dependencies מותקנים
- [ ] האפליקציה עובדת

## 📝 הערות חשובות

1. **אבטחה**: לעולם אל תעלה את Service Account Key ל-Git!
2. **Authorized Domains**: Firebase מאפשר `localhost` כברירת מחדל. כשתעלה ל-production, הוסף את הדומיין שלך ב-Firebase Console → Authentication → Settings → Authorized domains
3. **Token Refresh**: Firebase מטפלת בזה אוטומטית - המשתמש יישאר מחובר גם אחרי סגירת הדפדפן

---

**מוכן! 🚀**

עכשיו האפליקציה משתמשת ב-Firebase Authentication עם כל היתרונות:
- ✅ Token refresh אוטומטי
- ✅ "זכור אותי" מובנה
- ✅ חוויה חלקה יותר
- ✅ אבטחה חזקה יותר


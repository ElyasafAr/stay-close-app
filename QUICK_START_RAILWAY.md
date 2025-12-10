# 🚀 Quick Start - Railway Deployment

מדריך מהיר להתחלה.

---

## ✅ מה יש לך?

- [x] JWT Secret Key
- [x] Firebase Service Account Key (קובץ JSON)
- [ ] xAI API Key
- [ ] Firebase Config (6 משתנים)

---

## 🔧 שלב 1: המרת Firebase JSON

### אופציה A: PowerShell Script
```powershell
.\convert_json_to_string.ps1 -Path "C:\path\to\your\serviceAccountKey.json"
```

### אופציה B: ידנית
1. פתח את קובץ ה-JSON
2. העתק את כל התוכן (Ctrl+A, Ctrl+C)
3. פתח [JSON Minifier](https://jsonformatter.org/json-minify)
4. הדבק והמיר
5. העתק את התוצאה

**⚠️ חשוב:** צריך להיות **string אחד** ללא שורות!

---

## 📋 רשימת משתנים - Backend

הכנס ל-Railway → Backend Service → Variables → הוסף:

| Variable | Value |
|----------|-------|
| `XAI_API_KEY` | `xai-your-key-here` |
| `JWT_SECRET_KEY` | `your-jwt-key-here` |
| `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` | `{"type":"service_account",...}` (מה-JSON שהמרת) |
| `FRONTEND_URL` | `https://placeholder.railway.app` (יעודכן אחר כך) |

---

## 📋 רשימת משתנים - Frontend

הכנס ל-Railway → Frontend Service → Variables → הוסף:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789:web:abc` |
| `NEXT_PUBLIC_API_URL` | `https://backend-url.railway.app` (יעודכן אחר כך) |
| `NODE_ENV` | `production` |

---

## 🎯 איפה למצוא Firebase Config?

1. [Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. ⚙️ **Project Settings**
4. **General** tab
5. גלול למטה ל-**"Your apps"**
6. לחץ על ה-**Web app** (</>)
7. תראה את ה-config object - העתק משם!

**דוגמה:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                    // ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com",   // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "project-id",                 // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "project.appspot.com",    // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",          // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc"             // ← NEXT_PUBLIC_FIREBASE_APP_ID
};
```

---

## 🚀 סדר העבודה

1. **המר את Firebase JSON** → string אחד
2. **הכנס ל-Railway** → Backend Service
3. **הוסף Variables** (ראה רשימה למעלה)
4. **Deploy** → חכה שהבנייה מסתיימת
5. **צור Domain** → העתק את ה-URL
6. **חזור על זה ל-Frontend**

---

**מוכן? בואו נתחיל! 🎯**


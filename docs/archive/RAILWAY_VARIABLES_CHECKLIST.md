# ✅ רשימת משתנים ל-Railway - Checklist

רשימה מסודרת של כל המשתנים שצריך להכניס ל-Railway.

---

## 🔧 Backend Service Variables

### 1. xAI API Key
```env
XAI_API_KEY=xai-your-api-key-here
```
**✅ יש לך?** [ ]

---

### 2. JWT Secret Key
```env
JWT_SECRET_KEY=your-jwt-secret-key-here
```
**✅ יש לך?** [✓] (אמרת שיש לך!)

---

### 3. Firebase Service Account Key (JSON String)
```env
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account",...}
```
**✅ יש לך?** [✓] (יש לך קובץ JSON)

**📝 איך להמיר קובץ JSON ל-string:**
1. הרץ את הסקריפט: `.\convert_json_to_string.ps1 -Path "path\to\your\serviceAccountKey.json"`
2. או פתח את הקובץ, העתק את כל התוכן, והסר שורות ריקות

---

### 4. Frontend URL (יעודכן אחר כך)
```env
FRONTEND_URL=https://placeholder.railway.app
```
**📝 הערה:** זה יעודכן אחרי שיצרנו Frontend Domain.

---

## 🎨 Frontend Service Variables

### 1. Firebase API Key
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```
**✅ יש לך?** [ ]

**איפה למצוא:** Firebase Console → ⚙️ Project Settings → General → Your apps → Web app → Config

---

### 2. Firebase Auth Domain
```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```
**✅ יש לך?** [ ]

---

### 3. Firebase Project ID
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```
**✅ יש לך?** [ ]

---

### 4. Firebase Storage Bucket
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```
**✅ יש לך?** [ ]

---

### 5. Firebase Messaging Sender ID
```env
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
```
**✅ יש לך?** [ ]

---

### 6. Firebase App ID
```env
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```
**✅ יש לך?** [ ]

**📝 איפה למצוא את כל 6 המשתנים:**
1. Firebase Console → ⚙️ Project Settings
2. General tab
3. גלול למטה ל-"Your apps"
4. לחץ על ה-Web app (</>)
5. תראה את ה-config object - העתק משם!

**דוגמה:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com",  // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "project-id",        // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "project.appspot.com",    // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc"    // ← NEXT_PUBLIC_FIREBASE_APP_ID
};
```

---

### 7. Backend API URL (יעודכן אחר כך)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```
**📝 הערה:** זה יעודכן אחרי שיצרנו Backend Domain.

---

### 8. Node Environment
```env
NODE_ENV=production
```
**✅ זה קבוע - פשוט העתק!**

---

## 🔄 סדר העבודה

### שלב 1: Backend
1. [ ] יצירת Backend Service
2. [ ] הוספת Variables:
   - [ ] `XAI_API_KEY`
   - [ ] `JWT_SECRET_KEY`
   - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` (לאחר המרה)
   - [ ] `FRONTEND_URL` (placeholder)
3. [ ] Deploy
4. [ ] יצירת Domain
5. [ ] העתקת ה-URL

### שלב 2: Frontend
1. [ ] יצירת Frontend Service
2. [ ] הוספת Variables:
   - [ ] כל 6 משתני Firebase
   - [ ] `NEXT_PUBLIC_API_URL` (מה-URL של Backend)
   - [ ] `NODE_ENV=production`
3. [ ] Deploy
4. [ ] יצירת Domain
5. [ ] העתקת ה-URL

### שלב 3: עדכונים
1. [ ] עדכון `FRONTEND_URL` ב-Backend
2. [ ] עדכון Firebase Authorized domains

---

## 🛠️ כלי עזר

### המרת JSON ל-String
```powershell
.\convert_json_to_string.ps1 -Path "C:\path\to\serviceAccountKey.json"
```

### יצירת JWT Key (אם צריך)
```powershell
.\generate_jwt_key.ps1
```

---

**מוכן להתחיל! 🚀**


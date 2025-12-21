# 🔑 רשימת Environment Variables ל-Railway

רשימה מסודרת של כל המשתנים שצריך להכניס ל-Railway.

---

## 📦 Backend Service Variables

### 1. xAI API Key
```env
XAI_API_KEY=xai-your-api-key-here
```
**איפה למצוא:** מפתח xAI API שלך (מתחיל ב-`xai-`)

---

### 2. JWT Secret Key
```env
JWT_SECRET_KEY=your-generated-secret-key-here
```
**איך ליצור:** ראה למטה - אני אכין לך אחד!

---

### 3. Firebase Service Account Key (JSON)
```env
FIREBASE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```
**איך להמיר קובץ JSON ל-string:**
1. פתח את קובץ ה-JSON שלך
2. העתק את כל התוכן (Ctrl+A, Ctrl+C)
3. הדבק כאן (אבל **הסר כל שורות ריקות ו-Enter**)
4. או השתמש בכלי להמרה (ראה למטה)

**⚠️ חשוב:** 
- צריך להיות **string אחד** ללא שורות
- כל ה-JSON צריך להיות בשורה אחת
- שמור על כל התווים המיוחדים

---

### 4. Frontend URL (יעודכן אחר כך)
```env
FRONTEND_URL=https://placeholder.railway.app
```
**📝 הערה:** זה יעודכן אחרי שיצרנו Frontend Domain.

---

## 🎨 Frontend Service Variables

### 1. Firebase Config (6 משתנים)

#### Firebase API Key
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```
**איפה למצוא:** Firebase Console → Project Settings → General → Your apps → Web app → Config

#### Firebase Auth Domain
```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

#### Firebase Project ID
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

#### Firebase Storage Bucket
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

#### Firebase Messaging Sender ID
```env
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
```

#### Firebase App ID
```env
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**📝 איפה למצוא את כל זה:**
1. Firebase Console → ⚙️ Project Settings
2. General tab
3. גלול למטה ל-"Your apps"
4. לחץ על ה-Web app (</>)
5. תראה את ה-config object - העתק משם!

---

### 2. Backend API URL (יעודכן אחר כך)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```
**📝 הערה:** זה יעודכן אחרי שיצרנו Backend Domain.

---

### 3. Node Environment
```env
NODE_ENV=production
```

---

## 🔧 איך להמיר קובץ JSON ל-string

### שיטה 1: PowerShell (קל)
```powershell
# פתח PowerShell בתיקייה שבה נמצא הקובץ
$json = Get-Content -Path "serviceAccountKey.json" -Raw
$json = $json -replace "`r`n", "" -replace "`n", "" -replace "`r", ""
$json = $json -replace '\s+', ' '
Write-Output $json
```

### שיטה 2: Python
```python
import json

# קרא את הקובץ
with open('serviceAccountKey.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# המר ל-string אחד
json_string = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
print(json_string)
```

### שיטה 3: ידנית
1. פתח את הקובץ ב-Notepad++
2. לחץ Ctrl+H (Find & Replace)
3. Find: `\r\n` (או `\n`)
4. Replace: (ריק)
5. לחץ "Replace All"
6. העתק את כל התוכן

---

## ✅ רשימת בדיקה

### Backend
- [ ] `XAI_API_KEY` - מפתח xAI
- [ ] `JWT_SECRET_KEY` - מפתח JWT (64 תווים)
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` - JSON string
- [ ] `FRONTEND_URL` - URL של Frontend (יעודכן)

### Frontend
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_API_URL` - URL של Backend (יעודכן)
- [ ] `NODE_ENV=production`

---

## 🚀 סדר העבודה

1. **קודם Backend:**
   - הוסף את כל ה-Variables של Backend
   - Deploy
   - צור Domain
   - העתק את ה-URL

2. **אחר כך Frontend:**
   - הוסף את כל ה-Variables של Frontend
   - עדכן `NEXT_PUBLIC_API_URL` עם ה-URL של Backend
   - Deploy
   - צור Domain
   - העתק את ה-URL

3. **עדכון Backend:**
   - עדכן `FRONTEND_URL` עם ה-URL של Frontend
   - Railway יעשה Redeploy אוטומטית

4. **עדכון Firebase:**
   - הוסף את ה-Domain של Frontend ל-Authorized domains

---

**מוכן להתחיל! 🎯**


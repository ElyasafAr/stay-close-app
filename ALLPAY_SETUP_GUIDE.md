# 📚 מדריך התחברות ל-Allpay - Stay Close

## 🎯 סקירה כללית

מדריך זה מסביר איך להירשם ל-Allpay, לקבל API credentials, ולהגדיר את המערכת.

---

## 📝 שלב 1: הרשמה ל-Allpay

### 1.1 כניסה לאתר
1. היכנס לאתר: **https://www.allpay.co.il/en**
2. לחץ על **"Get started"** או **"התחל עכשיו"**

### 1.2 מילוי פרטי הרשמה
תצטרך למלא:
- **פרטי עסק:**
  - שם העסק
  - מספר עוסק פטור/מורשה (או חברה בע"מ)
  - כתובת
  - טלפון
  - אימייל

- **פרטי חשבון בנק:**
  - שם הבנק
  - מספר סניף
  - מספר חשבון
  - שם בעל החשבון

- **פרטי איש קשר:**
  - שם מלא
  - תפקיד
  - טלפון
  - אימייל

### 1.3 אישור הרשמה
- Allpay יבדקו את הפרטים
- ייתכן שיצרו קשר לאימות
- תקבל אישור במייל כשהחשבון מאושר

---

## 🔑 שלב 2: קבלת API Credentials

### 2.1 כניסה לחשבון
1. היכנס ל-**Allpay Dashboard**: https://www.allpay.co.il/en
2. התחבר עם האימייל והסיסמה שלך

### 2.2 יצירת API Integration
1. לך ל-**Settings** (הגדרות)
2. בחר **API Integrations** (אינטגרציות API)
3. לחץ על **"Create Login/Key Pair"** או **"צור זוג מפתחות"**

### 2.3 שמירת Credentials
תקבל:
- **API Login** (שם משתמש ל-API)
- **API Key** (מפתח API)

⚠️ **חשוב מאוד:** שמור את ה-Credentials במקום בטוח! תצטרך אותם להגדרת המערכת.

---

## ⚙️ שלב 3: הגדרת Webhook

### 3.1 הגדרת Webhook URL
1. ב-**API Integrations** → **Webhooks**
2. הוסף Webhook URL:
   ```
   https://your-backend.railway.app/api/allpay/webhook
   ```
   (החלף `your-backend.railway.app` בכתובת ה-Railway שלך)

3. שמור את **Webhook Secret** - תצטרך אותו ל-Environment Variables

### 3.2 הגדרת Success/Cancel URLs
1. ב-**Settings** → **Payment Links**
2. הגדר:
   - **Success URL:** `https://your-app.com/paywall?success=true`
   - **Cancel URL:** `https://your-app.com/paywall?cancel=true`

---

## 🧪 שלב 4: Test Mode

### 4.1 הפעלת Test Mode
1. ב-**Settings** → **API Integrations**
2. הפעל **Test Mode**

### 4.2 כרטיסי בדיקה
Allpay מספקים כרטיסי בדיקה:

**Visa (הצלחה):**
- מספר כרטיס: `4557430402053431`
- תאריך תפוגה: כל תאריך עתידי
- CVV: כל 3 ספרות

**Mastercard (הצלחה):**
- מספר כרטיס: `5555555555554444`
- תאריך תפוגה: כל תאריך עתידי
- CVV: כל 3 ספרות

### 4.3 בדיקת API
אתה יכול לבדוק את ה-API credentials דרך:
```
https://allpay.to/app/?show=checkkeys&mode=api9
```

---

## 🔧 שלב 5: הגדרת Environment Variables

### 5.1 ב-Railway (Backend)

היכנס ל-Railway Dashboard → הפרויקט שלך → **Variables**

הוסף את המשתנים הבאים:

```bash
# Allpay Credentials
ALLPAY_LOGIN=your_api_login_here
ALLPAY_API_KEY=your_api_key_here
ALLPAY_WEBHOOK_SECRET=your_webhook_secret_here

# URLs
ALLPAY_SUCCESS_URL=https://your-app.com/paywall?success=true
ALLPAY_CANCEL_URL=https://your-app.com/paywall?cancel=true
API_URL=https://your-backend.railway.app
```

**או אם יש לך:**
```bash
RAILWAY_PUBLIC_DOMAIN=https://your-backend.railway.app
```

### 5.2 איפה למצוא את הערכים?

- **ALLPAY_LOGIN:** מ-**Settings** → **API Integrations** → **API Login**
- **ALLPAY_API_KEY:** מ-**Settings** → **API Integrations** → **API Key**
- **ALLPAY_WEBHOOK_SECRET:** מ-**Settings** → **API Integrations** → **Webhooks** → **Secret**
- **ALLPAY_SUCCESS_URL:** כתובת האפליקציה שלך + `/paywall?success=true`
- **ALLPAY_CANCEL_URL:** כתובת האפליקציה שלך + `/paywall?cancel=true`
- **API_URL:** כתובת ה-Railway Backend שלך

---

## 📦 שלב 6: הגדרת מוצרים

### 6.1 יצירת Payment Links

#### תשלום חודשי (5₪/חודש):
1. ב-**Payment Links** → **Create New**
2. הגדר:
   - **שם:** "תרומה חודשית - Stay Close"
   - **מחיר:** 5.00 ₪
   - **סוג:** Recurring (חוזר)
   - **תדירות:** חודשי
   - **Webhook URL:** `https://your-backend.railway.app/api/allpay/webhook`

#### תשלום שנתי (50₪/שנה):
1. ב-**Payment Links** → **Create New**
2. הגדר:
   - **שם:** "תרומה שנתית - Stay Close (12 חודשים)"
   - **מחיר:** 50.00 ₪
   - **סוג:** One-time (חד-פעמי)
   - **Webhook URL:** `https://your-backend.railway.app/api/allpay/webhook`

### 6.2 הערה על Recurring
- **חודשי:** Recurring = כל חודש אוטומטי
- **שנתי:** One-time = תשלום חד-פעמי (אבל מקבל 12 חודשים)

---

## 🧪 שלב 7: בדיקות

### 7.1 בדיקת API Credentials
```bash
# בדיקה דרך Allpay API Tester
https://www.allpay.co.il/en/help/allpay-api-tester
```

### 7.2 בדיקת Payment Link
1. צור Payment Link ב-Test Mode
2. נסה לשלם עם כרטיס בדיקה
3. בדוק שה-Webhook מגיע לשרת

### 7.3 בדיקת Webhook
1. בדוק שה-Webhook URL נגיש:
   ```bash
   curl https://your-backend.railway.app/api/allpay/webhook
   ```
2. בדוק שה-Webhook מקבל requests מ-Allpay
3. בדוק את ה-logs ב-Railway

---

## 📚 משאבים נוספים

### תיעוד:
- **API Reference:** https://www.allpay.co.il/en/api-reference
- **Help Center:** https://www.allpay.co.il/en/help
- **API Tester:** https://www.allpay.co.il/en/help/allpay-api-tester

### תמיכה:
- **אימייל:** info@allpay.co.il
- **טלפון:** צריך לבדוק באתר

---

## ⚠️ נקודות חשובות

### אבטחה:
1. **אל תשתף את ה-API Key** - זה סודי!
2. **שמור את ה-Credentials** במקום בטוח
3. **בדוק את ה-Webhook Signature** - תמיד!

### Test Mode:
- ✅ השתמש ב-Test Mode לפני Production
- ✅ בדוק עם כרטיסי בדיקה
- ✅ וודא שה-Webhooks עובדים

### Production:
- ⚠️ רק אחרי שבדקת הכל ב-Test Mode
- ⚠️ וודא שה-Environment Variables נכונים
- ⚠️ בדוק שה-Webhook URL נגיש

---

## ✅ Checklist

### לפני התחלה:
- [ ] נרשמת ל-Allpay
- [ ] קיבלת אישור על החשבון
- [ ] קיבלת API Login ו-API Key
- [ ] קיבלת Webhook Secret

### הגדרות:
- [ ] הוספת Environment Variables ב-Railway
- [ ] הגדרת Webhook URL ב-Allpay
- [ ] הגדרת Success/Cancel URLs
- [ ] יצרת Payment Links (חודשי + שנתי)

### בדיקות:
- [ ] בדקת API Credentials
- [ ] בדקת Payment Link ב-Test Mode
- [ ] בדקת Webhook ב-Test Mode
- [ ] בדקת Subscription creation

### Production:
- [ ] עברת ל-Production Mode
- [ ] בדקת תשלום אמיתי
- [ ] בדקת Recurring payments
- [ ] בדקת Webhooks ב-Production

---

## 🆘 בעיות נפוצות

### "Signature is incorrect"
- ✅ בדוק שה-API Key נכון
- ✅ בדוק שה-Signature generation נכון
- ✅ בדוק שה-parameters מסודרים נכון

### "Webhook not received"
- ✅ בדוק שה-Webhook URL נגיש
- ✅ בדוק שה-URL נכון (HTTPS)
- ✅ בדוק את ה-logs ב-Railway

### "Payment link not created"
- ✅ בדוק שה-API Login נכון
- ✅ בדוק שה-API Key נכון
- ✅ בדוק שה-parameters נכונים

---

## 📞 תמיכה

אם יש בעיות:
1. בדוק את ה-Allpay Help Center
2. שלח אימייל ל-info@allpay.co.il
3. בדוק את ה-logs ב-Railway

---

**מוכן להתחיל?** 🚀

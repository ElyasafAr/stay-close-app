# הגדרת xAI API - Stay Close

## מה זה xAI?

xAI היא חברת AI שנוסדה על ידי אילון מאסק, שמציעה את מודל Grok.

## התקנה

1. התקן את הספרייה:
```bash
cd backend
pip3 install requests
```

או:
```bash
pip3 install -r requirements.txt
```

## הגדרת מפתח API

1. היכנס ל-https://console.x.ai/
2. היכנס לחשבון שלך (או צור חשבון חדש)
3. לך ל-API Keys
4. לחץ על "Create API Key"
5. העתק את המפתח

## הוספת המפתח לקובץ .env

עדכן את קובץ `.env` בתיקיית `backend/`:

```env
XAI_API_KEY=xai-your_api_key_here
```

או אם יש לך כבר `GROQ_API_KEY`, הקוד יתמוך בשניהם.

## מודלים זמינים

האפליקציה משתמשת במודל `grok-4-1-fast-reasoning` שהוא:
- ⚡ מהיר מאוד עם יכולת חשיבה
- 💰 בתשלום (ראה תעריפים באתר xAI)
- 🇮🇱 תומך בעברית
- 🧠 יכול לחשוב לפני תשובה (reasoning)

## בדיקה

לאחר הגדרת המפתח, בדוק שהכל עובד:

```bash
cd backend
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); key = os.getenv('XAI_API_KEY') or os.getenv('GROQ_API_KEY'); print('XAI_API_KEY:', 'מוגדר ✅' if key else 'לא מוגדר ❌')"
```

## הפעלת השרת

לאחר הגדרת המפתח, הפעל מחדש את השרת:

```bash
cd backend
python3 main.py
```

## הערות

- המפתח נשמר בקובץ `.env` שלא נשמר ב-Git
- שמור על המפתח בסוד
- יש תעריפים על השימוש (ראה באתר xAI)
- xAI API דורש הרשמה ותשלום (בניגוד ל-GROQ החינמי)


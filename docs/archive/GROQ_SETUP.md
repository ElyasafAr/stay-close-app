# הגדרת GROQ API - Stay Close

## מה זה GROQ?

GROQ היא פלטפורמת AI מהירה שמספקת API דומה ל-OpenAI, אבל עם ביצועים מהירים יותר ומחירים נמוכים יותר.

## התקנה

1. התקן את הספרייה:
```bash
cd backend
pip3 install groq
```

או:
```bash
pip3 install -r requirements.txt
```

## הגדרת מפתח API

1. היכנס ל-https://console.groq.com/keys
2. היכנס לחשבון שלך (או צור חשבון חדש - חינמי!)
3. לחץ על "Create API Key"
4. העתק את המפתח

⚠️ **חשוב:** המפתח צריך להתחיל ב-`gsk_` או `sk-` (לא `xai-`!)

## הוספת המפתח לקובץ .env

צור קובץ `.env` בתיקיית `backend/` עם התוכן הבא:

```env
GROQ_API_KEY=your_groq_api_key_here
```

או הוסף את השורה לקובץ `.env` הקיים.

## מודלים זמינים

האפליקציה משתמשת במודל `llama-3.1-8b-instant` שהוא:
- ⚡ מהיר מאוד
- 💰 חינמי (עם מגבלות)
- 🇮🇱 תומך בעברית

מודלים נוספים שתוכל להשתמש בהם:
- `llama-3.1-70b-versatile` - חזק יותר אבל איטי יותר
- `mixtral-8x7b-32768` - טוב לטקסטים ארוכים

## בדיקה

לאחר הגדרת המפתח, בדוק שהכל עובד:

```bash
cd backend
python3 -c "import os; from groq import Groq; key = os.getenv('GROQ_API_KEY'); print('GROQ_API_KEY:', 'מוגדר' if key else 'לא מוגדר')"
```

## הפעלת השרת

לאחר הגדרת המפתח, הפעל מחדש את השרת:

```bash
cd backend
python3 main.py
```

## יתרונות GROQ

- ✅ מהיר מאוד - תגובות תוך שניות
- ✅ חינמי - עם מגבלות נדיבות
- ✅ תומך בעברית
- ✅ API פשוט ונוח

## הערות

- המפתח נשמר בקובץ `.env` שלא נשמר ב-Git
- שמור על המפתח בסוד
- יש מגבלות על מספר הבקשות לדקה (ראה באתר GROQ)


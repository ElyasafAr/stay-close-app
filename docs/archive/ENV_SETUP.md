# הגדרת משתני סביבה - Stay Close

## קובץ .env

צור קובץ `.env` בשורש הפרויקט עם התוכן הבא:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
DATABASE_URL=postgresql://user:password@host:port/database

# GROQ API (חובה ליצירת הודעות עם AI)
# קבל מפתח מ: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Environment
NODE_ENV=development
```

## קובץ backend/.env

צור קובץ `.env` בתיקיית `backend/` עם התוכן הבא:

```env
# GROQ API Key (חובה ליצירת הודעות עם AI)
GROQ_API_KEY=your_groq_api_key_here

# Frontend URL (אופציונלי)
FRONTEND_URL=http://localhost:3000

# Database URL (אופציונלי)
DATABASE_URL=postgresql://user:password@host:port/database
```

## איך ליצור את הקבצים

### Windows (PowerShell)

```powershell
# בשורש הפרויקט
@"
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI API
GROQ_API_KEY=your_groq_api_key_here

# Environment
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8

# בתיקיית backend
cd backend
@"
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:port/database
"@ | Out-File -FilePath ".env" -Encoding utf8
```

### Linux/Mac

```bash
# בשורש הפרויקט
cat > .env << 'EOF'
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI API
GROQ_API_KEY=your_groq_api_key_here

# Environment
NODE_ENV=development
EOF

# בתיקיית backend
cd backend
cat > .env << 'EOF'
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:port/database
EOF
```

## קבלת מפתח GROQ API

1. היכנס ל-https://console.groq.com/keys
2. היכנס לחשבון שלך (או צור חשבון חדש)
3. לחץ על "Create API Key"
4. העתק את המפתח והדבק אותו במקום `your_groq_api_key_here`

## הערות חשובות

- ⚠️ **אל תעלה את קובץ .env ל-Git!** הקובץ כבר ב-.gitignore
- 🔒 שמור על המפתח שלך בסוד
- 💰 GROQ מציע API חינמי עם מגבלות (ראה תעריפים באתר GROQ)
- 🔄 לאחר יצירת הקובץ, הפעל מחדש את השרת

## בדיקה

לאחר יצירת הקובץ, ודא שהשרת קורא את המשתנים:

```bash
# Backend
cd backend
python3 -c "import os; print('GROQ_API_KEY:', 'מוגדר' if os.getenv('GROQ_API_KEY') else 'לא מוגדר')"
```


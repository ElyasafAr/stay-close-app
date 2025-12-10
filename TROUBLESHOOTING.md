# פתרון בעיות - Stay Close

## האתר לא זז / לא נטען

### 1. בדוק את הקונסול בדפדפן

פתח את Developer Tools (F12) ובדוק את הלשונית Console לשגיאות.

### 2. בדוק שהשרת רץ

```bash
# בדוק אם Next.js רץ
# אמור לראות: "Ready in X ms" או "Local: http://localhost:300X"
```

### 3. בדוק שגיאות נפוצות

#### שגיאת localStorage
אם אתה רואה שגיאה על `localStorage is not defined`:
- זה תוקן בקוד - ודא שהשרת רץ מחדש

#### שגיאת Import
אם אתה רואה שגיאת import:
```bash
# נסה למחוק את .next ולבנות מחדש
rm -rf .next
npm run dev
```

#### שגיאת CORS
אם אתה רואה שגיאת CORS:
- ודא שה-backend רץ על פורט 8000
- ודא שה-CORS מוגדר נכון ב-backend

### 4. בדיקות מהירות

#### בדוק שהקבצים קיימים:
```bash
# בדוק את הקבצים החשובים
ls app/layout.tsx
ls app/page.tsx
ls components/Header.tsx
ls i18n/useTranslation.ts
ls i18n/he.json
```

#### בדוק את ה-build:
```bash
npm run build
```

### 5. פתרונות מהירים

#### פתרון 1: הפעל מחדש הכל
```bash
# עצור את השרת (Ctrl+C)
# מחק את .next
rm -rf .next
# הפעל מחדש
npm run dev
```

#### פתרון 2: נקה cache
```bash
# מחק node_modules ו-.next
rm -rf node_modules .next
npm install
npm run dev
```

#### פתרון 3: בדוק את הפורט
```bash
# בדוק איזה פורט Next.js משתמש
# אמור לראות: "Local: http://localhost:300X"
# פתח את הכתובת הנכונה בדפדפן
```

### 6. בדיקת שגיאות ספציפיות

#### אם הדף לבן לחלוטין:
- בדוק את הקונסול לשגיאות JavaScript
- בדוק את Network tab לראות אם קבצים נטענים

#### אם הדף נטען אבל לא מגיב:
- בדוק את הקונסול לשגיאות
- בדוק אם יש שגיאות ב-useTranslation
- בדוק אם Header נטען

### 7. לוגים לבדיקה

פתח את הקונסול בדפדפן ובדוק:
- שגיאות אדומות
- אזהרות צהובות
- הודעות Network

### 8. יצירת קשר

אם הבעיה נמשכת, ציין:
1. מה אתה רואה בדף (דף לבן? שגיאה?)
2. מה יש בקונסול (שגיאות?)
3. איזה פורט השרת רץ עליו
4. האם ה-backend רץ


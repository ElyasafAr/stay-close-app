# 🔧 Migration: Add default_tone Column

## הבעיה
העמודה `default_tone` לא קיימת בטבלת `contacts` במסד הנתונים, מה שגורם לשגיאות:
```
column contacts.default_tone does not exist
```

## ✅ הפתרון

### אופציה 1: אוטומטי (מומלץ)
הקוד עודכן כך שה-migration רץ אוטומטית בעת הפעלת השרת.

**פשוט דחוף את הקוד ל-GitHub ו-Railway יעשה deploy:**
```powershell
.\push_to_git.ps1
```

השרת יוסיף את העמודה אוטומטית בעת הפעלה.

### אופציה 2: ידני - דרך Railway Dashboard

1. היכנס ל-Railway Dashboard
2. בחר את ה-PostgreSQL Service
3. לחץ על **"Query"** tab
4. העתק והדבק את התוכן מ-`backend/add_default_tone.sql`:
   ```sql
   DO $$ 
   BEGIN
       IF NOT EXISTS (
           SELECT 1 
           FROM information_schema.columns 
           WHERE table_name = 'contacts' AND column_name = 'default_tone'
       ) THEN
           ALTER TABLE contacts 
           ADD COLUMN default_tone VARCHAR DEFAULT 'friendly';
           
           UPDATE contacts 
           SET default_tone = 'friendly' 
           WHERE default_tone IS NULL;
           
           RAISE NOTICE 'Column default_tone added successfully';
       ELSE
           RAISE NOTICE 'Column default_tone already exists';
       END IF;
   END $$;
   ```
5. לחץ **"Run"**

### אופציה 3: ידני - Python Script

אם יש לך גישה ל-Railway CLI או SSH:

```bash
cd backend
python add_default_tone_column.py
```

## ✅ בדיקה

לאחר ה-migration, בדוק:

1. **ב-Railway PostgreSQL Query:**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'contacts' AND column_name = 'default_tone';
   ```
   
   אמור להחזיר:
   ```
   column_name  | data_type | column_default
   default_tone | varchar   | 'friendly'
   ```

2. **נסה ליצור contact חדש** דרך האפליקציה - אמור לעבוד!

## 📝 קבצים שנוצרו

- `backend/add_default_tone_column.py` - Python migration script
- `backend/add_default_tone.sql` - SQL migration script
- `backend/database.py` - עודכן לרוץ migration אוטומטית

## ⚠️ הערות

- ה-migration בטוח - לא מוחק נתונים
- אם העמודה כבר קיימת, ה-migration ידלג
- ערך ברירת מחדל: `'friendly'`





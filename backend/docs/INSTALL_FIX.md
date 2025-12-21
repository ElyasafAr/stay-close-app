# 🔧 תיקון בעיית התקנת תלויות

אם אתה מקבל שגיאה `ModuleNotFoundError: No module named 'jose'`, בצע את השלבים הבאים:

## פתרון מהיר

### שלב 1: פתח PowerShell או CMD בתיקיית backend

```powershell
cd "C:\Elyasaf\Stay close app\backend"
```

### שלב 2: התקן את התלויות אחת אחת

```powershell
python3 -m pip install python-jose[cryptography]
python3 -m pip install passlib[bcrypt]
python3 -m pip install authlib
```

אם `python3` לא עובד, נסה:
```powershell
python -m pip install python-jose[cryptography]
python -m pip install passlib[bcrypt]
python -m pip install authlib
```

### שלב 3: בדוק שההתקנה עבדה

```powershell
python3 -c "from jose import jwt; print('SUCCESS')"
```

אם אתה רואה `SUCCESS` - הכל תקין!

### שלב 4: הרץ את השרת

```powershell
python3 main.py
```

---

## אם עדיין לא עובד

### אפשרות 1: התקן את כל התלויות מחדש

```powershell
python3 -m pip install -r requirements.txt --force-reinstall
```

### אפשרות 2: בדוק איזה Python אתה משתמש

```powershell
python3 --version
python3 -m pip --version
python3 -c "import sys; print(sys.executable)"
```

### אפשרות 3: התקן עם pip ישירות

```powershell
pip install python-jose[cryptography] passlib[bcrypt] authlib
```

---

## פתרון בעיות נפוצות

### "python3 לא מזוהה כפקודה"
→ נסה `python` במקום `python3`

### "pip לא מזוהה"
→ התקן pip: `python -m ensurepip --upgrade`

### "Permission denied"
→ הוסף `--user`:
```powershell
python3 -m pip install --user python-jose[cryptography]
```

---

## בדיקה סופית

לאחר ההתקנה, הרץ:

```powershell
python3 main.py
```

השרת צריך להתחיל ולהציג:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

**אם עדיין יש בעיות, שלח את הודעת השגיאה המלאה!**


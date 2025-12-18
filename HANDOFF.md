# Stay Close App - Handoff Document
**תאריך:** דצמבר 2024  
**גרסה:** 1.3.0

---

## 📱 סקירה כללית

**Stay Close** היא אפליקציה שעוזרת לשמור על קשר עם אנשים חשובים.  
האפליקציה מאפשרת:
- ניהול אנשי קשר
- יצירת הודעות מותאמות אישית באמצעות AI
- תזכורות אוטומטיות
- התראות Push

---

## 🏗️ ארכיטקטורה

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │   Database      │
│   (Next.js)     │────▶│   (FastAPI)     │────▶│  (PostgreSQL)   │
│   + Capacitor   │     │   Python 3.11   │     │   Railway       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   Firebase      │
        │               │   - Auth        │
        │               │   - FCM (Push)  │
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Android App   │
│   (Capacitor)   │
└─────────────────┘
```

### טכנולוגיות:
| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | Next.js 14, React, TypeScript, CSS Modules |
| Mobile | Capacitor (Android) |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL (Railway) |
| Auth | Firebase Authentication |
| Push | Firebase Cloud Messaging |
| AI | xAI (Grok) / Groq |
| Hosting | Railway (Backend + DB), Vercel (Frontend) |

---

## 📁 מבנה הפרויקט

```
Stay close app/
├── app/                    # Next.js App Router pages
│   ├── about/             # דף אודות
│   ├── admin/             # דף ניהול (Admin only)
│   ├── contacts/          # ניהול אנשי קשר
│   ├── login/             # התחברות/הרשמה
│   ├── messages/          # יצירת הודעות
│   ├── paywall/           # מסך שדרוג
│   ├── privacy/           # מדיניות פרטיות
│   ├── settings/          # הגדרות
│   └── terms/             # תנאי שימוש
├── backend/               # FastAPI Backend
│   ├── main.py           # Main app + all endpoints
│   ├── models.py         # SQLAlchemy models
│   ├── database.py       # DB connection + migrations
│   ├── auth.py           # Authentication
│   ├── encryption.py     # AES encryption
│   ├── usage_limiter.py  # Paywall logic
│   ├── subscription_service.py  # Subscriptions
│   └── coupon_service.py # Coupons
├── components/            # React components
├── services/              # API services
├── android/               # Capacitor Android project
└── public/                # Static files
```

---

## 🗄️ Database Schema

### טבלאות:

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR PK | User ID |
| username_hash | VARCHAR | SHA256 for lookup |
| username_encrypted | VARCHAR | AES encrypted |
| email_hash | VARCHAR | SHA256 for lookup |
| email_encrypted | VARCHAR | AES encrypted |
| password_hash | VARCHAR | bcrypt hash |
| notification_platform | VARCHAR | 'phone'/'browser'/'both' |
| trial_started_at | TIMESTAMP | Trial start date |
| subscription_status | VARCHAR | 'trial'/'free'/'premium' |

#### `contacts`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Contact ID |
| user_id | VARCHAR FK | Owner |
| name_encrypted | VARCHAR | AES encrypted |
| default_tone | VARCHAR | 'friendly'/'warm'/etc |

#### `reminders`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Reminder ID |
| user_id | VARCHAR FK | Owner |
| contact_id | INTEGER FK | Related contact |
| reminder_type | VARCHAR | 'one_time'/'recurring'/'weekly'/'daily' |
| interval_type | VARCHAR | 'hours'/'days' |
| interval_value | INTEGER | Interval amount |
| next_trigger | TIMESTAMP | Next trigger time |

#### `subscriptions`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Subscription ID |
| user_id | VARCHAR FK | Owner |
| plan_type | VARCHAR | 'monthly'/'yearly' |
| status | VARCHAR | 'active'/'cancelled'/'expired' |
| google_order_id | VARCHAR | Google Play order |
| expires_at | TIMESTAMP | Expiry date |
| price_paid | FLOAT | Price in ILS |

#### `coupons`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Coupon ID |
| code | VARCHAR UNIQUE | Coupon code |
| coupon_type | VARCHAR | 'trial_extension'/'discount_percent'/'discount_fixed'/'free_period' |
| value | INTEGER | Days or percentage |
| max_uses | INTEGER | Max total uses |
| is_active | BOOLEAN | Active status |

#### `coupon_usages`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Usage ID |
| coupon_id | INTEGER FK | Coupon |
| user_id | VARCHAR FK | User |
| applied_to | VARCHAR | What it was applied to |

#### `app_settings`
| Column | Type | Description |
|--------|------|-------------|
| key | VARCHAR PK | Setting key |
| value | TEXT | Setting value |
| description | VARCHAR | Description |

#### `usage_stats`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Stat ID |
| user_id | VARCHAR FK | User |
| date | DATE | Usage date |
| messages_generated | INTEGER | Count |

#### `push_tokens`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Token ID |
| user_id | VARCHAR FK | User |
| token | TEXT UNIQUE | FCM token |
| device_info | TEXT | JSON with platform info |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | הרשמה |
| POST | `/api/auth/login` | התחברות |
| POST | `/api/auth/firebase` | Firebase login |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | רשימת אנשי קשר |
| POST | `/api/contacts` | יצירת איש קשר |
| PUT | `/api/contacts/{id}` | עדכון |
| DELETE | `/api/contacts/{id}` | מחיקה |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders` | רשימת תזכורות |
| POST | `/api/reminders` | יצירת תזכורת |
| PUT | `/api/reminders/{id}` | עדכון |
| DELETE | `/api/reminders/{id}` | מחיקה |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/generate` | יצירת הודעה (AI) |

### Usage & Subscription
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usage/status` | סטטוס שימוש |
| GET | `/api/subscription/status` | סטטוס מנוי |
| POST | `/api/subscription/verify` | אימות רכישה |
| POST | `/api/subscription/cancel` | ביטול מנוי |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupon/validate` | אימות קופון |
| POST | `/api/coupon/apply` | הפעלת קופון |

### Admin (requires admin email)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | סטטיסטיקות |
| GET | `/api/admin/settings` | הגדרות |
| PUT | `/api/admin/settings` | עדכון הגדרה |
| GET | `/api/admin/coupons` | רשימת קופונים |
| POST | `/api/admin/coupons` | יצירת קופון |
| PUT | `/api/admin/coupons/{id}/toggle` | הפעלה/השבתה |

### Account
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/account` | מחיקת חשבון |

---

## 💰 מודל עסקי (Paywall)

### תקופת ניסיון:
- 14 ימים
- גישה מלאה לכל הפיצ'רים

### משתמש חינמי (אחרי Trial):
- 3 הודעות ליום
- 30 הודעות לחודש
- 2 אנשי קשר מקסימום

### מנוי פרימיום:
| תוכנית | מחיר השקה | מחיר רגיל |
|--------|-----------|-----------|
| חודשי | 9.90₪ | 14.90₪ |
| שנתי | 69.90₪ | 99.90₪ |

### סוגי קופונים:
| סוג | תיאור |
|-----|-------|
| trial_extension | הארכת Trial בימים |
| discount_percent | הנחה באחוזים |
| discount_fixed | הנחה בשקלים |
| free_period | תקופת Premium חינם |

---

## 🔐 אבטחה

### הצפנת מידע:
- **שמות משתמש:** AES-256 encryption
- **אימיילים:** AES-256 encryption
- **שמות אנשי קשר:** AES-256 encryption
- **סיסמאות:** bcrypt hash
- **חיפוש:** SHA-256 hash (לא ניתן לפענוח)

### Environment Variables:
```
# Backend
DATABASE_URL=postgresql://...
SECRET_KEY=...
ENCRYPTION_KEY=... (32 bytes base64)
XAI_API_KEY=...
FIREBASE_CREDENTIALS=... (JSON base64)

# Frontend
NEXT_PUBLIC_API_URL=https://...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 👤 הגדרת מנהל (Admin)

### דרך SQL ב-Railway:
```sql
INSERT INTO app_settings (key, value, description)
VALUES ('admin_emails', '["your@email.com"]', 'JSON array of admin email addresses')
ON CONFLICT (key) DO UPDATE SET value = '["your@email.com"]';
```

### מה מנהל יכול:
- צפייה בסטטיסטיקות (משתמשים, הודעות, הכנסות)
- שינוי הגדרות (מחירים, הגבלות)
- יצירה וניהול קופונים
- כפתור חירום להשבתת Freemium

---

## 🚧 מה נשאר לעשות

### באגים לתקן:
- [ ] **Timezone bug** - `usage_limiter.py` line 73 משתמש ב-`datetime.utcnow()` במקום `utc_now()`

### פיצ'רים חסרים:
- [ ] **deleteData function** - להוסיף ל-`services/api.ts`
- [ ] **Checkbox הסכמה** - בדף ההרשמה
- [ ] **Google Play Billing** - אינטגרציה לתשלומים

### לפני העלאה ל-Play Store:
- [ ] אימות זהות ב-Google Play Console
- [ ] יצירת מוצרי מנוי ב-Console
- [ ] Internal Testing
- [ ] מילוי פרטי האפליקציה

---

## 🔧 פקודות חשובות

### פיתוח:
```bash
# Frontend
npm run dev

# Backend
cd backend
python -m uvicorn main:app --reload

# Build for Capacitor
$env:CAPACITOR_BUILD="true"; npm run build
npx cap sync android
```

### Deployment:
```bash
# Push to git (triggers Railway deploy)
git add -A
git commit -m "message"
git push
```

---

## 📞 יצירת קשר

- **מייל:** elyasaf.ar@gmail.com
- **GitHub:** https://github.com/ElyasafAr/stay-close-app

---

## 📝 הערות נוספות

1. **Firebase Config** נמצא ב-`.env.local` (לא ב-git)
2. **Backend מתארח ב-Railway** - deploy אוטומטי מ-main branch
3. **Frontend** - יכול להיות ב-Vercel או Railway
4. **Android** - לפתוח ב-Android Studio מתיקיית `android/`

---

*Last updated: December 2024*

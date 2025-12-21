# 📱 תכנון: Local Notifications לאנדרואיד

## 🎯 המטרה
לממש התראות מקומיות באנדרואיד ללא תלות בשרת, תוך שמירה על סנכרון עם השרת.

---

## 🔄 ארכיטקטורה מוצעת

### אופציה 1: Local Notifications בלבד (מומלץ לאנדרואיד)
```
┌─────────────────────────────────────────┐
│  Android App (Capacitor)                │
│  ┌───────────────────────────────────┐  │
│  │  Local Notifications Plugin       │  │
│  │  - מתזמן התראות מקומית           │  │
│  │  - עובד גם כשהאפליקציה סגורה     │  │
│  │  - לא צריך אינטרנט               │  │
│  └───────────────────────────────────┘  │
│           │                              │
│           │ סנכרון                        │
│           ▼                              │
│  ┌───────────────────────────────────┐  │
│  │  Backend (PostgreSQL)             │  │
│  │  - שמירת תזכורות                 │  │
│  │  - סנכרון בין מכשירים             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**יתרונות:**
- ✅ עובד גם בלי אינטרנט
- ✅ לא צריך Background Job בשרת
- ✅ פחות עומס על השרת
- ✅ יותר אמין

**חסרונות:**
- ⚠️ צריך לסנכרן תזכורות מהשרת למכשיר
- ⚠️ אם משתמש מחליף מכשיר, צריך לסנכרן מחדש

---

### אופציה 2: היברידי (Local + Push)
```
Android: Local Notifications (עיקרי) + Push (גיבוי)
Web: Push Notifications (כרגיל)
```

**יתרונות:**
- ✅ עובד גם בלי אינטרנט (Local)
- ✅ גיבוי דרך Push אם Local נכשל
- ✅ עובד גם ב-Web

**חסרונות:**
- ⚠️ יותר מורכב לניהול
- ⚠️ צריך לנהל גם Local וגם Push

---

## 🛠️ יישום מוצע

### שלב 1: התקנת Plugin
```bash
npm install @capacitor/local-notifications
npx cap sync android
```

### שלב 2: יצירת שירות Local Notifications

**קובץ חדש: `services/localNotifications.ts`**
```typescript
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { Reminder } from './reminders'

/**
 * שירות להתראות מקומיות באנדרואיד
 */

export async function scheduleLocalNotification(reminder: Reminder, contactName: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    console.log('⚠️ [LocalNotifications] Not on Android, skipping local notification')
    return
  }

  // בקשת הרשאות
  const permStatus = await LocalNotifications.checkPermissions()
  if (permStatus.display !== 'granted') {
    const requestResult = await LocalNotifications.requestPermissions()
    if (requestResult.display !== 'granted') {
      throw new Error('Notification permission denied')
    }
  }

  // חישוב תאריך ההתראה
  const scheduleTime = reminder.next_trigger
  if (!scheduleTime) {
    throw new Error('No next_trigger time')
  }

  // בניית טקסט התראה
  const reminderText = buildReminderText(reminder)
  const body = `הגיע הזמן לשלוח הודעה ל-${contactName}\n(${reminderText})`

  // תזמון התראה
  await LocalNotifications.schedule({
    notifications: [
      {
        id: reminder.id, // משתמש ב-ID של התזכורת
        title: 'זמן לשלוח הודעה! 💌',
        body: body,
        schedule: {
          at: new Date(scheduleTime),
          repeats: shouldRepeat(reminder),
          every: getRepeatInterval(reminder)
        },
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        extra: {
          reminderId: reminder.id,
          contactId: reminder.contact_id
        }
      }
    ]
  })
}

/**
 * ביטול התראה מקומית
 */
export async function cancelLocalNotification(reminderId: number): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  await LocalNotifications.cancel({
    notifications: [{ id: reminderId }]
  })
}

/**
 * ביטול כל ההתראות המקומיות
 */
export async function cancelAllLocalNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  await LocalNotifications.cancelAll()
}

/**
 * סנכרון כל התזכורות מהשרת למכשיר
 */
export async function syncRemindersFromServer(reminders: Reminder[], contactNames: Map<number, string>): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  // ביטול כל ההתראות הקיימות
  await cancelAllLocalNotifications()

  // תזמון מחדש של כל התזכורות הפעילות
  for (const reminder of reminders) {
    if (reminder.enabled && reminder.next_trigger) {
      const contactName = contactNames.get(reminder.contact_id) || 'איש קשר'
      try {
        await scheduleLocalNotification(reminder, contactName)
      } catch (error) {
        console.error(`Failed to schedule reminder ${reminder.id}:`, error)
      }
    }
  }
}
```

### שלב 3: עדכון ReminderModal

**בקובץ `components/ReminderModal.tsx`:**

לאחר יצירת/עדכון תזכורת בשרת, נזמן גם את Local Notifications:

```typescript
import { scheduleLocalNotification, cancelLocalNotification } from '@/services/localNotifications'

// אחרי יצירת תזכורת מוצלחת:
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
  if (enabled && newReminder.next_trigger) {
    await scheduleLocalNotification(newReminder, contactName)
  }
}

// אחרי עדכון תזכורת:
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
  if (enabled && updatedReminder.next_trigger) {
    await scheduleLocalNotification(updatedReminder, contactName)
  } else {
    await cancelLocalNotification(updatedReminder.id)
  }
}

// אחרי מחיקת תזכורת:
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
  await cancelLocalNotification(reminderId)
}
```

### שלב 4: סנכרון בעת טעינת האפליקציה

**בקובץ `app/layout.tsx` או קומפוננטה מתאימה:**

```typescript
import { syncRemindersFromServer } from '@/services/localNotifications'
import { getReminders } from '@/services/reminders'
import { getContacts } from '@/services/contacts'
import { Capacitor } from '@capacitor/core'

useEffect(() => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    // סנכרון תזכורות בעת טעינת האפליקציה
    const syncReminders = async () => {
      try {
        const reminders = await getReminders()
        const contacts = await getContacts()
        const contactNames = new Map(contacts.map(c => [c.id, c.name]))
        await syncRemindersFromServer(reminders, contactNames)
      } catch (error) {
        console.error('Failed to sync reminders:', error)
      }
    }
    syncReminders()
  }
}, [])
```

---

## 🔄 זרימת עבודה

### יצירת תזכורת חדשה:
1. משתמש יוצר תזכורת ב-ReminderModal
2. שומרים בשרת (POST `/api/reminders`)
3. אם אנדרואיד → מתזמנים Local Notification
4. אם Web → השרת ישלח Push (כרגיל)

### עדכון תזכורת:
1. משתמש מעדכן תזכורת
2. מעדכנים בשרת (PUT `/api/reminders/{id}`)
3. אם אנדרואיד → מבטלים התראה ישנה + מתזמנים חדשה
4. אם Web → השרת ישלח Push (כרגיל)

### מחיקת תזכורת:
1. משתמש מוחק תזכורת
2. מוחקים בשרת (DELETE `/api/reminders/{id}`)
3. אם אנדרואיד → מבטלים Local Notification

### סנכרון:
- בעת טעינת האפליקציה → מורידים תזכורות מהשרת ומתזמנים במכשיר
- בעת שינוי תזכורת → מעדכנים גם במכשיר

---

## ⚙️ הגדרות Android

**בקובץ `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
```

---

## 🎯 סיכום

**מה נדרש:**
1. ✅ התקנת `@capacitor/local-notifications`
2. ✅ יצירת `services/localNotifications.ts`
3. ✅ עדכון `ReminderModal.tsx` לתזמון התראות
4. ✅ סנכרון בעת טעינת האפליקציה
5. ✅ עדכון `ReminderChecker.tsx` (אולי להסיר - לא צריך יותר)

**יתרונות:**
- ✅ עובד גם בלי אינטרנט
- ✅ פחות עומס על השרת
- ✅ יותר אמין
- ✅ עובד גם כשהאפליקציה סגורה

**האם להמשיך עם זה?**

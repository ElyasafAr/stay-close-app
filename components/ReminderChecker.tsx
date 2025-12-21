'use client'

import { useEffect } from 'react'
import { checkReminders, getReminders } from '@/services/reminders'
import { getContact, getContacts } from '@/services/contacts'
import { requestNotificationPermission, startReminderChecker } from '@/services/notifications'
import { syncRemindersFromServer, isAndroid } from '@/services/localNotifications'
import { isAuthenticated } from '@/services/auth'

/**
 * קומפוננטה לבדיקה תקופתית של התראות
 */
export function ReminderChecker() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // סנכרון תזכורות לאנדרואיד בעת טעינת האפליקציה
    const syncRemindersOnLoad = async () => {
      if (!isAuthenticated()) {
        return
      }

      // רק באנדרואיד - סנכרון תזכורות מהשרת למכשיר
      if (isAndroid()) {
        try {
          console.log('🔄 [ReminderChecker] Syncing reminders from server for Android...')
          const reminders = await getReminders()
          const contacts = await getContacts()
          // סנן רק contacts עם id מוגדר
          const contactNames = new Map(
            contacts
              .filter(c => c.id !== undefined)
              .map(c => [c.id!, c.name])
          )
          await syncRemindersFromServer(reminders, contactNames)
          console.log('✅ [ReminderChecker] Reminders synced successfully')
        } catch (error) {
          console.error('❌ [ReminderChecker] Failed to sync reminders:', error)
          // לא נכשיל את האפליקציה אם יש בעיה בסנכרון
        }
      }
    }

    // סנכרון ראשוני
    syncRemindersOnLoad()

    // לא מבקשים הרשאה כאן - רק כשמגדירים תזכורת
    // הבקשה תופיע ב-ReminderModal כשמגדירים תזכורת חדשה

    // התחלת בדיקה תקופתית - רק אם המשתמש מחובר
    // הערה: באנדרואיד, ההתראות המקומיות יעבדו גם בלי בדיקה תקופתית
    // ב-Web, אנחנו משתמשים ב-Push Notifications (FCM) מהשרת,
    // ולכן אין צורך לבצע Polling מה-frontend (חוסך זיכרון ומשאבי שרת).
    /*
    const cleanup = startReminderChecker(
      async () => {
        // ...
      }
    )
    return cleanup
    */
  }, [])

  return null // קומפוננטה לא מציגה כלום
}


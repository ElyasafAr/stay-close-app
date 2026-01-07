'use client'

import { useEffect } from 'react'
import { getReminders } from '@/services/reminders'
import { getContacts } from '@/services/contacts'
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
        console.log('[NOTIF] ⚠️ User not authenticated, skipping reminder sync')
        return
      }

      // רק באנדרואיד - סנכרון תזכורות מהשרת למכשיר
      if (isAndroid()) {
        try {
          console.log('[NOTIF] 🔄 Syncing reminders from server for Android...')
          const reminders = await getReminders()
          const contacts = await getContacts()
          // סנן רק contacts עם id מוגדר
          const contactNames = new Map(
            contacts
              .filter(c => c.id !== undefined)
              .map(c => [c.id!, c.name])
          )
          await syncRemindersFromServer(reminders, contactNames)
          console.log('[NOTIF] ✅ Reminders synced successfully from server')
        } catch (error) {
          console.error('[NOTIF] ❌ Failed to sync reminders from server:', error)
          // לא נכשיל את האפליקציה אם יש בעיה בסנכרון
        }
      } else {
        console.log('[NOTIF] ℹ️ Not on Android, skipping local notification sync')
      }
    }

    // סנכרון ראשוני
    syncRemindersOnLoad()

    // NOTE: FCM and browser polling have been removed.
    // Reminders are now handled entirely by Android local notifications.
    // No permission request or polling needed here.
  }, [])

  return null // קומפוננטה לא מציגה כלום
}


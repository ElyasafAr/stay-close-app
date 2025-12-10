'use client'

import { useEffect } from 'react'
import { checkReminders } from '@/services/reminders'
import { getContact } from '@/services/contacts'
import { requestNotificationPermission, startReminderChecker } from '@/services/notifications'

/**
 * קומפוננטה לבדיקה תקופתית של התראות
 */
export function ReminderChecker() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // בקשת הרשאה להתראות
    requestNotificationPermission().then((granted) => {
      if (granted) {
        console.log('✅ הרשאה להתראות ניתנה')
      } else {
        console.warn('⚠️ הרשאה להתראות נדחתה')
      }
    })

    // התחלת בדיקה תקופתית
    const cleanup = startReminderChecker(
      async () => {
        try {
          return await checkReminders()
        } catch (error) {
          console.error('שגיאה בבדיקת התראות:', error)
          return []
        }
      },
      async (contactId: number) => {
        try {
          return await getContact(contactId)
        } catch (error) {
          console.error('שגיאה בטעינת איש קשר:', error)
          throw error
        }
      }
    )

    return cleanup
  }, [])

  return null // קומפוננטה לא מציגה כלום
}


'use client'

import { useEffect } from 'react'
import { checkReminders } from '@/services/reminders'
import { getContact } from '@/services/contacts'
import { requestNotificationPermission, startReminderChecker } from '@/services/notifications'
import { isAuthenticated } from '@/services/auth'

/**
 * קומפוננטה לבדיקה תקופתית של התראות
 */
export function ReminderChecker() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // לא מבקשים הרשאה כאן - רק כשמגדירים תזכורת
    // הבקשה תופיע ב-ReminderModal כשמגדירים תזכורת חדשה

    // התחלת בדיקה תקופתית - רק אם המשתמש מחובר
    const cleanup = startReminderChecker(
      async () => {
        // בדיקה אם המשתמש מחובר לפני ניסיון לבדוק התראות
        if (!isAuthenticated()) {
          return [] // אם לא מחובר, מחזירים רשימה ריקה בשקט
        }
        
        try {
          return await checkReminders()
        } catch (error) {
          // אם יש שגיאת authentication, לא נדפיס שגיאה (יכול להיות שהמשתמש התנתק)
          if (error instanceof Error && error.message.includes('Not authenticated')) {
            return []
          }
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


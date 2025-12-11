'use client'

import { Reminder } from './reminders'
import { Contact } from './contacts'

/**
 * שירות להתראות דפדפן
 */

let notificationPermission: NotificationPermission = 'default'

/**
 * בקשת הרשאה להתראות
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('הדפדפן לא תומך בהתראות')
    return false
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted'
    return true
  }

  if (Notification.permission === 'denied') {
    notificationPermission = 'denied'
    return false
  }

  const permission = await Notification.requestPermission()
  notificationPermission = permission
  return permission === 'granted'
}

/**
 * הצגת התראה
 */
export function showNotification(reminder: Reminder, contact: Contact): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (notificationPermission !== 'granted') {
    return
  }

  // בניית טקסט התראה לפי סוג ההתראה
  let reminderText = ''
  if (reminder.reminder_type === 'one_time') {
    reminderText = 'תאריך ספציפי'
  } else if (reminder.reminder_type === 'recurring') {
    const intervalText = reminder.interval_type === 'hours' 
      ? `${reminder.interval_value} שעות`
      : `${reminder.interval_value} ימים`
    reminderText = `כל ${intervalText}`
  } else if (reminder.reminder_type === 'weekly') {
    const weekdayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    const days = reminder.weekdays?.map(d => weekdayNames[d]).join(', ') || ''
    reminderText = `${days}${reminder.specific_time ? ` בשעה ${reminder.specific_time}` : ''}`
  } else if (reminder.reminder_type === 'daily') {
    reminderText = `כל יום בשעה ${reminder.specific_time || '12:00'}`
  } else {
    // Fallback למצב הישן
    const intervalText = reminder.interval_type === 'hours' 
      ? `${reminder.interval_value} שעות`
      : `${reminder.interval_value} ימים`
    reminderText = `כל ${intervalText}`
  }

  const notification = new Notification('זמן לשלוח הודעה! 💌', {
    body: `הגיע הזמן לשלוח הודעה ל-${contact.name}\n(${reminderText})`,
    icon: '/icon-192x192.png', // אם יש אייקון
    badge: '/icon-192x192.png',
    tag: `reminder-${reminder.id}`,
    requireInteraction: false,
    silent: false,
  })

  // סגירה אוטומטית אחרי 5 שניות
  setTimeout(() => {
    notification.close()
  }, 5000)

  // טיפול בלחיצה על ההתראה
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

/**
 * בדיקה תקופתית של התראות
 */
export function startReminderChecker(
  checkCallback: () => Promise<Reminder[]>,
  getContactCallback: (id: number) => Promise<Contact>
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  // בדיקה כל דקה
  const intervalId = setInterval(async () => {
    try {
      const triggeredReminders = await checkCallback()
      
      for (const reminder of triggeredReminders) {
        try {
          const contact = await getContactCallback(reminder.contact_id)
          showNotification(reminder, contact)
        } catch (error) {
          console.error('שגיאה בטעינת איש קשר להתראה:', error)
        }
      }
    } catch (error) {
      console.error('שגיאה בבדיקת התראות:', error)
    }
  }, 60000) // כל דקה

  // ניקוי בעת סגירת הדף
  return () => {
    clearInterval(intervalId)
  }
}


'use client'

import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { Reminder } from './reminders'

/**
 * שירות להתראות מקומיות באנדרואיד
 * עובד ללא תלות בשרת - ההתראות מתזמנות מקומית במכשיר
 */

/**
 * בדיקה אם רצים על אנדרואיד
 */
export function isAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

/**
 * בניית טקסט התראה לפי סוג התזכורת
 */
function buildReminderText(reminder: Reminder): string {
  if (reminder.reminder_type === 'one_time') {
    return 'תאריך ספציפי'
  } else if (reminder.reminder_type === 'recurring') {
    const intervalText = reminder.interval_type === 'hours' 
      ? `${reminder.interval_value} שעות`
      : `${reminder.interval_value} ימים`
    return `כל ${intervalText}`
  } else if (reminder.reminder_type === 'weekly') {
    const weekdayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    const days = reminder.weekdays?.map(d => weekdayNames[d]).join(', ') || ''
    return `${days}${reminder.specific_time ? ` בשעה ${reminder.specific_time}` : ''}`
  } else if (reminder.reminder_type === 'daily') {
    return `כל יום בשעה ${reminder.specific_time || '12:00'}`
  } else {
    // Fallback
    const intervalText = reminder.interval_type === 'hours' 
      ? `${reminder.interval_value} שעות`
      : `${reminder.interval_value} ימים`
    return `כל ${intervalText}`
  }
}

/**
 * בדיקה אם תזכורת צריכה לחזור על עצמה
 */
function shouldRepeat(reminder: Reminder): boolean {
  return reminder.reminder_type !== 'one_time'
}

/**
 * קבלת מרווח חזרה (להתראות חוזרות)
 */
function getRepeatInterval(reminder: Reminder): 'day' | 'hour' | undefined {
  if (reminder.reminder_type === 'one_time') {
    return undefined
  }
  
  if (reminder.reminder_type === 'daily') {
    return 'day'
  }
  
  if (reminder.reminder_type === 'recurring') {
    return reminder.interval_type === 'hours' ? 'hour' : 'day'
  }
  
  // weekly - לא נתמך ב-repeat interval, נשתמש ב-schedule מורכב יותר
  return undefined
}

/**
 * תזמון התראה מקומית
 */
export async function scheduleLocalNotification(
  reminder: Reminder,
  contactName: string
): Promise<void> {
  if (!isAndroid()) {
    console.log('⚠️ [LocalNotifications] Not on Android, skipping local notification')
    return
  }

  try {
    // בקשת הרשאות
    const permStatus = await LocalNotifications.checkPermissions()
    if (permStatus.display !== 'granted') {
      console.log('🔵 [LocalNotifications] Requesting notification permissions...')
      const requestResult = await LocalNotifications.requestPermissions()
      if (requestResult.display !== 'granted') {
        throw new Error('Notification permission denied')
      }
    }

    // בדיקה שיש next_trigger
    if (!reminder.next_trigger) {
      console.warn(`⚠️ [LocalNotifications] Reminder ${reminder.id} has no next_trigger, skipping`)
      return
    }

    // חישוב תאריך ההתראה
    const scheduleTime = new Date(reminder.next_trigger)
    const now = new Date()
    
    // אם התאריך כבר עבר, לא נתזמן
    if (scheduleTime <= now) {
      console.warn(`⚠️ [LocalNotifications] Reminder ${reminder.id} next_trigger is in the past, skipping`)
      return
    }

    // בניית טקסט התראה
    const reminderText = buildReminderText(reminder)
    const body = `הגיע הזמן לשלוח הודעה ל-${contactName}\n(${reminderText})`

    // תזמון התראה
    const notificationConfig: any = {
      id: reminder.id, // משתמש ב-ID של התזכורת
      title: 'זמן לשלוח הודעה! 💌',
      body: body,
      schedule: {
        at: scheduleTime,
      },
      sound: 'default',
      extra: {
        reminderId: reminder.id,
        contactId: reminder.contact_id,
        contactName: contactName
      }
    }

    // הוספת repeat אם צריך
    if (shouldRepeat(reminder)) {
      const repeatInterval = getRepeatInterval(reminder)
      if (repeatInterval) {
        notificationConfig.schedule.repeats = true
        notificationConfig.schedule.every = repeatInterval
        
        // עבור recurring - צריך לחשב את המרווח
        if (reminder.reminder_type === 'recurring' && reminder.interval_value) {
          if (reminder.interval_type === 'hours') {
            notificationConfig.schedule.every = 'hour'
            // לא ניתן להגדיר מספר שעות, אז נשתמש ב-repeat כל שעה
            // ונסמוך על השרת לעדכן את next_trigger
          } else {
            notificationConfig.schedule.every = 'day'
            // לא ניתן להגדיר מספר ימים, אז נשתמש ב-repeat כל יום
            // ונסמוך על השרת לעדכן את next_trigger
          }
        }
      }
    }

    await LocalNotifications.schedule({
      notifications: [notificationConfig]
    })

    console.log(`✅ [LocalNotifications] Scheduled notification for reminder ${reminder.id} at ${scheduleTime.toISOString()}`)
  } catch (error) {
    console.error(`❌ [LocalNotifications] Failed to schedule notification for reminder ${reminder.id}:`, error)
    throw error
  }
}

/**
 * ביטול התראה מקומית
 */
export async function cancelLocalNotification(reminderId: number): Promise<void> {
  if (!isAndroid()) {
    return
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: reminderId }]
    })
    console.log(`✅ [LocalNotifications] Cancelled notification for reminder ${reminderId}`)
  } catch (error) {
    console.error(`❌ [LocalNotifications] Failed to cancel notification for reminder ${reminderId}:`, error)
  }
}

/**
 * ביטול כל ההתראות המקומיות
 */
export async function cancelAllLocalNotifications(): Promise<void> {
  if (!isAndroid()) {
    return
  }

  try {
    // קבלת כל ההתראות המתוזמנות
    const pending = await LocalNotifications.getPending()
    
    if (pending.notifications && pending.notifications.length > 0) {
      // ביטול כל ההתראות
      const notificationIds = pending.notifications.map(n => ({ id: n.id }))
      await LocalNotifications.cancel({ notifications: notificationIds })
      console.log(`✅ [LocalNotifications] Cancelled ${notificationIds.length} local notifications`)
    } else {
      console.log('ℹ️ [LocalNotifications] No pending notifications to cancel')
    }
  } catch (error) {
    console.error('❌ [LocalNotifications] Failed to cancel all notifications:', error)
  }
}

/**
 * סנכרון כל התזכורות מהשרת למכשיר
 * מתזמן מחדש את כל ההתראות המקומיות
 */
export async function syncRemindersFromServer(
  reminders: Reminder[],
  contactNames: Map<number, string>
): Promise<void> {
  if (!isAndroid()) {
    return
  }

  try {
    console.log(`🔄 [LocalNotifications] Syncing ${reminders.length} reminders from server...`)
    
    // ביטול כל ההתראות הקיימות
    await cancelAllLocalNotifications()

    // תזמון מחדש של כל התזכורות הפעילות
    let scheduledCount = 0
    for (const reminder of reminders) {
      if (reminder.enabled && reminder.next_trigger) {
        const contactName = contactNames.get(reminder.contact_id) || 'איש קשר'
        try {
          await scheduleLocalNotification(reminder, contactName)
          scheduledCount++
        } catch (error) {
          console.error(`Failed to schedule reminder ${reminder.id}:`, error)
        }
      }
    }

    console.log(`✅ [LocalNotifications] Synced ${scheduledCount} reminders`)
  } catch (error) {
    console.error('❌ [LocalNotifications] Failed to sync reminders:', error)
    throw error
  }
}

/**
 * קבלת כל ההתראות המתוזמנות
 */
export async function getPendingNotifications(): Promise<any[]> {
  if (!isAndroid()) {
    return []
  }

  try {
    const result = await LocalNotifications.getPending()
    return result.notifications || []
  } catch (error) {
    console.error('❌ [LocalNotifications] Failed to get pending notifications:', error)
    return []
  }
}

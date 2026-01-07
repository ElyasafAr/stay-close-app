'use client'

import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { Reminder } from './reminders'

/**
 * שירות להתראות מקומיות באנדרואיד
 * עובד ללא תלות בשרת - ההתראות מתזמנות מקומית במכשיר
 *
 * WORKAROUND: Capacitor LocalNotifications תומך רק ב-'hour' ו-'day' repeat.
 * עבור weekly ו-custom intervals, מתזמנים מספר התראות בודדות.
 */

// קבועים למגבלות Capacitor
const MAX_CAPACITOR_NOTIFICATIONS = 64  // מגבלת Capacitor
const WEEKLY_SCHEDULE_DURATION_DAYS = 365  // מתזמנים שנה קדימה
const CUSTOM_INTERVAL_SCHEDULE_COUNT = 52  // מתזמנים 52 אירועים

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
 * תזמון מספר התראות בודדות (workaround ל-weekly ו-custom intervals)
 */
async function scheduleMultipleNotifications(
  reminderId: number,
  contactName: string,
  dates: Date[],
  title: string,
  body: string
): Promise<void> {
  console.log(`[NOTIF] 📅 Scheduling ${dates.length} notifications for reminder ${reminderId}`)

  // הגבלה ל-64 התראות (מגבלת Capacitor)
  const limitedDates = dates.slice(0, MAX_CAPACITOR_NOTIFICATIONS)

  if (dates.length > MAX_CAPACITOR_NOTIFICATIONS) {
    console.warn(`[NOTIF] ⚠️ Reminder ${reminderId} has ${dates.length} occurrences, limiting to ${MAX_CAPACITOR_NOTIFICATIONS}`)
  }

  const notifications = limitedDates.map((date, index) => ({
    id: reminderId * 1000 + index,  // ID ייחודי: reminderId * 1000 + index
    title: title,
    body: body,
    schedule: { at: date },
    sound: 'default',
    extra: {
      reminderId: reminderId,
      contactName: contactName,
      occurrenceIndex: index
    }
  }))

  await LocalNotifications.schedule({ notifications })
  console.log(`[NOTIF] ✅ Scheduled ${notifications.length} notifications for reminder ${reminderId}`)
}

/**
 * חישוב תאריכים עבור תזכורת שבועית
 * מחזיר רשימת תאריכים לשנה הבאה
 */
function calculateWeeklyDates(
  weekdays: number[],
  specificTime: string,
  timezone: string,
  durationDays: number
): Date[] {
  const dates: Date[] = []
  const [hour, minute] = specificTime.split(':').map(Number)

  console.log(`[NOTIF] 📅 Calculating weekly dates for weekdays ${weekdays}, time ${specificTime}`)

  const now = new Date()
  const startDate = new Date(now)
  startDate.setHours(hour, minute, 0, 0)

  // יצירת תאריכים לשנה הבאה
  for (let day = 0; day < durationDays; day++) {
    const checkDate = new Date(startDate)
    checkDate.setDate(startDate.getDate() + day)

    const weekday = checkDate.getDay()  // 0 = ראשון
    if (weekdays.includes(weekday)) {
      // רק תאריכים עתידיים
      if (checkDate > now) {
        dates.push(new Date(checkDate))
      }
    }
  }

  console.log(`[NOTIF] 📅 Calculated ${dates.length} weekly dates for weekdays ${weekdays}`)
  return dates
}

/**
 * חישוב תאריכים עבור תזכורת עם מרווח מותאם אישית
 * מחזיר רשימת תאריכים עבור N אירועים
 */
function calculateCustomIntervalDates(
  startTrigger: string,
  intervalType: 'hours' | 'days',
  intervalValue: number,
  count: number
): Date[] {
  const dates: Date[] = []
  let current = new Date(startTrigger)
  const now = new Date()

  console.log(`[NOTIF] 📅 Calculating custom interval dates: every ${intervalValue} ${intervalType}, ${count} occurrences`)

  for (let i = 0; i < count; i++) {
    if (current > now) {
      dates.push(new Date(current))
    }

    // הוספת מרווח
    if (intervalType === 'hours') {
      current.setHours(current.getHours() + intervalValue)
    } else {
      current.setDate(current.getDate() + intervalValue)
    }
  }

  console.log(`[NOTIF] 📅 Calculated ${dates.length} custom interval dates (every ${intervalValue} ${intervalType})`)
  return dates
}

/**
 * תזמון התראה מקומית
 * תומך בכל 4 סוגי התזכורות: one_time, recurring, weekly, daily
 */
export async function scheduleLocalNotification(
  reminder: Reminder,
  contactName: string
): Promise<void> {
  if (!isAndroid()) {
    console.log('[NOTIF] ⚠️ Not on Android, skipping local notification')
    return
  }

  try {
    console.log(`[NOTIF] 🔔 Scheduling notification for reminder ${reminder.id}, type: ${reminder.reminder_type}`)

    // בקשת הרשאות
    const permStatus = await LocalNotifications.checkPermissions()
    if (permStatus.display !== 'granted') {
      console.log('[NOTIF] 🔵 Requesting local notification permissions...')
      const requestResult = await LocalNotifications.requestPermissions()
      if (requestResult.display !== 'granted') {
        console.warn('[NOTIF] ⚠️ Local notification permission denied')
        throw new Error('Notification permission denied')
      }
      console.log('[NOTIF] ✅ Local notification permission granted')
    }

    // בדיקה שיש next_trigger
    if (!reminder.next_trigger) {
      console.warn(`[NOTIF] ⚠️ Reminder ${reminder.id} has no next_trigger, skipping`)
      return
    }

    // בניית טקסט התראה
    const reminderText = buildReminderText(reminder)
    const title = 'זמן לשלוח הודעה! 💌'
    const body = `הגיע הזמן לשלוח הודעה ל-${contactName}\n(${reminderText})`

    // טיפול לפי סוג התזכורת
    if (reminder.reminder_type === 'one_time') {
      // התראה חד-פעמית
      const scheduleTime = new Date(reminder.next_trigger)
      if (scheduleTime <= new Date()) {
        console.warn(`[NOTIF] ⚠️ Reminder ${reminder.id} next_trigger is in the past, skipping`)
        return
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: reminder.id,
          title: title,
          body: body,
          schedule: { at: scheduleTime },
          sound: 'default',
          extra: {
            reminderId: reminder.id,
            contactId: reminder.contact_id,
            contactName: contactName
          }
        }]
      })
      console.log(`[NOTIF] ✅ Scheduled one-time notification for reminder ${reminder.id} at ${scheduleTime.toISOString()}`)

    } else if (reminder.reminder_type === 'weekly') {
      // התראה שבועית - תזמון מספר התראות בודדות
      if (!reminder.weekdays || reminder.weekdays.length === 0 || !reminder.specific_time) {
        console.warn(`[NOTIF] ⚠️ Weekly reminder ${reminder.id} missing weekdays or time`)
        return
      }

      const dates = calculateWeeklyDates(
        reminder.weekdays,
        reminder.specific_time,
        reminder.timezone || 'Asia/Jerusalem',
        WEEKLY_SCHEDULE_DURATION_DAYS
      )

      if (dates.length === 0) {
        console.warn(`[NOTIF] ⚠️ No future dates calculated for weekly reminder ${reminder.id}`)
        return
      }

      await scheduleMultipleNotifications(reminder.id, contactName, dates, title, body)

    } else if (reminder.reminder_type === 'recurring') {
      // התראה חוזרת
      const intervalValue = reminder.interval_value || 1
      const intervalType = reminder.interval_type || 'days'

      if ((intervalType === 'days' && intervalValue === 1) ||
          (intervalType === 'hours' && intervalValue === 1)) {
        // מרווח רגיל - שימוש ב-native repeat
        const scheduleTime = new Date(reminder.next_trigger)
        if (scheduleTime <= new Date()) {
          console.warn(`[NOTIF] ⚠️ Reminder ${reminder.id} next_trigger is in the past, skipping`)
          return
        }

        await LocalNotifications.schedule({
          notifications: [{
            id: reminder.id,
            title: title,
            body: body,
            schedule: {
              at: scheduleTime,
              repeats: true,
              every: intervalType === 'hours' ? 'hour' : 'day'
            },
            sound: 'default',
            extra: {
              reminderId: reminder.id,
              contactId: reminder.contact_id,
              contactName: contactName
            }
          }]
        })
        console.log(`[NOTIF] ✅ Scheduled recurring notification (every ${intervalType}) for reminder ${reminder.id}`)

      } else {
        // מרווח מותאם אישית - תזמון מספר התראות בודדות
        const dates = calculateCustomIntervalDates(
          reminder.next_trigger,
          intervalType,
          intervalValue,
          CUSTOM_INTERVAL_SCHEDULE_COUNT
        )

        if (dates.length === 0) {
          console.warn(`[NOTIF] ⚠️ No future dates calculated for recurring reminder ${reminder.id}`)
          return
        }

        await scheduleMultipleNotifications(reminder.id, contactName, dates, title, body)
      }

    } else if (reminder.reminder_type === 'daily') {
      // התראה יומית - שימוש ב-native daily repeat
      if (!reminder.specific_time) {
        console.warn(`[NOTIF] ⚠️ Daily reminder ${reminder.id} missing time`)
        return
      }

      const scheduleTime = new Date(reminder.next_trigger)
      if (scheduleTime <= new Date()) {
        console.warn(`[NOTIF] ⚠️ Reminder ${reminder.id} next_trigger is in the past, skipping`)
        return
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: reminder.id,
          title: title,
          body: body,
          schedule: {
            at: scheduleTime,
            repeats: true,
            every: 'day'
          },
          sound: 'default',
          extra: {
            reminderId: reminder.id,
            contactId: reminder.contact_id,
            contactName: contactName
          }
        }]
      })
      console.log(`[NOTIF] ✅ Scheduled daily notification for reminder ${reminder.id}`)
    }

  } catch (error) {
    console.error(`[NOTIF] ❌ Failed to schedule local notification for reminder ${reminder.id}:`, error)
    throw error
  }
}

/**
 * ביטול התראה מקומית
 * מבטל גם את כל ההתראות הקשורות (עבור weekly/custom intervals)
 */
export async function cancelLocalNotification(reminderId: number): Promise<void> {
  if (!isAndroid()) {
    return
  }

  try {
    console.log(`[NOTIF] 🔵 Cancelling notifications for reminder ${reminderId}`)

    // ביטול ההתראה הראשית
    await LocalNotifications.cancel({
      notifications: [{ id: reminderId }]
    })

    // ביטול כל ההתראות המבוססות על אירועים (עבור weekly/custom intervals)
    const occurrenceIds = []
    for (let i = 0; i < MAX_CAPACITOR_NOTIFICATIONS; i++) {
      occurrenceIds.push({ id: reminderId * 1000 + i })
    }

    await LocalNotifications.cancel({ notifications: occurrenceIds })

    console.log(`[NOTIF] ✅ Cancelled local notifications for reminder ${reminderId}`)
  } catch (error) {
    console.error(`[NOTIF] ❌ Failed to cancel local notification for reminder ${reminderId}:`, error)
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
      console.log(`[NOTIF] ✅ Cancelled ${notificationIds.length} local notifications`)
    } else {
      console.log('[NOTIF] ℹ️ No pending local notifications to cancel')
    }
  } catch (error) {
    console.error('[NOTIF] ❌ Failed to cancel all local notifications:', error)
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
    console.log(`[NOTIF] 🔄 Syncing ${reminders.length} reminders from server to local notifications...`)

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
          console.error(`[NOTIF] ❌ Failed to schedule reminder ${reminder.id}:`, error)
        }
      }
    }

    console.log(`[NOTIF] ✅ Synced ${scheduledCount} reminders to local notifications`)

    // בדיקה אם מתקרבים למגבלת 64 התראות
    const pending = await getPendingNotifications()
    if (pending.length >= 60) {
      console.warn(`[NOTIF] ⚠️ Warning: ${pending.length} scheduled notifications (limit: ${MAX_CAPACITOR_NOTIFICATIONS})`)
      console.warn(`[NOTIF] ⚠️ Consider reducing the number of weekly reminders or re-syncing periodically`)
    }
  } catch (error) {
    console.error('[NOTIF] ❌ Failed to sync reminders:', error)
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
    console.log(`[NOTIF] 🔍 Found ${result.notifications?.length || 0} pending local notifications`)
    return result.notifications || []
  } catch (error) {
    console.error('[NOTIF] ❌ Failed to get pending local notifications:', error)
    return []
  }
}

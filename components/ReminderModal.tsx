'use client'

import { useState, useEffect } from 'react'
import { MdClose, MdNotifications } from 'react-icons/md'
import { Reminder, ReminderCreate, ReminderType, createReminder, updateReminder } from '@/services/reminders'
import { requestNotificationPermission } from '@/services/notifications'
import { scheduleLocalNotification, cancelLocalNotification, isAndroid } from '@/services/localNotifications'
import styles from './ReminderModal.module.css'

interface ReminderModalProps {
  contactId: number
  contactName: string
  existingReminder?: Reminder
  onClose: () => void
  onSuccess: () => void
}

const WEEKDAYS = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' },
]

export function ReminderModal({ contactId, contactName, existingReminder, onClose, onSuccess }: ReminderModalProps) {
  // סוג התראה
  const [reminderType, setReminderType] = useState<ReminderType>(
    existingReminder?.reminder_type || 'recurring'
  )
  
  // שדות ל-recurring
  const [intervalType, setIntervalType] = useState<'hours' | 'days'>(
    existingReminder?.interval_type || 'days'
  )
  const [intervalValue, setIntervalValue] = useState(existingReminder?.interval_value || 7)
  
  // שדות ל-one_time
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (existingReminder?.scheduled_datetime) {
      const date = new Date(existingReminder.scheduled_datetime)
      return date.toISOString().split('T')[0]
    }
    return ''
  })
  const [scheduledTime, setScheduledTime] = useState(() => {
    if (existingReminder?.scheduled_datetime) {
      const date = new Date(existingReminder.scheduled_datetime)
      return date.toTimeString().slice(0, 5)
    }
    return '12:00'
  })
  
  // שדות ל-weekly
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    existingReminder?.weekdays || []
  )
  const [weeklyTime, setWeeklyTime] = useState(existingReminder?.specific_time || '12:00')
  
  // שדות ל-daily
  const [dailyTime, setDailyTime] = useState(existingReminder?.specific_time || '12:00')
  
  // שדות כלליים
  const [enabled, setEnabled] = useState(existingReminder?.enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // עדכון weekdays
  const toggleWeekday = (weekday: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(weekday) 
        ? prev.filter(w => w !== weekday)
        : [...prev, weekday].sort()
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // וולידציה
      if (reminderType === 'one_time' && (!scheduledDate || !scheduledTime)) {
        setError('נא לבחור תאריך ושעה')
        setLoading(false)
        return
      }
      
      if (reminderType === 'recurring' && (!intervalValue || intervalValue < 1)) {
        setError('נא להזין תדירות תקינה')
        setLoading(false)
        return
      }
      
      if (reminderType === 'weekly' && selectedWeekdays.length === 0) {
        setError('נא לבחור לפחות יום אחד בשבוע')
        setLoading(false)
        return
      }
      
      if (reminderType === 'weekly' && !weeklyTime) {
        setError('נא לבחור שעה')
        setLoading(false)
        return
      }
      
      if (reminderType === 'daily' && !dailyTime) {
        setError('נא לבחור שעה')
        setLoading(false)
        return
      }

      // אם זו תזכורת חדשה ופעילה - נבקש הרשאה להתראות
      if (!existingReminder && enabled) {
        console.log('🔵 [REMINDER] Requesting notification permission for new reminder...')
        const granted = await requestNotificationPermission()
        if (granted) {
          console.log('✅ [REMINDER] Notification permission granted')
        } else {
          console.warn('⚠️ [REMINDER] Notification permission denied - reminders will not show notifications')
        }
      }

      // בניית reminderData לפי סוג ההתראה
      const reminderData: ReminderCreate = {
        contact_id: contactId,
        reminder_type: reminderType,
        enabled,
      }

      if (reminderType === 'recurring') {
        reminderData.interval_type = intervalType
        reminderData.interval_value = intervalValue
      } else if (reminderType === 'one_time') {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        reminderData.scheduled_datetime = scheduledDateTime.toISOString()
      } else if (reminderType === 'weekly') {
        reminderData.weekdays = selectedWeekdays
        reminderData.specific_time = weeklyTime
      } else if (reminderType === 'daily') {
        reminderData.specific_time = dailyTime
      }
      
      // Add user timezone
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        reminderData.timezone = userTimezone
      } catch (e) {
        console.warn('Failed to get user timezone:', e)
        // Default to Asia/Jerusalem if detection fails
        reminderData.timezone = 'Asia/Jerusalem'
      }

      let savedReminder: Reminder
      if (existingReminder) {
        savedReminder = await updateReminder(existingReminder.id, reminderData)
        
        // באנדרואיד - ביטול התראה ישנה ותזמון חדשה
        if (isAndroid()) {
          try {
            // ביטול התראה ישנה
            await cancelLocalNotification(existingReminder.id)
            
            // תזמון התראה חדשה אם התזכורת פעילה
            if (savedReminder.enabled && savedReminder.next_trigger) {
              await scheduleLocalNotification(savedReminder, contactName)
            }
          } catch (error) {
            console.error('Failed to update local notification:', error)
            // לא נכשיל את הפעולה אם יש בעיה עם התראות מקומיות
          }
        }
      } else {
        savedReminder = await createReminder(reminderData)
        
        // באנדרואיד - תזמון התראה מקומית אם התזכורת פעילה
        if (isAndroid() && savedReminder.enabled && savedReminder.next_trigger) {
          try {
            await scheduleLocalNotification(savedReminder, contactName)
          } catch (error) {
            console.error('Failed to schedule local notification:', error)
            // לא נכשיל את הפעולה אם יש בעיה עם התראות מקומיות
          }
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת התראה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <MdNotifications style={{ fontSize: '24px', marginLeft: '8px' }} />
            {existingReminder ? 'ערוך התראה' : 'הגדר התראה'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <MdClose style={{ fontSize: '24px' }} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.contactName}>לשלח הודעה ל-{contactName}</p>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* בחירת סוג התראה */}
            <div className={styles.formGroup}>
              <label className={styles.label}>סוג התראה</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reminderType"
                    value="one_time"
                    checked={reminderType === 'one_time'}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className={styles.radio}
                  />
                  <span>חד-פעמית (תאריך ושעה ספציפיים)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reminderType"
                    value="recurring"
                    checked={reminderType === 'recurring'}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className={styles.radio}
                  />
                  <span>חזרתית (כל X שעות/ימים)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reminderType"
                    value="weekly"
                    checked={reminderType === 'weekly'}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className={styles.radio}
                  />
                  <span>שבועית (יום/ימים קבועים)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reminderType"
                    value="daily"
                    checked={reminderType === 'daily'}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className={styles.radio}
                  />
                  <span>יומית (כל יום בשעה מסוימת)</span>
                </label>
              </div>
            </div>

            {/* טופס לפי סוג התראה */}
            {reminderType === 'one_time' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>תאריך</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={styles.dateInput}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <label className={styles.label} style={{ marginTop: '12px' }}>שעה</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={styles.timeInput}
                  required
                />
              </div>
            )}

            {reminderType === 'recurring' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>תדירות</label>
                <div className={styles.intervalInputs}>
                  <input
                    type="number"
                    min="1"
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                    className={styles.numberInput}
                    required
                  />
                  <select
                    value={intervalType}
                    onChange={(e) => setIntervalType(e.target.value as 'hours' | 'days')}
                    className={styles.select}
                  >
                    <option value="hours">שעות</option>
                    <option value="days">ימים</option>
                  </select>
                </div>
              </div>
            )}

            {reminderType === 'weekly' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ימים בשבוע</label>
                  <div className={styles.weekdaysGrid}>
                    {WEEKDAYS.map(day => (
                      <label key={day.value} className={styles.weekdayLabel}>
                        <input
                          type="checkbox"
                          checked={selectedWeekdays.includes(day.value)}
                          onChange={() => toggleWeekday(day.value)}
                          className={styles.checkbox}
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>שעה</label>
                  <input
                    type="time"
                    value={weeklyTime}
                    onChange={(e) => setWeeklyTime(e.target.value)}
                    className={styles.timeInput}
                    required
                  />
                </div>
              </>
            )}

            {reminderType === 'daily' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>שעה</label>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  className={styles.timeInput}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>התראה פעילה</span>
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={onClose} className={styles.cancelButton}>
                ביטול
              </button>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'שומר...' : existingReminder ? 'עדכן' : 'שמור'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

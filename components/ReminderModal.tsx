'use client'

import { useState } from 'react'
import { MdClose, MdNotifications } from 'react-icons/md'
import { Reminder, ReminderCreate, createReminder, updateReminder } from '@/services/reminders'
import { requestNotificationPermission } from '@/services/notifications'
import styles from './ReminderModal.module.css'

interface ReminderModalProps {
  contactId: number
  contactName: string
  existingReminder?: Reminder
  onClose: () => void
  onSuccess: () => void
}

export function ReminderModal({ contactId, contactName, existingReminder, onClose, onSuccess }: ReminderModalProps) {
  const [intervalType, setIntervalType] = useState<'hours' | 'days'>(existingReminder?.interval_type || 'days')
  const [intervalValue, setIntervalValue] = useState(existingReminder?.interval_value || 7)
  const [enabled, setEnabled] = useState(existingReminder?.enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // אם זו תזכורת חדשה ופעילה - נבקש הרשאה להתראות
      if (!existingReminder && enabled) {
        console.log('🔵 [REMINDER] Requesting notification permission for new reminder...')
        const granted = await requestNotificationPermission()
        if (granted) {
          console.log('✅ [REMINDER] Notification permission granted')
        } else {
          console.warn('⚠️ [REMINDER] Notification permission denied - reminders will not show notifications')
          // לא נעצור את התהליך - רק נזהיר
        }
      }

      const reminderData: ReminderCreate = {
        contact_id: contactId,
        interval_type: intervalType,
        interval_value: intervalValue,
        enabled,
      }

      if (existingReminder) {
        await updateReminder(existingReminder.id, reminderData)
      } else {
        await createReminder(reminderData)
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


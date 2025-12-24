'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { getContacts, createContact, deleteContact, Contact } from '@/services/contacts'
import { getReminders, deleteReminder, Reminder } from '@/services/reminders'
import { cancelLocalNotification, isAndroid } from '@/services/localNotifications'
import { Loading } from '@/components/Loading'
import { ReminderModal } from '@/components/ReminderModal'
import { MdAdd, MdDelete, MdNotifications, MdNotificationsOff, MdTune, MdSend } from 'react-icons/md'
import styles from './page.module.css'

export default function ContactsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reminderModal, setReminderModal] = useState<{ contactId: number; contactName: string; reminder?: Reminder } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    default_tone: 'friendly',
  })

  // Navigate to messages page with pre-selected contact
  const handleSendMessage = (contactId: number) => {
    router.push(`/messages?contact=${contactId}`)
  }

  useEffect(() => {
    loadContacts()
    loadReminders()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getContacts()
      setContacts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contacts.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  const loadReminders = async () => {
    try {
      const data = await getReminders()
      setReminders(data)
    } catch (err) {
      console.error('Error loading reminders:', err)
    }
  }

  const getReminderForContact = (contactId: number): Reminder | undefined => {
    return reminders.find(r => r.contact_id === contactId && r.enabled)
  }

  const handleDeleteReminder = async (reminderId: number) => {
    if (!confirm(t('contacts.deleteReminderConfirm'))) {
      return
    }
    try {
      // באנדרואיד - ביטול התראה מקומית לפני מחיקה
      if (isAndroid()) {
        try {
          await cancelLocalNotification(reminderId)
        } catch (error) {
          console.error('Failed to cancel local notification:', error)
          // לא נכשיל את הפעולה אם יש בעיה עם התראות מקומיות
        }
      }
      
      await deleteReminder(reminderId)
      await loadReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contacts.errorDeletingReminder'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      await createContact(formData)
      setFormData({ name: '', default_tone: 'friendly' })
      setShowForm(false)
      await loadContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contacts.errorCreating'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('contacts.deleteConfirm'))) {
      return
    }
    try {
      setError(null)
      await deleteContact(id)
      await loadContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contacts.errorDeleting'))
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('contacts.title')}</h1>
          <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
            <MdAdd style={{ fontSize: '24px' }} />
            {showForm ? t('settings.cancel') : t('contacts.addContact')}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>{t('contacts.addNewContact')}</h2>
            <input
              type="text"
              placeholder={t('contacts.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={styles.input}
            />
            <label className={styles.label}>{t('contacts.defaultTone')}</label>
            <select
              value={formData.default_tone}
              onChange={(e) => setFormData({ ...formData, default_tone: e.target.value })}
              className={styles.input}
            >
              {Object.entries(t('messages.tones') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                {t('settings.cancel')}
              </button>
              <button type="submit" className={styles.submitButton}>
                {t('settings.save')}
              </button>
            </div>
          </form>
        )}

        <div className={styles.contactsList}>
          {contacts.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💙</div>
              <p>{t('contacts.noContacts')}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.7 }}>
                {t('contacts.clickToAdd')}
              </p>
            </div>
          ) : (
            contacts.map((contact, index) => (
              <div key={contact.id} className={styles.contactCard} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={styles.contactHeader}>
                  <h3 className={styles.contactName}>
                    <span className={styles.contactIcon}>
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                    {contact.name}
                  </h3>
                </div>
                {contact.default_tone && (
                  <p className={styles.contactInfo}>
                    <MdTune style={{ fontSize: '18px', color: '#a8d5e2' }} />
                    {t('contacts.defaultTone')}: {
                      (t('messages.tones') as any)[contact.default_tone] || contact.default_tone
                    }
                  </p>
                )}
                {contact.id && getReminderForContact(contact.id) && (() => {
                  const reminder = getReminderForContact(contact.id)!
                  let reminderText = ''
                  
                  if (reminder.reminder_type === 'one_time') {
                    if (reminder.scheduled_datetime) {
                      const date = new Date(reminder.scheduled_datetime)
                      reminderText = date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { 
                        day: 'numeric', 
                        month: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    } else {
                      reminderText = t('contacts.reminderTypes.oneTime')
                    }
                  } else if (reminder.reminder_type === 'recurring') {
                    const intervalType = reminder.interval_type === 'hours' ? t('contacts.intervals.hours') : t('contacts.intervals.days')
                    reminderText = t('contacts.reminderTypes.recurring')
                      .replace('{{value}}', reminder.interval_value?.toString() || '1')
                      .replace('{{type}}', intervalType)
                  } else if (reminder.reminder_type === 'weekly') {
                    const weekdayNames = t('contacts.weekdays') as unknown as string[]
                    const days = reminder.weekdays?.map(d => weekdayNames[d]).join(', ') || ''
                    reminderText = t('contacts.reminderTypes.weekly')
                      .replace('{{days}}', days)
                      .replace('{{time}}', reminder.specific_time || '12:00')
                  } else if (reminder.reminder_type === 'daily') {
                    reminderText = t('contacts.reminderTypes.daily')
                      .replace('{{time}}', reminder.specific_time || '12:00')
                  }
                  
                  return (
                    <div className={styles.reminderBadge}>
                      <MdNotifications style={{ fontSize: '16px', marginInlineEnd: '4px' }} />
                      <span>{reminderText}</span>
                    </div>
                  )
                })()}
                <div className={styles.contactActions}>
                  <button
                    onClick={() => contact.id && handleSendMessage(contact.id)}
                    className={styles.sendMessageButton}
                    disabled={!contact.id}
                  >
                    <MdSend style={{ fontSize: '18px' }} />
                    {t('contacts.sendMessage')}
                  </button>
                  <button
                    onClick={() => contact.id && setReminderModal({ 
                      contactId: contact.id, 
                      contactName: contact.name,
                      reminder: getReminderForContact(contact.id)
                    })}
                    className={styles.reminderButton}
                    disabled={!contact.id}
                  >
                    {contact.id && getReminderForContact(contact.id) ? (
                      <>
                        <MdNotifications style={{ fontSize: '18px' }} />
                        {t('contacts.editReminder')}
                      </>
                    ) : (
                      <>
                        <MdNotificationsOff style={{ fontSize: '18px' }} />
                        {t('contacts.setReminder')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => contact.id && handleDelete(contact.id)}
                    className={styles.deleteButton}
                  >
                    <MdDelete style={{ fontSize: '18px' }} />
                    {t('contacts.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {reminderModal && (
        <ReminderModal
          contactId={reminderModal.contactId}
          contactName={reminderModal.contactName}
          existingReminder={reminderModal.reminder}
          onClose={() => setReminderModal(null)}
          onSuccess={() => {
            loadReminders()
            setReminderModal(null)
          }}
        />
      )}
    </main>
  )
}


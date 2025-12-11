'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { getContacts, createContact, deleteContact, Contact } from '@/services/contacts'
import { getReminders, deleteReminder, Reminder } from '@/services/reminders'
import { Loading } from '@/components/Loading'
import { ReminderModal } from '@/components/ReminderModal'
import { MdAdd, MdDelete, MdNotifications, MdNotificationsOff, MdTune } from 'react-icons/md'
import styles from './page.module.css'

export default function ContactsPage() {
  const { t } = useTranslation()
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
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת אנשי קשר')
    } finally {
      setLoading(false)
    }
  }

  const loadReminders = async () => {
    try {
      const data = await getReminders()
      setReminders(data)
    } catch (err) {
      console.error('שגיאה בטעינת התראות:', err)
    }
  }

  const getReminderForContact = (contactId: number): Reminder | undefined => {
    return reminders.find(r => r.contact_id === contactId && r.enabled)
  }

  const handleDeleteReminder = async (reminderId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההתראה?')) {
      return
    }
    try {
      await deleteReminder(reminderId)
      await loadReminders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת התראה')
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
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת איש קשר')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את איש הקשר הזה?')) {
      return
    }
    try {
      setError(null)
      await deleteContact(id)
      await loadContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת איש קשר')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>אנשי קשר</h1>
          <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
            <MdAdd style={{ fontSize: '24px' }} />
            {showForm ? 'ביטול' : 'הוסף איש קשר'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>הוסף איש קשר חדש</h2>
            <input
              type="text"
              placeholder="שם מלא"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={styles.input}
            />
            <label className={styles.label}>טון הודעה ברירת מחדל</label>
            <select
              value={formData.default_tone}
              onChange={(e) => setFormData({ ...formData, default_tone: e.target.value })}
              className={styles.input}
            >
              <option value="friendly">ידידותי</option>
              <option value="warm">חם</option>
              <option value="casual">קליל</option>
              <option value="formal">פורמלי</option>
            </select>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                ביטול
              </button>
              <button type="submit" className={styles.submitButton}>
                שמור
              </button>
            </div>
          </form>
        )}

        <div className={styles.contactsList}>
          {contacts.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💙</div>
              <p>אין אנשי קשר עדיין</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.7 }}>
                לחץ על &quot;הוסף איש קשר&quot; כדי להתחיל
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
                    טון ברירת מחדל: {
                      contact.default_tone === 'friendly' ? 'ידידותי' :
                      contact.default_tone === 'warm' ? 'חם' :
                      contact.default_tone === 'casual' ? 'קליל' :
                      contact.default_tone === 'formal' ? 'פורמלי' :
                      contact.default_tone
                    }
                  </p>
                )}
                {contact.id && getReminderForContact(contact.id) && (
                  <div className={styles.reminderBadge}>
                    <MdNotifications style={{ fontSize: '16px', marginLeft: '4px' }} />
                    <span>
                      כל {getReminderForContact(contact.id)?.interval_value} {getReminderForContact(contact.id)?.interval_type === 'hours' ? 'שעות' : 'ימים'}
                    </span>
                  </div>
                )}
                <div className={styles.contactActions}>
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
                        ערוך התראה
                      </>
                    ) : (
                      <>
                        <MdNotificationsOff style={{ fontSize: '18px' }} />
                        הגדר התראה
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => contact.id && handleDelete(contact.id)}
                    className={styles.deleteButton}
                  >
                    <MdDelete style={{ fontSize: '18px' }} />
                    מחק
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


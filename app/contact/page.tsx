'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { MdSend, MdCheckCircle, MdArrowBack, MdEmail, MdQuestionAnswer } from 'react-icons/md'
import { sendSupportTicket } from '@/services/support'
import { getStoredUser } from '@/services/auth'
import styles from './page.module.css'

export default function ContactPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
      setEmail(storedUser.email || '')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !subject.trim()) return

    setIsSending(true)
    setError(null)
    try {
      await sendSupportTicket({
        subject,
        message,
        email: email || undefined
      })
      setIsSent(true)
    } catch (err) {
      console.error('Error sending support ticket:', err)
      setError('שגיאה בשליחת הפנייה. אנא נסה שוב מאוחר יותר.')
    } finally {
      setIsSending(false)
    }
  }

  if (isSent) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <MdCheckCircle className={styles.successIcon} />
            <h1>ההודעה נשלחה בהצלחה!</h1>
            <p>תודה שפנית אלינו. אנחנו נחזור אליך בהקדם האפשרי.</p>
            <button onClick={() => router.push('/')} className={styles.backButton}>
              <MdArrowBack /> חזרה לבית
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.iconButton}>
            <MdArrowBack />
          </button>
          <h1 className={styles.title}>צור קשר</h1>
        </div>

        <div className={styles.card}>
          <div className={styles.infoSection}>
            <MdQuestionAnswer className={styles.infoIcon} />
            <p>נשמח לשמוע ממך! שלח לנו הצעה, דיווח על תקלה או כל שאלה שיש לך.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.field}>
              <label htmlFor="subject">נושא הפנייה</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="לדוגמה: דיווח על באג, הצעת שיפור..."
                required
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">אימייל למענה (אופציונלי)</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="המייל שלך..."
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="message">הודעה</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתוב כאן את פרטי הפנייה..."
                required
                className={styles.textarea}
                rows={6}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSending || !message.trim() || !subject.trim()}
            >
              <MdSend /> {isSending ? 'שולח...' : 'שלח הודעה'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

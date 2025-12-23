'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { AiFillHeart } from 'react-icons/ai'
import { MdEmail, MdSend, MdCheckCircle } from 'react-icons/md'
import { APP_VERSION, BUILD_DATE, CONTACT_EMAIL } from '@/lib/constants'
import { sendSupportTicket } from '@/services/support'
import styles from './page.module.css'

export default function AboutPage() {
  const { t } = useTranslation()
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactSubject, setContactSubject] = useState('פידבק מאפליקציית Stay Close')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendFeedback = async () => {
    if (!contactMessage.trim()) return
    
    setIsSending(true)
    setError(null)
    try {
      await sendSupportTicket({
        subject: contactSubject,
        message: contactMessage,
        email: contactEmail || undefined
      });
      
      setIsSent(true)
      setContactMessage('')
      setContactEmail('')
      
      // Reset after 5 seconds
      setTimeout(() => {
        setIsSent(false)
        setShowContactForm(false)
      }, 5000)
    } catch (err) {
      console.error('Error sending feedback:', err)
      setError('שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('navigation.about')}</h1>
        
        <div className={styles.content}>
          <div className={styles.icon}>💙</div>
          <p className={styles.paragraph}>
            Stay Close היא אפליקציה שפותחה כדי לעזור לכם לשמור על קשר עם האנשים החשובים בחייכם.
          </p>
          <p className={styles.paragraph}>
            האפליקציה מספקת כלים נוחים לניהול קשרים, תזכורות, והתראות כדי שלא תפספסו רגעים חשובים.
          </p>
          
          {/* מידע על גרסה */}
          <div className={styles.versionBox}>
            <p className={styles.versionText}>
            <AiFillHeart style={{ color: '#f4a5ae', fontSize: '1.2rem', marginLeft: '4px' }} />
              גרסה: <strong>{APP_VERSION}</strong>
            </p>
            <p className={styles.buildDate}>תאריך עדכון: {BUILD_DATE}</p>
          </div>

          {/* כפתור צור קשר */}
          <button 
            className={styles.contactButton}
            onClick={() => setShowContactForm(!showContactForm)}
          >
            <MdEmail style={{ fontSize: '20px' }} />
            צור קשר
          </button>

          {/* טופס צור קשר */}
          {showContactForm && (
            <div className={styles.contactForm}>
              {isSent ? (
                <div className={styles.successMessage}>
                  <MdCheckCircle style={{ fontSize: '48px', color: '#4ade80' }} />
                  <p>תודה על הפידבק! 💙</p>
                </div>
              ) : (
                <>
                  <h3>שלח לנו הודעה</h3>
                  {error && <div className={styles.formError}>{error}</div>}
                  <input
                    type="text"
                    placeholder="נושא הפנייה"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className={styles.contactInput}
                  />
                  <input
                    type="email"
                    placeholder="האימייל שלך למענה (אופציונלי)"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={styles.contactInput}
                  />
                  <textarea
                    placeholder="כתוב כאן את ההודעה, הצעה לשיפור, או דיווח על באג..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className={styles.contactTextarea}
                    rows={4}
                  />
                  <button 
                    className={styles.sendButton}
                    onClick={handleSendFeedback}
                    disabled={isSending || !contactMessage.trim()}
                  >
                    <MdSend style={{ fontSize: '18px' }} />
                    {isSending ? 'שולח...' : 'שלח'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}


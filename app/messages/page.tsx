'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { getContacts, Contact } from '@/services/contacts'
import { generateMessage, MessageRequest } from '@/services/messages'
import { Loading } from '@/components/Loading'
import { MdAutoAwesome, MdContentCopy, MdPerson, MdMessage, MdTune, MdEditNote, MdShare } from 'react-icons/md'
import { AiFillHeart, AiFillStar } from 'react-icons/ai'
import styles from './page.module.css'

export default function MessagesPage() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<number | null>(null)
  const [messageConfig, setMessageConfig] = useState<MessageRequest>({
    contact_id: 0,
    message_type: 'checkin',
    tone: 'friendly',
    additional_context: '',
    language: 'he',
  })

  useEffect(() => {
    loadContacts()
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

  const handleGenerate = async () => {
    if (!selectedContact) {
      setError('אנא בחר איש קשר')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setGeneratedMessage(null)

      const request: MessageRequest = {
        ...messageConfig,
        contact_id: selectedContact,
      }

      const result = await generateMessage(request)
      setGeneratedMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הודעה')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedMessage) return

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedMessage)
        alert('ההודעה הועתקה ללוח!')
      } else {
        // Fallback for older browsers/mobile
        const textArea = document.createElement('textarea')
        textArea.value = generatedMessage
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          const successful = document.execCommand('copy')
          if (successful) {
            alert('ההודעה הועתקה ללוח!')
          } else {
            throw new Error('Copy command failed')
          }
        } catch (err) {
          // Last resort - show the text for manual copy
          alert('העתק את ההודעה:\n\n' + generatedMessage)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Last resort - show the text for manual copy
      alert('העתק את ההודעה:\n\n' + generatedMessage)
    }
  }

  const handleShare = async () => {
    if (!generatedMessage) return

    try {
      // Check if Web Share API is available (works on mobile and modern browsers)
      if (navigator.share) {
        await navigator.share({
          text: generatedMessage,
          title: 'הודעה מותאמת אישית'
        })
      } else {
        // Fallback: copy to clipboard and show message
        await handleCopy()
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
        // Fallback to copy
        await handleCopy()
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('messages.title')}</h1>
        <p className={styles.subtitle}>{t('messages.subtitle')}</p>

        {error && (
          <div className={styles.error}>
            <strong>שגיאה:</strong> {error}
            <br />
            <small>
              טיפ: ודא שה-backend רץ, שיש GROQ_API_KEY מוגדר, ויש לפחות איש קשר אחד.
            </small>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.configPanel}>
            <h2 className={styles.sectionTitle}>
              <MdPerson style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('messages.selectContact')}
            </h2>
            <select
              value={selectedContact || ''}
              onChange={(e) => setSelectedContact(Number(e.target.value))}
              className={styles.select}
            >
              <option value="">-- בחר איש קשר --</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}>
              <MdMessage style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('messages.messageType')}
            </h2>
            <select
              value={messageConfig.message_type}
              onChange={(e) => setMessageConfig({
                ...messageConfig,
                message_type: e.target.value as MessageRequest['message_type'],
              })}
              className={styles.select}
            >
              <option value="checkin">{t('messages.types.checkin')}</option>
              <option value="birthday">{t('messages.types.birthday')}</option>
              <option value="holiday">{t('messages.types.holiday')}</option>
              <option value="custom">{t('messages.types.custom')}</option>
            </select>

            <h2 className={styles.sectionTitle}>
              <MdTune style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('messages.tone')}
            </h2>
            <select
              value={messageConfig.tone}
              onChange={(e) => setMessageConfig({
                ...messageConfig,
                tone: e.target.value as MessageRequest['tone'],
              })}
              className={styles.select}
            >
              <option value="friendly">{t('messages.tones.friendly')}</option>
              <option value="warm">{t('messages.tones.warm')}</option>
              <option value="casual">{t('messages.tones.casual')}</option>
              <option value="formal">{t('messages.tones.formal')}</option>
            </select>

            <h2 className={styles.sectionTitle}>
              <MdEditNote style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('messages.additionalContext')}
            </h2>
            <textarea
              value={messageConfig.additional_context || ''}
              onChange={(e) => setMessageConfig({
                ...messageConfig,
                additional_context: e.target.value,
              })}
              placeholder={t('messages.contextPlaceholder')}
              className={styles.textarea}
              rows={3}
            />

            <button
              onClick={handleGenerate}
              disabled={!selectedContact || generating}
              className={styles.generateButton}
            >
              <MdAutoAwesome style={{ fontSize: '20px' }} />
              {generating ? t('messages.generating') : t('messages.generate')}
            </button>
          </div>

          <div className={styles.messagePanel}>
            <h2 className={styles.sectionTitle}>
              <AiFillStar style={{ fontSize: '24px', color: '#ffd6a5' }} />
              {t('messages.generatedMessage')}
            </h2>
            {generatedMessage ? (
              <div className={styles.messageBox}>
                <div className={styles.messageContent}>{generatedMessage}</div>
                <div className={styles.buttonGroup}>
                  <button onClick={handleShare} className={styles.shareButton}>
                    <MdShare style={{ fontSize: '20px' }} />
                    {t('messages.share')}
                  </button>
                  <button onClick={handleCopy} className={styles.copyButton}>
                    <MdContentCopy style={{ fontSize: '20px' }} />
                    {t('messages.copy')}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>💙</div>
                {t('messages.placeholder')}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


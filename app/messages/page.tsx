'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { getContacts, createContact, Contact } from '@/services/contacts'
import { generateMessage, MessageRequest } from '@/services/messages'
import { Loading } from '@/components/Loading'
import { UsageBanner } from '@/components/UsageBanner'
import { MdAutoAwesome, MdContentCopy, MdPerson, MdMessage, MdTune, MdEditNote, MdShare, MdAdd } from 'react-icons/md'
import { AiFillHeart, AiFillStar } from 'react-icons/ai'
import styles from './page.module.css'

export default function MessagesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<number | 'new' | null>(null)
  const [newRecipientName, setNewRecipientName] = useState('')
  const [addingRecipient, setAddingRecipient] = useState(false)
  const [messageConfig, setMessageConfig] = useState<MessageRequest>({
    contact_id: 0,
    message_type: 'custom',
    tone: 'friendly',  // Will be updated when contact is selected
    additional_context: '',
    language: 'he',
  })

  useEffect(() => {
    loadContacts()
  }, [])
  
  // Pre-select contact from URL parameter
  useEffect(() => {
    const contactId = searchParams?.get('contact')
    if (contactId && contacts.length > 0) {
      const id = parseInt(contactId, 10)
      if (!isNaN(id) && contacts.some(c => c.id === id)) {
        setSelectedContact(id)
      }
    }
  }, [searchParams, contacts])

  // Update default tone when contact is selected
  useEffect(() => {
    if (selectedContact) {
      const contact = contacts.find(c => c.id === selectedContact)
      if (contact && contact.default_tone) {
        setMessageConfig(prev => ({
          ...prev,
          tone: contact.default_tone as MessageRequest['tone']
        }))
      }
    }
  }, [selectedContact, contacts])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getContacts()
      setContacts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נמענים')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRecipientName.trim()) return

    try {
      setAddingRecipient(true)
      setError(null)
      const newContact = await createContact({
        name: newRecipientName.trim(),
        default_tone: 'friendly'
      })
      
      setContacts(prev => [...prev, newContact])
      setSelectedContact(newContact.id!)
      setNewRecipientName('')
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת נמען')
    } finally {
      setAddingRecipient(false)
    }
  }

  const handleGenerate = async () => {
    let currentContactId = selectedContact;

    // Handle auto-creation of new recipient if user forgot to click "Add"
    if (currentContactId === 'new' && newRecipientName.trim()) {
      try {
        setAddingRecipient(true);
        const newContact = await createContact({
          name: newRecipientName.trim(),
          default_tone: messageConfig.tone || 'friendly'
        });
        setContacts(prev => [...prev, newContact]);
        currentContactId = newContact.id!;
        setSelectedContact(newContact.id!);
        setNewRecipientName('');
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'שגיאה ביצירת נמען אוטומטית');
        setAddingRecipient(false);
        return;
      } finally {
        setAddingRecipient(false);
      }
    }

    if (!currentContactId || currentContactId === 'new') {
      setError('אנא בחר נמען או הזן שם לנמען חדש');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setGeneratedMessage(null);

      const request: MessageRequest = {
        ...messageConfig,
        contact_id: currentContactId as number,
      }

      const result = await generateMessage(request)
      setGeneratedMessage(result.message)
    } catch (err: any) {
      // Check if this is a payment required error (usage limit reached)
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (errorMsg.includes('402') || errorMsg.includes('הגעת למגבלת')) {
        // Redirect to paywall
        router.push('/paywall')
        return
      }
      setError(errorMsg || 'שגיאה ביצירת הודעה')
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
    console.log('🟢 [SHARE] handleShare called')
    console.log('🟢 [SHARE] generatedMessage:', generatedMessage?.substring(0, 50))
    
    if (!generatedMessage) {
      console.log('🟢 [SHARE] No message to share, returning')
      return
    }

    try {
      // Check if running on Capacitor (native)
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.()
      console.log('🟢 [SHARE] isNative:', isNative)
      console.log('🟢 [SHARE] navigator.share available:', !!navigator.share)
      
      if (isNative) {
        console.log('🟢 [SHARE] Using Capacitor Share plugin...')
        // Use Capacitor Share plugin on native
        const { Share } = await import('@capacitor/share')
        console.log('🟢 [SHARE] Share plugin imported, calling share...')
        const result = await Share.share({
          text: generatedMessage,
          title: 'הודעה מותאמת אישית',
          dialogTitle: 'שתף הודעה'
        })
        console.log('🟢 [SHARE] Share result:', result)
      } else if (navigator.share) {
        console.log('🟢 [SHARE] Using Web Share API...')
        // Use Web Share API on web
        await navigator.share({
          text: generatedMessage,
          title: 'הודעה מותאמת אישית'
        })
        console.log('🟢 [SHARE] Web Share completed')
      } else {
        console.log('🟢 [SHARE] No share API available, falling back to copy')
        // Fallback: copy to clipboard and show message
        await handleCopy()
      }
    } catch (err) {
      console.error('🟢 [SHARE] Error:', err)
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

        {/* באנר שימוש/Trial */}
        <UsageBanner />

        {error && (
          <div className={styles.error}>
            <strong>שגיאה:</strong> {error}
            <br />
            <small>
              טיפ: ודא שה-backend רץ, שיש GROQ_API_KEY מוגדר, ויש לפחות נמען אחד.
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
              onChange={(e) => {
                const val = e.target.value
                setSelectedContact(val === 'new' ? 'new' : (val ? Number(val) : null))
              }}
              className={styles.select}
            >
              <option value="">-- בחר נמען --</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
              <option value="new">+ הוסף נמען חדש...</option>
            </select>

            {selectedContact === 'new' && (
              <form onSubmit={handleAddRecipient} className={styles.addRecipientForm}>
                <input
                  type="text"
                  placeholder="שם הנמען החדש"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className={styles.input}
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={addingRecipient || !newRecipientName.trim()}
                  className={styles.addRecipientButton}
                >
                  <MdAdd /> {addingRecipient ? 'מוסיף...' : 'הוסף'}
                </button>
              </form>
            )}

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
              <option value="custom">{t('messages.types.custom')}</option>
              <option value="checkin">{t('messages.types.checkin')}</option>
              <option value="birthday">{t('messages.types.birthday')}</option>
              <option value="holiday">{t('messages.types.holiday')}</option>
              <option value="congratulations">{t('messages.types.congratulations')}</option>
              <option value="thank_you">{t('messages.types.thank_you')}</option>
              <option value="apology">{t('messages.types.apology')}</option>
              <option value="support">{t('messages.types.support')}</option>
              <option value="invitation">{t('messages.types.invitation')}</option>
              <option value="thinking_of_you">{t('messages.types.thinking_of_you')}</option>
              <option value="anniversary">{t('messages.types.anniversary')}</option>
              <option value="get_well">{t('messages.types.get_well')}</option>
              <option value="new_job">{t('messages.types.new_job')}</option>
              <option value="graduation">{t('messages.types.graduation')}</option>
              <option value="achievement">{t('messages.types.achievement')}</option>
              <option value="encouragement">{t('messages.types.encouragement')}</option>
              <option value="condolences">{t('messages.types.condolences')}</option>
              <option value="farewell">{t('messages.types.farewell')}</option>
              <option value="new_beginning">{t('messages.types.new_beginning')}</option>
              <option value="special_thanks">{t('messages.types.special_thanks')}</option>
              <option value="moving">{t('messages.types.moving')}</option>
              <option value="wedding">{t('messages.types.wedding')}</option>
              <option value="pregnancy">{t('messages.types.pregnancy')}</option>
              <option value="birth">{t('messages.types.birth')}</option>
              <option value="promotion">{t('messages.types.promotion')}</option>
              <option value="retirement">{t('messages.types.retirement')}</option>
              <option value="reunion">{t('messages.types.reunion')}</option>
              <option value="appreciation">{t('messages.types.appreciation')}</option>
              <option value="miss_you">{t('messages.types.miss_you')}</option>
              <option value="good_luck">{t('messages.types.good_luck')}</option>
              <option value="celebration">{t('messages.types.celebration')}</option>
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
              <option value="humorous">{t('messages.tones.humorous')}</option>
              <option value="professional">{t('messages.tones.professional')}</option>
              <option value="intimate">{t('messages.tones.intimate')}</option>
              <option value="supportive">{t('messages.tones.supportive')}</option>
              <option value="enthusiastic">{t('messages.tones.enthusiastic')}</option>
              <option value="gentle">{t('messages.tones.gentle')}</option>
              <option value="confident">{t('messages.tones.confident')}</option>
              <option value="playful">{t('messages.tones.playful')}</option>
              <option value="sincere">{t('messages.tones.sincere')}</option>
              <option value="optimistic">{t('messages.tones.optimistic')}</option>
              <option value="empathetic">{t('messages.tones.empathetic')}</option>
              <option value="encouraging">{t('messages.tones.encouraging')}</option>
              <option value="grateful">{t('messages.tones.grateful')}</option>
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
              disabled={(selectedContact === 'new' ? !newRecipientName.trim() : !selectedContact) || generating || addingRecipient}
              className={styles.generateButton}
            >
              <MdAutoAwesome style={{ fontSize: '20px' }} />
              {generating ? t('messages.generating') : (addingRecipient ? 'יוצר נמען...' : t('messages.generate'))}
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


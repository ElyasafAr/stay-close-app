'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { getContacts, createContact, Contact } from '@/services/contacts'
import { generateMessage, MessageRequest } from '@/services/messages'
import { getStoredUser } from '@/services/auth'
import { Loading } from '@/components/Loading'
import { UsageBanner } from '@/components/UsageBanner'
import { MdAutoAwesome, MdContentCopy, MdPerson, MdMessage, MdTune, MdEditNote, MdShare, MdAdd, MdLanguage, MdWavingHand } from 'react-icons/md'
import { AiFillHeart, AiFillStar } from 'react-icons/ai'
import styles from './page.module.css'

export default function MessagesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [greeting, setGreeting] = useState('')
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

  // Load user and set greeting
  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)
    
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting(t('messages.greetings.morning'))
    else if (hour >= 12 && hour < 17) setGreeting(t('messages.greetings.afternoon'))
    else if (hour >= 17 && hour < 21) setGreeting(t('messages.greetings.evening'))
    else setGreeting(t('messages.greetings.night'))
  }, [t])

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
    if (selectedContact && selectedContact !== 'new') {
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
      setError(err instanceof Error ? err.message : t('contacts.errorLoading'))
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
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('402') || errorMsg.includes('הגעת למגבלת') || errorMsg.includes('limit reached')) {
        router.push('/paywall');
        return;
      }
      setError(errorMsg || t('messages.errorCreatingContact'));
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
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('402') || errorMsg.includes('הגעת למגבלת') || errorMsg.includes('limit reached')) {
          router.push('/paywall');
          return;
        }
        setError(errorMsg || t('messages.errorCreatingContact'));
        setAddingRecipient(false);
        return;
      } finally {
        setAddingRecipient(false);
      }
    }

    if (!currentContactId || currentContactId === 'new') {
      setError(t('messages.errorNoContact'));
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
      if (errorMsg.includes('402') || errorMsg.includes('הגעת למגבלת') || errorMsg.includes('limit reached')) {
        // Redirect to paywall
        router.push('/paywall')
        return
      }
      setError(errorMsg || t('messages.errorGenerating'))
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
        alert(t('messages.copied'))
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
            alert(t('messages.copied'))
          } else {
            throw new Error('Copy command failed')
          }
        } catch (err) {
          // Last resort - show the text for manual copy
          alert(t('messages.copy') + ':\n\n' + generatedMessage)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Last resort - show the text for manual copy
      alert(t('messages.copy') + ':\n\n' + generatedMessage)
    }
  }

  const handleShare = async () => {
    if (!generatedMessage) return

    try {
      // Check if running on Capacitor (native)
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.()
      
      if (isNative) {
        // Use Capacitor Share plugin on native
        const { Share } = await import('@capacitor/share')
        await Share.share({
          text: generatedMessage,
          title: t('messages.shareTitle'),
          dialogTitle: t('messages.shareDialog')
        })
      } else if (navigator.share) {
        // Use Web Share API on web
        await navigator.share({
          text: generatedMessage,
          title: t('messages.shareTitle')
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
        <div className={styles.welcomeSection}>
          <div className={styles.greeting}>
            <MdWavingHand className={styles.greetingIcon} />
            <span>{greeting}, {user?.username || t('messages.greetings.guest')}</span>
          </div>
          <h1 className={styles.title}>{t('messages.title')}</h1>
          <p className={styles.subtitle}>{t('messages.subtitle')}</p>
        </div>

        {/* באנר שימוש/Trial */}
        <UsageBanner />

        {error && (
          <div className={styles.error}>
            <strong>{t('common.error')}:</strong> {error}
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.configPanel}>
            <h2 className={styles.sectionTitle}>
              <MdPerson style={{ fontSize: '24px', color: '#a8d5e2', marginInlineEnd: '8px' }} />
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
              <option value="">{t('messages.selectContactPlaceholder')}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
              <option value="new">{t('messages.addNewContactOption')}</option>
            </select>

            {selectedContact === 'new' && (
              <form onSubmit={handleAddRecipient} className={styles.addRecipientForm}>
                <input
                  type="text"
                  placeholder={t('messages.newContactNamePlaceholder')}
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
                  <MdAdd /> {addingRecipient ? t('messages.addingRecipient') : t('contacts.addContact')}
                </button>
              </form>
            )}

            <h2 className={styles.sectionTitle}>
              <MdMessage style={{ fontSize: '24px', color: '#a8d5e2', marginInlineEnd: '8px' }} />
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
              {Object.entries(t('messages.types') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}>
              <MdTune style={{ fontSize: '24px', color: '#a8d5e2', marginInlineEnd: '8px' }} />
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
              {Object.entries(t('messages.tones') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}>
              <MdLanguage style={{ fontSize: '24px', color: '#a8d5e2', marginInlineEnd: '8px' }} />
              {t('messages.language')}
            </h2>
            <select
              value={messageConfig.language}
              onChange={(e) => setMessageConfig({
                ...messageConfig,
                language: e.target.value as MessageRequest['language'],
              })}
              className={styles.select}
            >
              {Object.entries(t('messages.languages') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}>
              <MdEditNote style={{ fontSize: '24px', color: '#a8d5e2', marginInlineEnd: '8px' }} />
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
              {generating ? t('messages.generating') : (addingRecipient ? t('messages.addingRecipient') : t('messages.generate'))}
            </button>
          </div>

          <div className={styles.messagePanel}>
            <h2 className={styles.sectionTitle}>
              <AiFillStar style={{ fontSize: '24px', color: '#ffd6a5', marginInlineEnd: '8px' }} />
              {t('messages.generatedMessage')}
            </h2>
            {generating ? (
              <div className={styles.generatingBox}>
                <MdAutoAwesome className={styles.generatingIcon} />
                <div className={styles.generatingText}>{t('messages.generating')}</div>
              </div>
            ) : generatedMessage ? (
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
    </main>
  )
}


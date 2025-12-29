'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { useSettings } from '@/state/useSettings'
import { 
  getData, 
  postData,
  MessageResponse
} from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { 
  MdSend, 
  MdRefresh, 
  MdContentCopy, 
  MdPerson, 
  MdHistory,
  MdTune,
  MdLanguage,
  MdCheckCircle,
  MdError,
  MdChat,
  MdShare,
  MdWavingHand
} from 'react-icons/md'
import { AdBanner } from '@/components/AdBanner'
import { UsageBanner } from '@/components/UsageBanner'
import styles from './page.module.css'

function MessagesContent() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  
  const [messageConfig, setMessageConfig] = useState<any>({
    contact_id: 0,
    message_type: 'custom',
    tone: 'friendly',
    additional_context: '',
    language: 'he',
  })

  const [generatedMessage, setGeneratedMessage] = useState<MessageResponse | null>(null)

  // Emergency render break
  const renderCount = useRef(0)
  useEffect(() => {
    renderCount.current += 1
    if (renderCount.current > 100) {
      console.error('🚨 [MessagesPage] Infinite loop detected!');
    }
  })

  // Data loader
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated()) return;
    
    try {
      setLoading(true)
      const contactsRes = await getData<any[]>('/api/contacts')
      if (contactsRes.success) setContacts(contactsRes.data || [])
      
      const contactId = searchParams?.get('contactId')
      if (contactId) {
        setMessageConfig((prev: any) => ({ ...prev, contact_id: parseInt(contactId) }))
      }
    } catch (err) {
      console.error('Failed to load initial data:', err)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (settings.messageLanguage && messageConfig.language !== settings.messageLanguage) {
      setMessageConfig((prev: any) => ({ ...prev, language: settings.messageLanguage }));
    }
  }, [settings.messageLanguage, messageConfig.language]);

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleGenerate = async () => {
    if (messageConfig.contact_id === 0) {
      setError(t('messages.selectContactError'))
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const response = await postData<{message: string, contact_name: string, message_type: string, tone: string, usage?: any}>('/api/messages/generate', messageConfig)
      if (response.success && response.data) {
        // Map API response (uses 'message') to our interface (uses 'content')
        setGeneratedMessage({
          content: response.data.message,
          contact_name: response.data.contact_name,
          message_type: response.data.message_type,
          tone: response.data.tone,
          usage: response.data.usage
        })
      } else {
        setError(response.error || t('messages.generateError'))
      }
    } catch (err) {
      setError(t('messages.generateError'))
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generatedMessage) return
    navigator.clipboard.writeText(generatedMessage.content)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleShare = async () => {
    if (!generatedMessage) return
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: t('messages.shareTitle'),
        text: generatedMessage.content,
        dialogTitle: t('messages.shareDialogTitle'),
      })
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const greeting = useMemo(() => {
    const hours = new Date().getHours()
    if (hours < 12) return t('messages.greetings.morning')
    if (hours < 18) return t('messages.greetings.afternoon')
    return t('messages.greetings.evening')
  }, [t])

  if (loading) {
    return <main className={styles.main}><div className={styles.container}>{t('common.loading')}</div></main>
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <UsageBanner />
        
        <div className={styles.welcomeSection}>
          <div className={styles.greeting}>
            <MdWavingHand className={styles.greetingIcon} />
            {greeting}
          </div>
          <h1 className={styles.title}>{t('messages.title')}</h1>
          <p className={styles.subtitle}>{t('messages.subtitle')}</p>
        </div>

        {error && (
          <div className={styles.error}>
            <MdError /> {error}
          </div>
        )}

        <div className={styles.content}>
          {/* Configuration Panel */}
          <div className={styles.configPanel}>
            <h2 className={styles.sectionTitle}><MdPerson /> {t('messages.chooseContact')}</h2>
            <select
              value={messageConfig.contact_id}
              onChange={(e) => setMessageConfig({...messageConfig, contact_id: parseInt(e.target.value)})}
              className={styles.select}
            >
              <option value={0}>{t('messages.selectContact')}</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>{contact.name}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdChat /> {t('messages.messageType')}</h2>
            <select
              value={messageConfig.message_type}
              onChange={(e) => setMessageConfig({...messageConfig, message_type: e.target.value})}
              className={styles.select}
            >
              {Object.entries(t('messages.types') || {}).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdTune /> {t('messages.tone')}</h2>
            <select
              value={messageConfig.tone}
              onChange={(e) => setMessageConfig({...messageConfig, tone: e.target.value as any})}
              className={styles.select}
            >
              {Object.entries(t('messages.tones') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdLanguage /> {t('messages.language')}</h2>
            <select
              value={messageConfig.language}
              onChange={(e) => setMessageConfig({...messageConfig, language: e.target.value})}
              className={styles.select}
            >
              {Object.entries(t('messages.languages') as any).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdHistory /> {t('messages.context')}</h2>
            <textarea
              value={messageConfig.additional_context}
              onChange={(e) => setMessageConfig({...messageConfig, additional_context: e.target.value})}
              placeholder={t('messages.contextPlaceholder')}
              className={styles.textarea}
            />

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={styles.generateButton}
            >
              {generating ? (
                <><MdRefresh className={styles.spinning} /> {t('messages.generating')}</>
              ) : (
                <><MdSend /> {t('messages.generate')}</>
              )}
            </button>
          </div>

          {/* Message Result Panel */}
          <div className={styles.messagePanel}>
            {generating ? (
              <div className={styles.generatingBox}>
                <MdRefresh className={styles.generatingIcon} />
                <p className={styles.generatingText}>{t('messages.generating')}</p>
              </div>
            ) : generatedMessage ? (
              <div className={styles.messageBox}>
                <div className={styles.messageContent}>
                  {generatedMessage.content}
                </div>
                <div className={styles.buttonGroup}>
                  <button onClick={handleShare} className={styles.shareButton}>
                    <MdShare /> {t('messages.share')}
                  </button>
                  <button onClick={handleCopy} className={styles.copyButton}>
                    {copySuccess ? <MdCheckCircle /> : <MdContentCopy />}
                    {copySuccess ? t('messages.copied') : t('messages.copy')}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <MdChat className={styles.placeholderIcon} />
                <p>{t('messages.noMessageYet')}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <AdBanner />
        </div>
      </div>
    </main>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<main className={styles.main}></main>}>
      <MessagesContent />
    </Suspense>
  )
}

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
  MdWavingHand,
  MdVideoLibrary,
  MdStar
} from 'react-icons/md'
import { AdBanner } from '@/components/AdBanner'
import { UsageBanner } from '@/components/UsageBanner'
import { showInterstitialAd, showRewardedVideoAd, isAdsSupported } from '@/services/admob'
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
  const [usageStatus, setUsageStatus] = useState<any>(null)
  const [showRewardedVideoModal, setShowRewardedVideoModal] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  
  // Initial config with language from settings/localStorage if available
  const [messageConfig, setMessageConfig] = useState<any>(() => {
    let initialLang = 'he';
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.language) initialLang = settings.language;
        } catch (e) {}
      }
    }
    return {
      contact_id: 0,
      message_type: 'custom',
      tone: 'friendly',
      additional_context: '',
      language: initialLang,
    };
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
    console.log('🔵 [MessagesPage] loadInitialData starting...');
    if (!isAuthenticated()) {
      console.warn('⚠️ [MessagesPage] Not authenticated in loadInitialData');
      setLoading(false);
      return;
    }
    
    // Safety timeout to prevent stuck loading screen
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ [MessagesPage] initial data load timed out');
      isTimedOut = true;
      setLoading(false);
    }, 5000);

    try {
      setLoading(true)
      console.log('🔵 [MessagesPage] Fetching contacts...');
      const contactsRes = await getData<any[]>('/api/contacts')
      console.log('🔵 [MessagesPage] Contacts response:', contactsRes.success ? 'success' : 'failed');
      if (contactsRes.success) setContacts(contactsRes.data || [])

      // Load usage status for ads and limits
      console.log('🔵 [MessagesPage] Fetching usage status...');
      const usageRes = await getData<any>('/api/usage/status')
      console.log('🔵 [MessagesPage] Usage status response:', JSON.stringify(usageRes.data, null, 2));
      if (usageRes.success && usageRes.data) {
        setUsageStatus(usageRes.data)
      }

      const contactId = searchParams?.get('contactId') || searchParams?.get('contact')
      if (contactId) {
        console.log('🔵 [MessagesPage] Setting contact from URL:', contactId);
        const id = parseInt(contactId);
        setMessageConfig((prev: any) => {
          const newConfig = { ...prev, contact_id: id };

          // If we found the contact in the list, use its default tone
          const selectedContact = contactsRes.data?.find((c: any) => c.id === id);
          if (selectedContact?.default_tone) {
            console.log('🔵 [MessagesPage] Setting default tone from contact:', selectedContact.default_tone);
            newConfig.tone = selectedContact.default_tone;
          }

          return newConfig;
        })
      }
    } catch (err) {
      console.error('❌ [MessagesPage] Failed to load initial data:', err)
    } finally {
      clearTimeout(timeoutId);
      if (!isTimedOut) {
        console.log('🔵 [MessagesPage] loadInitialData finished, setting loading to false');
        setLoading(false)
      }
    }
  }, [searchParams])

  // Sync language with settings changes if it hasn't been manually changed yet
  const isLanguageManuallyChanged = useRef(false);
  useEffect(() => {
    if (settings.language && !isLanguageManuallyChanged.current) {
      console.log('🔵 [MessagesPage] Updating language from settings change:', settings.language);
      setMessageConfig((prev: any) => ({ ...prev, language: settings.language }));
    }
  }, [settings.language]);

  // Debug log for config changes
  useEffect(() => {
    console.log('🔵 [MessagesPage] messageConfig updated:', messageConfig);
  }, [messageConfig]);

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
    setGenerationStage('preparing')

    try {
      // Show interstitial ad for free users every 3rd message (less aggressive)
      console.log('🔵 [Messages] Usage status:', JSON.stringify(usageStatus, null, 2))
      const dailyUsed = usageStatus?.messages?.daily_used || 0
      const shouldShowAd = dailyUsed > 0 && dailyUsed % 3 === 0 // Every 3rd message

      console.log('🎯 [Messages] Ad check:', {
        dailyUsed,
        modulo: dailyUsed % 3,
        shouldShowAd,
        isFree: usageStatus?.subscription_status === 'free',
        adsSupported: isAdsSupported()
      })

      if (usageStatus?.subscription_status === 'free' && isAdsSupported() && shouldShowAd) {
        console.log('📺 [Messages] Showing interstitial ad (every 3rd message)')
        setGenerationStage('ad')
        await showInterstitialAd()
      } else {
        console.log('✅ [Messages] Skipping ad - not 3rd message or premium user')
      }

      // Generate the message
      setGenerationStage('generating')
      const response = await postData<{message: string, contact_name: string, message_type: string, tone: string, usage?: any}>('/api/messages/generate', messageConfig)

      if (response.success && response.data) {
        console.log('✅ [Messages] Message generated successfully')
        // Map API response (uses 'message') to our interface (uses 'content')
        setGeneratedMessage({
          content: response.data.message,
          contact_name: response.data.contact_name,
          message_type: response.data.message_type,
          tone: response.data.tone,
          usage: response.data.usage
        })

        // Update usage status
        if (response.data?.usage) {
          setUsageStatus((prev: any) => ({
            ...prev,
            messages: response.data?.usage
          }))
        }
      } else {
        console.error('❌ [Messages] Generation failed:', response.error)
        // Check if error is due to limit reached - parse JSON error
        let shouldShowRewardedModal = false
        if (response.error) {
          try {
            // Try to parse error as JSON (backend sends 402 with detail object)
            const errorObj = JSON.parse(response.error)
            if (errorObj.reason === 'daily_limit_reached' || errorObj.reason === 'monthly_limit_reached') {
              console.log('🎯 [Messages] Daily limit reached - showing rewarded video modal')
              shouldShowRewardedModal = true
            }
          } catch (e) {
            // Not JSON, check string
            if (response.error.includes('הגעת למגבלת')) {
              console.log('🎯 [Messages] Limit reached (string match) - showing rewarded video modal')
              shouldShowRewardedModal = true
            }
          }
        }
        if (shouldShowRewardedModal) {
          setShowRewardedVideoModal(true)
        }
        setError(response.error || t('messages.generateError'))
      }
    } catch (err: any) {
      console.error('❌ [Messages] Generation error:', err)
      // Check if error is due to limit reached
      let shouldShowRewardedModal = false
      if (err.message) {
        try {
          const errorObj = JSON.parse(err.message)
          if (errorObj.reason === 'daily_limit_reached' || errorObj.reason === 'monthly_limit_reached') {
            console.log('🎯 [Messages] Daily limit reached (catch) - showing rewarded video modal')
            shouldShowRewardedModal = true
          }
        } catch (e) {
          if (err.message.includes('הגעת למגבלת') || err.message.includes('402')) {
            console.log('🎯 [Messages] Limit reached (catch string) - showing rewarded video modal')
            shouldShowRewardedModal = true
          }
        }
      }
      if (shouldShowRewardedModal) {
        setShowRewardedVideoModal(true)
      }
      setError(err.message || t('messages.generateError'))
    } finally {
      setGenerating(false)
      setGenerationStage('')
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

  const handleWatchRewardedVideo = async () => {
    setShowRewardedVideoModal(false)

    try {
      const result = await showRewardedVideoAd()

      if (result.rewarded) {
        // Call backend to redeem the bonus
        const response = await postData<{success: boolean; bonus_added: number; message: string}>('/api/usage/rewarded-video', {})

        if (response.success && response.data) {
          alert(`✅ ${response.data.message}`)

          // Reload usage status
          const usageRes = await getData<any>('/api/usage/status')
          if (usageRes.success && usageRes.data) {
            setUsageStatus(usageRes.data)
          }
        }
      } else {
        alert('⚠️ צפה בסרטון עד הסוף כדי לקבל 25 הודעות נוספות')
      }
    } catch (error) {
      console.error('Rewarded video error:', error)
      alert('⚠️ שגיאה בהצגת הפרסומת. נסה שוב מאוחר יותר.')
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
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const selectedContact = contacts.find(c => c.id === id);
                setMessageConfig((prev: any) => ({
                  ...prev,
                  contact_id: id,
                  tone: selectedContact?.default_tone || prev.tone
                }));
              }}
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
              {Object.entries(t('messages.types') && typeof t('messages.types') === 'object' ? t('messages.types') : {}).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdTune /> {t('messages.tone')}</h2>
            <select
              value={messageConfig.tone}
              onChange={(e) => setMessageConfig({...messageConfig, tone: e.target.value as any})}
              className={styles.select}
            >
              {Object.entries(t('messages.tones') && typeof t('messages.tones') === 'object' ? t('messages.tones') : {}).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>

            <h2 className={styles.sectionTitle}><MdLanguage /> {t('messages.language')}</h2>
            <select
              value={messageConfig.language}
              onChange={(e) => {
                console.log('🔵 [MessagesPage] Language changed manualy to:', e.target.value);
                isLanguageManuallyChanged.current = true;
                setMessageConfig({...messageConfig, language: e.target.value});
              }}
              className={styles.select}
            >
              {Object.entries(t('messages.languages') && typeof t('messages.languages') === 'object' ? t('messages.languages') : {}).map(([key, label]) => (
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
                {generationStage === 'preparing' && (
                  <>
                    <p className={styles.generatingText}>⏳ {t('messages.preparingMessage')}</p>
                    <small style={{opacity: 0.7, marginTop: '8px'}}>{t('messages.preparingWait')}</small>
                  </>
                )}
                {generationStage === 'ad' && (
                  <>
                    <p className={styles.generatingText}>⏳ {t('messages.generatingPersonal')}</p>
                    <small style={{opacity: 0.7, marginTop: '8px'}}>💡 {t('messages.generatingAdWait')}</small>
                  </>
                )}
                {generationStage === 'generating' && (
                  <>
                    <p className={styles.generatingText}>🤖 {t('messages.generatingAI')}</p>
                    <small style={{opacity: 0.7, marginTop: '8px'}}>{t('messages.generatingAlmost')}</small>
                  </>
                )}
                {!generationStage && (
                  <p className={styles.generatingText}>{t('messages.generating')}</p>
                )}
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

        {/* Rewarded Video Modal */}
        {showRewardedVideoModal && (
          <div className={styles.modalOverlay} onClick={() => setShowRewardedVideoModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                <MdVideoLibrary size={32} style={{marginBottom: '8px'}} />
                <br />
                {t('messages.rewardedModal.title')}
              </h2>
              <p className={styles.modalText} dangerouslySetInnerHTML={{ __html: t('messages.rewardedModal.description') }} />
              {usageStatus?.messages?.rewarded_bonus > 0 && (
                <p className={styles.modalText} style={{fontSize: '0.9rem', opacity: 0.85, marginTop: '8px'}}>
                  {t('messages.rewardedModal.bonusEarned', { count: usageStatus.messages.rewarded_bonus })}
                </p>
              )}
              <div className={styles.modalButtons}>
                <button onClick={handleWatchRewardedVideo} className={styles.watchButton}>
                  <MdVideoLibrary /> {t('messages.rewardedModal.watchButton')}
                </button>
                <button onClick={() => router.push('/paywall')} className={styles.upgradeButton}>
                  <MdStar /> {t('messages.rewardedModal.upgradeButton')}
                </button>
                <button onClick={() => setShowRewardedVideoModal(false)} className={styles.cancelButton}>
                  {t('messages.rewardedModal.closeButton')}
                </button>
              </div>
            </div>
          </div>
        )}
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

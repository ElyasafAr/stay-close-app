'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData } from '@/services/api'
import { isAuthenticated } from '@/services/auth'
import { useTranslation } from '@/i18n/useTranslation'
import styles from './UsageBanner.module.css'

interface UsageStatus {
  subscription_status: 'trial' | 'free' | 'premium'
  trial_days_remaining: number
  messages: {
    daily_used: number
    daily_limit: number | null
    monthly_used: number
    monthly_limit: number | null
    can_generate: boolean
  }
  contacts: {
    current: number
    max: number | null
    can_add: boolean
  }
}

export function UsageBanner() {
  const { t } = useTranslation()
  const router = useRouter()
  const [usageData, setUsageData] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) return
    loadUsageStatus()
  }, [])

  const loadUsageStatus = async () => {
    try {
      const response = await getData<UsageStatus>('/api/usage/status')
      if (response.success && response.data) {
        setUsageData(response.data)
      }
    } catch (error) {
      console.error('Error loading usage status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show banner for premium users or while loading
  if (loading || !usageData || usageData.subscription_status === 'premium') {
    return null
  }

  const { subscription_status, trial_days_remaining, messages } = usageData

  const handleNavigation = (href: string) => {
    console.log(`[UsageBanner] Navigating to ${href}`);
    try {
      router.push(href);
      // Fallback if router gets stuck
      setTimeout(() => {
        if (window.location.pathname !== href) {
          console.warn(`[UsageBanner] Router stuck, using window.location`);
          window.location.href = href;
        }
      }, 500);
    } catch (error) {
      window.location.href = href;
    }
  }

  // Trial banner
  if (subscription_status === 'trial' && trial_days_remaining > 0) {
    return (
      <div className={styles.trialBanner}>
        <span>{t('usage.trialRemaining').replace('{{days}}', trial_days_remaining.toString())}</span>
        <button 
          className={styles.upgradeButton}
          onClick={() => handleNavigation('/paywall')}
        >
          {t('usage.donateNow')}
        </button>
      </div>
    )
  }

  // Free user - show remaining messages
  if (subscription_status === 'free' && messages.daily_limit !== null) {
    const remaining = messages.daily_limit - messages.daily_used
    const isLow = remaining <= 1
    
    return (
      <div className={`${styles.usageBanner} ${isLow ? styles.warning : ''}`}>
        <span>
          {remaining > 0 
            ? t('usage.messagesRemaining').replace('{{count}}', remaining.toString())
            : t('usage.limitReached')
          }
        </span>
        <button 
          className={styles.upgradeButton}
          onClick={() => handleNavigation('/paywall')}
        >
          {t('usage.donateUnlimited')}
        </button>
      </div>
    )
  }

  return null
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData } from '@/services/api'
import styles from './AdBanner.module.css'

interface UsageStatus {
  subscription_status: 'free' | 'trial' | 'premium'
  ads_enabled: boolean
}

export const AdBanner = () => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkAdsStatus = async () => {
      try {
        const response = await getData<UsageStatus>('/api/usage/status')
        if (response.success && response.data) {
          const { subscription_status, ads_enabled } = response.data
          // Show ads ONLY if they are enabled globally AND the user is NOT a premium user
          // Free and Trial users see ads if enabled. Premium users never see ads.
          setIsVisible(ads_enabled && subscription_status !== 'premium')
        }
      } catch (error) {
        console.error('Error checking ads status:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    checkAdsStatus()
  }, [])

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    console.log(`[AdBanner] Navigating to ${href}`);
    try {
      router.push(href);
      // Fallback if router gets stuck
      setTimeout(() => {
        if (window.location.pathname !== href) {
          console.warn(`[AdBanner] Router stuck, using window.location`);
          window.location.href = href;
        }
      }, 500);
    } catch (error) {
      window.location.href = href;
    }
  }

  if (!isLoaded || !isVisible) return null

  return (
    <div className={styles.adContainer}>
      <div className={styles.adBox}>
        <span className={styles.adLabel}>פרסומת</span>
        <div className={styles.adContent}>
          <div className={styles.adTitle}>Stay Close Premium</div>
          <div className={styles.adText}>תמוך באפליקציה ותהנה מחוויה ללא פרסומות</div>
        </div>
      </div>
      <a 
        href="/paywall" 
        className={styles.removeAds}
        onClick={(e) => handleNavigation(e, '/paywall')}
      >
        הסר פרסומות ושדרג לפרימיום
      </a>
    </div>
  )
}

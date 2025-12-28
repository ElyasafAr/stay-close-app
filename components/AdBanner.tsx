'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData } from '@/services/api'
import { Capacitor } from '@capacitor/core'
import { 
  AdMob, 
  BannerAdPosition, 
  BannerAdSize, 
  AdmobConsentStatus,
  BannerAdPluginEvents,
  AdMobBannerSize
} from '@capacitor-community/admob'
import styles from './AdBanner.module.css'

interface UsageStatus {
  subscription_status: 'free' | 'trial' | 'premium'
  ads_enabled: boolean
}

// מזהה יחידת הפרסום (Ad Unit ID) שקיבלת עבור אנדרואיד
const ADMOB_BANNER_ID = 'ca-app-pub-1245288761068546/5996451103';

export const AdBanner = () => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    const checkAdsStatus = async () => {
      try {
        const isAndroid = Capacitor.getPlatform() === 'android';
        setIsNative(Capacitor.isNativePlatform());

        const response = await getData<UsageStatus>('/api/usage/status')
        if (response.success && response.data) {
          const { subscription_status, ads_enabled } = response.data
          // הצגת פרסומות רק אם הן מופעלות גלובלית והמשתמש אינו פרימיום
          const shouldShow = ads_enabled && subscription_status !== 'premium';
          setIsVisible(shouldShow)

          // אם אנחנו באנדרואיד וצריך להציג פרסומת
          if (shouldShow && isAndroid) {
            initializeAndShowBanner();
          }
        }
      } catch (error) {
        console.error('Error checking ads status:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    const initializeAndShowBanner = async () => {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: [], // הוסף כאן מזהי מכשירים לבדיקה אם צריך
          initializeOnStartup: true,
        });

        // הצגת הבאנר
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false // שנה ל-true בזמן פיתוח אם גוגל חוסמים אותך
        });

        console.log('✅ [AdMob] Banner shown successfully');
      } catch (error) {
        console.error('❌ [AdMob] Error showing banner:', error);
      }
    };

    checkAdsStatus()

    // ניקוי ביציאה מהקומפוננטה
    return () => {
      if (Capacitor.getPlatform() === 'android') {
        AdMob.hideBanner().catch(err => console.error('Error hiding banner:', err));
      }
    }
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

  // אם אנחנו באנדרואיד, הבאנר מוצג בצורה נייטיבית מעל ה-WebView
  // לכן נחזיר אלמנט ריק כדי לא "להפריע" ויזואלית ב-DOM, או נחזיר רווח תחתון
  if (isNative) {
    return <div style={{ height: '60px', width: '100%' }} />;
  }

  // תצוגת Web (באנר דמה/עיצובי)
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

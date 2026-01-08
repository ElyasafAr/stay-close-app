'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getData } from '@/services/api'
import { Capacitor } from '@capacitor/core'
import { 
  AdMob, 
  BannerAdPosition, 
  BannerAdSize, 
} from '@capacitor-community/admob'
import styles from './AdBanner.module.css'

interface UsageStatus {
  subscription_status: 'free' | 'trial' | 'premium'
  ads_enabled: boolean
}

const ADMOB_BANNER_ID = 'ca-app-pub-1245288761068546/5996451103';

let isAdMobInitialized = false;
let isBannerVisible = false;

export const AdBanner = () => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [donationEnabled, setDonationEnabled] = useState(false)

  useEffect(() => {
    const isAndroid = Capacitor.getPlatform() === 'android';
    setIsNative(isAndroid);

    const initializeAndShowBanner = async () => {
      try {
        if (!isAdMobInitialized) {
          const myDeviceId = 'DE492EA88D9B9D65E5B0D047D4A5500C';
          console.log(`[AdMob] Initializing AdMob with device: ${myDeviceId}`);
          await AdMob.initialize({ testingDevices: [myDeviceId] });
          isAdMobInitialized = true;
        }

        if (isBannerVisible) {
          console.log('[AdMob] Banner already exists, ensuring it is visible');
          await AdMob.resumeBanner();
          return;
        }

        console.log('[AdMob] Calling showBanner...');
        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false 
        });
        isBannerVisible = true;
        console.log('✅ [AdMob] Banner is now visible');
      } catch (error) {
        console.error('❌ [AdMob] Error in initializeAndShowBanner:', error);
      }
    };

    const checkAdsStatus = async () => {
      try {
        console.log('🔵 [AdBanner] Checking ads status...');
        const response = await getData<any>('/api/usage/status')
        if (response.success && response.data) {
          const { subscription_status, ads_enabled, donation_enabled } = response.data
          console.log('📊 [AdBanner DEBUG] Status:', {
            subscription_status,
            ads_enabled,
            donation_enabled,
            isAndroid,
            shouldShow: ads_enabled && subscription_status !== 'premium'
          });

          setDonationEnabled(donation_enabled === true);

          const shouldShow = ads_enabled && subscription_status !== 'premium';
          setIsVisible(shouldShow);

          if (shouldShow && isAndroid) {
            console.log('✅ [AdBanner] Should show banner - initializing...');
            // טעינה עם השהיה קלה כדי לוודא שה-WebView סיים להתרנדר
            setTimeout(() => initializeAndShowBanner(), 500);
          } else {
            console.log('❌ [AdBanner] Banner hidden. Reason:', {
              ads_enabled,
              subscription_status,
              isAndroid
            });
          }
        }
      } catch (error) {
        console.error('❌ [AdBanner] Error checking ads status:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    checkAdsStatus()
  }, [])

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    router.replace(href);
  }

  // באנדרואיד אנחנו תמיד מחזירים את הדיב כדי לשמור על מקום למודעה
  if (isNative) {
    return <div id="admob-placeholder" style={{ height: '65px', width: '100%', background: 'transparent' }} />;
  }

  if (!isLoaded || !isVisible) return null

  return (
    <div className={styles.adContainer}>
      <div className={styles.adBox}>
        <span className={styles.adLabel}>פרסומת</span>
        <div className={styles.adContent}>
          <div className={styles.adTitle}>Stay Close</div>
          <div className={styles.adText}>תודה שאתם משתמשים באפליקציה! 💙</div>
        </div>
      </div>
      {donationEnabled && (
        <a href="/paywall" className={styles.removeAds} onClick={(e) => handleNavigation(e, '/paywall')}>
          הסר פרסומות ושדרג לפרימיום
        </a>
      )}
    </div>
  )
}

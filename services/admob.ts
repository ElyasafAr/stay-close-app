/**
 * AdMob Service - Handles interstitial and rewarded video ads
 */

import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  InterstitialAdPluginEvents,
  AdOptions
} from '@capacitor-community/admob'
import { RewardAdPluginEvents } from '@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum'
import type { AdMobRewardItem } from '@capacitor-community/admob/dist/esm/reward/reward-item.interface'

// Ad Unit IDs - Production
export const AD_UNIT_IDS = {
  INTERSTITIAL: 'ca-app-pub-1245288761068546/4215501546', // Message Generation Interstitial
  REWARDED: 'ca-app-pub-1245288761068546/6806345170',     // Extra Messages Reward
}

let isInitialized = false

/**
 * Initialize AdMob
 */
export async function initializeAdMob(): Promise<boolean> {
  if (isInitialized) {
    return true
  }

  const isNative = Capacitor.getPlatform() === 'android'
  if (!isNative) {
    console.log('[AdMob] Not on Android, skipping initialization')
    return false
  }

  try {
    const myDeviceId = 'DE492EA88D9B9D65E5B0D047D4A5500C'
    console.log('[AdMob] Initializing...')

    await AdMob.initialize({
      testingDevices: [myDeviceId],
      initializeForTesting: false // Production mode
    })

    isInitialized = true
    console.log('✅ [AdMob] Initialized successfully')
    return true
  } catch (error) {
    console.error('❌ [AdMob] Initialization error:', error)
    return false
  }
}

/**
 * Show interstitial ad during message generation
 * Returns a promise that resolves when ad is closed or fails
 */
export async function showInterstitialAd(): Promise<boolean> {
  const isNative = Capacitor.getPlatform() === 'android'
  if (!isNative) {
    console.log('[AdMob] Not on Android, skipping interstitial')
    return false
  }

  try {
    // Ensure initialized
    if (!isInitialized) {
      await initializeAdMob()
    }

    console.log('[AdMob] Preparing interstitial ad...')

    // Prepare (load) the interstitial ad
    const options: AdOptions = {
      adId: AD_UNIT_IDS.INTERSTITIAL,
      isTesting: false // Production mode
    }

    await AdMob.prepareInterstitial(options)
    console.log('[AdMob] Interstitial ad prepared')

    // Show the interstitial ad
    await AdMob.showInterstitial()
    console.log('✅ [AdMob] Interstitial ad shown')

    return true
  } catch (error) {
    console.error('❌ [AdMob] Interstitial error:', error)
    return false
  }
}

/**
 * Show rewarded video ad and return whether user watched it completely
 * Returns a promise that resolves to true if rewarded, false otherwise
 */
export async function showRewardedVideoAd(): Promise<{ rewarded: boolean; amount?: number }> {
  const isNative = Capacitor.getPlatform() === 'android'
  if (!isNative) {
    console.log('[AdMob] Not on Android, skipping rewarded video')
    return { rewarded: false }
  }

  try {
    // Ensure initialized
    if (!isInitialized) {
      await initializeAdMob()
    }

    console.log('[AdMob] Preparing rewarded video ad...')

    return new Promise(async (resolve, reject) => {
      let rewardReceived = false

      // Listen for reward event
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: AdMobRewardItem) => {
          console.log('✅ [AdMob] User earned reward:', reward)
          rewardReceived = true
          rewardListener.remove()
        }
      )

      // Listen for ad dismissed (closed)
      const dismissListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.log('[AdMob] Rewarded ad dismissed')
          dismissListener.remove()

          if (rewardReceived) {
            resolve({ rewarded: true, amount: 25 })
          } else {
            console.log('⚠️ [AdMob] User closed ad before completion')
            resolve({ rewarded: false })
          }
        }
      )

      // Listen for errors
      const errorListener = await AdMob.addListener(
        RewardAdPluginEvents.FailedToLoad,
        (error) => {
          console.error('❌ [AdMob] Rewarded ad failed to load:', error)
          errorListener.remove()
          dismissListener.remove()
          rewardListener.remove()
          resolve({ rewarded: false })
        }
      )

      try {
        // Prepare (load) the rewarded video ad
        const options: AdOptions = {
          adId: AD_UNIT_IDS.REWARDED,
          isTesting: false // Production mode
        }

        await AdMob.prepareRewardVideoAd(options)
        console.log('[AdMob] Rewarded video ad prepared')

        // Show the rewarded video ad
        await AdMob.showRewardVideoAd()
        console.log('[AdMob] Rewarded video ad shown')
      } catch (error) {
        console.error('❌ [AdMob] Error showing rewarded video:', error)
        errorListener.remove()
        dismissListener.remove()
        rewardListener.remove()
        reject(error)
      }
    })
  } catch (error) {
    console.error('❌ [AdMob] Rewarded video error:', error)
    return { rewarded: false }
  }
}

/**
 * Check if ads are supported on this platform
 */
export function isAdsSupported(): boolean {
  return Capacitor.getPlatform() === 'android'
}

'use client'

import { Capacitor } from '@capacitor/core'
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications'
import { postData } from './api'

/**
 * שירות התראות מותאם ל-Capacitor (Native Android/iOS)
 */

// בדיקה אם רצים על Native
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

// בדיקה אם רצים על אנדרואיד
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}

// בדיקה אם רצים על iOS
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

// בדיקה אם רצים על Web
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web'
}

/**
 * אתחול Push Notifications עבור Native
 */
export async function initializeNativePushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) {
    console.log('⚠️ [Capacitor] Not running on native platform, skipping native push setup')
    return null
  }

  try {
    console.log('🔔 [Capacitor] Initializing native push notifications...')

    // בקשת הרשאות
    const permStatus = await PushNotifications.checkPermissions()
    console.log('🔍 [Capacitor] Permission status:', permStatus.receive)

    if (permStatus.receive === 'prompt') {
      const requestResult = await PushNotifications.requestPermissions()
      console.log('🔍 [Capacitor] Permission request result:', requestResult.receive)
      
      if (requestResult.receive !== 'granted') {
        console.warn('⚠️ [Capacitor] Push notification permission denied')
        return null
      }
    } else if (permStatus.receive !== 'granted') {
      console.warn('⚠️ [Capacitor] Push notifications not granted')
      return null
    }

    // רישום ל-Push Notifications
    await PushNotifications.register()
    console.log('✅ [Capacitor] Push notifications registered')

    // הגדרת listeners
    return new Promise((resolve) => {
      // קבלת FCM Token
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('✅ [Capacitor] FCM Token received:', token.value.substring(0, 30) + '...')
        
        // שמירת ה-token בשרת
        try {
          await registerTokenWithBackend(token.value)
        } catch (error) {
          console.error('❌ [Capacitor] Failed to register token with backend:', error)
        }
        
        resolve(token.value)
      })

      // שגיאה ברישום
      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ [Capacitor] Registration error:', error)
        resolve(null)
      })

      // התראה נכנסת (כשהאפליקציה פתוחה)
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('📩 [Capacitor] Push notification received:', notification)
        // אפשר להציג התראה מותאמת אישית כאן
      })

      // לחיצה על התראה
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('👆 [Capacitor] Push notification action performed:', notification)
        // אפשר לנווט למסך ספציפי כאן
      })
    })
  } catch (error) {
    console.error('❌ [Capacitor] Error initializing push notifications:', error)
    return null
  }
}

/**
 * שליחת FCM Token לשרת
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  const platform = Capacitor.getPlatform()
  
  console.log(`🔵 [Capacitor] Registering ${platform} token with backend...`)
  
  const response = await postData('/api/push/register', {
    token,
    platform // 'android' או 'ios' או 'web'
  })
  
  if (response.success) {
    console.log('✅ [Capacitor] Token registered with backend')
  } else {
    throw new Error(response.error || 'Failed to register token')
  }
}

/**
 * הסרת כל ה-listeners
 */
export async function removeAllListeners(): Promise<void> {
  if (!isNativePlatform()) return
  
  await PushNotifications.removeAllListeners()
  console.log('🧹 [Capacitor] All push notification listeners removed')
}

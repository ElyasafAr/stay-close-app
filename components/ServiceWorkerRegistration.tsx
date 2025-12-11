'use client'

import { useEffect } from 'react'
import { isAuthenticated } from '@/services/auth'
import { postData, getData } from '@/services/api'

/**
 * קומפוננטה לרישום Service Worker ו-Push Notifications
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log('🔍 [SW] ServiceWorkerRegistration component mounted')
    
    if (typeof window === 'undefined') {
      console.log('⚠️ [SW] Window is undefined (SSR)')
      return
    }

    // רק אם המשתמש מחובר
    const authenticated = isAuthenticated()
    console.log('🔍 [SW] User authenticated:', authenticated)
    if (!authenticated) {
      console.log('⚠️ [SW] User not authenticated - skipping registration')
      return
    }

    const registerServiceWorker = async () => {
      console.log('🔍 [SW] Starting registration process...')
      console.log('🔍 [SW] Service Worker support:', 'serviceWorker' in navigator)
      console.log('🔍 [SW] Push Manager support:', 'PushManager' in window)
      
      if ('serviceWorker' in navigator) {
        try {
          // רישום Service Worker
          console.log('🔍 [SW] Attempting to register /sw.js...')
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })
          
          console.log('✅ [SW] Service Worker registered successfully!')
          console.log('   Scope:', registration.scope)
          console.log('   Active:', registration.active?.state)
          console.log('   Installing:', registration.installing?.state)
          console.log('   Waiting:', registration.waiting?.state)

          // בדיקה אם יש Push Notifications support
          if ('PushManager' in window) {
            console.log('🔍 [SW] PushManager is available')
            
            // בדיקת הרשאות נוכחיות
            const currentPermission = Notification.permission
            console.log('🔍 [SW] Current notification permission:', currentPermission)
            
            // קבלת Push subscription
            console.log('🔍 [SW] Checking for existing subscription...')
            let subscription = await registration.pushManager.getSubscription()
            
            if (subscription) {
              console.log('✅ [SW] Found existing subscription:', {
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                keys: Object.keys(subscription.getKey ? subscription.getKey('p256dh') || {} : {})
              })
            } else {
              console.log('ℹ️ [SW] No existing subscription found')
            }
            
            // אם אין subscription, נבקש הרשאה ונצור אחד
            if (!subscription) {
              console.log('🔍 [SW] Requesting notification permission...')
              // בקשת הרשאה
              const permission = await Notification.requestPermission()
              console.log('🔍 [SW] Permission result:', permission)
              
              if (permission === 'granted') {
                console.log('✅ [SW] Permission granted! Fetching VAPID key...')
                // קבלת VAPID public key מה-backend
                try {
                  console.log('🔍 [SW] Fetching VAPID key from backend...')
                  const vapidKeyResponse = await getData<{ publicKey: string }>('/api/push/vapid-public-key')
                  console.log('🔍 [SW] VAPID key response:', {
                    success: vapidKeyResponse.success,
                    hasData: !!vapidKeyResponse.data
                  })
                  
                  if (vapidKeyResponse.success && vapidKeyResponse.data) {
                    console.log('✅ [SW] VAPID key received:', {
                      hasPublicKey: !!vapidKeyResponse.data.publicKey,
                      keyLength: vapidKeyResponse.data.publicKey?.length
                    })
                    const { publicKey } = vapidKeyResponse.data
                    
                    // המרה מ-base64 ל-Uint8Array
                    console.log('🔍 [SW] Converting VAPID key to Uint8Array...')
                    const applicationServerKey = urlBase64ToUint8Array(publicKey)
                    console.log('✅ [SW] Key converted, length:', applicationServerKey.length)
                    
                    // יצירת Push subscription
                    console.log('🔍 [SW] Creating push subscription...')
                    subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: applicationServerKey as BufferSource
                    })
                    console.log('✅ [SW] Push subscription created!', {
                      endpoint: subscription.endpoint.substring(0, 50) + '...'
                    })
                    
                    // שליחת subscription ל-backend
                    console.log('🔍 [SW] Sending subscription to backend...')
                    const tokenData = {
                      token: JSON.stringify(subscription),
                      device_info: {
                        platform: 'web',
                        userAgent: navigator.userAgent,
                        language: navigator.language
                      }
                    }
                    console.log('🔍 [SW] Token data:', {
                      tokenLength: tokenData.token.length,
                      deviceInfo: tokenData.device_info
                    })
                    
                    const backendResponse = await postData('/api/push-tokens', tokenData)
                    console.log('✅ [SW] Push subscription sent to backend successfully!', backendResponse)
                  } else {
                    console.error('❌ [SW] Failed to get VAPID key:', vapidKeyResponse.error || 'Unknown error')
                  }
                } catch (error) {
                  console.error('❌ [SW] Error creating push subscription:', error)
                  console.error('❌ [SW] Error details:', {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                  })
                }
              } else {
                console.warn('⚠️ [SW] Notification permission denied:', permission)
              }
            } else {
              // יש כבר subscription - נשלח ל-backend (למקרה שלא נשמר)
              console.log('🔍 [SW] Sending existing subscription to backend...')
              try {
                const tokenData = {
                  token: JSON.stringify(subscription),
                  device_info: {
                    platform: 'web',
                    userAgent: navigator.userAgent,
                    language: navigator.language
                  }
                }
                const backendResponse = await postData('/api/push-tokens', tokenData)
                console.log('✅ [SW] Existing push subscription sent to backend:', backendResponse)
              } catch (error) {
                console.error('❌ [SW] Error sending existing subscription:', error)
                console.error('❌ [SW] Error details:', {
                  message: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                })
              }
            }
          } else {
            console.warn('⚠️ [SW] Push Notifications not supported in this browser')
          }

          // עדכון Service Worker אם יש גרסה חדשה
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 [SW] New service worker available - reload to update')
                }
              })
            }
          })

        } catch (error) {
          console.error('❌ [SW] Service Worker registration failed:', error)
          console.error('❌ [SW] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
          })
        }
      } else {
        console.warn('⚠️ [SW] Service Workers not supported in this browser')
      }
    }

    registerServiceWorker()
  }, [])

  return null // קומפוננטה לא מציגה כלום
}

/**
 * המרת VAPID public key מ-base64 ל-Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}


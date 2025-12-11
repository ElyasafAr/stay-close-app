'use client'

import { useEffect } from 'react'
import { isAuthenticated } from '@/services/auth'
import { postData } from '@/services/api'

/**
 * קומפוננטה לרישום Service Worker ו-Push Notifications
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // רק אם המשתמש מחובר
    if (!isAuthenticated()) {
      return
    }

    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // רישום Service Worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })
          
          console.log('✅ [SW] Service Worker registered:', registration.scope)

          // בדיקה אם יש Push Notifications support
          if ('PushManager' in window) {
            // קבלת Push subscription
            let subscription = await registration.pushManager.getSubscription()
            
            // אם אין subscription, נבקש הרשאה ונצור אחד
            if (!subscription) {
              // בקשת הרשאה
              const permission = await Notification.requestPermission()
              
              if (permission === 'granted') {
                // קבלת VAPID public key מה-backend
                try {
                  const vapidKeyResponse = await fetch('/api/push/vapid-public-key')
                  if (vapidKeyResponse.ok) {
                    const { publicKey } = await vapidKeyResponse.json()
                    
                    // המרה מ-base64 ל-Uint8Array
                    const applicationServerKey = urlBase64ToUint8Array(publicKey)
                    
                    // יצירת Push subscription
                    subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: applicationServerKey
                    })
                    
                    // שליחת subscription ל-backend
                    await postData('/api/push-tokens', {
                      token: JSON.stringify(subscription),
                      device_info: {
                        platform: 'web',
                        userAgent: navigator.userAgent,
                        language: navigator.language
                      }
                    })
                    
                    console.log('✅ [SW] Push subscription created and sent to backend')
                  }
                } catch (error) {
                  console.error('❌ [SW] Error creating push subscription:', error)
                }
              } else {
                console.warn('⚠️ [SW] Notification permission denied')
              }
            } else {
              // יש כבר subscription - נשלח ל-backend (למקרה שלא נשמר)
              try {
                await postData('/api/push-tokens', {
                  token: JSON.stringify(subscription),
                  device_info: {
                    platform: 'web',
                    userAgent: navigator.userAgent,
                    language: navigator.language
                  }
                })
                console.log('✅ [SW] Existing push subscription sent to backend')
              } catch (error) {
                console.error('❌ [SW] Error sending existing subscription:', error)
              }
            }
          } else {
            console.warn('⚠️ [SW] Push Notifications not supported')
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
        }
      } else {
        console.warn('⚠️ [SW] Service Workers not supported')
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


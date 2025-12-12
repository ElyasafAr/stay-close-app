'use client'

import { useEffect, useState } from 'react'
import { isAuthenticated } from '@/services/auth'
import { postData } from '@/services/api'
import { getFCMToken, onFCMMessage } from '@/lib/firebase'

/**
 * קומפוננטה לרישום Push Notifications עם Firebase Cloud Messaging
 */
export function ServiceWorkerRegistration() {
  const [fcmToken, setFcmToken] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 [FCM] ServiceWorkerRegistration component mounted')
    
    if (typeof window === 'undefined') {
      console.log('⚠️ [FCM] Window is undefined (SSR)')
      return
    }

    // רק אם המשתמש מחובר
    const authenticated = isAuthenticated()
    console.log('🔍 [FCM] User authenticated:', authenticated)
    if (!authenticated) {
      console.log('⚠️ [FCM] User not authenticated - skipping FCM registration')
      return
    }

    const setupFCM = async () => {
      console.log('🔍 [FCM] Starting FCM setup...')
      
      try {
        // קבלת FCM token
        console.log('🔍 [FCM] Requesting FCM token...')
        const token = await getFCMToken()
        
        if (token) {
          console.log('✅ [FCM] Token received:', token.substring(0, 30) + '...')
          setFcmToken(token)
          
          // שליחת ה-token ל-backend
          console.log('🔍 [FCM] Sending token to backend...')
          const tokenData = {
            token: token, // FCM token ישירות, לא JSON
            device_info: {
              platform: 'web',
              userAgent: navigator.userAgent,
              language: navigator.language,
              type: 'fcm'
            }
          }
          
          try {
            const response = await postData('/api/push-tokens', tokenData)
            console.log('✅ [FCM] Token sent to backend:', response)
          } catch (error) {
            console.error('❌ [FCM] Error sending token to backend:', error)
          }
        } else {
          console.warn('⚠️ [FCM] No token received')
        }
        
        // האזנה להודעות נכנסות (כשהאפליקציה פתוחה)
        const unsubscribe = onFCMMessage((payload) => {
          console.log('📩 [FCM] Foreground message received:', payload)
          
          // הצגת התראה כשהאפליקציה פתוחה
          if (payload.notification) {
            const { title, body } = payload.notification
            
            // הצגת התראה ידנית (כי Firebase לא מציג אוטומטית ב-foreground)
            if (Notification.permission === 'granted') {
              new Notification(title || 'Stay Close', {
                body: body || '',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'fcm-foreground',
              })
            }
          }
        })
        
        // Cleanup
        return () => {
          unsubscribe()
        }
        
      } catch (error) {
        console.error('❌ [FCM] Error setting up FCM:', error)
      }
    }

    setupFCM()
  }, [])

  // גם רישום Service Worker לפונקציונליות נוספת
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerSW = async () => {
      try {
        console.log('🔍 [SW] Registering service worker...')
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        console.log('✅ [SW] Service Worker registered:', registration.scope)
      } catch (error) {
        console.error('❌ [SW] Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return null // קומפוננטה לא מציגה כלום
}

/**
 * Hook לקבלת FCM token (לשימוש בקומפוננטות אחרות)
 */
export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getToken = async () => {
      try {
        const fcmToken = await getFCMToken()
        setToken(fcmToken)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get FCM token')
      } finally {
        setLoading(false)
      }
    }

    getToken()
  }, [])

  return { token, loading, error }
}

'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [swStatus, setSwStatus] = useState<string>('Checking...')

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
        },
        features: {
          serviceWorker: 'serviceWorker' in navigator,
          pushManager: 'PushManager' in window,
          notifications: 'Notification' in window,
        },
        permissions: {
          notification: Notification.permission,
        },
        serviceWorker: {},
        pushSubscription: null,
      }

      // בדיקת Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            info.serviceWorker = {
              scope: registration.scope,
              active: registration.active?.state,
              installing: registration.installing?.state,
              waiting: registration.waiting?.state,
            }
            setSwStatus('✅ Registered')

            // בדיקת Push Subscription
            if (registration.pushManager) {
              const subscription = await registration.pushManager.getSubscription()
              if (subscription) {
                info.pushSubscription = {
                  endpoint: subscription.endpoint,
                  expirationTime: subscription.expirationTime,
                  keys: {
                    p256dh: subscription.getKey('p256dh') ? 'Present' : 'Missing',
                    auth: subscription.getKey('auth') ? 'Present' : 'Missing',
                  },
                }
              } else {
                info.pushSubscription = 'No subscription'
              }
            }
          } else {
            info.serviceWorker = 'Not registered'
            setSwStatus('❌ Not registered')
          }
        } catch (error) {
          info.serviceWorker = {
            error: error instanceof Error ? error.message : String(error),
          }
          setSwStatus('❌ Error: ' + (error instanceof Error ? error.message : String(error)))
        }
      } else {
        setSwStatus('❌ Not supported')
      }

      setDebugInfo(info)
    }

    gatherDebugInfo()

    // עדכון כל 5 שניות
    const interval = setInterval(gatherDebugInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  const testNotification = async () => {
    if (Notification.permission === 'granted') {
      new Notification('🧪 Test Notification', {
        body: 'אם אתה רואה את זה, ההתראות עובדות!',
        icon: '/icon-192x192.png',
        tag: 'test',
      })
    } else {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('🧪 Test Notification', {
          body: 'אם אתה רואה את זה, ההתראות עובדות!',
          icon: '/icon-192x192.png',
          tag: 'test',
        })
      } else {
        alert('הרשאת התראות נדחתה')
      }
    }
  }

  const checkBackend = async () => {
    try {
      const response = await fetch('/api/push/vapid-public-key')
      const data = await response.json()
      alert('Backend VAPID Key: ' + (data.publicKey ? '✅ קיים' : '❌ חסר'))
    } catch (error) {
      alert('❌ שגיאה: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 דף דיבוג - Push Notifications</h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>סטטוס Service Worker: {swStatus}</h2>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            margin: '10px 5px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🔄 רענן דף
        </button>
        <button
          onClick={testNotification}
          style={{
            padding: '10px 20px',
            margin: '10px 5px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🧪 בדוק התראה
        </button>
        <button
          onClick={checkBackend}
          style={{
            padding: '10px 20px',
            margin: '10px 5px',
            background: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🔑 בדוק Backend
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>פתח Console (F12) כדי לראות לוגים מפורטים</h2>
        <p>חפש הודעות שמתחילות ב-[SW]</p>
      </div>

      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
        <h3>מידע דיבוג:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>📋 הוראות דיבוג:</h3>
        <ol>
          <li>פתח את ה-Console (F12 → Console)</li>
          <li>חפש הודעות שמתחילות ב-[SW]</li>
          <li>ודא ש-Service Worker נרשם (✅ [SW] Service Worker registered)</li>
          <li>ודא שיש הרשאת התראות (permission: granted)</li>
          <li>ודא ש-VAPID key התקבל מה-backend</li>
          <li>ודא ש-Push subscription נוצר ונשלח ל-backend</li>
          <li>בדוק את Network tab - חפש קריאות ל-/api/push-tokens ו-/api/push/vapid-public-key</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '8px' }}>
        <h3>🔧 בדיקות נוספות:</h3>
        <p>
          <strong>Application Tab (Chrome DevTools):</strong>
        </p>
        <ul>
          <li>Service Workers → ודא שיש Service Worker פעיל</li>
          <li>Storage → Application → Service Workers</li>
        </ul>
        <p>
          <strong>Network Tab:</strong>
        </p>
        <ul>
          <li>חפש קריאות ל-/sw.js - ודא שהקובץ נטען (200 OK)</li>
          <li>חפש קריאות ל-/api/push/vapid-public-key</li>
          <li>חפש קריאות ל-/api/push-tokens</li>
        </ul>
      </div>
    </div>
  )
}


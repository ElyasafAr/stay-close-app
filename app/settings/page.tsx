'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { useSettings } from '@/state/useSettings'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData, putData } from '@/services/api'
import { MdSettings, MdLanguage, MdPalette, MdNotifications, MdLogout, MdPerson, MdPhoneAndroid, MdComputer, MdDevices, MdDeleteForever } from 'react-icons/md'
import { deleteData } from '@/services/api'
import styles from './page.module.css'

export default function SettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { settings, updateSettings, saveSettings } = useSettings()
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const user = getStoredUser()

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'האם אתה בטוח שברצונך למחוק את החשבון?\n\n' +
      'פעולה זו תמחק את כל המידע שלך לצמיתות:\n' +
      '• כל אנשי הקשר\n' +
      '• כל התזכורות\n' +
      '• כל ההגדרות\n\n' +
      'לא ניתן לבטל פעולה זו!'
    )
    
    if (!confirmed) return
    
    const doubleConfirmed = confirm('האם אתה בטוח לחלוטין? המידע יימחק לצמיתות ולא ניתן לשחזור.')
    
    if (!doubleConfirmed) return
    
    setIsDeleting(true)
    
    try {
      await deleteData('/api/account')
      
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('firebase_token')
      localStorage.removeItem('user')
      localStorage.removeItem('app_settings')
      
      alert('החשבון נמחק בהצלחה. להתראות!')
      
      // Redirect to login
      window.location.replace('/login')
    } catch (error: any) {
      alert('שגיאה במחיקת החשבון: ' + (error.message || 'אנא נסה שוב'))
    } finally {
      setIsDeleting(false)
    }
  }

  // טעינת הגדרת הפלטפורמה מהשרת
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!isAuthenticated()) return
      
      try {
        const response = await getData<{ notification_platform: string }>('/api/notification-settings')
        if (response.success && response.data?.notification_platform) {
          updateSettings({ notificationPlatform: response.data.notification_platform as 'phone' | 'browser' | 'both' })
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      }
    }
    
    loadNotificationSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // שמירת הגדרות מקומיות
      saveSettings()
      
      // שמירת הגדרת הפלטפורמה בשרת
      if (isAuthenticated()) {
        await putData('/api/notification-settings', {
          notification_platform: settings.notificationPlatform || 'both'
        })
      }
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      // Note: Theme changes apply immediately, but language changes may require a refresh
      const currentLanguage = settings.language
      if (currentLanguage !== (localStorage.getItem('app_language') || 'he')) {
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      logout()
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <MdSettings style={{ fontSize: '2.5rem', color: '#a8d5e2', marginLeft: '12px', display: 'inline-block' }} />
          {t('settings.title')}
        </h1>
        
        <div className={styles.settingsForm}>
          <div className={styles.settingItem}>
            <label htmlFor="theme">
              <MdPalette style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('settings.theme')}
            </label>
            <select
              id="theme"
              value={settings.theme || 'light'}
              onChange={(e) => updateSettings({ theme: e.target.value })}
              className={styles.select}
            >
              <option value="light">בהיר</option>
              <option value="dark">כהה</option>
              <option value="auto">אוטומטי</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="notifications">
              <MdNotifications style={{ fontSize: '24px', color: '#a8d5e2' }} />
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications ?? true}
                onChange={(e) => updateSettings({ notifications: e.target.checked })}
                className={styles.checkbox}
              />
              {t('settings.notifications')}
            </label>
          </div>

          {/* בחירת מקום קבלת התראות */}
          {settings.notifications && (
            <div className={styles.settingItem}>
              <label htmlFor="notificationPlatform">
                <MdDevices style={{ fontSize: '24px', color: '#a8d5e2' }} />
                קבל התראות ב:
              </label>
              <div className={styles.platformOptions}>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'phone' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'phone' })}
                >
                  <MdPhoneAndroid style={{ fontSize: '20px' }} />
                  <span>טלפון בלבד</span>
                </button>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'browser' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'browser' })}
                >
                  <MdComputer style={{ fontSize: '20px' }} />
                  <span>דפדפן בלבד</span>
                </button>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'both' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'both' })}
                >
                  <MdDevices style={{ fontSize: '20px' }} />
                  <span>שניהם</span>
                </button>
              </div>
            </div>
          )}

          <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? 'שומר...' : t('settings.save')}
          </button>

          {showSuccess && (
            <div className={styles.successMessage}>
              {t('settings.saved')}
            </div>
          )}

          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <MdPerson style={{ fontSize: '24px', color: '#a8d5e2' }} />
              <div>
                <p className={styles.userName}>{user?.username || 'משתמש'}</p>
                <p className={styles.userEmail}>{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <MdLogout style={{ fontSize: '24px' }} />
            <span>התנתק</span>
          </button>

          {/* Delete Account */}
          <div className={styles.dangerZone}>
            <h3 className={styles.dangerTitle}>אזור מסוכן</h3>
            <p className={styles.dangerText}>
              מחיקת החשבון תסיר את כל המידע שלך לצמיתות ולא ניתן לשחזור.
            </p>
            <button 
              onClick={handleDeleteAccount} 
              className={styles.deleteButton}
              disabled={isDeleting}
            >
              <MdDeleteForever style={{ fontSize: '24px' }} />
              <span>{isDeleting ? 'מוחק...' : 'מחק את החשבון שלי'}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}


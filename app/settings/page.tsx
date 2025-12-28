'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { useSettings } from '@/state/useSettings'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData, putData } from '@/services/api'
import { MdSettings, MdLanguage, MdPalette, MdNotifications, MdLogout, MdPerson, MdPhoneAndroid, MdComputer, MdDevices, MdDeleteForever } from 'react-icons/md'
import { deleteData } from '@/services/api'
import { APP_VERSION } from '@/lib/constants'
import styles from './page.module.css'

export default function SettingsPage() {
  const { t, language } = useTranslation()
  const router = useRouter()
  const { settings, updateSettings, saveSettings } = useSettings()
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const user = getStoredUser()

  const handleDeleteAccount = async () => {
    const confirmed = confirm(t('settings.deleteAccountConfirm1'))
    
    if (!confirmed) return
    
    const doubleConfirmed = confirm(t('settings.deleteAccountConfirm2'))
    
    if (!doubleConfirmed) return
    
    setIsDeleting(true)
    
    try {
      await deleteData('/api/account')
      
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('firebase_token')
      localStorage.removeItem('user')
      localStorage.removeItem('app_settings')
      
      alert(t('settings.deleteAccountSuccess'))
      
      // Redirect to login
      window.location.replace('/login')
    } catch (error: any) {
      alert(t('common.error') + ': ' + (error.message || 'Error'))
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
      
      // Refresh the entire site after a short delay to ensure all changes (language, theme, etc.) apply correctly
      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    if (confirm(t('settings.logoutConfirm'))) {
      logout()
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          <MdSettings style={{ fontSize: '2.5rem', color: '#a8d5e2', marginInlineEnd: '12px', display: 'inline-block' }} />
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
              <option value="light">{language === 'he' ? 'בהיר' : 'Light'}</option>
              <option value="dark">{language === 'he' ? 'כהה' : 'Dark'}</option>
              <option value="auto">{language === 'he' ? 'אוטומטי' : 'Auto'}</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="language">
              <MdLanguage style={{ fontSize: '24px', color: '#a8d5e2' }} />
              {t('settings.language')}
            </label>
            <select
              id="language"
              value={settings.language || 'he'}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className={styles.select}
            >
              <option value="he">עברית (Hebrew)</option>
              <option value="en">English</option>
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
                {t('settings.receiveNotificationsAt')}
              </label>
              <div className={styles.platformOptions}>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'phone' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'phone' })}
                >
                  <MdPhoneAndroid style={{ fontSize: '20px' }} />
                  <span>{t('settings.phoneOnly')}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'browser' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'browser' })}
                >
                  <MdComputer style={{ fontSize: '20px' }} />
                  <span>{t('settings.browserOnly')}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.platformButton} ${settings.notificationPlatform === 'both' ? styles.active : ''}`}
                  onClick={() => updateSettings({ notificationPlatform: 'both' })}
                >
                  <MdDevices style={{ fontSize: '20px' }} />
                  <span>{t('settings.bothPlatforms')}</span>
                </button>
              </div>
            </div>
          )}

          <button onClick={handleSave} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? t('settings.saveLoading') : t('settings.save')}
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
                <p className={styles.userName}>{user?.username || (language === 'he' ? 'משתמש' : 'User')}</p>
                <p className={styles.userEmail}>{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <MdLogout style={{ fontSize: '24px' }} />
            <span>{t('settings.logout')}</span>
          </button>

          {/* Delete Account */}
          <div className={styles.dangerZone}>
            <h3 className={styles.dangerTitle}>{t('settings.dangerZone')}</h3>
            <p className={styles.dangerText}>
              {t('settings.deleteAccountWarning')}
            </p>
            <button 
              onClick={handleDeleteAccount} 
              className={styles.deleteButton}
              disabled={isDeleting}
            >
              <MdDeleteForever style={{ fontSize: '24px' }} />
              <span>{isDeleting ? (language === 'he' ? 'מוחק...' : 'Deleting...') : t('settings.deleteAccount')}</span>
            </button>
          </div>

          <div className={styles.versionFooter}>
            <p>Stay Close {t('settings.version')} {APP_VERSION}</p>
          </div>
        </div>
      </div>
    </main>
  )
}


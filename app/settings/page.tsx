'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { useSettings } from '@/state/useSettings'
import { logout, getStoredUser } from '@/services/auth'
import { MdSettings, MdLanguage, MdPalette, MdNotifications, MdLogout, MdPerson, MdPhoneAndroid, MdComputer, MdDevices } from 'react-icons/md'
import styles from './page.module.css'

export default function SettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { settings, updateSettings, saveSettings } = useSettings()
  const [showSuccess, setShowSuccess] = useState(false)
  const user = getStoredUser()

  const handleSave = () => {
    saveSettings()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
    // Note: Theme changes apply immediately, but language changes may require a refresh
    // We'll reload only if language changed
    const currentLanguage = settings.language
    if (currentLanguage !== (localStorage.getItem('app_language') || 'he')) {
      setTimeout(() => {
        window.location.reload()
      }, 500)
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

          <button onClick={handleSave} className={styles.saveButton}>
            {t('settings.save')}
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
        </div>
      </div>
    </main>
  )
}


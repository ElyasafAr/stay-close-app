'use client'

import { useState, useEffect } from 'react'

export interface Settings {
  language: string
  theme: string
  notifications: boolean
}

const defaultSettings: Settings = {
  language: 'he',
  theme: 'auto',
  notifications: true,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // טוען הגדרות מהמקום המקומי בעת טעינת הקומפוננטה
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsed })
        } catch (error) {
          console.error('שגיאה בטעינת הגדרות:', error)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // עדכון הגדרות
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
  }

  // שמירת הגדרות למקום המקומי
  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_settings', JSON.stringify(settings))
        // עדכון ערכת נושא אם נבחרה
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (settings.theme === 'light') {
          document.documentElement.classList.remove('dark')
        }
      } catch (error) {
        console.error('שגיאה בשמירת הגדרות:', error)
      }
    }
  }

  return {
    settings,
    updateSettings,
    saveSettings,
    isLoaded,
  }
}


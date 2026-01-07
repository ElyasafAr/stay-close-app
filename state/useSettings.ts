'use client'

import { useState, useEffect } from 'react'

export interface Settings {
  language: string
  theme: string
  notifications: boolean
  // REMOVED: notificationPlatform - no longer needed (Android local notifications only)
}

const defaultSettings: Settings = {
  language: 'he',
  theme: 'light',
  notifications: true,
  // REMOVED: notificationPlatform - no longer needed (Android local notifications only)
}

// Apply theme to document
function applyTheme(theme: string) {
  if (typeof window === 'undefined') return
  
  const html = document.documentElement
  html.classList.remove('dark', 'light')
  
  if (theme === 'dark') {
    html.classList.add('dark')
  } else if (theme === 'light') {
    html.classList.add('light')
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.add(prefersDark ? 'dark' : 'light')
  }
}

// Apply language to document
function applyLanguage(language: string) {
  if (typeof window === 'undefined') return
  
  const html = document.documentElement
  html.setAttribute('lang', language)
  html.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr')
  
  // Sync app_language for simple hooks
  localStorage.setItem('app_language', language)
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app_settings')
      const activeLanguage = localStorage.getItem('app_language') || 'he'
      
      let loadedSettings = { ...defaultSettings, language: activeLanguage }
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          loadedSettings = { ...loadedSettings, ...parsed }
        } catch (error) {
          console.error('Error parsing settings:', error)
        }
      }
      
      setSettings(loadedSettings)
      
      // Apply existing settings immediately on load
      applyTheme(loadedSettings.theme)
      applyLanguage(loadedSettings.language)
      
      setIsLoaded(true)
    }
  }, [])

  // Update state ONLY (no side effects until save)
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  // Save settings to localStorage and APPLY side effects
  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_settings', JSON.stringify(settings))
        
        // Ensure theme and language are applied now that they are saved
        applyTheme(settings.theme)
        applyLanguage(settings.language)
        
        // Dispatch custom event to notify other components (like ThemeProvider if it exists)
        window.dispatchEvent(new Event('settingsUpdated'))
        window.dispatchEvent(new Event('storage')) // Also trigger storage event for cross-tab sync
        
        console.log('Settings saved and applied:', settings)
      } catch (error) {
        console.error('Error saving settings:', error)
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

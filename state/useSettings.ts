'use client'

import { useState, useEffect } from 'react'

export interface Settings {
  language: string
  theme: string
  notifications: boolean
  notificationPlatform: 'phone' | 'browser' | 'both'
}

const defaultSettings: Settings = {
  language: 'he',
  theme: 'light',
  notifications: true,
  notificationPlatform: 'both', // ברירת מחדל - שני המקומות
}

// Apply theme to document immediately
function applyTheme(theme: string) {
  if (typeof window === 'undefined') return
  
  const html = document.documentElement
  
  // Remove all theme classes
  html.classList.remove('dark', 'light', 'auto')
  
  if (theme === 'dark') {
    html.classList.add('dark')
  } else if (theme === 'light') {
    html.classList.add('light')
  } else if (theme === 'auto') {
    // Auto theme: use system preference
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
  
  // Also update localStorage for useTranslation hook
  localStorage.setItem('app_language', language)
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          const loadedSettings = { ...defaultSettings, ...parsed }
          setSettings(loadedSettings)
          
          // Apply settings immediately
          applyTheme(loadedSettings.theme)
          applyLanguage(loadedSettings.language)
        } catch (error) {
          console.error('Error loading settings:', error)
          // Apply defaults if loading fails
          applyTheme(defaultSettings.theme)
          applyLanguage(defaultSettings.language)
        }
      } else {
        // Apply defaults if no settings found
        applyTheme(defaultSettings.theme)
        applyLanguage(defaultSettings.language)
      }
      setIsLoaded(true)
    }
  }, [])

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    // Apply changes immediately (without saving)
    if (newSettings.theme !== undefined) {
      applyTheme(newSettings.theme)
    }
    if (newSettings.language !== undefined) {
      applyLanguage(newSettings.language)
    }
  }

  // Save settings to localStorage
  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_settings', JSON.stringify(settings))
        // Ensure theme and language are applied
        applyTheme(settings.theme)
        applyLanguage(settings.language)
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('settingsUpdated'))
        
        console.log('Settings saved:', settings)
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


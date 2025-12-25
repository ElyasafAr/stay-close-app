'use client'

import { useEffect } from 'react'

/**
 * ThemeProvider - Centralizes theme and language DOM applications.
 * This component is responsible ONLY for applying attributes to the <html> element.
 */
export function ThemeProvider() {
  const applySettings = () => {
    if (typeof window === 'undefined') return

    try {
      const savedSettings = localStorage.getItem('app_settings')
      const parsed = savedSettings ? JSON.parse(savedSettings) : {}
      
      const theme = parsed.theme || 'light'
      const language = parsed.language || 'he'
      
      const html = document.documentElement
      
      // Apply Theme classes
      html.classList.remove('dark', 'light')
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        html.classList.add(prefersDark ? 'dark' : 'light')
      } else {
        html.classList.add(theme)
      }
      
      // Apply Language and Direction
      html.setAttribute('lang', language)
      html.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr')
      
      // Sync app_language for simple hooks
      localStorage.setItem('app_language', language)
    } catch (error) {
      console.error('[ThemeProvider] Error applying settings:', error)
    }
  }

  useEffect(() => {
    // Initial application on mount (Client-side only)
    applySettings()
    
    // Listen for storage changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'app_settings') applySettings()
    }
    
    // Listen for custom settings update event from within the app
    window.addEventListener('storage', handleStorage)
    window.addEventListener('settingsUpdated', applySettings)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('settingsUpdated', applySettings)
    }
  }, [])

  return null
}

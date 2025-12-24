'use client'

import { useEffect } from 'react'

/**
 * ThemeProvider - Applies theme and language settings on app load
 * This component ensures settings are applied immediately when the app loads
 */
export function ThemeProvider() {
  const applySettings = () => {
    if (typeof window === 'undefined') return

    console.log('🎨 [ThemeProvider] Applying settings...')
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app_settings')
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        
        // Apply theme
        const theme = parsed.theme || 'light'
        const html = document.documentElement
        
        console.log('🎨 [ThemeProvider] Theme:', theme, 'Language:', parsed.language)
        
        // Remove all theme classes
        html.classList.remove('dark', 'light', 'auto')
        
        if (theme === 'dark') {
          html.classList.add('dark')
        } else if (theme === 'light') {
          html.classList.add('light')
        } else if (theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          html.classList.add(prefersDark ? 'dark' : 'light')
        }
        
        // Apply language
        const language = parsed.language || 'he'
        html.setAttribute('lang', language)
        html.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr')
        console.log('🎨 [ThemeProvider] Set HTML dir to:', language === 'he' ? 'rtl' : 'ltr')
        
        localStorage.setItem('app_language', language)
      } catch (error) {
        console.error('🎨 [ThemeProvider] Error applying settings:', error)
      }
    } else {
      console.log('🎨 [ThemeProvider] No settings found, applying defaults')
      const html = document.documentElement
      html.classList.add('light')
      html.setAttribute('lang', 'he')
      html.setAttribute('dir', 'rtl')
      localStorage.setItem('app_language', 'he')
    }
  }

  useEffect(() => {
    // Initial apply
    applySettings()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_settings' || e.key === 'app_language') {
        applySettings()
      }
    }
    
    // Listen for custom settings update event
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('settingsUpdated', applySettings)
    
    // Listen for system theme changes (for auto theme)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed.theme === 'auto') {
            const html = document.documentElement
            html.classList.remove('dark', 'light')
            html.classList.add(e.matches ? 'dark' : 'light')
          }
        } catch (error) {
          console.error('Error handling theme change:', error)
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleThemeChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settingsUpdated', applySettings)
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  return null
}









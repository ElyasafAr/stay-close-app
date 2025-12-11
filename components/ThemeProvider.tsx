'use client'

import { useEffect } from 'react'

/**
 * ThemeProvider - Applies theme and language settings on app load
 * This component ensures settings are applied immediately when the app loads
 */
export function ThemeProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app_settings')
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        
        // Apply theme
        const theme = parsed.theme || 'light'
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
        
        // Apply language
        const language = parsed.language || 'he'
        html.setAttribute('lang', language)
        html.setAttribute('dir', language === 'he' ? 'rtl' : 'ltr')
        
        // Also update app_language for backward compatibility
        localStorage.setItem('app_language', language)
      } catch (error) {
        console.error('Error applying theme/language:', error)
      }
    } else {
      // Apply defaults
      const html = document.documentElement
      html.classList.add('light')
      html.setAttribute('lang', 'he')
      html.setAttribute('dir', 'rtl')
      localStorage.setItem('app_language', 'he')
    }
    
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
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  return null // This component doesn't render anything
}


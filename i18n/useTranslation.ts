'use client'

import { useState, useEffect } from 'react'
import he from './he.json'
import en from './en.json'

const translations: Record<string, any> = {
  he,
  en
}

type TranslationKey = string

// Recursive function to get nested translation
function getNestedTranslation(obj: any, key: string): string {
  const keys = key.split('.')
  let value = obj
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : key
}

export function useTranslation() {
  const [language, setLanguage] = useState<string>('he')

  useEffect(() => {
    // Load language from settings (check both app_language and app_settings)
    if (typeof window !== 'undefined') {
      // First check app_language (for backward compatibility)
      let savedLanguage = localStorage.getItem('app_language')
      
      // If not found, check app_settings
      if (!savedLanguage) {
        const savedSettings = localStorage.getItem('app_settings')
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            savedLanguage = parsed.language || 'he'
          } catch (error) {
            console.error('Error parsing settings:', error)
          }
        }
      }
      
      setLanguage(savedLanguage || 'he')
    }
  }, [])

  // Listen for storage changes to update language in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_settings' || e.key === 'app_language') {
        if (e.key === 'app_settings' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue)
            if (parsed.language) {
              setLanguage(parsed.language)
            }
          } catch (error) {
            console.error('Error parsing settings:', error)
          }
        } else if (e.key === 'app_language' && e.newValue) {
          setLanguage(e.newValue)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed.language) {
            setLanguage(parsed.language)
          }
        } catch (error) {
          console.error('Error parsing settings:', error)
        }
      }
    }
    
    // Listen for custom event
    window.addEventListener('settingsUpdated', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settingsUpdated', handleCustomStorageChange)
    }
  }, [])

  const t = (key: TranslationKey): string => {
    const currentTranslations = translations[language] || translations['he']
    return getNestedTranslation(currentTranslations, key)
  }

  return { t, language, setLanguage }
}

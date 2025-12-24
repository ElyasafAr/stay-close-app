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
function getNestedTranslation(obj: any, key: string): any {
  const keys = key.split('.')
  let value = obj
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // Return key if not found
    }
  }
  
  return value
}

export function useTranslation() {
  const [language, setLanguage] = useState<string>('he')

  useEffect(() => {
    // Load language from settings (check both app_language and app_settings)
    if (typeof window !== 'undefined') {
      let savedLanguage = localStorage.getItem('app_language')
      console.log('🌐 [useTranslation] Initial language check (app_language):', savedLanguage)
      
      if (!savedLanguage) {
        const savedSettings = localStorage.getItem('app_settings')
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings)
            savedLanguage = parsed.language
            console.log('🌐 [useTranslation] Language found in app_settings:', savedLanguage)
          } catch (error) {
            console.error('🌐 [useTranslation] Error parsing settings:', error)
          }
        }
      }
      
      const finalLang = savedLanguage || 'he'
      console.log('🌐 [useTranslation] Setting initial language to:', finalLang)
      setLanguage(finalLang)
    }
  }, [])

  // Listen for storage changes to update language in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_settings' || e.key === 'app_language') {
        console.log('🌐 [useTranslation] Storage change detected:', e.key, e.newValue)
        if (e.key === 'app_settings' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue)
            if (parsed.language) {
              setLanguage(parsed.language)
            }
          } catch (error) {
            console.error('🌐 [useTranslation] Error parsing settings:', error)
          }
        } else if (e.key === 'app_language' && e.newValue) {
          setLanguage(e.newValue)
        }
      }
    }
    
    const handleCustomStorageChange = () => {
      const savedSettings = localStorage.getItem('app_settings')
      console.log('🌐 [useTranslation] Custom event settingsUpdated triggered')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed.language) {
            console.log('🌐 [useTranslation] Updating language to:', parsed.language)
            setLanguage(parsed.language)
          }
        } catch (error) {
          console.error('🌐 [useTranslation] Error parsing settings:', error)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('settingsUpdated', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settingsUpdated', handleCustomStorageChange)
    }
  }, [])

  const t = (key: TranslationKey): any => {
    const currentTranslations = translations[language] || translations['he']
    const result = getNestedTranslation(currentTranslations, key)
    if (result === key) {
      // console.warn(`🌐 [useTranslation] Missing translation for key: ${key} in language: ${language}`)
    }
    return result
  }

  return { t, language, setLanguage }
}

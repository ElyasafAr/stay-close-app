'use client'

import { useState, useEffect, useCallback } from 'react'
import he from './he.json'
import en from './en.json'

const translations: Record<string, any> = { he, en }

/**
 * useTranslation - Simplified hook for i18n
 * Stabilized 't' function to prevent infinite render loops.
 */
export function useTranslation() {
  const [language, setLanguage] = useState<string>('he')

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateLanguage = () => {
      const saved = localStorage.getItem('app_language') || 'he'
      console.log(`🌐 [useTranslation] Language updated to: ${saved}`);
      setLanguage(saved)
    }

    updateLanguage()

    // Listen for storage changes and custom settings updates
    window.addEventListener('storage', updateLanguage)
    window.addEventListener('settingsUpdated', updateLanguage)

    return () => {
      window.removeEventListener('storage', updateLanguage)
      window.removeEventListener('settingsUpdated', updateLanguage)
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, any>): any => {
    const keys = key.split('.')
    let value = translations[language] || translations['he']

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    // Interpolate parameters if provided
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param])
      })
    }

    return value
  }, [language]) // 't' will only change when 'language' changes

  return { t, language }
}

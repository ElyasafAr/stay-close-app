'use client'

import { useState, useEffect } from 'react'
import he from './he.json'
import en from './en.json'

const translations: Record<string, any> = { he, en }

/**
 * useTranslation - Simplified hook for i18n
 * Just loads the language once on mount and provides the 't' function.
 */
export function useTranslation() {
  const [language, setLanguage] = useState<string>('he')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('app_language') || 'he'
    setLanguage(saved)
  }, [])

  const t = (key: string): any => {
    const keys = key.split('.')
    let value = translations[language] || translations['he']
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }
    return value
  }

  return { t, language }
}

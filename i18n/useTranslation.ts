'use client'

import { useState, useEffect } from 'react'
import translations from './he.json'

type TranslationKey = string
type TranslationObject = typeof translations

// פונקציה רקורסיבית לקבלת תרגום
function getNestedTranslation(obj: any, key: string): string {
  const keys = key.split('.')
  let value = obj
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key // מחזיר את המפתח אם לא נמצא
    }
  }
  
  return typeof value === 'string' ? value : key
}

export function useTranslation() {
  const [language, setLanguage] = useState<string>('he')

  useEffect(() => {
    // טוען את השפה מהגדרות מקומיות
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('app_language') || 'he'
      setLanguage(savedLanguage)
    }
  }, [])

  const t = (key: TranslationKey): string => {
    return getNestedTranslation(translations, key)
  }

  return { t, language, setLanguage }
}


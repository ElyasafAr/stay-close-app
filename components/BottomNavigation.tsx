'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { MdHome, MdContacts, MdMessage, MdSettings, MdInfo } from 'react-icons/md'
import { isAuthenticated } from '@/services/auth'
import styles from './BottomNavigation.module.css'

export function BottomNavigation() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)

  // בדיקה מהירה - רק פעם אחת
  useEffect(() => {
    setAuthenticated(isAuthenticated())
  }, [pathname]) // רק כשהדף משתנה

  const navItems = [
    { href: '/messages', label: t('navigation.messages'), icon: MdMessage },
    { href: '/contacts', label: t('navigation.contacts'), icon: MdContacts },
  ]

  // אם המשתמש לא מחובר, לא להציג את ה-navigation
  if (!authenticated) {
    return null
  }

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname?.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}


'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { MdLogout, MdPerson } from 'react-icons/md'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUser(getStoredUser())
    }
  }, [pathname])

  // סגירת התפריט כשלוחצים מחוץ לו
  useEffect(() => {
    if (!showMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(`.${styles.userMenu}`)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleLogout = () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      logout()
    }
  }

  // אם המשתמש לא מחובר, לא להציג את ה-Header
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    return null
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          {t('app.name')}
        </Link>
        <div className={styles.navRight}>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              {t('navigation.home')}
            </Link>
            <Link href="/contacts" className={styles.navLink}>
              {t('navigation.contacts')}
            </Link>
            <Link href="/messages" className={styles.navLink}>
              {t('navigation.messages')}
            </Link>
            <Link href="/settings" className={styles.navLink}>
              {t('navigation.settings')}
            </Link>
            <Link href="/about" className={styles.navLink}>
              {t('navigation.about')}
            </Link>
          </div>
          
          {user && (
            <div className={styles.userMenu}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={styles.userButton}
                aria-label="תפריט משתמש"
              >
                <MdPerson className={styles.userIcon} />
                <span className={styles.userName}>{user.username || 'משתמש'}</span>
              </button>
              
              {showMenu && (
                <div className={styles.dropdown}>
                  <div className={styles.userInfo}>
                    <p className={styles.userNameFull}>{user.username}</p>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    <MdLogout className={styles.logoutIcon} />
                    <span>התנתק</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}


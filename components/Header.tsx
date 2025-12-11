'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { MdLogout, MdPerson, MdMenu, MdClose } from 'react-icons/md'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!showMobileMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuButton}`)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  // אם המשתמש לא מחובר, לא להציג את ה-Header
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    return null
  }

  const navLinks = [
    { href: '/', label: t('navigation.home') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/messages', label: t('navigation.messages') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/about', label: t('navigation.about') },
  ]

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            {t('app.name')}
          </Link>
          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <button
              className={styles.mobileMenuButton}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="תפריט ניווט"
            >
              <MdMenu />
            </button>
            
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

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`}
        onClick={() => setShowMobileMenu(false)}
      />

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <h2>{t('app.name')}</h2>
          <button
            className={styles.mobileMenuClose}
            onClick={() => setShowMobileMenu(false)}
            aria-label="סגור תפריט"
          >
            <MdClose />
          </button>
        </div>
        
        <nav className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px solid var(--color-primary-light)' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {user.username}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={() => {
                handleLogout()
                setShowMobileMenu(false)
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(255, 154, 158, 0.3)',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <MdLogout />
              <span>התנתק</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}


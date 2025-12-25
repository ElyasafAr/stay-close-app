'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { MdLogout, MdMenu, MdClose, MdPerson } from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      setUser(getStoredUser())
    }
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('user')
    await logout()
    window.location.href = '/login'
  }

  const handleLinkClick = () => {
    setShowMobileMenu(false)
    setShowUserDropdown(false)
  }

  // Prevent rendering anything that depends on window/localStorage before mount
  if (!mounted) return null

  // If user is not authenticated, don't show the header navigation
  if (!isAuthenticated()) return null

  const navLinks = [
    { href: '/messages', label: t('navigation.messages') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/about', label: t('navigation.about') },
  ]

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} onClick={handleLinkClick}>
          {t('app.name')}
        </Link>

        <div className={styles.navRight}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.desktopUserMenu}>
            <div className={styles.userMenu}>
              <button 
                className={styles.userButton}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <MdPerson className={styles.userIcon} />
                <span className={styles.userName}>{user?.username || t('messages.greetings.guest')}</span>
              </button>

              {showUserDropdown && (
                <div className={styles.dropdown}>
                  <div className={styles.userInfo}>
                    <p className={styles.userNameFull}>{user?.username}</p>
                    <p className={styles.userEmail}>{user?.email}</p>
                  </div>
                  <div className={styles.versionInfo}>
                    <small>{t('settings.version')} {APP_VERSION}</small>
                  </div>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    <MdLogout /> {t('settings.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <MdClose size={28} /> : <MdMenu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
          <div className={styles.mobileNavLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
                onClick={handleLinkClick}
              >
                {link.label}
              </Link>
            ))}
            <button onClick={handleLogout} className={styles.mobileLogoutButton}>
              <MdLogout /> {t('settings.logout')}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

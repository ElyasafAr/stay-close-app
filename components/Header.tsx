'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated } from '@/services/auth'
import { getData } from '@/services/api'
import { MdLogout, MdMenu, MdClose, MdPerson } from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  console.log('[Header] Render start');
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log('[Header] Mounted');
    setMounted(true)
    if (isAuthenticated()) {
      const storedUser = getStoredUser()
      console.log('[Header] User is authenticated:', storedUser?.username);
      setUser(storedUser)
      checkAdminStatus()
    } else {
      console.log('[Header] User NOT authenticated');
    }
  }, [])

  const checkAdminStatus = async () => {
    try {
      console.log('[Header] Checking admin status...');
      const response = await getData('/api/admin/stats')
      if (response.success) {
        console.log('[Header] Admin status: YES');
        setIsAdmin(true)
      } else {
        console.log('[Header] Admin status: NO');
      }
    } catch (err) {
      console.log('[Header] Admin status check failed:', err);
      setIsAdmin(false)
    }
  }

  const handleLogout = async () => {
    console.log('[Header] Logout initiated');
    localStorage.removeItem('auth_token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('user')
    await logout()
    window.location.href = '/login'
  }

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    console.log(`[Header] Link clicked: ${href}`);
    setShowMobileMenu(false)
    setShowUserDropdown(false)
    
    // Explicitly check if the router works
    // if (href.startsWith('/')) {
    //   e.preventDefault();
    //   console.log(`[Header] Manual router push to: ${href}`);
    //   router.push(href);
    // }
  }

  // Hydration safety: render a consistent empty skeleton on server
  if (!mounted) {
    console.log('[Header] Rendering skeleton (not mounted)');
    return (
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>Stay Close</div>
        </nav>
      </header>
    )
  }

  // If user is not authenticated, don't show the header navigation
  if (!isAuthenticated()) {
    console.log('[Header] Not authenticated, rendering null');
    return null;
  }

  const navLinks = [
    { href: '/messages', label: t('navigation.messages') },
    { href: '/contacts', label: t('navigation.contacts') },
    { href: '/settings', label: t('navigation.settings') },
    { href: '/contact', label: t('navigation.contact') },
    { href: '/about', label: t('navigation.about') },
    ...(isAdmin ? [{ href: '/admin', label: `🛠️ ${t('navigation.admin')}` }] : []),
  ]

  console.log('[Header] Rendering full navigation, links:', navLinks.length);

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link 
            href="/" 
            className={styles.logo} 
            onClick={(e) => handleLinkClick(e, '/')}
          >
            {t('app.name')}
          </Link>

          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={(e) => handleLinkClick(e, link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className={styles.desktopUserMenu}>
              <div className={styles.userMenu}>
                <button 
                  className={styles.userButton}
                  onClick={() => {
                    console.log('[Header] User dropdown toggled');
                    setShowUserDropdown(!showUserDropdown);
                  }}
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
              onClick={() => {
                console.log(`[Header] Mobile menu button clicked, current state: ${showMobileMenu}`);
                setShowMobileMenu(!showMobileMenu);
              }}
            >
              {showMobileMenu ? <MdClose size={28} /> : <MdMenu size={28} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`}
        onClick={() => {
          console.log('[Header] Mobile menu overlay clicked - closing');
          setShowMobileMenu(false);
        }}
      />

      {/* Mobile Menu - Controlled by CSS for stability */}
      <div className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className={styles.mobileLogoutButton}>
            <MdLogout /> {t('settings.logout')}
          </button>
        </div>
      </div>
    </>
  )
}

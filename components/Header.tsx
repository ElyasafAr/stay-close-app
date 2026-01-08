'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { logout, getStoredUser, isAuthenticated, onAuthStateChange, isLoggingOut } from '@/services/auth'
import { getData } from '@/services/api'
import { 
  MdLogout, 
  MdMenu, 
  MdClose, 
  MdPerson, 
  MdChat, 
  MdPeople, 
  MdSettings, 
  MdEmail, 
  MdInfo,
  MdAdminPanelSettings,
  MdStar
} from 'react-icons/md'
import { APP_VERSION } from '@/lib/constants'
import styles from './Header.module.css'

export function Header() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(true) // Default to true to hide during loading
  const [donationEnabled, setDonationEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  // פונקציה לבדיקת סטטוס אדמין ופרימיום
  const checkAccountStatus = async () => {
    try {
      console.log('🔍 [Header] checkAccountStatus: Starting check...');
      
      // Check admin status
      const adminRes = await getData('/api/admin/stats')
      setIsAdmin(adminRes.success)
      
      // Check premium status and remote switches
      const usageRes = await getData<any>('/api/usage/status')
      if (usageRes.success && usageRes.data) {
        setIsPremium(usageRes.data.subscription_status === 'premium')
        setDonationEnabled(usageRes.data.donation_enabled === true)
      }
    } catch (err) {
      console.error('❌ [Header] checkAccountStatus: API Error:', err);
    }
  }

  useEffect(() => {
    console.log('🔵 [Header] useEffect: Component mounted');
    setMounted(true)
    
    // האזנה לשינויי התחברות של Firebase
    const unsubscribe = onAuthStateChange((updatedUser) => {
      // לא מגיבים אם אנחנו בתהליך התנתקות
      if (isLoggingOut()) {
        console.log('👤 [Header] onAuthStateChange ignored (logout in progress)');
        return;
      }
      console.log('👤 [Header] onAuthStateChange:', updatedUser ? `User found: ${updatedUser.username}` : 'No user');
      setUser(updatedUser);
      if (updatedUser) {
        console.log('👤 [Header] Triggering account check from onAuthStateChange');
        checkAccountStatus();
      } else {
        setIsAdmin(false);
        setIsPremium(true);
      }
    });

    // האזנה לאירוע התחברות/התנתקות ידני (CustomEvent)
    const handleAuthChange = (e: any) => {
      const newUser = e.detail?.user;
      const isLogoutEvent = e.detail?.isLogout === true;
      
      // אם זה אירוע התנתקות, ננקה את ה-state ולא נעשה יותר כלום
      if (isLogoutEvent || isLoggingOut()) {
        console.log('👤 [Header] Logout event detected, clearing state');
        setUser(null);
        setIsAdmin(false);
        return;
      }
      
      console.log('👤 [Header] Custom authChanged event:', newUser ? `Login: ${newUser.username}` : 'No user');
      setUser(newUser || null);
      if (newUser) {
        console.log('👤 [Header] Triggering account check from authChanged event');
        checkAccountStatus();
      } else {
        setIsAdmin(false);
        setIsPremium(true);
      }
    };

    // האזנה לשינויים ב-Storage (בשביל סנכרון בין טאבים)
    const handleStorageChange = (e: StorageEvent) => {
      // לא מגיבים אם אנחנו בתהליך התנתקות
      if (isLoggingOut()) {
        console.log('👤 [Header] Storage change ignored (logout in progress)');
        return;
      }
      
      if (e.key === 'auth_token' || e.key === 'user') {
        console.log(`👤 [Header] Storage changed (key: ${e.key}), refreshing auth state`);
        const storedUser = getStoredUser();
        setUser(storedUser);
        if (storedUser) {
          console.log('👤 [Header] Triggering account check from StorageChange');
          checkAccountStatus();
        } else {
          setIsAdmin(false);
          setIsPremium(true);
        }
      }
    };

    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    // בדיקה ראשונית
    const authStatus = isAuthenticated();
    console.log('👤 [Header] Initial check: authenticated =', authStatus);
    if (authStatus) {
      const stored = getStoredUser();
      console.log('👤 [Header] Initial check: stored user =', stored?.username);
      setUser(stored);
      checkAccountStatus();
    }

    return () => {
      console.log('🔵 [Header] useEffect: Cleanup');
      unsubscribe();
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [])

  const handleLogout = async () => {
    console.log('🔵 [Header] handleLogout: Initiating logout...');
    setShowMobileMenu(false);
    setShowUserDropdown(false);
    // ניקוי מיידי של ה-State המקומי כדי שה-UI יגיב מהר
    setUser(null);
    setIsAdmin(false);
    await logout();
    console.log('🔵 [Header] handleLogout: Logout complete, redirecting to /login');
    router.replace('/login');
  }

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    console.log(`🧭 [Header] handleNavigation: To ${href}`);
    if (pathname === href || (pathname === '/' && href === '/messages')) {
      e.preventDefault();
      console.log('🧭 [Header] handleNavigation: Same path, ignoring');
      setShowMobileMenu(false);
      return;
    }

    e.preventDefault();
    setShowMobileMenu(false);
    setShowUserDropdown(false);

    try {
      console.log(`🧭 [Header] handleNavigation: router.replace(${href})`);
      router.replace(href);
    } catch (error) {
      console.warn('🧭 [Header] handleNavigation: router.replace failed, using window.location', error);
      window.location.href = href;
    }
  }

  // אם המערכת עוד לא נטענה בצד לקוח, נציג מבנה בסיסי שזהה ל-guest
  if (!mounted) {
    return (
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>Stay Close</div>
        </nav>
      </header>
    )
  }

  // מצב Guest - משתמש לא מחובר
  if (!user && !isAuthenticated()) {
    return (
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logo}>Stay Close</div>
        </nav>
      </header>
    )
  }

  const navLinks = [
    { href: '/messages', label: t('navigation.messages'), icon: <MdChat /> },
    { href: '/contacts', label: t('navigation.contacts'), icon: <MdPeople /> },
    ...(donationEnabled && !isPremium ? [{ href: '/paywall', label: t('paywall.title'), icon: <MdStar />, highlight: true }] : []),
    { href: '/settings', label: t('navigation.settings'), icon: <MdSettings /> },
    { href: '/contact', label: t('navigation.contact'), icon: <MdEmail /> },
    { href: '/about', label: t('navigation.about'), icon: <MdInfo /> },
    ...(isAdmin ? [{ href: '/admin', label: t('navigation.admin'), icon: <MdAdminPanelSettings /> }] : []),
  ]

  return (
    <>
    <header className={styles.header}>
        <nav className={styles.nav}>
          <button className={styles.mobileMenuButton} onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <MdClose size={28} /> : <MdMenu size={28} />}
          </button>

          <a href="/" className={styles.logo} onClick={(e) => handleNavigation(e, '/')}>
            {t('app.name')}
          </a>

          <div className={styles.navRight}>
            <div className={styles.navLinks}>
              {navLinks.map((link: any) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''} ${link.highlight ? styles.highlight : ''}`}
                  onClick={(e) => handleNavigation(e, link.href)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.navLinkIcon}>{link.icon}</span>
                    <span className={styles.navLinkLabel}>{link.label}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className={styles.desktopUserMenu}>
              <div className={styles.userMenu}>
                <button className={styles.userButton} onClick={() => setShowUserDropdown(!showUserDropdown)}>
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
          </div>
          <div className={styles.mobileSpacer}></div>
        </nav>
      </header>

      <div className={`${styles.mobileMenuOverlay} ${showMobileMenu ? styles.open : ''}`} onClick={() => setShowMobileMenu(false)} />

      <div className={`${styles.mobileMenu} ${showMobileMenu ? styles.open : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navLinks.map((link: any) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''} ${link.highlight ? styles.highlight : ''}`}
              onClick={(e) => handleNavigation(e, link.href)}
            >
              <span className={styles.navLinkIcon}>{link.icon}</span>
              {link.label}
            </a>
          ))}
          <button onClick={handleLogout} className={styles.mobileLogoutButton}>
            <MdLogout size={24} /> {t('settings.logout')}
          </button>
        </div>
      </div>
    </>
  )
}

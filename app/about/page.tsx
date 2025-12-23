'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/useTranslation'
import { AiFillHeart } from 'react-icons/ai'
import { MdEmail } from 'react-icons/md'
import { APP_VERSION, BUILD_DATE } from '@/lib/constants'
import styles from './page.module.css'

export default function AboutPage() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('navigation.about')}</h1>
        
        <div className={styles.content}>
          <div className={styles.icon}>💙</div>
          <p className={styles.paragraph}>
            Stay Close היא אפליקציה שפותחה כדי לעזור לכם לשמור על קשר עם האנשים החשובים בחייכם.
          </p>
          <p className={styles.paragraph}>
            האפליקציה מספקת כלים נוחים לניהול קשרים, תזכורות, והתראות כדי שלא תפספסו רגעים חשובים.
          </p>
          
          {/* מידע על גרסה */}
          <div className={styles.versionBox}>
            <p className={styles.versionText}>
            <AiFillHeart style={{ color: '#f4a5ae', fontSize: '1.2rem', marginLeft: '4px' }} />
              גרסה: <strong>{APP_VERSION}</strong>
            </p>
            <p className={styles.buildDate}>תאריך עדכון: {BUILD_DATE}</p>
          </div>

          {/* כפתור צור קשר - מעבר לדף הייעודי */}
          <button 
            className={styles.contactButton}
            onClick={() => router.push('/contact')}
          >
            <MdEmail style={{ fontSize: '20px' }} />
            צור קשר
          </button>
        </div>
      </div>
    </main>
  )
}


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
        <h1 className={styles.title}>{t('about.title')}</h1>
        
        <div className={styles.content}>
          <div className={styles.icon}>💙</div>
          <p className={styles.paragraph}>
            {t('about.description1')}
          </p>
          <p className={styles.paragraph}>
            {t('about.description2')}
          </p>
          
          {/* מידע על גרסה */}
          <div className={styles.versionBox}>
            <p className={styles.versionText}>
            <AiFillHeart style={{ color: '#f4a5ae', fontSize: '1.2rem', marginInlineEnd: '4px' }} />
              {t('about.version')}: <strong>{APP_VERSION}</strong>
            </p>
            <p className={styles.buildDate}>{t('about.buildDate')}: {BUILD_DATE}</p>
          </div>

          {/* כפתור צור קשר - מעבר לדף הייעודי */}
          <button 
            className={styles.contactButton}
            onClick={() => router.push('/contact')}
          >
            <MdEmail style={{ fontSize: '20px' }} />
            {t('about.contact')}
          </button>
        </div>
      </div>
    </main>
  )
}


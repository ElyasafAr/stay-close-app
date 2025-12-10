'use client'

import { useTranslation } from '@/i18n/useTranslation'
import { AiFillHeart } from 'react-icons/ai'
import styles from './page.module.css'

export default function AboutPage() {
  const { t } = useTranslation()

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
          <p className={styles.paragraph}>
            <AiFillHeart style={{ color: '#f4a5ae', fontSize: '1.2rem', marginLeft: '4px' }} />
            גרסה: 1.0.0
          </p>
        </div>
      </div>
    </main>
  )
}


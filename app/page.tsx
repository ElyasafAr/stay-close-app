'use client'

import Link from 'next/link'
import { MdContacts, MdMessage, MdSettings, MdInfo } from 'react-icons/md'
import { AiFillHeart } from 'react-icons/ai'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.welcomeCard}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💙</div>
          <h1 className={styles.title}>ברוכים הבאים ל-Stay Close</h1>
          <p className={styles.subtitle}>שמרו על קשר עם האנשים החשובים בחייכם</p>
          <div className={styles.description}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>
              איך זה עובד?
            </p>
            <div style={{ textAlign: 'right', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-primary)' }}>1️⃣ מגדירים אנשי קשר</strong>
                <p style={{ marginTop: '8px', fontSize: '1rem' }}>
                  הוסיפו את האנשים החשובים בחייכם - משפחה, חברים, קולגות
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--color-primary)' }}>2️⃣ שולחים להם הודעות</strong>
                <p style={{ marginTop: '8px', fontSize: '1rem' }}>
                  צרו הודעות מותאמות אישית באמצעות AI - הודעות חמות, מקצועיות או ידידותיות
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-primary)' }}>3️⃣ מקבלים תזכורות</strong>
                <p style={{ marginTop: '8px', fontSize: '1rem' }}>
                  הגדירו תזכורות אוטומטיות כדי שלא תשכחו לשמור על קשר
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.quickActions}>
          <Link href="/contacts" className={styles.actionCard}>
            <MdContacts className={styles.actionIcon} />
            <span className={styles.actionTitle}>אנשי קשר</span>
            <span className={styles.actionDescription}>הוסיפו וניהולו את האנשים החשובים</span>
          </Link>
          
          <Link href="/messages" className={styles.actionCard}>
            <MdMessage className={styles.actionIcon} />
            <span className={styles.actionTitle}>הודעות</span>
            <span className={styles.actionDescription}>צרו הודעות מותאמות אישית עם AI</span>
          </Link>
          
          <Link href="/settings" className={styles.actionCard}>
            <MdSettings className={styles.actionIcon} />
            <span className={styles.actionTitle}>הגדרות</span>
            <span className={styles.actionDescription}>התאימו את האפליקציה לצרכים שלכם</span>
          </Link>
          
          <Link href="/about" className={styles.actionCard}>
            <MdInfo className={styles.actionIcon} />
            <span className={styles.actionTitle}>אודות</span>
            <span className={styles.actionDescription}>מידע נוסף על האפליקציה</span>
          </Link>
        </div>
      </div>
    </main>
  )
}


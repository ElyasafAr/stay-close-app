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
          <h1 className={styles.title}>ברוכים הבאים</h1>
          <p className={styles.subtitle}>נהלו את הקשרים החשובים שלכם</p>
          <p className={styles.description}>
            אפליקציית Stay Close מאפשרת לכם לשמור על קשר עם האנשים החשובים בחייכם ולנהל את הקשרים שלכם בצורה יעילה ונוחה.
          </p>
        </div>
        
        <div className={styles.quickActions}>
          <Link href="/contacts" className={styles.actionCard}>
            <MdContacts className={styles.actionIcon} />
            <span className={styles.actionTitle}>אנשי קשר</span>
            <span className={styles.actionDescription}>נהלו את רשימת אנשי הקשר</span>
          </Link>
          
          <Link href="/messages" className={styles.actionCard}>
            <MdMessage className={styles.actionIcon} />
            <span className={styles.actionTitle}>הודעות</span>
            <span className={styles.actionDescription}>צרו הודעות מעוצבות</span>
          </Link>
          
          <Link href="/settings" className={styles.actionCard}>
            <MdSettings className={styles.actionIcon} />
            <span className={styles.actionTitle}>הגדרות</span>
            <span className={styles.actionDescription}>התאימו את האפליקציה</span>
          </Link>
          
          <Link href="/about" className={styles.actionCard}>
            <MdInfo className={styles.actionIcon} />
            <span className={styles.actionTitle}>אודות</span>
            <span className={styles.actionDescription}>מידע על האפליקציה</span>
          </Link>
        </div>
      </div>
    </main>
  )
}


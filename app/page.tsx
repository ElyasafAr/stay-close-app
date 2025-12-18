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
          <h1 className={styles.title}>ברוכים הבאים ל-Stay Close</h1>
          <p className={styles.subtitle}>שמרו על קשר עם האנשים החשובים בחייכם</p>
          <div className={styles.description}>
            <p className={styles.howItWorks}>איך זה עובד?</p>
            <ul className={styles.stepsList}>
              <li>
                <strong>1️⃣ מגדירים אנשי קשר</strong>
                <span> - הוסיפו את האנשים החשובים בחייכם</span>
              </li>
              <li>
                <strong>2️⃣ שולחים להם הודעות</strong>
                <span> - צרו הודעות מותאמות אישית באמצעות AI</span>
              </li>
              <li>
                <strong>3️⃣ מקבלים תזכורות</strong>
                <span> - הגדירו תזכורות אוטומטיות</span>
              </li>
            </ul>
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


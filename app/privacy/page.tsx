'use client'

import { useTranslation } from '@/i18n/useTranslation'
import styles from './page.module.css'

export default function PrivacyPage() {
  const { t } = useTranslation()
  
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('privacy.title')}</h1>
        <p className={styles.lastUpdated}>{t('privacy.lastUpdated')}</p>

        <section className={styles.section}>
          <h2>{t('privacy.intro.title')}</h2>
          <p>{t('privacy.intro.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.collection.title')}</h2>
          <h3>{t('privacy.collection.userProvided.title')}</h3>
          <ul>
            <li>{t('privacy.collection.userProvided.account')}</li>
            <li>{t('privacy.collection.userProvided.contacts')}</li>
            <li>{t('privacy.collection.userProvided.settings')}</li>
          </ul>
          
          <h3>{t('privacy.collection.automated.title')}</h3>
          <ul>
            <li>{t('privacy.collection.automated.device')}</li>
            <li>{t('privacy.collection.automated.usage')}</li>
            <li>{t('privacy.collection.automated.push')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.usage.title')}</h2>
          <ul>
            <li>{t('privacy.usage.item1')}</li>
            <li>{t('privacy.usage.item2')}</li>
            <li>{t('privacy.usage.item3')}</li>
            <li>{t('privacy.usage.item4')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.security.title')}</h2>
          <p>{t('privacy.security.intro')}</p>
          <ul>
            <li>{t('privacy.security.encryption')}</li>
            <li>{t('privacy.security.secureComm')}</li>
            <li>{t('privacy.security.backup')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.thirdParties.title')}</h2>
          <p>{t('privacy.thirdParties.intro')}</p>
          <ul>
            <li>{t('privacy.thirdParties.firebase')}</li>
            <li>{t('privacy.thirdParties.ai')}</li>
            <li>{t('privacy.thirdParties.payments')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.rights.title')}</h2>
          <p>{t('privacy.rights.intro')}</p>
          <ul>
            <li>{t('privacy.rights.access')}</li>
            <li>{t('privacy.rights.correct')}</li>
            <li>{t('privacy.rights.delete')}</li>
            <li>{t('privacy.rights.revoke')}</li>
          </ul>
          <p>
            {t('privacy.rights.contact')} <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.retention.title')}</h2>
          <p>{t('privacy.retention.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.children.title')}</h2>
          <p>{t('privacy.children.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.changes.title')}</h2>
          <p>{t('privacy.changes.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.contactInfo.title')}</h2>
          <p>
            {t('privacy.contactInfo.content')}
            <br />
            {t('privacy.contactInfo.email')} <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}


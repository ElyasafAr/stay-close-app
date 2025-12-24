'use client'

import { useTranslation } from '@/i18n/useTranslation'
import styles from './page.module.css'

export default function TermsPage() {
  const { t } = useTranslation()
  
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('terms.title')}</h1>
        <p className={styles.lastUpdated}>{t('terms.lastUpdated')}</p>

        <section className={styles.section}>
          <h2>{t('terms.intro.title')}</h2>
          <p>{t('terms.intro.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.usage.title')}</h2>
          <p>{t('terms.usage.content')}</p>
          <ul>
            <li>{t('terms.usage.item1')}</li>
            <li>{t('terms.usage.item2')}</li>
            <li>{t('terms.usage.item3')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.account.title')}</h2>
          <ul>
            <li>{t('terms.account.item1')}</li>
            <li>{t('terms.account.item2')}</li>
            <li>{t('terms.account.item3')}</li>
            <li>{t('terms.account.item4')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.payments.title')}</h2>
          <h3>{t('terms.payments.trial.title')}</h3>
          <p>{t('terms.payments.trial.content')}</p>
          
          <h3>{t('terms.payments.paid.title')}</h3>
          <ul>
            <li>{t('terms.payments.paid.item1')}</li>
            <li>{t('terms.payments.paid.item2')}</li>
            <li>{t('terms.payments.paid.item3')}</li>
          </ul>
          
          <h3>{t('terms.payments.cancellation.title')}</h3>
          <ul>
            <li>{t('terms.payments.cancellation.item1')}</li>
            <li>{t('terms.payments.cancellation.item2')}</li>
            <li>{t('terms.payments.cancellation.item3')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.aiContent.title')}</h2>
          <div className={styles.important}>
            <p>
              <strong>{t('terms.aiContent.important')}</strong>
            </p>
            <ul>
              <li>{t('terms.aiContent.item1')}</li>
              <li>{t('terms.aiContent.item2')}</li>
              <li>{t('terms.aiContent.item3')}</li>
              <li>{t('terms.aiContent.item4')}</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.allowedUsage.title')}</h2>
          <h3>{t('terms.allowedUsage.allowed.title')}</h3>
          <ul>
            <li>{t('terms.allowedUsage.allowed.item1')}</li>
            <li>{t('terms.allowedUsage.allowed.item2')}</li>
          </ul>
          
          <h3>{t('terms.allowedUsage.forbidden.title')}</h3>
          <ul>
            <li>{t('terms.allowedUsage.forbidden.item1')}</li>
            <li>{t('terms.allowedUsage.forbidden.item2')}</li>
            <li>{t('terms.allowedUsage.forbidden.item3')}</li>
            <li>{t('terms.allowedUsage.forbidden.item4')}</li>
            <li>{t('terms.allowedUsage.forbidden.item5')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.limitation.title')}</h2>
          <div className={styles.important}>
            <p>{t('terms.limitation.content')}</p>
            <ul>
              <li>{t('terms.limitation.item1')}</li>
              <li>{t('terms.limitation.item2')}</li>
              <li>{t('terms.limitation.item3')}</li>
              <li>{t('terms.limitation.item4')}</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.ip.title')}</h2>
          <p>{t('terms.ip.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.termination.title')}</h2>
          <p>{t('terms.termination.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.changes.title')}</h2>
          <p>{t('terms.changes.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.law.title')}</h2>
          <p>{t('terms.law.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.contact.title')}</h2>
          <p>
            {t('terms.contact.content')}
            <br />
            {t('terms.contact.email')} <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}


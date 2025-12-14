'use client'

import styles from './page.module.css'

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>תנאי שימוש</h1>
        <p className={styles.lastUpdated}>עודכן לאחרונה: דצמבר 2024</p>

        <section className={styles.section}>
          <h2>1. הסכמה לתנאים</h2>
          <p>
            בשימוש באפליקציית Stay Close (״האפליקציה״), אתה מסכים לתנאי שימוש אלה.
            אם אינך מסכים לתנאים, אנא הפסק להשתמש באפליקציה.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. תיאור השירות</h2>
          <p>
            Stay Close היא אפליקציה שעוזרת לך לשמור על קשר עם אנשים חשובים בחייך.
            האפליקציה מספקת:
          </p>
          <ul>
            <li>ניהול אנשי קשר ותזכורות</li>
            <li>יצירת הודעות מותאמות אישית באמצעות בינה מלאכותית</li>
            <li>התראות Push לתזכורת</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. הרשמה וחשבון</h2>
          <ul>
            <li>עליך להיות בן 13 לפחות כדי להשתמש באפליקציה</li>
            <li>עליך לספק מידע מדויק בעת ההרשמה</li>
            <li>אתה אחראי לשמור על סודיות פרטי הגישה שלך</li>
            <li>אתה אחראי לכל הפעילות בחשבונך</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. מנויים ותשלומים</h2>
          <h3>4.1 תקופת ניסיון</h3>
          <p>
            משתמשים חדשים מקבלים 14 ימי ניסיון חינם עם גישה מלאה לכל הפיצרים.
          </p>
          
          <h3>4.2 מנוי בתשלום</h3>
          <ul>
            <li>המנוי מתחדש אוטומטית בתום התקופה</li>
            <li>התשלום מתבצע דרך Google Play</li>
            <li>ניתן לבטל מנוי בכל עת דרך Google Play</li>
          </ul>
          
          <h3>4.3 ביטול והחזרים</h3>
          <ul>
            <li>ביטול מנוי יכנס לתוקף בתום התקופה ששולמה</li>
            <li>החזרים כספיים בהתאם למדיניות Google Play</li>
            <li>תוך 14 יום מהרכישה - זכאות להחזר מלא לפי חוק</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. תוכן שנוצר על ידי בינה מלאכותית</h2>
          <div className={styles.important}>
            <p>
              <strong>חשוב להבין:</strong>
            </p>
            <ul>
              <li>ההודעות נוצרות באופן אוטומטי על ידי בינה מלאכותית</li>
              <li>האפליקציה אינה מספקת ייעוץ אישי, רגשי או מקצועי</li>
              <li><strong>אתה אחראי לבדוק ולערוך כל הודעה לפני שליחתה</strong></li>
              <li>אנו לא אחראים לתוכן ההודעות או להשלכותיהן</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>6. שימוש מותר ואסור</h2>
          <h3>6.1 שימוש מותר:</h3>
          <ul>
            <li>שליחת הודעות אישיות לחברים ובני משפחה</li>
            <li>ניהול תזכורות אישיות</li>
          </ul>
          
          <h3>6.2 שימוש אסור:</h3>
          <ul>
            <li>שליחת ספאם או הודעות מסחריות</li>
            <li>הטרדה, איומים או התנהגות פוגענית</li>
            <li>התחזות לאנשים אחרים</li>
            <li>שימוש לפעילות בלתי חוקית</li>
            <li>ניסיון לפרוץ או לפגוע במערכת</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. הגבלת אחריות</h2>
          <div className={styles.important}>
            <p>
              האפליקציה מסופקת ״כמות שהיא״ (AS IS).
              אנו לא אחראים לכל נזק ישיר או עקיף הנובע משימוש באפליקציה, כולל:
            </p>
            <ul>
              <li>תוכן הודעות שנוצרו</li>
              <li>תקלות טכניות או הפסקות שירות</li>
              <li>אובדן נתונים</li>
              <li>השלכות של הודעות שנשלחו</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>8. קניין רוחני</h2>
          <p>
            כל הזכויות באפליקציה, כולל עיצוב, קוד וסימני מסחר, שייכות לנו.
            אינך רשאי להעתיק, לשנות או להפיץ חלקים מהאפליקציה.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. סיום שירות</h2>
          <p>
            אנו רשאים להשעות או לסגור את חשבונך אם תפר תנאים אלה.
            אתה רשאי לסגור את חשבונך בכל עת דרך ההגדרות או ביצירת קשר עמנו.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. שינויים בתנאים</h2>
          <p>
            אנו רשאים לעדכן תנאים אלה מעת לעת.
            שינויים מהותיים יפורסמו באפליקציה.
            המשך השימוש לאחר השינויים מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. דין וסמכות שיפוט</h2>
          <p>
            תנאים אלה כפופים לחוקי מדינת ישראל.
            כל סכסוך יידון בבתי המשפט המוסמכים בישראל.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. יצירת קשר</h2>
          <p>
            לשאלות בנוגע לתנאי השימוש:
            <br />
            אימייל: <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}


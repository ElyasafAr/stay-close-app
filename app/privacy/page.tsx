'use client'

import styles from './page.module.css'

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>מדיניות פרטיות</h1>
        <p className={styles.lastUpdated}>עודכן לאחרונה: דצמבר 2024</p>

        <section className={styles.section}>
          <h2>1. מבוא</h2>
          <p>
            ברוכים הבאים ל-Stay Close (״האפליקציה״, ״אנחנו״, ״שלנו״). 
            אנו מחויבים להגן על פרטיותך ולשמור על המידע האישי שלך בצורה מאובטחת.
            מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. מידע שאנו אוספים</h2>
          <h3>2.1 מידע שאתה מספק לנו:</h3>
          <ul>
            <li><strong>פרטי חשבון:</strong> כתובת אימייל, שם משתמש</li>
            <li><strong>אנשי קשר:</strong> שמות של אנשים שאתה רוצה לשמור איתם קשר</li>
            <li><strong>הגדרות:</strong> העדפות התראות, שפה, ערכת נושא</li>
          </ul>
          
          <h3>2.2 מידע שנאסף אוטומטית:</h3>
          <ul>
            <li>סוג המכשיר ומערכת ההפעלה</li>
            <li>נתוני שימוש באפליקציה (מספר הודעות שנוצרו)</li>
            <li>Token להתראות Push</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. כיצד אנו משתמשים במידע</h2>
          <ul>
            <li>יצירת הודעות מותאמות אישית באמצעות בינה מלאכותית</li>
            <li>שליחת התראות תזכורת לפי הגדרותיך</li>
            <li>שיפור השירות והחוויה באפליקציה</li>
            <li>תמיכה טכנית ותקשורת עמך</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. אבטחת מידע</h2>
          <p>
            אנו משתמשים באמצעי אבטחה מתקדמים להגנה על המידע שלך:
          </p>
          <ul>
            <li><strong>הצפנה:</strong> מידע רגיש (שמות, אימיילים) מוצפן בהצפנת AES</li>
            <li><strong>תקשורת מאובטחת:</strong> כל התקשורת מתבצעת דרך HTTPS</li>
            <li><strong>גיבוי מאובטח:</strong> המידע מאוחסן בשרתים מאובטחים</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. שיתוף מידע עם צדדים שלישיים</h2>
          <p>
            אנו לא מוכרים את המידע האישי שלך. אנו משתפים מידע רק עם:
          </p>
          <ul>
            <li><strong>Google Firebase:</strong> לצורך אימות והתראות Push</li>
            <li><strong>xAI/Groq:</strong> לצורך יצירת הודעות (ללא זיהוי אישי)</li>
            <li><strong>Google Play:</strong> לצורך עיבוד תשלומים</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. הזכויות שלך</h2>
          <p>יש לך זכות:</p>
          <ul>
            <li><strong>לגשת למידע:</strong> לבקש עותק של המידע שלך</li>
            <li><strong>לתקן מידע:</strong> לעדכן פרטים שגויים</li>
            <li><strong>למחוק מידע:</strong> לבקש מחיקת החשבון וכל המידע</li>
            <li><strong>לבטל הסכמה:</strong> לכבות התראות בכל עת</li>
          </ul>
          <p>
            ליצירת קשר בנושא פרטיות: <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. שמירת מידע</h2>
          <p>
            אנו שומרים את המידע שלך כל עוד החשבון שלך פעיל.
            לאחר מחיקת חשבון, המידע יימחק תוך 30 יום.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. ילדים</h2>
          <p>
            האפליקציה מיועדת למשתמשים בני 13 ומעלה.
            אנו לא אוספים ביודעין מידע מילדים מתחת לגיל 13.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. שינויים במדיניות</h2>
          <p>
            אנו עשויים לעדכן מדיניות זו מעת לעת.
            שינויים מהותיים יפורסמו באפליקציה ובאימייל.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. יצירת קשר</h2>
          <p>
            לשאלות בנוגע למדיניות הפרטיות:
            <br />
            אימייל: <a href="mailto:elyasaf.ar@gmail.com">elyasaf.ar@gmail.com</a>
          </p>
        </section>
      </div>
    </main>
  )
}

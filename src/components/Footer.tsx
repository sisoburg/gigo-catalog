import { useLanguage } from '../i18n/LanguageContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Footer.module.css'

const WHATSAPP_NUMBERS = {
  noam: '972545555656',
  ayala: '972528888981',
}

function whatsappHref(number: string, locale: 'en' | 'he') {
  const message = locale === 'he' ? 'היי! מתעניינ/ת בתכשיט מ-GIGO' : "Hi! I'm interested in a piece from Gigo"
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function Footer() {
  const { locale } = useLanguage()
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <footer className={styles.footer}>
      <div ref={ref} className={styles.inner}>
        <div className={styles.about}>
          <span className={styles.eyebrow}>{locale === 'he' ? 'אודות' : 'About'}</span>
          {locale === 'he' ? (
            <>
              <h2 className={styles.heading}>GIGO התחיל מתכשיטי הסבתות שלנו.</h2>
              <p>תכשיטים ישנים, צורות שגדלנו עליהן, דברים שנשמרו ועברו מדור לדור — ומשם התחלנו ליצור משהו משלנו.</p>
              <p>
                אנחנו נועם, אדריכל, ואיילה, צורפת. אנחנו מגיעים מעולמות שונים, והעבודה שלנו נוצרת איפשהו בחיבור ביניהם בין תכנון במחשב
                לעבודה ביד, בין ישן לחדש.
              </p>
              <p>כל התכשיטים מיוצרים על ידינו כאן בארץ, מכסף 925, זהב ואבנים.</p>
              <p>אנחנו אוהבים חומרים שנשארים, ותכשיטים שאפשר לענוד שנים ובסוף אולי גם להעביר הלאה.</p>
            </>
          ) : (
            <>
              <h2 className={styles.heading}>GIGO began with our grandmothers&rsquo; jewelry.</h2>
              <p>Old pieces, familiar shapes, things made to last — kept, worn and passed on.</p>
              <p>
                We&rsquo;re Noam, an architect, and Ayala, a jeweler and maker. Together we create somewhere between digital design and
                working by hand, giving old references new forms.
              </p>
              <p>Made locally in Israel, using sterling silver, gold and natural stones — materials that age, live with you, and are made to stay.</p>
              <p>Pieces to wear now, keep forever, and maybe one day pass on.</p>
            </>
          )}
        </div>

        <div className={styles.contact}>
          <span className={styles.eyebrow}>{locale === 'he' ? 'יצירת קשר' : 'Contact'}</span>
          <p className={styles.dm}>{locale === 'he' ? 'להזמנות, פרטים ושאלות — דברו איתנו בפרטי' : 'DM for pieces, orders & inquiries'}</p>

          <div className={styles.links}>
            <a
              className={styles.instagram}
              href="https://www.instagram.com/gigo_jewelry/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
              </svg>
              <span>@gigo_jewelry</span>
            </a>

            <a className={styles.whatsapp} href={whatsappHref(WHATSAPP_NUMBERS.noam, locale)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span>{locale === 'he' ? 'וואטסאפ — נועם' : 'WhatsApp — Noam'}</span>
            </a>

            <a className={styles.whatsapp} href={whatsappHref(WHATSAPP_NUMBERS.ayala, locale)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span>{locale === 'he' ? 'וואטסאפ — איילה' : 'WhatsApp — Ayala'}</span>
            </a>
          </div>
        </div>

        <p className={styles.copyright}>&copy; {new Date().getFullYear()} GIGO</p>
      </div>
    </footer>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a9 9 0 0 0-7.78 13.5L3 21l4.65-1.2A9 9 0 1 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.8c.2-.5.4-.5.6-.5h.4c.15 0 .3 0 .45.35.15.4.5 1.3.55 1.4.05.1.08.2 0 .35-.08.15-.12.25-.25.38-.12.13-.25.3-.37.4-.12.1-.25.22-.1.47.15.25.65 1.05 1.4 1.7.95.85 1.75 1.1 2 1.25.25.15.4.12.55-.05.15-.17.6-.7.76-.95.17-.25.33-.2.55-.12.23.08 1.45.68 1.7.8.25.13.4.18.47.3.07.1.07.6-.13 1.2-.2.6-1.15 1.15-1.6 1.2-.4.05-.9.07-1.45-.1-.33-.1-.76-.25-1.3-.5-2.3-1-3.8-3.3-3.9-3.45-.1-.15-.9-1.2-.9-2.3 0-1.1.55-1.6.75-1.85Z"
        fill="currentColor"
      />
    </svg>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Piece } from '../../data/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { scrollToY } from '../SmoothScroll'
import { ScrambleHeading } from '../ScrambleHeading'
import { WHATSAPP_NUMBERS, whatsappHref } from '../../lib/contact'
import liyaRed from '../../assets/worn/liya-red.jpg'
import liyaBlue from '../../assets/worn/liya-blue.jpg'
import liyaSilver from '../../assets/worn/liya-silver.jpg'
import styles from './WornCustom.module.css'

type Metal = 'silver' | 'gold'

// One photo per stone colour. Colour names only: no claims about which
// specific stones exist.
const STONE_OPTIONS = [
  { id: 'red', hex: '#a3262a', src: liyaRed, en: 'red', he: 'אדום' },
  { id: 'blue', hex: '#1f2f5c', src: liyaBlue, en: 'blue', he: 'כחול' },
  { id: 'silver', hex: '#d4d4d8', src: liyaSilver, en: 'no stones, plain silver', he: 'בלי אבנים, כסף חלק' },
]

/** The cover is often a worn/lifestyle shot; the second photo is usually the clean product shot, which reads better for colour play. */
const productShot = (p: Piece) => p.gallery.filter((m) => m.kind === 'photo')[1] ?? p.cover

const findByName = (pieces: Piece[], slugPart: string, nameEn: string) =>
  pieces.find((p) => p.slug.includes(slugPart)) ?? pieces.find((p) => p.name.en.toLowerCase() === nameEn)

/** Customization finale: metal and stones are choices, Liza is personal —
 *  play with it a little, then take the conversation to WhatsApp / About. */
export function WornCustom({ pieces }: { pieces: Piece[] }) {
  const { locale } = useLanguage()
  const he = locale === 'he'
  const ref = useScrollReveal<HTMLDivElement>()
  const [metal, setMetal] = useState<Metal>('silver')
  const [stone, setStone] = useState(0)

  const liza = useMemo(() => findByName(pieces, 'liza', 'liza'), [pieces])
  const liya = useMemo(() => findByName(pieces, 'liya', 'liya'), [pieces])

  const message = he ? 'היי! אשמח לראות תכשיט ולהתאים אותו אישית' : "Hi! I'd love to see a piece in person and customize it"
  const goAbout = () => {
    const el = document.getElementById('about')
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY - 24)
  }

  return (
    <section className={styles.section}>
      <div ref={ref} className={styles.inner}>
        <p className={styles.eyebrow}>{he ? 'מותאם אישית' : 'Made for you'}</p>
        <ScrambleHeading text={he ? 'הופכים אותו לשלכם' : 'Make it yours'} className={styles.heading} />
        <p className={styles.lead}>
          {he
            ? 'כל תכשיט יכול להיעשות מכסף או מזהב. לחלקם אפשר לבחור אבנים, ואת ליזה אפשר להתאים אישית רק בשבילכם.'
            : 'Every piece can be made in silver or gold. Some come with a choice of stones, and Liza can be made personal, just for you.'}
        </p>

        <div className={styles.cards}>
          {liza && (
            <div className={`${styles.card} ${styles.cardLiza}`}>
              <Link to={`/piece/${liza.slug}`} className={styles.photo} data-metal={metal}>
                <img src={productShot(liza).medium} alt={productShot(liza).alt[locale]} loading="lazy" />
              </Link>
              <div className={styles.controls}>
                <span className={styles.cardName}>{liza.name[locale]}</span>
                <div className={styles.toggle} role="group" aria-label={he ? 'מתכת' : 'Metal'}>
                  {(['silver', 'gold'] as Metal[]).map((m) => (
                    <button key={m} type="button" className={metal === m ? styles.on : undefined} aria-pressed={metal === m} onClick={() => setMetal(m)}>
                      {m === 'silver' ? (he ? 'כסף' : 'Silver') : he ? 'זהב' : 'Gold'}
                    </button>
                  ))}
                </div>
                <span className={styles.note}>{he ? 'תצוגה מקדימה לצבע בלבד' : 'colour preview only'}</span>
              </div>
            </div>
          )}

          {liya && (
            <div className={`${styles.card} ${styles.cardLiya}`}>
              <Link to={`/piece/${liya.slug}`} className={styles.photo}>
                {STONE_OPTIONS.map((c, i) => (
                  <img
                    key={c.id}
                    src={c.src}
                    alt={c.id === 'silver' ? (he ? 'ליה, כסף חלק' : 'Liya in plain silver') : he ? `ליה עם אבן ${c.he}` : `Liya with a ${c.en} stone`}
                    data-off={i === stone ? undefined : ''}
                    loading="lazy"
                  />
                ))}
              </Link>
              <div className={styles.controls}>
                <span className={styles.cardName}>{liya.name[locale]}</span>
                <div className={styles.dots} role="group" aria-label={he ? 'צבע אבן' : 'Stone colour'}>
                  {STONE_OPTIONS.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      className={i === stone ? `${styles.dot} ${styles.dotOn}` : styles.dot}
                      style={{ background: c.hex }}
                      aria-label={he ? c.he : c.en}
                      aria-pressed={i === stone}
                      onClick={() => setStone(i)}
                    />
                  ))}
                </div>
                <span className={styles.note}>{he ? 'האבנים לפי הטעם שלכם' : 'stones to your taste'}</span>
              </div>
            </div>
          )}
        </div>

        <ul className={styles.chips}>
          <li>{he ? 'כסף או זהב' : 'Silver or gold'}</li>
          <li>{he ? 'אבנים לבחירתכם' : 'Stones you pick'}</li>
          <li>{he ? 'אישי, רק בשבילכם' : 'Made personal'}</li>
        </ul>

        <p className={styles.cta}>
          {he ? 'בואו לראות את זה מקרוב, ונעצב את שלכם יחד.' : "Come see it in person and we'll design yours together."}
        </p>
        <div className={styles.buttons}>
          <a className={styles.primary} href={whatsappHref(WHATSAPP_NUMBERS.noam, locale, message)} target="_blank" rel="noopener noreferrer">
            {he ? 'וואטסאפ — נועם' : 'WhatsApp — Noam'}
          </a>
          <a className={styles.primary} href={whatsappHref(WHATSAPP_NUMBERS.ayala, locale, message)} target="_blank" rel="noopener noreferrer">
            {he ? 'וואטסאפ — איילה' : 'WhatsApp — Ayala'}
          </a>
        </div>
        <button type="button" className={styles.meet} onClick={goAbout}>
          {he ? 'להכיר אותנו ↓' : 'Meet us ↓'}
        </button>
      </div>
    </section>
  )
}

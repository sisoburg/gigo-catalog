import { useLayoutEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Piece } from '../../data/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { ScrambleHeading } from '../ScrambleHeading'
import { PinSkipControls } from '../PinSkipControls'
import styles from './WornStory.module.css'

gsap.registerPlugin(ScrollTrigger)

// Optional on purpose: the section still works if the photo is ever removed.
const originals = import.meta.glob('../../assets/worn/chaya-original.*', { eager: true, import: 'default' }) as Record<string, string>
const chayaOriginal = Object.values(originals)[0]

const GRID_SIZE = 9
const HERO_CELL = 4 // centre of the 3x3

// Per-tile entrance: each non-hero cell flies in from its own direction at
// its own scale/tilt, so the wall assembles itself rather than fading in.
const FROM_SCALE = [0.4, 1.7, 0.55, 1.5, 0.5, 1.8, 0.45, 1.6]
const FROM_ROTATE = [-16, 12, -9, 14, -12, 9, -14, 11]

interface Tile {
  slug: string
  name: string
  src: string
  alt: string
}

function tileFor(piece: Piece, locale: 'en' | 'he', preferFresh: boolean): Tile {
  const photos = piece.gallery.filter((m) => m.kind === 'photo')
  const photo = (preferFresh ? photos[1] : undefined) ?? photos[0] ?? piece.cover
  return { slug: piece.slug, name: piece.name[locale], src: photo.medium, alt: photo.alt[locale] }
}

/** The grandmother story, then the pull-back: Chaya fills the screen and
 *  zooms out to reveal the rest of the family around it. */
export function WornStory({ pieces }: { pieces: Piece[] }) {
  const { locale } = useLanguage()
  const he = locale === 'he'
  const storyRef = useScrollReveal<HTMLDivElement>()
  const sectionRef = useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)

  const tiles = useMemo(() => {
    if (pieces.length < 2) return null
    const heroPiece = pieces.find((p) => p.slug === 'chaya') ?? pieces[0]
    const others = pieces.filter((p) => p !== heroPiece)
    const hero = { ...tileFor(heroPiece, locale, false), src: heroPiece.cover.large }
    const rest: Tile[] = []
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      rest.push(tileFor(others[i % others.length], locale, i < others.length))
    }
    const list = [...rest.slice(0, HERO_CELL), hero, ...rest.slice(HERO_CELL)]
    return list
  }, [pieces, locale])

  useLayoutEffect(() => {
    const section = sectionRef.current
    const grid = gridRef.current
    if (!section || !grid || !tiles) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cells = Array.from(grid.children) as HTMLElement[]
    const hero = cells[HERO_CELL]
    const heroName = hero.querySelector('[data-name]')
    const others = cells.filter((_, i) => i !== HERO_CELL)

    const ctx = gsap.context(() => {
      // The hero cell is the exact middle of the grid, so scaling the grid up
      // about its centre until that one cell covers the viewport = "Chaya
      // full-screen", and scaling back to 1 = the zoom-out. Measuring the
      // real cell (not guessing) is what lets it land exactly in its slot.
      const coverScale = () => Math.max(window.innerWidth / hero.offsetWidth, window.innerHeight / hero.offsetHeight)

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=220%',
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(grid, { scale: coverScale }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      tl.fromTo(
        others,
        {
          opacity: 0,
          scale: (i) => FROM_SCALE[i % FROM_SCALE.length],
          rotate: (i) => FROM_ROTATE[i % FROM_ROTATE.length],
          x: (i) => ((i % 3) - 1) * window.innerWidth * 0.18,
          y: (i) => (Math.floor(i / 3) - 1) * window.innerHeight * 0.18,
        },
        { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0, ease: 'back.out(1.25)', duration: 0.55, stagger: 0.07 },
        0.3,
      )
      // The hero's name is on screen from the very first frame (like a title
      // card); counter-scaling keeps it a readable size while the grid is blown up.
      tl.fromTo(heroName, { scale: () => 1.5 / coverScale() }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
    }, section)

    return () => ctx.revert()
  }, [tiles])

  const heading = he ? 'חלק מהתכשיטים נושאים את הסיפור של סבתא' : "Some pieces carry a grandmother's story"

  return (
    <>
      <section className={styles.story}>
        <div ref={storyRef} className={styles.storyInner}>
          {chayaOriginal && (
            <figure className={styles.polaroid}>
              <img src={chayaOriginal} alt={he ? 'טבעת האירוסין המקורית של סבתא של איילה' : "Ayala's grandmother's original engagement ring"} loading="lazy" />
              <figcaption>{he ? 'הטבעת המקורית' : 'The original'}</figcaption>
            </figure>
          )}
          <div className={styles.copy}>
            <ScrambleHeading text={heading} className={styles.heading} />
            <p>
              {he
                ? 'חלק מהתכשיטים שלנו נולדו מסבתא אחת: הטבעת שלה, הצורה שלה, הדרך שבה ענדה אותה.'
                : 'Some of our pieces are born from one grandmother: her ring, her shape, the way she wore it.'}
            </p>
            <p>
              {he
                ? 'חיה התחילה כטבעת האירוסין של סבתא של איילה. שמרנו על הנשמה שלה, ונתנו לה צורה חדשה.'
                : "Chaya began as the engagement ring of Ayala's grandmother. We kept its soul and gave it a new shape."}
            </p>
            <p className={styles.cue}>{he ? 'ועכשיו, התכשיטים שירשו את הסיפור ↓' : 'And now, the pieces that inherited it ↓'}</p>
          </div>
        </div>
      </section>

      {tiles && (
        <section ref={sectionRef} className={styles.zoom} aria-label={he ? 'הקולקציה' : 'The family of pieces'}>
          <div ref={gridRef} className={styles.grid}>
            {tiles.map((tile, i) => (
              <Link key={`${tile.slug}-${i}`} to={`/piece/${tile.slug}`} className={i === HERO_CELL ? `${styles.cell} ${styles.heroCell}` : styles.cell}>
                <img src={tile.src} alt={tile.alt} loading="lazy" />
                <span data-name className={styles.name}>
                  {tile.name}
                </span>
              </Link>
            ))}
          </div>
          <PinSkipControls sectionRef={sectionRef} upLabel={he ? 'דלג למעלה' : 'Skip up'} downLabel={he ? 'דלג למטה' : 'Skip down'} />
        </section>
      )}
    </>
  )
}

import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PieceMedia } from '../../data/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { PinSkipControls } from '../PinSkipControls'
import styles from './WornLayers.module.css'

gsap.registerPlugin(ScrollTrigger)

const MAX_ITEMS = 15

type SceneKind = 'stack' | 'drop' | 'pair' | 'reveal'
const SCENE_ORDER: SceneKind[] = ['stack', 'drop', 'pair', 'reveal']
const NEEDS: Record<SceneKind, number> = { stack: 2, drop: 1, pair: 2, reveal: 1 }

interface Scene {
  kind: SceneKind
  media: PieceMedia[]
}

/** Curators only pick images; the look of each scene is decided here, in a
 *  fixed rotation, so the strip always mixes layered, dropping, paired and
 *  wiped-in compositions instead of one repeated tile. */
function buildScenes(items: PieceMedia[]): Scene[] {
  const queue = items.slice(0, MAX_ITEMS)
  const scenes: Scene[] = []
  let i = 0
  while (queue.length > 0) {
    let kind = SCENE_ORDER[i % SCENE_ORDER.length]
    if (queue.length < NEEDS[kind]) kind = 'drop'
    scenes.push({ kind, media: queue.splice(0, NEEDS[kind]) })
    i++
  }
  return scenes
}

interface WornLayersProps {
  items: PieceMedia[]
}

/** A short, pinned horizontal scroll where layers move at different speeds:
 *  backs lag, fronts race ahead, images drop in from above, colour panels
 *  wipe away. All of it hangs off one linear horizontal tween via
 *  `containerAnimation`, so each element's motion is tied to the strip. */
export function WornLayers({ items }: WornLayersProps) {
  const { locale } = useLanguage()
  const he = locale === 'he'
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const scenes = useMemo(() => buildScenes(items), [items])

  useLayoutEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - section.clientWidth)
      const main = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // Scrolling a bit less than the strip is wide makes the strip
          // move briskly — short and lively rather than a long haul.
          end: () => `+=${distance() * 0.55}`,
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
        },
      })

      const vw = () => window.innerWidth
      const vh = () => window.innerHeight
      const run = (el: Element, from: gsap.TweenVars, to: gsap.TweenVars, scene: Element, start = 'left right', end = 'right left') =>
        gsap.fromTo(el, from, {
          ...to,
          ease: to.ease ?? 'none',
          scrollTrigger: { trigger: scene, containerAnimation: main, start, end, scrub: true },
        })

      track.querySelectorAll<HTMLElement>('[data-scene]').forEach((scene) => {
        const kind = scene.dataset.scene
        const el = (name: string) => scene.querySelector(`[data-l="${name}"]`)
        const all = (name: string) => Array.from(scene.querySelectorAll(`[data-l="${name}"]`))

        if (kind === 'title') {
          // The big word lags behind the strip so photos slide over it.
          run(el('word')!, { x: () => -vw() * 0.12 }, { x: () => vw() * 0.2 }, scene)
        } else if (kind === 'stack') {
          run(el('back')!, { x: () => -vw() * 0.1, scale: 1.12 }, { x: () => vw() * 0.1, scale: 1 }, scene)
          run(el('front')!, { x: () => vw() * 0.22, rotate: 7, y: () => vh() * 0.06 }, { x: () => -vw() * 0.2, rotate: -6, y: () => -vh() * 0.06 }, scene)
          run(el('panel')!, { yPercent: 8 }, { yPercent: -8 }, scene)
        } else if (kind === 'drop') {
          // Falls in from above and settles by the time it reaches centre.
          run(el('img')!, { y: () => -vh() * 0.7, rotate: 14, opacity: 0 }, { y: 0, rotate: -3, opacity: 1, ease: 'power3.out' }, scene, 'left 105%', 'left 35%')
          run(el('panel')!, { xPercent: -30 }, { xPercent: 30 }, scene)
        } else if (kind === 'pair') {
          const [a, b] = all('img')
          run(a, { y: () => -vh() * 0.14 }, { y: () => vh() * 0.14 }, scene)
          run(b, { y: () => vh() * 0.14 }, { y: () => -vh() * 0.14 }, scene)
        } else if (kind === 'reveal') {
          // Colour panel covers the photo, then wipes off sideways.
          run(el('cover')!, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', ease: 'power2.inOut' }, scene, 'left 90%', 'left 30%')
          run(el('img')!, { scale: 1.25 }, { scale: 1 }, scene)
        }
      })
    }, section)

    return () => ctx.revert()
  }, [scenes])

  return (
    <section ref={sectionRef} className={styles.section} aria-label={he ? 'יום-יום, עלינו' : 'Everyday, on us'}>
      <div ref={trackRef} className={styles.track}>
        <div className={`${styles.scene} ${styles.title}`} data-scene="title">
          <h2 data-l="word" dir={he ? 'rtl' : 'ltr'} className={styles.word}>
            {he ? 'יום-יום, עלינו' : 'Everyday, on us'}
          </h2>
        </div>
        {scenes.map((scene, i) => (
          <div key={i} className={`${styles.scene} ${styles[scene.kind]}`} data-scene={scene.kind} data-tone={i % 4}>
            {scene.kind === 'stack' && (
              <>
                <div data-l="panel" className={styles.panel} />
                <div data-l="back" className={`${styles.frame} ${styles.stackBack}`}>
                  <Media media={scene.media[0]} />
                </div>
                {scene.media[1] && (
                  <div data-l="front" className={`${styles.frame} ${styles.stackFront}`}>
                    <Media media={scene.media[1]} />
                  </div>
                )}
              </>
            )}
            {scene.kind === 'drop' && (
              <>
                <div data-l="panel" className={styles.panel} />
                <div data-l="img" className={`${styles.frame} ${styles.dropImg}`}>
                  <Media media={scene.media[0]} />
                </div>
              </>
            )}
            {scene.kind === 'pair' && (
              <>
                <div data-l="img" className={`${styles.frame} ${styles.pairA}`}>
                  <Media media={scene.media[0]} />
                </div>
                {scene.media[1] && (
                  <div data-l="img" className={`${styles.frame} ${styles.pairB}`}>
                    <Media media={scene.media[1]} />
                  </div>
                )}
              </>
            )}
            {scene.kind === 'reveal' && (
              <div className={`${styles.frame} ${styles.revealFrame}`}>
                <div data-l="img" className={styles.revealImg}>
                  <Media media={scene.media[0]} />
                </div>
                <div data-l="cover" className={styles.cover} />
              </div>
            )}
          </div>
        ))}
      </div>
      <PinSkipControls sectionRef={sectionRef} upLabel={he ? 'דלג למעלה' : 'Skip up'} downLabel={he ? 'דלג למטה' : 'Skip down'} />
    </section>
  )
}

function Media({ media }: { media: PieceMedia }) {
  if (media.kind === 'photo') return <img src={media.large} alt={media.alt.en} loading="lazy" draggable={false} />
  return <LoopVideo media={media} />
}

function LoopVideo({ media }: { media: Extract<PieceMedia, { kind: 'video' }> }) {
  const ref = useRef<HTMLVideoElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <video ref={ref} src={media.src} poster={media.poster} muted loop playsInline preload="metadata" />
}

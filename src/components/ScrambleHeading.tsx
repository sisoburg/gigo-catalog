import { Fragment, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrambleHeadingProps {
  text: string
  className?: string
}

/** Splits text into per-letter spans that tumble into place (randomized
 *  offset/rotation settling to rest, staggered from a random start point)
 *  the first time the heading scrolls into view. Bidi-safe: the DOM stays
 *  in logical character order, so RTL text reorders correctly via `dir`. */
export function ScrambleHeading({ text, className }: ScrambleHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const letters = Array.from(el.querySelectorAll<HTMLElement>('[data-letter]'))
    const ctx = gsap.context(() => {
      gsap.fromTo(
        letters,
        {
          opacity: 0,
          y: () => gsap.utils.random(-36, 36),
          rotate: () => gsap.utils.random(-28, 28),
        },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: 0.65,
          ease: 'power4.out',
          stagger: { each: 0.02, from: 'random' },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [text])

  // Words stay unbreakable: per-letter inline-blocks would otherwise let a
  // line wrap in the middle of a word.
  return (
    <h2 ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((word, w, words) => (
        <Fragment key={w}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }} aria-hidden="true">
            {Array.from(word).map((char, i) => (
              <span key={i} data-letter style={{ display: 'inline-block' }}>
                {char}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h2>
  )
}

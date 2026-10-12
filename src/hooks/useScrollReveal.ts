import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Slow, subtle fade + rise reveal as an element enters the viewport. */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        },
      )
    })

    return () => ctx.revert()
  }, [])

  return ref
}

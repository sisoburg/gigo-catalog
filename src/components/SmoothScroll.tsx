import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null

/** Smooth-scrolls to an absolute page Y position, using Lenis when it's
 *  running — Lenis drives its own internal scroll target each frame, so a
 *  raw window.scrollTo() gets fought and mostly undone on the next tick.
 *  Reduced-motion users never get a Lenis instance, so this falls back to
 *  native scroll. */
export function scrollToY(y: number) {
  if (lenisInstance) lenisInstance.scrollTo(y, { duration: 1.2 })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

export function scrollToTop() {
  scrollToY(0)
}

/**
 * Site-wide smooth (inertial) scroll, wired into GSAP's ticker so every
 * ScrollTrigger-driven animation moves with it instead of against native
 * scroll. This is most of what makes a GSAP+ScrollTrigger site feel
 * "premium" rather than just having scroll-triggered reveals.
 */
export function SmoothScroll() {
  const location = useLocation()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1 - Math.pow(2, -10 * t)), // ease-out expo
      smoothWheel: true,
    })
    lenisInstance = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])

  // Reset scroll on route change — Lenis intercepts native scroll, so React
  // Router's own history scroll handling doesn't reach it.
  useEffect(() => {
    lenisInstance?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

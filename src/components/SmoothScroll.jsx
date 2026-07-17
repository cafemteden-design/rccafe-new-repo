import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SMOOTH_SCROLL_ROUTES = new Set([
  '/',
  '/booking',
  '/contact',
  '/experience',
  '/menu',
  '/rewards',
  '/reward-card',
])

function isSmoothScrollRoute(pathname) {
  return SMOOTH_SCROLL_ROUTES.has(pathname) || pathname.startsWith('/rewards/card/')
}

function useSmoothScrollCapability() {
  const [isCapable, setIsCapable] = useState(false)

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function' || typeof window.matchMedia !== 'function') return undefined

    const desktopQuery = window.matchMedia('(min-width: 768px)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    const updateCapability = () => {
      setIsCapable(desktopQuery.matches && !reducedMotionQuery.matches && !coarsePointerQuery.matches)
    }

    updateCapability()
    const queries = [desktopQuery, reducedMotionQuery, coarsePointerQuery]
    queries.forEach((query) => query.addEventListener?.('change', updateCapability))

    return () => {
      queries.forEach((query) => query.removeEventListener?.('change', updateCapability))
    }
  }, [])

  return isCapable
}

export default function SmoothScroll() {
  const location = useLocation()
  const lenisRef = useRef(null)
  const isCapable = useSmoothScrollCapability()
  const isEnabled = isCapable && isSmoothScrollRoute(location.pathname)

  useEffect(() => {
    if (!isEnabled) return undefined

    let disposed = false
    let routeFrame = 0

    import('lenis').then(({ default: Lenis }) => {
      if (disposed) return

      const lenis = new Lenis({
        autoRaf: true,
        duration: 1.1,
        easing: (value) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1,
        wheelMultiplier: 1,
        anchors: { offset: -96 },
        stopInertiaOnNavigate: true,
        prevent: (node) => Boolean(node?.closest?.('[data-lenis-prevent], [role="dialog"]')),
      })

      lenisRef.current = lenis
      routeFrame = window.requestAnimationFrame(() => {
        lenis.resize()
        const target = location.hash ? document.querySelector(location.hash) : null
        lenis.scrollTo(target || 0, { immediate: true, force: true, offset: target ? -96 : 0 })
      })
    }).catch(() => {
      // Native scrolling remains available if the optional enhancement cannot load.
    })

    return () => {
      disposed = true
      window.cancelAnimationFrame(routeFrame)
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled || !lenisRef.current) return undefined

    const frame = window.requestAnimationFrame(() => {
      const lenis = lenisRef.current
      if (!lenis) return

      lenis.resize()
      const target = location.hash ? document.querySelector(location.hash) : null
      lenis.scrollTo(target || 0, { immediate: true, force: true, offset: target ? -96 : 0 })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isEnabled, location.hash, location.key, location.pathname])

  return null
}

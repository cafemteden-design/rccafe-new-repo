import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo.jsx'

const FLAG_KEY = '__rccafe_loaded'
const DURATION_MS = 700

export default function Loader() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem(FLAG_KEY)
  })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!show) return
    // Lock body scroll while loader is up
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const start = performance.now()
    let raf
    const tick = (t) => {
      const pct = Math.min(100, ((t - start) / DURATION_MS) * 100)
      setProgress(pct)
      if (pct < 100) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const id = setTimeout(() => {
      sessionStorage.setItem(FLAG_KEY, '1')
      setShow(false)
      document.body.style.overflow = prev
    }, DURATION_MS)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(id)
      document.body.style.overflow = prev
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-[200] grid place-items-center bg-white"
          aria-hidden="true"
        >
          <div className="relative w-[78%] max-w-sm">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex items-center justify-center"
            >
              <Logo className="h-20 sm:h-24 w-auto" />
            </motion.div>

            {/* Progress bar */}
            <div className="mt-8 h-[3px] w-full rounded-full bg-bg-soft overflow-hidden">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Track + percent */}
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] font-bold">
              <span className="text-muted">Loading Arena</span>
              <span className="text-orange-600 tabular-nums">{Math.floor(progress)}%</span>
            </div>

            {/* Subtle bouncing dots */}
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-orange-500"
                  animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

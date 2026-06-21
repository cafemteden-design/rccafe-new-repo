import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { ChevronRight, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV } from '../data/site.js'
import Logo from './Logo.jsx'
import { trackBookNowClick } from '../hooks/useAnalytics.js'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-white/95 shadow-soft backdrop-blur-md'
          : 'border-b border-white/20 bg-white/85 shadow-md backdrop-blur'
      }`}
    >
      <div className="container-x flex h-20 items-center gap-5 sm:h-24">
        <Link to="/" className="group flex shrink-0 items-center" aria-label="Remote Control Cafe Home">
          <Logo className="h-[60px] w-auto max-w-[140px] transition-transform group-hover:scale-[1.03] sm:h-[74px] sm:max-w-[166px]" />
        </Link>

        <nav className="ml-auto hidden items-center justify-end gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative px-3 py-2 text-sm font-semibold transition-colors xl:px-4 ${
                  isActive ? 'text-orange-600' : 'text-charcoal-100 hover:text-orange-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-1 h-0.5 rounded bg-orange-500"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            to="/booking#calendar"
            className="btn-primary !py-2.5"
            onClick={() => trackBookNowClick({ location: 'header' })}
          >
            Book Now
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="ml-auto inline-flex items-center justify-center rounded-md border border-border bg-white p-2 text-charcoal-100 lg:hidden"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-navigation"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="absolute inset-x-0 top-full z-[60] h-[calc(100dvh-5rem)] overflow-y-auto border-t border-border bg-white shadow-[0_18px_45px_rgba(24,24,27,0.18)] sm:h-[calc(100dvh-6rem)] lg:hidden"
          >
            <div className="container-x flex min-h-full flex-col bg-white pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
              <div className="mb-4">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Explore RCC</div>
                <p className="mt-1 text-sm text-muted">Choose where you would like to go.</p>
              </div>

              <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[56px] items-center justify-between rounded-xl border px-4 py-3 text-base font-bold transition ${
                        isActive
                          ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-border bg-white text-charcoal-300 hover:border-orange-200 hover:bg-orange-50/50'
                      }`
                    }
                  >
                    {item.label}
                    <ChevronRight size={19} className="flex-shrink-0 text-orange-500" />
                  </NavLink>
                ))}
              </nav>

              <Link
                to="/booking#calendar"
                className="btn-primary mt-5 min-h-[54px] w-full"
                onClick={() => {
                  setOpen(false)
                  trackBookNowClick({ location: 'mobile_menu' })
                }}
              >
                Book Now
              </Link>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                Book a weekday session online or contact RCC for weekends and group events.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV, SITE } from '../data/site.js'
import Logo from './Logo.jsx'

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

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-border shadow-soft'
          : 'bg-white/85 backdrop-blur border-b border-white/20 shadow-md'
      }`}
    >
      <div className="container-x flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center group" aria-label="RC Cafe — Home">
          <Logo className="h-[52px] sm:h-[64px] w-auto transition-transform group-hover:scale-[1.03]" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-orange-600' : 'text-charcoal-100 hover:text-orange-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
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

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${SITE.phoneTel}`}
            className="flex items-center gap-2 text-sm font-semibold text-charcoal-100 hover:text-orange-600"
          >
            <Phone size={16} /> {SITE.phone}
          </a>
          <Link to="/booking" className="btn-primary !py-2.5">
            Book Now
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden inline-flex items-center justify-center rounded-md border border-border bg-white p-2 text-charcoal-100"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden fixed inset-y-0 right-0 top-20 w-[82%] max-w-sm border-l border-border bg-white shadow-card"
          >
            <div className="flex flex-col p-6 gap-2">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl border border-border bg-bg-soft px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'text-orange-600 border-orange-300 bg-orange-50' : 'text-charcoal-100'
                    }`
                  }
                >
                  {n.label}
                  <span className="text-orange-500">›</span>
                </NavLink>
              ))}
              <Link to="/booking" className="btn-primary mt-4 w-full">Book Now</Link>
              <a
                href={`tel:${SITE.phoneTel}`}
                className="btn-outline mt-2 w-full"
              >
                <Phone size={16} /> {SITE.phone}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

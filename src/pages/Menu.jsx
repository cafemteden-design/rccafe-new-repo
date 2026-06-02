import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, GlassWater, Flame, Cookie, IceCream2, Sparkles, Plus } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { MENU } from '../data/menu.js'

const ICONS = {
  'Hot Drinks': Coffee,
  'Cold Drinks': GlassWater,
  'Smoothies': Sparkles,
  'Air Fry': Flame,
  'Bubble Tea': Cookie,
  'Snow Ice': IceCream2,
  'Coffee Range': Coffee,
  'Add-ons': Plus
}

const CATEGORIES = Object.keys(MENU)

export default function Menu() {
  const [active, setActive] = useState(CATEGORIES[0])
  const items = MENU[active]

  return (
    <>
      <PageHero
        breadcrumbs={['Menu']}
        eyebrow="Café Menu"
        title={<>Fuel Up After The <span className="accent">Fun</span></>}
        subtitle="Premium coffee, fresh smoothies, indulgent bubble tea and air-fried snacks — all served while you play."
        image="/images/family-cafe-activity.svg"
      />

      <section className="section-light py-12">
        <div className="container-x">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c] || Coffee
              const isActive = active === c
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border transition ${
                    isActive
                      ? 'bg-orange-500 border-orange-500 text-white shadow-glow'
                      : 'border-border bg-white text-charcoal-100 hover:border-orange-500 hover:text-orange-600'
                  }`}
                >
                  <Icon size={14} /> {c}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {items.map((item, i) => (
                <div key={item.name + i} className="card card-hover px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-charcoal-300">{item.name}</div>
                    <div className="text-[11px] uppercase tracking-widest text-muted mt-1">{active}</div>
                  </div>
                  <div className="font-display text-xl font-extrabold text-orange-600">${item.price.toFixed(2)}</div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <p className="mt-12 text-center text-xs text-muted">All prices in NZD. Menu may change seasonally — speak to staff for daily specials.</p>
        </div>
      </section>
    </>
  )
}

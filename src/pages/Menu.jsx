import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Coffee, GlassWater, Cookie, IceCream2, Sparkles, Plus, CupSoda, Utensils, ArrowRight } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { MENU, RC_PACKAGES, TOASTIE_CHOICES, COFFEE_CHOICES, UPGRADED_PLAY, FOOD_ITEMS, MENU_NOTES } from '../data/menu.js'

const ICONS = {
  'Hot Drinks': Coffee,
  'Non-Coffee': CupSoda,
  Tea: Cookie,
  'Cold Drinks': GlassWater,
  Frappe: IceCream2,
  Smoothies: Sparkles,
  Shake: CupSoda,
  Extras: Plus
}

const CATEGORIES = Object.keys(MENU)

function priceLabel(item) {
  const price = `$${item.price.toFixed(item.price % 1 === 0 ? 0 : 2)}`
  return item.prefix ? `${item.prefix} ${price}` : price
}

export default function Menu() {
  const [active, setActive] = useState(CATEGORIES[0])
  const items = MENU[active]

  return (
    <>
      <PageHero
        breadcrumbs={['Menu']}
        eyebrow="Cafe Menu"
        title={<>Fuel Up After The <span className="accent">Fun</span></>}
        subtitle="Premium drinks, RC + Food Garage packages and fresh bites for families, parties and group visits."
        image="/images/family-cafe-activity.jpg"
      />

      <section className="section-light py-12">
        <div className="container-x">
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center text-sm font-bold text-orange-800">
            {MENU_NOTES.coffee}
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center">
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c] || Coffee
              const isActive = active === c
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition ${
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
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item) => (
                <div key={item.name} className="rounded-lg border border-border bg-white px-4 py-3 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-charcoal-300">{item.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-widest text-muted">{active}</div>
                    </div>
                    <div className="shrink-0 font-display text-lg font-extrabold text-orange-600">{priceLabel(item)}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <PackageSection />

          <div className="mt-10 rounded-xl border border-border bg-white p-5 text-sm text-muted">
            <p className="font-semibold text-charcoal-300">{MENU_NOTES.venue}</p>
            <p className="mt-3">{MENU_NOTES.allergen}</p>
          </div>
        </div>
      </section>
    </>
  )
}

function PackageSection() {
  return (
    <div className="mt-14">
      <div className="flex items-center gap-2 text-orange-700 font-bold uppercase tracking-widest text-xs">
        <Utensils size={14} /> RC + Food Garage
      </div>
      <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-charcoal-300">Play Packages</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {RC_PACKAGES.map((pkg) => (
          <div key={pkg.id} className={`rounded-lg border bg-white p-5 shadow-soft ${pkg.badge ? 'border-orange-400' : 'border-border'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-extrabold text-charcoal-300">{pkg.name}</div>
                <div className="mt-1 text-sm font-semibold text-orange-700">{pkg.playTime}</div>
              </div>
              {pkg.badge && <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">{pkg.badge}</span>}
            </div>
            <div className="mt-5 font-display text-4xl font-extrabold text-orange-600">${pkg.price}</div>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-300">
              <li>Any Toastie</li>
              <li>Any Hot Coffee</li>
            </ul>
            <Link to={`/booking?package=${encodeURIComponent(pkg.name)}#calendar`} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
              Book Package <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChoiceCard title="Toastie Choices" items={TOASTIE_CHOICES} />
        <ChoiceCard title="Coffee Choices" items={COFFEE_CHOICES} />
        <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
          <div className="font-display text-lg font-extrabold text-charcoal-300">Upgraded Play</div>
          <div className="mt-4 space-y-3">
            {UPGRADED_PLAY.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="font-semibold text-charcoal-300">{item.playTime}</span>
                <span className="font-display text-xl font-extrabold text-orange-600">${item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-xl font-extrabold text-charcoal-300">Food Items</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOOD_ITEMS.map((item) => (
            <div key={item.name} className="rounded-lg border border-border bg-white px-4 py-3 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-charcoal-300">{item.name}</span>
                <span className="shrink-0 font-display text-lg font-extrabold text-orange-600">${item.price.toFixed(2)}</span>
              </div>
              {item.options && <div className="mt-1 text-xs text-muted">{item.options}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChoiceCard({ title, items }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="font-display text-lg font-extrabold text-charcoal-300">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-charcoal-300">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

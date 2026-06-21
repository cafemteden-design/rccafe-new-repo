import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Coffee, GlassWater, Cookie, IceCream2, Sparkles, Plus, CupSoda, ArrowRight, Sandwich, Gamepad2, Clock3 } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { TOASTIE_CHOICES, COFFEE_CHOICES, FOOD_ITEMS, MENU_NOTES } from '../data/menu.js'
import { PAGE_SEO } from '../data/seo.js'
import { trackMenuInteraction } from '../hooks/useAnalytics.js'
import { useLiveMenu } from '../hooks/useLiveMenu.js'

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

function priceLabel(item) {
  const price = `$${Number(item.price).toFixed(item.price % 1 === 0 ? 0 : 2)}`
  return item.prefix ? `${item.prefix} ${price}` : price
}

export default function Menu() {
  const { menu } = useLiveMenu()
  const categories = Object.keys(menu)
  const [active, setActive] = useState(categories[0])
  const activeCategory = menu[active] ? active : categories[0]
  const items = menu[activeCategory] || []

  const handleCategoryChange = (category) => {
    setActive(category)
    trackMenuInteraction({
      category: category,
      action: 'category_change'
    })
  }

  return (
    <>
      <SEO {...PAGE_SEO['/menu']} path="/menu" />
      <PageHero
        breadcrumbs={['Menu']}
        eyebrow="Cafe Menu"
        title={<>Fuel Up After The <span className="accent">Fun</span></>}
        subtitle="Premium drinks, flexible RC gameplay options and fresh bites for families, parties and group visits."
        image="/images/family-cafe-activity.jpg"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center text-sm font-bold text-orange-800">
            {MENU_NOTES.coffee}
          </div>

          <nav className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Menu sections">
            <MenuJumpLink href="#gameplay" icon={Gamepad2} title="Gameplay Options" text="45 or 60 minutes per remote" />
            <MenuJumpLink href="#food" icon={Sandwich} title="Food & Toasties" text="Fresh bites and cafe food" />
            <MenuJumpLink href="#drinks" icon={Coffee} title="Coffee & Drinks" text="Hot, cold and blended drinks" />
          </nav>

          <GameplayOptions />

          <div id="drinks" className="scroll-mt-28 pt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-700"><Coffee size={14} />Cafe Drinks</div>
                <h2 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Coffee, cold drinks and more</h2>
                <p className="mt-2 text-sm text-muted">Choose a category to browse current cafe pricing.</p>
              </div>
              <Link to="/booking#calendar" className="btn-outline hidden sm:inline-flex">Book a Visit</Link>
            </div>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center">
            {categories.map((c) => {
              const Icon = ICONS[c] || Coffee
              const isActive = activeCategory === c
              return (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition ${
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
              key={activeCategory}
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
                      <div className="mt-1 text-[11px] uppercase tracking-widest text-muted">{activeCategory}</div>
                    </div>
                    <div className="shrink-0 font-display text-lg font-extrabold text-orange-600">{priceLabel(item)}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 rounded-xl border border-border bg-white p-5 text-sm text-muted">
            <p className="font-semibold text-charcoal-300">{MENU_NOTES.venue}</p>
            <p className="mt-3">{MENU_NOTES.allergen}</p>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-orange-200 bg-orange-50 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-charcoal-300">Ready for food and RC play?</h2>
              <p className="mt-1 text-sm text-muted">Reserve an hourly slot, choose 45 or 60 minutes of gameplay and select your included food and drink.</p>
            </div>
            <Link to="/booking#calendar" className="btn-primary whitespace-nowrap">Book Your Session <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}

function GameplayOptions() {
  return (
    <div id="gameplay" className="scroll-mt-28 pt-14">
      <div className="flex items-center gap-2 text-orange-700 font-bold uppercase tracking-widest text-xs">
        <Gamepad2 size={14} /> RCC Gameplay
      </div>
      <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-charcoal-300">Choose Your Gameplay</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">Bookings are made by selecting a 1-hour time slot and number of remotes. Pricing is per remote.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[{ minutes: 45, price: 45 }, { minutes: 60, price: 55 }].map((option) => (
          <article key={option.minutes} className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-card">
            <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-700"><Clock3 size={14} />Gameplay</div>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300">{option.minutes} Minutes</h3>
                <p className="mt-2 text-sm text-muted">Includes one toastie and one hot coffee selection per booking.</p>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-extrabold text-orange-600">${option.price}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Per Remote</div>
              </div>
            </div>
            <Link to="/booking#calendar" className="btn-outline mt-5 w-full">Choose This Session <ArrowRight size={14} /></Link>
          </article>
        ))}
      </div>

      <div id="food" className="mt-6 grid scroll-mt-28 gap-4 md:grid-cols-2">
        <ChoiceCard title="Toastie Choices" items={TOASTIE_CHOICES} />
        <ChoiceCard title="Coffee Choices" items={COFFEE_CHOICES} />
      </div>

      <div className="mt-8">
        <h3 className="font-display text-xl font-extrabold text-charcoal-300">Food Items</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOOD_ITEMS.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition hover:border-orange-200 hover:shadow-card">
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
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="font-display text-lg font-extrabold text-charcoal-300">{title}</div>
      <ul className="mt-4 space-y-2 text-sm text-charcoal-300">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function MenuJumpLink({ href, icon: Icon, title, text }) {
  return (
    <a href={href} className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block font-extrabold text-charcoal-300">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{text}</span>
      </span>
    </a>
  )
}

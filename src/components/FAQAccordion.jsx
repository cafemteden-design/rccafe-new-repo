import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

/**
 * Reusable FAQ accordion.
 * Pass either `items` (flat [{q,a}]) or `groups` ([{category, items}]).
 * UI only — inject FAQPage schema via the page's <SEO schema={faqSchema(...)} />.
 */
export default function FAQAccordion({ items = [], groups = null }) {
  if (groups) {
    return (
      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-orange-600">
              <HelpCircle size={15} /> {group.category}
            </div>
            <AccordionList items={group.items} />
          </div>
        ))}
      </div>
    )
  }
  return <AccordionList items={items} />
}

function AccordionList({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            className={`rounded-2xl border transition ${isOpen ? 'border-orange-300 bg-orange-50' : 'border-border bg-white'}`}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-charcoal-300">{item.q}</span>
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-orange-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 leading-relaxed text-muted">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

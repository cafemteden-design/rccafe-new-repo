import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { GALLERY, GALLERY_FILTERS } from '../data/gallery.js'
import { PAGE_SEO } from '../data/seo.js'

export default function Gallery() {
  const [filter, setFilter] = useState('All')
  const [active, setActive] = useState(null)
  const items = filter === 'All' ? GALLERY : GALLERY.filter((g) => g.category === filter)

  return (
    <>
      <SEO {...PAGE_SEO['/gallery']} path="/gallery" />
      <PageHero
        breadcrumbs={['Gallery']}
        eyebrow="Inside The Arena"
        title={<>RC Cafe <span className="accent">Gallery</span></>}
        subtitle="Real moments from our arena, machines, café and group events."
        image="/images/indoor-arena.jpg"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="flex flex-wrap items-center gap-2 mb-8 justify-center">
            {GALLERY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition ${
                  filter === f
                    ? 'bg-orange-500 border-orange-500 text-white shadow-glow'
                    : 'border-border bg-white text-charcoal-100 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 [grid-auto-rows:160px] sm:[grid-auto-rows:200px]">
            {items.map((g, i) => (
              <motion.button
                key={g.id}
                onClick={() => setActive(g)}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: (i % 8) * 0.04 }}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-white shadow-soft ${
                  i % 7 === 0 ? 'col-span-2 row-span-2' : i % 5 === 0 ? 'row-span-2' : ''
                }`}
              >
                <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal-300/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
                  <div className="text-white text-[10px] uppercase tracking-widest font-bold">{g.category}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[100] bg-charcoal-300/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full"
            >
              <button onClick={() => setActive(null)} className="absolute -top-12 right-0 grid place-items-center w-10 h-10 rounded-full bg-white text-charcoal-300 hover:bg-orange-500 hover:text-white transition">
                <X size={20} />
              </button>
              <img src={active.src} alt={active.alt} className="w-full max-h-[80vh] object-contain rounded-2xl bg-white" />
              <div className="mt-3 text-center text-sm text-white/80">{active.alt}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

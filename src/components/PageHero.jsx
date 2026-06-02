import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function PageHero({ eyebrow, title, subtitle, image, breadcrumbs = [] }) {
  return (
    <section className="relative overflow-hidden bg-bg-soft border-b border-border">
      <div className="container-x grid lg:grid-cols-12 gap-10 py-14 lg:py-20 items-center">
        <div className="lg:col-span-7">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-muted mb-4">
              <Link to="/" className="hover:text-orange-600">Home</Link>
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={12} />
                  <span className={i === breadcrumbs.length - 1 ? 'text-orange-600 font-semibold' : ''}>{b}</span>
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />{eyebrow}</span>}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-display mt-4 text-charcoal-300"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-4 max-w-xl text-muted"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="rounded-3xl overflow-hidden border border-border bg-white shadow-soft">
              <img src={image} alt="" className="w-full h-64 sm:h-80 object-cover" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

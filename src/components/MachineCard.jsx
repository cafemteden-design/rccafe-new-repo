import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'

export default function MachineCard({ m, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group card card-hover overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-soft">
        <img
          src={m.image}
          alt={m.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 chip !bg-white">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> {m.tag}
        </div>
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-orange-500 text-white px-2.5 py-1 text-[11px] font-bold">
          <Users size={12} /> ×{m.capacity}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-extrabold text-charcoal-300">{m.name}</h3>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">{m.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-orange-600 font-bold">{m.capacity}/slot</span>
          <Link
            to="/booking"
            className="inline-flex items-center gap-1 text-sm font-bold text-charcoal-300 hover:text-orange-600"
          >
            Book <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

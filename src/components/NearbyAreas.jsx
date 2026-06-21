import { MapPin } from 'lucide-react'
import { NEARBY_AREAS } from '../data/seo.js'

/**
 * Soft local-signal section listing Auckland areas we serve.
 * Not a doorway page — purely supporting context for local relevance.
 */
export default function NearbyAreas({ title = 'Serving families and groups across Auckland' }) {
  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow"><MapPin size={14} /> Auckland Wide</span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">{title}</h2>
          <p className="mt-2 text-muted">
            Families, schools and groups visit Remote Control Cafe from right across the
            Auckland region for a fun, hands-on RC construction experience.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {NEARBY_AREAS.map((area) => (
            <span
              key={area}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-charcoal-100"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

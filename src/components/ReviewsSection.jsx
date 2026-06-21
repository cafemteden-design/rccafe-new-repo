import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'

const REVIEWS = [
  {
    name: 'Sarah M.',
    location: 'Mount Eden',
    text: 'Finally something different! My kids loved operating the diggers and I actually enjoyed a proper coffee while they played. We are already planning our next visit.',
    rating: 5,
    category: 'family'
  },
  {
    name: 'James T.',
    location: 'North Shore',
    text: 'Best birthday party we have ever had. The kids were engaged the whole time and the staff made everything easy. Highly recommend for anyone looking for a unique party venue.',
    rating: 5,
    category: 'birthday'
  },
  {
    name: 'Corporate Team',
    location: 'Auckland CBD',
    text: 'Our team building day at RCC was brilliant. Everyone got involved, the atmosphere was fun, and it actually got people talking and laughing together. Much better than the usual activities.',
    rating: 5,
    category: 'corporate'
  },
  {
    name: 'Lisa & Family',
    location: 'Epsom',
    text: 'We visit regularly now. The kids are always excited to come back, and the Reward Card gives them a goal to work towards. It has become our go-to screen-free family activity.',
    rating: 5,
    category: 'family'
  },
  {
    name: 'David K.',
    location: 'Newmarket',
    text: 'Took my nephews here during the school holidays and they absolutely loved it. The staff were patient and helpful, and the cafe made it easy for me to relax while they played.',
    rating: 5,
    category: 'family'
  },
  {
    name: 'Marketing Team',
    location: 'Parnell',
    text: 'We used RCC for a client entertainment event and it was perfect. Low pressure, fun, and gave everyone something to talk about. Great for building relationships.',
    rating: 5,
    category: 'corporate'
  }
]

const CATEGORY_LABELS = {
  family: 'Family Visit',
  birthday: 'Birthday Party',
  corporate: 'Corporate Event'
}

export default function ReviewsSection({ limit = 3, showFilter = false, showLink = true }) {
  return (
    <section className="section-soft py-16 sm:py-20">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow"><Quote size={14} /> Customer Reviews</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-muted">
            Real experiences from Auckland families, teams and groups.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.slice(0, limit).map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-center gap-1">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} size={16} className="fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-charcoal-200">"{review.text}"</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-charcoal-300">{review.name}</div>
                  <div className="text-xs text-muted">{review.location}</div>
                </div>
              </div>
              {showFilter && (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    {CATEGORY_LABELS[review.category]}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        {showLink && (
          <div className="mt-8 text-center">
            <Link to="/why-rcc-cafe" className="btn-outline">
              Read More Reviews
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

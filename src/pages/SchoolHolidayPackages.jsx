import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, CheckCircle2, ArrowRight, Calendar, Gift, Repeat } from 'lucide-react'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { PAGE_SEO, faqSchema, serviceSchema, breadcrumbSchema } from '../data/seo.js'
import SEO from '../components/SEO.jsx'
import StickyCTA from '../components/StickyCTA.jsx'

const SCHOOL_HOLIDAY_PACKAGES_SEO = {
  ...PAGE_SEO,
  title: 'School Holiday Packages Auckland | RCC Remote Control Cafe',
  description: 'School holiday activity packages in Auckland. Multi-visit options, holiday programmes, and single sessions. Keep kids active and engaged these holidays.',
  keywords: ['school holiday packages auckland', 'school holiday programme auckland', 'holiday activities for kids auckland']
}

const PACKAGES = [
  {
    name: 'Single Visit',
    price: 'Standard Pricing',
    popular: false,
    duration: '45-60 minutes',
    includes: [
      'RC machine play time',
      'Toastie and hot drink included',
      'Staff supervision',
      'Flexible booking times'
    ],
    bestFor: 'One-off holiday activity'
  },
  {
    name: 'Multi-Visit Pass',
    price: 'Custom Quote',
    popular: true,
    duration: 'Multiple visits',
    includes: [
      '3 or more holiday sessions',
      'Discounted rate for multiple visits',
      'Reward Card stamps on each visit',
      'Flexible scheduling',
      'Priority booking'
    ],
    bestFor: 'Regular holiday outings'
  },
  {
    name: 'Holiday Programme',
    price: 'Custom Quote',
    popular: false,
    duration: 'Full day or half-day',
    includes: [
      'Extended RC machine activities',
      'Structured holiday programme',
      'Multiple activity rotations',
      'Food and drink options',
      'Dedicated staff coordination',
      'Certificate of completion'
    ],
    bestFor: 'Schools and holiday programmes'
  }
]

const BENEFITS = [
  { icon: Gift, title: 'Reward Card Integration', desc: 'Every visit counts towards your free gift after seven stamps' },
  { icon: Repeat, title: 'Replay Value', desc: 'Activity evolves as kids improve their skills' },
  { icon: Calendar, title: 'Flexible Scheduling', desc: 'Book around your holiday plans' },
  { icon: GraduationCap, title: 'Educational Value', desc: 'Builds coordination and problem-solving skills' }
]

const SCHOOL_HOLIDAY_PACKAGES_FAQS = [
  {
    q: 'How do I book a school holiday package?',
    a: 'Contact us through our contact page with your preferred dates and package choice. School holiday sessions are arranged separately from standard weekday slots.'
  },
  {
    q: 'What is the multi-visit pass?',
    a: 'The multi-visit pass offers discounted rates for 3 or more holiday sessions. It is perfect for families who want regular holiday outings.'
  },
  {
    q: 'Do you offer full-day holiday programmes?',
    a: 'Yes. We can structure full-day or half-day holiday programmes with extended activities, food options, and dedicated staff coordination.'
  },
  {
    q: 'Can schools book holiday programmes?',
    a: 'Yes. We work with schools to create custom holiday programmes that combine fun with educational elements.'
  },
  {
    q: 'Is the activity suitable for different ages?',
    a: 'Yes. RCC suits a wide range of ages. The machines are remote controlled and the arena is family-friendly, so younger and older kids both enjoy it.'
  },
  {
    q: 'How far in advance should we book?',
    a: 'We recommend booking holiday sessions as early as possible, especially for multi-visit passes and holiday programmes. Contact us to check availability.'
  }
]

function SchoolHolidayPackages() {
  const schema = [
    serviceSchema({ name: 'School Holiday Packages', description: SCHOOL_HOLIDAY_PACKAGES_SEO.description, path: '/school-holiday-packages' }),
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'School Holiday Packages', path: '/school-holiday-packages' }]),
    faqSchema(SCHOOL_HOLIDAY_PACKAGES_FAQS)
  ]

  return (
    <>
      <SEO seo={SCHOOL_HOLIDAY_PACKAGES_SEO} schema={schema} />
      <StickyCTA primaryLabel="Get a Quote" primaryTo="/contact" />
      
      <section className="section-soft py-16 sm:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><GraduationCap size={14} /> School Holidays</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">
              School Holiday Packages Auckland
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Keep kids active and engaged these school holidays. Unique RC construction experience 
              with flexible packages for single visits, multi-visit passes, and holiday programmes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact" className="btn-primary">Get a Quote <ArrowRight size={16} /></Link>
              <Link to="/school-holiday-activities-auckland" className="btn-outline">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Choose Your Package
            </h2>
            <p className="mt-4 text-muted">
              Options for one-off visits, regular outings, or full holiday programmes. Custom quotes available.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
              <Clock size={14} />
              <span>Pricing from $22 per child</span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`card p-6 relative ${pkg.popular ? 'border-2 border-orange-500' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Best Value
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-charcoal-300">{pkg.name}</h3>
                <div className="mt-2 text-2xl font-bold text-orange-600">{pkg.price}</div>
                <div className="mt-4 text-sm text-muted">{pkg.duration}</div>
                <ul className="mt-6 space-y-3">
                  {pkg.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-charcoal-200">
                      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="text-sm text-muted">Best for: {pkg.bestFor}</div>
                </div>
                <Link to="/contact" className="mt-6 block w-full btn-primary text-center">
                  Get Quote
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Why Choose RCC for School Holidays
            </h2>
            <p className="mt-4 text-muted">
              Benefits that make holiday planning easier.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <benefit.icon size={24} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal-300">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-8">
              <FAQAccordion items={SCHOOL_HOLIDAY_PACKAGES_FAQS} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Plan Your Holidays?
            </h2>
            <p className="mt-4 text-muted">
              Contact us today to discuss your school holiday activity needs.
            </p>
            <div className="mt-8">
              <Link to="/contact" className="btn-primary">Get Your Quote <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default SchoolHolidayPackages

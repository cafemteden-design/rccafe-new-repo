import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, CheckCircle2, ArrowRight, Calendar, GraduationCap, PartyPopper } from 'lucide-react'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { PAGE_SEO, faqSchema, serviceSchema, breadcrumbSchema } from '../data/seo.js'
import SEO from '../components/SEO.jsx'
import StickyCTA from '../components/StickyCTA.jsx'

const GROUP_PACKAGES_SEO = {
  ...PAGE_SEO,
  title: 'Group Booking Packages Auckland | RCC Remote Control Cafe',
  description: 'Group booking packages for schools, clubs, and social groups in Auckland. RC construction experience with flexible options. Contact us for a quote.',
  keywords: ['group booking packages auckland', 'group activities auckland', 'group bookings auckland']
}

const GROUP_TYPES = [
  {
    icon: GraduationCap,
    title: 'School Groups',
    desc: 'Educational outings that combine fun with skill-building. Perfect for school trips and educational programmes.'
  },
  {
    icon: PartyPopper,
    title: 'Social Groups',
    desc: 'Club outings, community groups, and social gatherings. A unique activity that brings people together.'
  },
  {
    icon: Users,
    title: 'Sports Teams',
    desc: 'Team bonding sessions that build communication and camaraderie. Great for end-of-season celebrations.'
  }
]

const PACKAGES = [
  {
    name: 'Small Group',
    size: '5-10 people',
    duration: '60-90 minutes',
    includes: [
      'RC machine play time for all participants',
      'Staff supervision and support',
      'Use of cafe space',
      'Flexible timing'
    ]
  },
  {
    name: 'Medium Group',
    size: '10-20 people',
    duration: '90-120 minutes',
    includes: [
      'Extended RC machine play time with rotations',
      'Dedicated staff support',
      'Use of cafe space',
      'Structured activities',
      'Flexible timing'
    ]
  },
  {
    name: 'Large Group',
    size: '20+ people',
    duration: 'Custom duration',
    includes: [
      'Multiple arena rotations',
      'Dedicated coordination',
      'Use of cafe space',
      'Custom activities',
      'Flexible timing',
      'Additional staff support'
    ]
  }
]

const GROUP_PACKAGES_FAQS = [
  {
    q: 'How do I get a quote for a group booking?',
    a: 'Contact us through our contact page with your group type, size, and preferred date. We will provide a custom quote based on your specific requirements.'
  },
  {
    q: 'What group types do you host?',
    a: 'We welcome school groups, sports teams, clubs, community groups, and social gatherings. Contact us to discuss your specific group type.'
  },
  {
    q: 'Can you accommodate large groups?',
    a: 'Yes. Larger groups are accommodated with multiple rotations through the arena. Contact us with your group size and we will advise on the best approach.'
  },
  {
    q: 'Is food and catering available?',
    a: 'Yes. The cafe serves hot coffee, cold drinks, smoothies, shakes and toasties. We can arrange catering as part of your group booking.'
  },
  {
    q: 'Do you offer educational content for school groups?',
    a: 'Yes. We can tailor the experience to include educational elements about engineering, physics, and construction concepts for school groups.'
  },
  {
    q: 'How far in advance should we book?',
    a: 'We recommend booking group sessions as early as possible, especially for preferred dates and larger groups. Contact us to check availability.'
  }
]

function GroupBookingPackages() {
  const schema = [
    serviceSchema({ name: 'Group Booking Packages', description: GROUP_PACKAGES_SEO.description, path: '/group-booking-packages' }),
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Group Booking Packages', path: '/group-booking-packages' }]),
    faqSchema(GROUP_PACKAGES_FAQS)
  ]

  return (
    <>
      <SEO seo={GROUP_PACKAGES_SEO} schema={schema} />
      <StickyCTA primaryLabel="Get a Quote" primaryTo="/contact" />
      
      <section className="section-soft py-16 sm:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Users size={14} /> Group Bookings</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">
              Group Booking Packages
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Flexible packages for schools, clubs, sports teams, and social groups. 
              Unique RC construction experience that brings people together.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact" className="btn-primary">Get a Quote <ArrowRight size={16} /></Link>
              <Link to="/group-bookings-auckland" className="btn-outline">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Group Types We Host
            </h2>
            <p className="mt-4 text-muted">
              From school outings to social gatherings, we welcome all types of groups. Custom quotes based on group size.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
              <Clock size={14} />
              <span>Pricing from $20 per person</span>
            </div>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {GROUP_TYPES.map((type, i) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <type.icon size={24} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal-300">{type.title}</h3>
                <p className="mt-2 text-sm text-muted">{type.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Package Options
            </h2>
            <p className="mt-4 text-muted">
              Choose the package that fits your group size.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <h3 className="font-display text-xl font-bold text-charcoal-300">{pkg.name}</h3>
                <div className="mt-2 text-lg font-bold text-orange-600">{pkg.size}</div>
                <div className="mt-4 text-sm text-muted">{pkg.duration}</div>
                <ul className="mt-6 space-y-3">
                  {pkg.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-charcoal-200">
                      <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className="mt-6 block w-full btn-primary text-center">
                  Get Quote
                </Link>
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
              <FAQAccordion items={GROUP_PACKAGES_FAQS} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Book Your Group?
            </h2>
            <p className="mt-4 text-muted">
              Contact us today to discuss your group booking requirements.
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

export default GroupBookingPackages

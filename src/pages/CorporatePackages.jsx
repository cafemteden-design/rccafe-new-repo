import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, CheckCircle2, ArrowRight, Calendar, Users, TrendingUp } from 'lucide-react'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { PAGE_SEO, faqSchema, serviceSchema, breadcrumbSchema } from '../data/seo.js'
import SEO from '../components/SEO.jsx'
import StickyCTA from '../components/StickyCTA.jsx'

const CORPORATE_PACKAGES_SEO = {
  ...PAGE_SEO,
  title: 'Corporate Team Building Packages Auckland | RCC Remote Control Cafe',
  description: 'Unique corporate team building packages in Auckland. RC construction machine challenges that build communication and teamwork. Custom quotes available.',
  keywords: ['corporate packages auckland', 'corporate team building packages auckland', 'team building packages auckland']
}

const PACKAGES = [
  {
    name: 'Team Session',
    price: 'Custom Quote',
    popular: false,
    duration: '60-90 minutes',
    includes: [
      'RC machine challenges for your team',
      'Arena time with staff supervision',
      'Light competition and collaboration activities',
      'Use of cafe space',
      'Flexible timing to suit your schedule'
    ],
    bestFor: 'Small teams, quick team building'
  },
  {
    name: 'Team Day',
    price: 'Custom Quote',
    popular: true,
    duration: '2-3 hours',
    includes: [
      'Extended RC machine challenges',
      'Structured team activities',
      'Arena time with dedicated staff',
      'Use of cafe space for food and drinks',
      'Customized challenges for your team',
      'Debrief and discussion time'
    ],
    bestFor: 'Most corporate team building'
  },
  {
    name: 'Team Event',
    price: 'Custom Quote',
    popular: false,
    duration: 'Half-day or full-day',
    includes: [
      'Comprehensive team building program',
      'Multiple RC machine activities',
      'Dedicated staff coordination',
      'Catering options available',
      'Custom event planning',
      'Post-event analysis and feedback'
    ],
    bestFor: 'Large events, client entertainment'
  }
]

const CORPORATE_PACKAGES_FAQS = [
  {
    q: 'How do I get a quote for a corporate package?',
    a: 'Contact us through our contact page with your preferred date, team size, and package preference. We will provide a custom quote based on your specific requirements.'
  },
  {
    q: 'What is the ROI of team building at RCC?',
    a: 'RCC team building improves communication, breaks down hierarchies, and creates shared experiences that strengthen team relationships. The low-pressure, engaging format delivers better engagement than traditional activities.'
  },
  {
    q: 'Can you accommodate large corporate groups?',
    a: 'Yes. Larger groups can be accommodated with multiple rotations through the arena. Contact us with your group size and we will advise on the best approach.'
  },
  {
    q: 'Is food and catering available?',
    a: 'Yes. The cafe serves hot coffee, cold drinks, smoothies, shakes and toasties. We can arrange catering as part of your corporate booking.'
  },
  {
    q: 'Do you offer client entertainment packages?',
    a: 'Yes. RCC is ideal for client entertainment, offering a memorable, low-pressure activity that builds rapport without the formality of traditional business meetings.'
  },
  {
    q: 'How far in advance should we book?',
    a: 'We recommend booking corporate sessions as early as possible, especially for preferred dates and larger groups. Contact us to check availability.'
  }
]

function CorporatePackages() {
  const schema = [
    serviceSchema({ name: 'Corporate Team Building Packages', description: CORPORATE_PACKAGES_SEO.description, path: '/corporate-packages' }),
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Corporate Packages', path: '/corporate-packages' }]),
    faqSchema(CORPORATE_PACKAGES_FAQS)
  ]

  return (
    <>
      <SEO seo={CORPORATE_PACKAGES_SEO} schema={schema} />
      <StickyCTA primaryLabel="Get a Quote" primaryTo="/contact" />
      
      <section className="section-soft py-16 sm:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Building2 size={14} /> Corporate Team Building</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">
              Corporate Team Building Packages Auckland
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Unique RC construction challenges that build communication, collaboration and team spirit. 
              Custom packages for teams of all sizes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact" className="btn-primary">Get a Quote <ArrowRight size={16} /></Link>
              <Link to="/team-building-auckland" className="btn-outline">Learn More</Link>
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
              Three options to suit different team sizes and objectives. Custom quotes based on your team size.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
              <Clock size={14} />
              <span>Pricing from $30 per person</span>
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
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-charcoal-300">{pkg.name}</h3>
                <div className="mt-2 text-2xl font-bold text-orange-600">{pkg.price}</div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Clock size={16} />
                  <span>{pkg.duration}</span>
                </div>
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
              Why Choose RCC for Team Building
            </h2>
            <p className="mt-4 text-muted">
              Benefits that go beyond just a fun day out.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Users, title: 'Breaks Down Hierarchies', desc: 'Everyone starts on equal footing regardless of seniority' },
              { icon: TrendingUp, title: 'Builds Communication', desc: 'Natural collaboration through shared challenges' },
              { icon: Building2, title: 'Memorable Experience', desc: 'Creates inside jokes and stories that last' },
              { icon: Calendar, title: 'Flexible Scheduling', desc: 'Morning, lunchtime or afternoon sessions available' }
            ].map((benefit, i) => (
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
              <FAQAccordion items={CORPORATE_PACKAGES_FAQS} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Build Your Team?
            </h2>
            <p className="mt-4 text-muted">
              Contact us today to discuss your team building requirements.
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

export default CorporatePackages

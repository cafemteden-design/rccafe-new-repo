import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cake, Gift, CheckCircle2, ArrowRight, Calendar, Users, Clock } from 'lucide-react'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { PAGE_SEO, faqSchema, serviceSchema, breadcrumbSchema } from '../data/seo.js'
import SEO from '../components/SEO.jsx'
import StickyCTA from '../components/StickyCTA.jsx'

const BIRTHDAY_PACKAGES_SEO = {
  ...PAGE_SEO,
  title: 'Birthday Party Packages Auckland | RCC Remote Control Cafe',
  description: 'Choose from our birthday party packages in Auckland. Unique RC construction experience with arena time, cafe food, and flexible options. Book your party today.',
  keywords: ['birthday packages auckland', 'birthday party packages auckland', 'kids birthday packages auckland']
}

const PACKAGES = [
  {
    name: 'Basic Party',
    price: 'Custom Quote',
    popular: false,
    duration: '60 minutes arena time',
    includes: [
      'RC machine play time for all guests',
      'Use of cafe space for food and cake',
      'Staff supervision and support',
      'Free venue hire available'
    ],
    bestFor: 'Small groups, quick celebrations'
  },
  {
    name: 'Standard Party',
    price: 'Custom Quote',
    popular: true,
    duration: '90 minutes arena time',
    includes: [
      'Extended RC machine play time',
      'Use of cafe space for food and cake',
      'Staff supervision and support',
      'Free venue hire available',
      'Party decorations included',
      'Additional staff support'
    ],
    bestFor: 'Most birthday parties'
  },
  {
    name: 'Premium Party',
    price: 'Custom Quote',
    popular: false,
    duration: '2 hours arena time',
    includes: [
      'Extended RC machine play time',
      'Use of cafe space for food and cake',
      'Staff supervision and support',
      'Free venue hire available',
      'Premium decorations',
      'Additional staff support',
      'Food and drink catering options',
      'Gift bag for birthday child'
    ],
    bestFor: 'Large celebrations, special milestones'
  }
]

const ADD_ONS = [
  { name: 'Themed decorations', price: 'Custom quote' },
  { name: 'Extended arena time', price: 'Custom quote' },
  { name: 'Food and drink catering', price: 'Custom quote' },
  { name: 'Gift bags for guests', price: 'Custom quote' },
  { name: 'Photography service', price: 'Custom quote' }
]

const BIRTHDAY_PACKAGES_FAQS = [
  {
    q: 'How do I get a quote for a birthday package?',
    a: 'Contact us through our contact page with your preferred date, guest numbers and package preference. We will provide a custom quote based on your specific requirements.'
  },
  {
    q: 'What is included in the venue hire?',
    a: 'Free venue hire is available for special birthday functions. This includes use of the arena and cafe space for your celebration duration.'
  },
  {
    q: 'Can we bring our own cake and food?',
    a: 'Yes. The cafe space is perfect for your own cake and food, or we can arrange catering as part of your package. Discuss your preferences when you enquire.'
  },
  {
    q: 'How many guests can attend?',
    a: 'Group sizes are arranged with our team. Contact us with your guest numbers and we will advise on the best setup and package for your celebration.'
  },
  {
    q: 'Do you host weekend birthday parties?',
    a: 'Yes. Weekend and school holiday sessions are managed as special bookings. Contact us and we will do our best to accommodate your preferred date.'
  },
  {
    q: 'Is there a minimum age for birthday parties?',
    a: 'RCC works well for children of various ages. Younger children may need more help with the controls, and our staff are happy to assist so everyone enjoys the experience.'
  }
]

function BirthdayPackages() {
  const schema = [
    serviceSchema({ name: 'Birthday Party Packages', description: BIRTHDAY_PACKAGES_SEO.description, path: '/birthday-packages' }),
    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Birthday Packages', path: '/birthday-packages' }]),
    faqSchema(BIRTHDAY_PACKAGES_FAQS)
  ]

  return (
    <>
      <SEO seo={BIRTHDAY_PACKAGES_SEO} schema={schema} />
      <StickyCTA primaryLabel="Get a Quote" primaryTo="/contact" />
      
      {/* Hero Section */}
      <section className="section-soft py-16 sm:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Cake size={14} /> Birthday Parties</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">
              Birthday Party Packages Auckland
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Choose the perfect package for your celebration. Unique RC construction experience, 
              flexible options, and a party your guests will actually remember.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact" className="btn-primary">Get a Quote <ArrowRight size={16} /></Link>
              <Link to="/birthday-party-venue-auckland" className="btn-outline">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Choose Your Package
            </h2>
            <p className="mt-4 text-muted">
              Three options to suit different celebration styles and group sizes. Custom quotes based on your specific needs.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
              <Clock size={14} />
              <span>Pricing from $25 per child</span>
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

      {/* Add-ons */}
      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Add-On Options
            </h2>
            <p className="mt-4 text-muted">
              Customise your party with these additional options.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ONS.map((addon, i) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center justify-between"
              >
                <span className="font-semibold text-charcoal-300">{addon.name}</span>
                <span className="text-sm text-muted">{addon.price}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Process */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Booking Process
            </h2>
            <p className="mt-4 text-muted">
              Simple steps to book your birthday party.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Calendar, title: 'Contact Us', desc: 'Get in touch with your preferred date and guest numbers' },
              { icon: Users, title: 'Custom Quote', desc: 'We provide a tailored quote based on your needs' },
              { icon: Gift, title: 'Confirm & Celebrate', desc: 'Lock in your date and enjoy the party' }
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <step.icon size={24} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal-300">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-8">
              <FAQAccordion items={BIRTHDAY_PACKAGES_FAQS} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Plan Your Party?
            </h2>
            <p className="mt-4 text-muted">
              Contact us today to get a custom quote for your birthday celebration.
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

export default BirthdayPackages

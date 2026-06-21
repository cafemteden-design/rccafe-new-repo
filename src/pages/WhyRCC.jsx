import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShieldCheck, MapPin, Truck, Users, Sparkles, ArrowRight, CheckCircle2, Star, Clock } from 'lucide-react'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { HOME_FAQS } from '../data/faqs.js'
import { PAGE_SEO, faqSchema } from '../data/seo.js'
import { SITE } from '../data/site.js'
import SEO from '../components/SEO.jsx'

const WHY_RCC_SEO = {
  ...PAGE_SEO,
  title: 'Why Choose Remote Control Cafe | Unique Auckland Family Activity',
  description: 'Discover why RCC is Auckland is most unique indoor family activity. Real RC construction machines, screen-free fun, safe environment, and central Mount Eden location.',
  keywords: ['why rcc cafe', 'remote control cafe auckland', 'unique family activities auckland', 'screen-free activities auckland']
}

const OUR_STORY = [
  {
    heading: 'Born from a simple idea',
    body: 'Remote Control Cafe started with a straightforward question: what if there was a genuinely different family activity in Auckland? Something that was hands-on rather than passive, screen-free rather than digital, and memorable rather than forgettable. The answer was RCC — a place where kids and adults alike can take the controls of real remote control construction machines and experience the satisfaction of operating real equipment.'
  },
  {
    heading: 'More than just play',
    body: 'We built RCC because we believe activities should offer more than just entertainment. Operating RC machines quietly builds coordination, spatial awareness, patience and problem-solving skills. Children are having so much fun they do not realise they are learning valuable abilities that transfer to school, sports and everyday life.'
  },
  {
    heading: 'Family-first by design',
    body: 'Every decision at RCC comes back to one principle: families first. From the no-advance-payment booking system that keeps commitments low, to the cafe that lets parents actually relax while kids play, to the Reward Card that encourages repeat visits, everything is designed to make family life easier and more enjoyable.'
  }
]

const WHAT_MAKES_US_DIFFERENT = [
  {
    icon: Truck,
    title: 'Real RC Machines',
    desc: 'An authentic fleet of remote control construction machines — diggers, dump trucks, cranes and loaders — built for hands-on play.'
  },
  {
    icon: ShieldCheck,
    title: 'Safe Environment',
    desc: 'A family-friendly arena designed for safe, supervised play with trained staff on hand to help everyone get started.'
  },
  {
    icon: Heart,
    title: 'Screen-Free',
    desc: 'Active, engaging play that builds real skills without screens. The kind of activity kids actually want to repeat.'
  },
  {
    icon: MapPin,
    title: 'Local Auckland',
    desc: 'Proudly based on Mount Eden Road, serving families across the Auckland region from a central, accessible location.'
  },
  {
    icon: Users,
    title: 'All Ages Welcome',
    desc: 'The machines appeal across generations, making RCC a rare activity where kids, parents and grandparents all enjoy it together.'
  },
  {
    icon: Sparkles,
    title: 'Unique Experience',
    desc: 'Unlike anything else in Auckland — a hands-on construction experience that creates genuine memories and stories to tell.'
  }
]

const OUR_VALUES = [
  {
    title: 'Safety First',
    desc: 'The arena is designed for family play, staff are trained to help, and every visit includes a safety briefing. We take the responsibility of hosting your family seriously.'
  },
  {
    title: 'Inclusive Fun',
    desc: 'RCC works for mixed ages, mixed abilities and mixed groups. Everyone can participate at their own level, and no one feels left out.'
  },
  {
    title: 'Low Pressure',
    desc: 'No advance payment for weekday bookings. Request a slot, confirm on the day, pay when you arrive. Simple, flexible, family-friendly.'
  },
  {
    title: 'Real Value',
    desc: 'Packages combine play time with food and drink. The Reward Card rewards repeat visits. We offer genuine value, not hidden costs.'
  }
]

const REVIEWS = []

const WHY_RCC_FAQS = [
  {
    q: 'What makes RCC different from other Auckland family activities?',
    a: 'RCC offers a hands-on, skill-based experience that is unlike anything else in Auckland. Unlike passive entertainment like cinemas or soft play centres, our visitors actively control real remote control construction machines, building coordination and problem-solving skills while having fun.'
  },
  {
    q: 'Is RCC safe for children?',
    a: 'Yes. The arena is designed for safe, supervised family play. Staff provide a safety briefing, help children get started with the controls, and are on hand throughout the session to ensure everyone has a great, safe time.'
  },
  {
    q: 'Do adults enjoy RCC too?',
    a: 'Absolutely. The RC machines are sophisticated enough to be genuinely challenging and fun for adults. We regularly host corporate team building, adult birthday parties, and family groups where everyone takes part.'
  },
  {
    q: 'Why is RCC screen-free important?',
    a: 'Screen time is a constant concern for modern families. RCC delivers the engagement and excitement kids associate with screens, but in a form that builds physical skills, social confidence and real-world problem-solving abilities. It is screen-free time kids actually want.'
  },
  {
    q: 'How does the Reward Card work?',
    a: 'Create a free digital Reward Card, collect a stamp on every visit, and unlock a surprise gift after seven visits. It is our way of encouraging families to make RCC a regular part of their routine and rewarding loyalty.'
  },
  {
    q: 'Why is there no advance payment for weekday bookings?',
    a: 'We know family plans can change. No advance payment means you can request a slot without commitment, confirm on the day, and pay when you arrive. It keeps booking low-pressure and flexible for busy families.'
  }
]

function WhyRCC() {
  return (
    <>
      <SEO seo={WHY_RCC_SEO} schema={faqSchema(WHY_RCC_FAQS)} />
      
      {/* Hero Section */}
      <section className="section-soft py-16 sm:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Heart size={14} /> Our Story</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">
              Why Choose Remote Control Cafe
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Auckland is most unique indoor family activity. Real remote control construction machines, 
              screen-free fun, and a genuinely different experience that creates memories.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/booking#calendar" className="btn-primary">Book Your First Visit <ArrowRight size={16} /></Link>
              <Link to="/about" className="btn-outline">Learn More About RCC</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Our Story
            </h2>
            <div className="mt-8 space-y-8">
              {OUR_STORY.map((section, i) => (
                <motion.div
                  key={section.heading}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <h3 className="font-display text-xl font-bold text-charcoal-300">{section.heading}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{section.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              What Makes Us Different
            </h2>
            <p className="mt-4 text-muted">
              Six reasons why families across Auckland choose RCC for their outings.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_MAKES_US_DIFFERENT.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal-300">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-muted">
              The principles that guide everything we do at RCC.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {OUR_VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card p-6"
              >
                <h3 className="font-display text-lg font-bold text-charcoal-300">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-muted">
              Customer reviews coming soon. Check our Google Business Profile for the latest feedback.
            </p>
            <div className="mt-8">
              <a href={SITE.googleBusiness} target="_blank" rel="noopener noreferrer" className="btn-outline">
                View Google Reviews <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-8">
              <FAQAccordion items={WHY_RCC_FAQS} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-soft py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Experience RCC?
            </h2>
            <p className="mt-4 text-muted">
              Book your first visit and discover why Auckland families choose RCC for their outings.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/booking#calendar" className="btn-primary">Book Your Visit <ArrowRight size={16} /></Link>
              <Link to="/rewards" className="btn-outline">Join Rewards Program</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="section-light py-16 sm:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl text-center">Visit Us</h2>
            <p className="mt-2 text-center text-muted">159 Mount Eden Road, Mount Eden, Auckland 1024</p>
            <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-soft">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3191.5784!2d174.7616!3d-36.8712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCs1MjEnMTYuMyJOIDE3NMKwNDUnNDEuOCJF!5e0!3m2!1sen!2snz!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Remote Control Cafe Location"
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-muted">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Free street parking available on Mount Eden Road and surrounding streets.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Open daily 9:00 AM - 4:00 PM. Extended hours for weekend bookings.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default WhyRCC

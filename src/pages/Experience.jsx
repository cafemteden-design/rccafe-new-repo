import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Building2, Cake, Coffee, Gamepad2, Heart, Images, Sparkles, Star, Truck, Users } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { SITE } from '../data/site.js'
import { useCmsContent } from '../hooks/useCmsContent.js'

const EXPERIENCE_SECTIONS = [
  {
    key: 'unique',
    icon: Sparkles,
    title: 'What Makes Remote Control Cafe Unique',
    text: 'Cafe culture, hands-on RC construction play, family-friendly service and a venue people remember.'
  },
  {
    key: 'rc_arena',
    icon: Truck,
    title: 'Real Remote-Control Construction Arena',
    text: 'Drive detailed RC machines in a purpose-built indoor arena with real movement, sand, missions and teamwork.'
  },
  {
    key: 'food',
    icon: Coffee,
    title: 'Café, Food & Snacks Experience',
    text: 'Enjoy toasties, hot coffee and cafe favourites while your session feels relaxed, social and easy.'
  },
  {
    key: 'family',
    icon: Users,
    title: 'Family Friendly Experience',
    text: 'A welcoming indoor activity for kids, parents, friends and first-time visitors who want something different.'
  },
  {
    key: 'events',
    icon: Cake,
    title: 'Birthday Parties & Events',
    text: 'Celebrate with a playful RC-themed experience that works for kids, adults and mixed family groups.'
  },
  {
    key: 'corporate',
    icon: Building2,
    title: 'Corporate / Group Experience',
    text: 'A fresh team outing for groups that want an activity, cafe time and a shared memory in one place.'
  }
]

const STORY_BLOCKS = [
  {
    title: 'Build, load and complete missions',
    text: 'The arena is designed for active play. Guests can control construction machines, move material, explore the track and take turns with friends or family.',
    image: '/images/rc-excavator-arena.jpg',
    icon: Gamepad2
  },
  {
    title: 'Relax with food and coffee',
    text: 'Packages pair play time with cafe favourites, making the visit feel polished, easy and social from arrival to checkout.',
    image: '/images/family-cafe-activity.jpg',
    icon: Coffee
  }
]

const LOVE_POINTS = [
  'A unique indoor activity in Auckland',
  'Great for all ages and mixed groups',
  'Food, drinks and play in one visit',
  'Memorable birthdays and group sessions'
]

const GALLERY = [
  '/images/hero-arena.jpg',
  '/images/indoor-arena.jpg',
  '/images/rc-excavator-arena.jpg',
  '/images/family-cafe-activity.jpg'
]

export default function Experience() {
  const cms = useCmsContent('experience')
  return (
    <>
      <SEO
        title="Experience Remote Control Cafe | Auckland RC Cafe"
        description="Explore the Remote Control Cafe experience: RC construction machines, cafe food and coffee, family visits, birthdays, group bookings and events in Auckland."
        path="/experience"
      />
      <PageHero
        breadcrumbs={['Experience']}
        eyebrow="Remote Control Cafe"
        title={cms.field('hero', 'title', 'Experience Remote Control Cafe')}
        subtitle={cms.field('hero', 'subtitle', "Remote Control Café is New Zealand's most unique café experience, combining great coffee, tasty food, and exciting remote-control fun for all ages.")}
        image={cms.field('hero', 'imageUrl', '/images/indoor-arena.jpg')}
        imageAlt="Remote Control Cafe indoor arena"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCE_SECTIONS.map(({ key, icon: Icon, title, text }, index) => (
              <Reveal key={key} delay={index * 0.04}>
                <article className="card card-hover h-full p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-extrabold text-charcoal-300">{cms.field(key, 'title', title)}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{cms.field(key, 'body', text)}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft py-12 sm:py-16">
        <div className="container-x space-y-6">
          {STORY_BLOCKS.map((block, index) => (
            <Reveal key={block.title}>
              <article className={`grid overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-card lg:grid-cols-2 ${index % 2 ? 'lg:[&>div:first-child]:order-2' : ''}`}>
                <div className="min-h-[260px]">
                  <img src={block.image} alt={block.title} className="h-full min-h-[260px] w-full object-cover" loading="lazy" />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                    <block.icon size={22} />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300">{block.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{block.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow"><Images size={14} />Gallery Preview</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">{cms.field('gallery', 'title', 'See the RCC experience')}</h2>
            </div>
            <Link to="/gallery" className="btn-outline w-fit">View Gallery <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.map((src, index) => (
              <Reveal key={src} delay={index * 0.04}>
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
                  <img src={src} alt="Remote Control Cafe experience" className="h-56 w-full object-cover" loading="lazy" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <Reveal className="rounded-3xl border border-orange-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <span className="eyebrow"><Heart size={14} />Why Visitors Love It</span>
                <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">A cafe visit that becomes a memory.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                {LOVE_POINTS.map((point) => (
                  <div key={point} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft px-4 py-3 text-sm font-bold text-charcoal-300">
                    <Star size={16} className="text-orange-500" /> {point}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <Reveal className="rounded-3xl border border-orange-200 bg-white p-6 shadow-soft sm:p-8 lg:flex lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Plan your visit</div>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-charcoal-300">{cms.field('cta', 'title', 'Ready to experience Remote Control Cafe?')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {cms.field('cta', 'body', 'Book an everyday weekday package online, or send an enquiry for birthdays, private functions, venue hire and group bookings.')}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Link to="/booking#calendar" className="btn-primary">Book Your Session <ArrowRight size={16} /></Link>
              <a href={`mailto:${SITE.email}`} className="btn-outline">Send Enquiry</a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

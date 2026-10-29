import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Calendar, Clock3, Coffee, Facebook, Gift, Instagram, Mail, PartyPopper, Sparkles, Truck, Users } from 'lucide-react'
import SEO from '../components/SEO.jsx'
import AnnouncementStrip from '../components/AnnouncementStrip.jsx'
import { SITE } from '../data/site.js'
import { PAGE_SEO } from '../data/seo.js'
import { trackBookNowClick } from '../hooks/useAnalytics.js'
import { useCmsContent } from '../hooks/useCmsContent.js'
import { usePublicSiteSettings } from '../hooks/usePublicSiteSettings.js'
import { BUSINESS_HOURS_ROWS } from '../data/businessHours.js'

const HERO_SUBTITLE = "Remote Control Café is New Zealand's most unique café experience, combining great coffee, tasty food, and exciting remote-control fun for all ages."
const HERO_BADGES = ['Real RC Machines', 'Café & Snacks', 'Family Friendly', 'Birthday Friendly']

const HIGHLIGHTS = [
  { icon: Truck, title: 'RC Construction Arena', text: 'Drive detailed remote-control construction machines in a purpose-built indoor arena.' },
  { icon: Coffee, title: 'Cafe Food & Snacks', text: 'Pair your play session with toasties, hot coffee and cafe favourites.' },
  { icon: Users, title: 'All Ages Welcome', text: 'A fun, easy experience for families, kids, friends and first-time visitors.' }
]

const EVENTS = [
  'Birthday Parties',
  'Venue Hire',
  'Corporate Events',
  'School Holiday Groups',
  'Private Functions',
  'Large Group Bookings'
]

export default function Home() {
  const cms = useCmsContent('home')
  const { settings: siteSettings } = usePublicSiteSettings()
  return (
    <>
      <SEO {...PAGE_SEO['/']} path="/" />
      <AnnouncementStrip />
      <HeroSection cms={cms} siteSettings={siteSettings} />
<SummerComingSoonPoster />
<OpeningHoursStrip settings={siteSettings} />
      <IntroSection cms={cms} />
      <ExperienceHighlights />
      <PackagesSection />
      <RewardsSection cms={cms} />
      <MomentsSection />
      <EventsSection cms={cms} />
      <HomeEnquiryForm cms={cms} />
    </>
  )
}

function SummerComingSoonPoster() {
  return (
    <section className="bg-white py-5 sm:py-7">
      <div className="container-x">
        <div className="mx-auto max-w-5xl rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
                ☀️ SUMMER AT REMOTE CONTROL CAFÉ
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300">
                Something Exciting Is Coming!
              </h2>
              <p className="mt-2 text-sm text-charcoal-300">
                New Summer Menu + Exciting RC Updates
              </p>
            </div>
            <span className="w-fit rounded-full bg-orange-500 px-4 py-2 text-xs font-extrabold text-white">
              COMING SOON
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function OpeningHoursStrip({ settings }) {
  return <section className="border-b border-orange-100 bg-[#fffaf3] py-6 sm:py-8"><div className="container-x"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-white"><Clock3 size={20} /></span><div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">Official Opening Hours</div><h2 className="mt-1 font-display text-xl font-extrabold text-charcoal-300">Open every day</h2></div></div><div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-4xl lg:grid-cols-7">{BUSINESS_HOURS_ROWS.map(([key, label]) => <div key={key} className="rounded-xl border border-orange-100 bg-white px-3 py-2 text-center shadow-sm"><div className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{label.slice(0, 3)}</div><div className="mt-1 text-[11px] font-bold leading-tight text-charcoal-300">{settings.openingHours[key]}</div></div>)}</div></div></div></section>
}

function HeroSection({ cms, siteSettings }) {
  const videoRef = useRef(null)
  const heroTitle = cms.field('hero', 'title', 'Drive. Dig. Build. Play.')
  const heroSubtitle = cms.field('hero', 'subtitle', HERO_SUBTITLE)
  const heroVideo = cms.field('hero', 'videoUrl', '/videos/hero-rc-gameplay.mp4')
  const heroPoster = cms.field('hero', 'imageUrl', '/images/hero-arena.jpg')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !('IntersectionObserver' in window)) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    }, { threshold: 0.12 })

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative min-h-[680px] overflow-hidden border-b border-charcoal-300 bg-charcoal-300 text-white sm:min-h-[calc(100svh-96px)]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] sm:object-center"
        src={heroVideo}
        poster={heroPoster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/62 to-black/28 sm:from-black/80 sm:via-black/58 sm:to-black/22" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 sm:from-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,108,24,0.28),transparent_34%),radial-gradient(circle_at_75%_70%,rgba(255,255,255,0.12),transparent_28%)]" />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1 }}
        className="absolute bottom-8 right-6 hidden rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-widest text-white/85 backdrop-blur lg:block"
      >
        Auckland indoor RC arena
      </motion.div>

      <div className="container-x relative z-10 flex min-h-[680px] items-center py-10 sm:min-h-[calc(100svh-96px)] sm:py-16 lg:py-20">
        <div className="max-w-4xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-orange-100 backdrop-blur"
          >
            <Sparkles size={14} /> Remote Control Cafe
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="mt-4 max-w-[760px] font-display text-[42px] font-extrabold leading-[0.98] text-white min-[400px]:text-5xl sm:mt-5 sm:text-6xl lg:text-7xl"
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/90 sm:mt-5 sm:text-lg"
          >
            {heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:flex sm:flex-row"
          >
            <Link to="/booking#calendar" className="btn-primary min-h-12 px-5 sm:min-h-[54px] sm:px-6" onClick={() => trackBookNowClick({ location: 'home_hero' })}>
              Book Your Session <ArrowRight size={16} />
            </Link>
            <Link to="/rewards" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-black/20 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white hover:text-charcoal-300 sm:min-h-[54px] sm:px-6">
              Create Reward Card
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.32 }}
            className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-2.5"
          >
            {HERO_BADGES.map((badge) => (
              <span key={badge} className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur sm:px-3 sm:py-1.5 sm:text-xs">
                {badge}
              </span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.34 }} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            <Clock3 size={15} className="text-orange-300" />{siteSettings.openingHighlight}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-5 flex items-center gap-2.5">
            <span className="mr-1 text-[10px] font-extrabold uppercase tracking-widest text-white/65">Follow RCC</span>
            {siteSettings.socials.instagram && <SocialLink href={siteSettings.socials.instagram} label="Instagram"><Instagram size={16} /></SocialLink>}
            {siteSettings.socials.facebook && <SocialLink href={siteSettings.socials.facebook} label="Facebook"><Facebook size={16} /></SocialLink>}
            {siteSettings.socials.tiktok && <SocialLink href={siteSettings.socials.tiktok} label="TikTok"><TikTokIcon className="h-4 w-4" /></SocialLink>}
          </motion.div>
        </div>
      </div>
    </section>
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

function IntroSection({ cms }) {
  const title = cms.field('intro', 'title', 'A cafe visit with something exciting to do.')
  const body = cms.field('intro', 'body', 'Remote Control Cafe is made for people who want more than a standard cafe stop. Enjoy a relaxed cafe setting, choose a food and play package, and experience remote-control construction machines in a clean indoor space.')
  return (
    <section className="section-light relative overflow-hidden py-12 sm:py-16">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-orange-100/70 blur-3xl" />
      <Reveal className="container-x grid gap-6 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <span className="eyebrow"><BadgeCheck size={14} />Why Remote Control Cafe</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="lg:col-span-7">
          <p className="text-base leading-relaxed text-muted">
            {body}
          </p>
        </div>
      </Reveal>
    </section>
  )
}

function ExperienceHighlights() {
  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><Truck size={14} />Experience Highlights</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">What guests enjoy at RCC</h2>
          </div>
          <Link to="/experience" className="btn-outline w-fit">View Experience <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.06}>
              <article className="card card-hover h-full p-5">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold text-charcoal-300">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PackagesSection() {
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x">
        <Reveal className="overflow-hidden rounded-3xl border border-orange-200 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow"><Calendar size={14} />Book Online</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">Ready to Book Your Remote Control Session?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Choose your date, time slot, remotes and gameplay duration in a simple booking flow.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link to="/booking#calendar" className="btn-primary" onClick={() => trackBookNowClick({ location: 'home_booking_cta' })}>Book Your Session <ArrowRight size={16} /></Link>
              <Link to="/contact" className="btn-outline">Group / Venue Enquiry</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function RewardsSection({ cms }) {
  const title = cms.field('rewards', 'title', 'My Rewards')
  const body = cms.field('rewards', 'body', 'Create your digital RCC card, collect stamps and unlock surprise rewards.')
  return (
    <section className="section-soft py-10 sm:py-12">
      <div className="container-x">
        <Reveal className="rounded-3xl border border-orange-200 bg-white p-5 shadow-card sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="eyebrow"><Gift size={14} />Reward Card</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">{title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{body}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Reward Card', 'Collect Stamps', 'Unlock Surprises'].map((item, index) => <div key={item} className="flex items-center gap-2 text-sm font-bold text-charcoal-300"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 text-xs text-orange-700">{index + 1}</span>{item}</div>)}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/rewards#create-card" className="btn-primary min-h-12">Create Card <ArrowRight size={16} /></Link>
              <Link to="/rewards#card-login" className="btn-outline min-h-12">Open My Card</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function SocialLink({ href, label, children }) {
  return <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:border-white/60 hover:bg-white hover:text-charcoal-300">{children}</a>
}

function TikTokIcon(props) {
  return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7Z" /></svg>
}

const MOMENT_IMAGES = [
  { src: '/images/hero-arena.jpg', alt: 'Remote Control Cafe indoor arena' },
  { src: '/images/rc-excavator-arena.jpg', alt: 'RC excavator in the arena' },
  { src: '/images/family-cafe-activity.jpg', alt: 'Family cafe activity at RCC' },
  { src: '/images/indoor-arena.jpg', alt: 'Indoor construction play arena' },
  { src: '/images/birthday-party.jpg', alt: 'Birthday celebration at RCC' },
  { src: '/images/kids-rc-construction.jpg', alt: 'Kids enjoying RC construction play' },
  { src: '/images/rc-crane.jpg', alt: 'Remote control crane' },
  { src: '/images/rc-fire-truck.jpg', alt: 'Remote control fire truck' }
]

function MomentsSection() {
  const firstRow = [...MOMENT_IMAGES, ...MOMENT_IMAGES]
  const secondRow = [...MOMENT_IMAGES.slice().reverse(), ...MOMENT_IMAGES.slice().reverse()]

  return (
    <section className="section-light overflow-hidden py-10 sm:py-14">
      <div className="container-x">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><Sparkles size={14} />Inside RCC</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Moments at Remote Control Cafe</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">RC action, cafe favourites and memorable visits, all under one roof.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/gallery" className="btn-outline">View Gallery</Link>
            <Link to="/menu" className="btn-primary">View Menu <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
      </div>
      <div className="mt-7 space-y-4">
        <MomentTrack items={firstRow} />
        <div className="hidden sm:block">
          <MomentTrack items={secondRow} reverse />
        </div>
      </div>
    </section>
  )
}

function MomentTrack({ items, reverse = false }) {
  return (
    <div className="moment-marquee overflow-hidden">
      <div className={`moment-track flex w-max gap-4 px-2 ${reverse ? 'moment-track-reverse' : ''}`}>
        {items.map((item, index) => (
          <figure key={`${item.src}-${index}`} className="relative h-36 w-56 shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-soft sm:h-40 sm:w-64">
            <img src={item.src} alt={index < MOMENT_IMAGES.length ? item.alt : ''} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" decoding="async" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500" />
          </figure>
        ))}
      </div>
    </div>
  )
}

function EventsSection({ cms }) {
  const title = cms.field('venue_hire', 'title', 'Special bookings are handled by enquiry.')
  const body = cms.field('venue_hire', 'body', 'For weekend sessions, venue hire, school holidays, public holidays and private events, send a message and our team will respond within 24 hours.')
  const footnote = cms.field('venue_hire', 'footnote', 'Venue hire starts from $300. Please send an enquiry for details and availability.')
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x">
        <Reveal className="rounded-3xl border border-orange-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <span className="eyebrow"><PartyPopper size={14} />Venue Hire / Events</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {body}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {EVENTS.map((event) => (
                <div key={event} className="rounded-2xl border border-border bg-bg-soft px-4 py-3 text-sm font-bold text-charcoal-300">
                  {event}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-charcoal-300">{footnote}</p>
            <Link to="/contact" className="btn-primary w-fit">Send Enquiry <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function HomeEnquiryForm({ cms }) {
  const title = cms.field('enquiry', 'title', 'Need help planning a visit?')
  const intro = cms.field('enquiry', 'body', 'For special bookings, events, venue hire or weekend/school holiday enquiries, send us a message. Our team will respond within 24 hours.')
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', type: 'General Enquiry', message: '' })

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const subject = encodeURIComponent(`Remote Control Cafe enquiry - ${form.type}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nEnquiry Type: ${form.type}\n\n${form.message}`)
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x grid gap-7 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <span className="eyebrow"><Mail size={14} />Send Enquiry</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {intro}
          </p>
        </Reveal>
        <Reveal className="lg:col-span-7" delay={0.06}>
          <form onSubmit={submit} className="card border-orange-100 p-5 shadow-card sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={form.name} onChange={update('name')} required />
              <Field label="Email" type="email" value={form.email} onChange={update('email')} required />
              <div className="sm:col-span-2">
                <label className="field-label">Enquiry Type</label>
                <select value={form.type} onChange={update('type')} className="field-input">
                  <option>General Enquiry</option>
                  <option>Party Booking</option>
                  <option>Venue Hire</option>
                  <option>Corporate / Event Booking</option>
                  <option>School Holiday / Public Holiday Booking</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Message</label>
                <textarea value={form.message} onChange={update('message')} required rows={5} className="field-input resize-y" placeholder="Tell us what you are planning..." />
              </div>
            </div>
            {sent && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">Your email app has opened with the enquiry details.</div>}
            <button type="submit" className="btn-primary mt-5 w-full sm:w-auto">Send Enquiry <ArrowRight size={16} /></button>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-orange-500">*</span>}</label>
      <input type={type} value={value} onChange={onChange} required={required} className="field-input" />
    </div>
  )
}

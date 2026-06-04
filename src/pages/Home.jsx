import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Coffee, Cake, GraduationCap, Users, Gift, Truck,
  ChevronDown, Heart, Sparkles, ShieldCheck, Phone, Building2
} from 'lucide-react'
import SectionHeading from '../components/SectionHeading.jsx'
import MachineCard from '../components/MachineCard.jsx'
import VideoRail from '../components/VideoRail.jsx'
import { MACHINES } from '../data/machines.js'
import { PRICING, SITE } from '../data/site.js'
import { GALLERY } from '../data/gallery.js'

const CHIPS = [
  { icon: Heart, label: 'Family Friendly' },
  { icon: Truck, label: 'RC Construction Arena' },
  { icon: Coffee, label: 'Cafe Experience' },
  { icon: Cake, label: 'Birthday Friendly' },
  { icon: Sparkles, label: 'Easy Online Booking' }
]

const GROUPS = [
  { icon: Cake, title: 'Birthday Parties', desc: 'Unforgettable RC-themed birthdays for kids and adults.' },
  { icon: Building2, title: 'Corporate Bookings', desc: 'Team outings, corporate events and special functions.' },
  { icon: GraduationCap, title: 'School Visits', desc: 'Hands-on learning with real construction machinery.' },
  { icon: Users, title: 'Family Fun', desc: 'A perfect indoor outing for the whole family.' },
  { icon: Gift, title: 'Group Bookings', desc: 'Food + RC play packages for families, friends and teams.' },
  { icon: Truck, title: 'Special Functions', desc: 'Free venue hire available for special functions and events.' }
]

const FAQS = [
  { q: 'Do I need to book in advance?', a: 'Yes. Weekday online slots can be booked through the website. Weekend sessions should be booked directly at the cafe or by contacting us.' },
  { q: 'How long is each session?', a: 'Our RC + Food Garage packages include 30, 45 or 60 minutes of play. Upgraded Play options are available for 15 or 30 minutes.' },
  { q: 'Which package is most popular?', a: 'POWER is the most popular package with 45 minutes of play, any toastie and any hot coffee.' },
  { q: 'Are group bookings available?', a: 'Yes. Corporate events, birthday parties, school visits and group bookings are available with free venue hire options.' },
  { q: 'What happens if a toy is damaged?', a: 'Please return all RC toys to staff after your session. Any damage caused by misuse may be charged at repair or replacement cost.' }
]

export default function Home() {
  return (
    <>
      <Hero />
      <HighlightsBar />
      <div id="videos">
        <VideoRail />
      </div>
      <AboutExperience />
      <MachinesSection />
      <PricingSection />
      <CorporateSection />
      <GalleryPreview />
      <GroupsSection />
      <FAQSection />
      <FinalCTA />
    </>
  )
}

function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-[76vh] md:min-h-[78vh] md:max-h-[820px] flex items-center overflow-hidden bg-charcoal-300">
      <video className="absolute inset-0 w-full h-full object-cover object-center md:object-center-[55%]" autoPlay muted loop playsInline preload="metadata">
        <source src="/videos/hero-rc-gameplay.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.48) 42%, rgba(0,0,0,0.18) 100%), linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.55) 100%)' }} />
      <div className="relative z-20 px-4 sm:px-6 md:px-8 py-[96px] md:py-0">
        <div className="max-w-[720px] md:ml-[8vw] text-white">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/50 bg-black/40 backdrop-blur-md text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Auckland - Family Friendly - Open Daily
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display mt-4 sm:mt-5 text-[clamp(42px,13vw,64px)] leading-[0.95] font-extrabold tracking-tight text-white" style={{ textShadow: '0 8px 30px rgba(0,0,0,0.55)' }}>
            Drive. Dig. <span className="text-orange-500">Build.</span> Play.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 sm:mt-5 text-base sm:text-[18px] leading-relaxed max-w-[620px] text-white/92">
            New Zealand's first family-friendly RC construction arena where kids, families and groups operate real RC construction machines.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link to="/booking#calendar" className="inline-flex h-[52px] items-center justify-center rounded-full bg-orange-500 px-6 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-shadow hover:shadow-orange-500/50">Book Your Session</Link>
            <button onClick={() => scrollToSection('videos')} className="h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/35 text-white font-semibold text-base px-6 hover:bg-black/50 transition-colors">Watch The Experience</button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
            {[
              { icon: Truck, label: 'Real RC Machines' },
              { icon: Coffee, label: 'Cafe & Snacks' },
              { icon: Cake, label: 'Birthday Friendly' },
              { icon: Users, label: 'Family Friendly' }
            ].map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/18 text-sm text-white">
                <item.icon size={14} className="text-orange-400" />
                <span className="text-xs sm:text-sm">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function HighlightsBar() {
  return (
    <section className="bg-bg-soft border-y border-border">
      <div className="container-x py-6 flex flex-wrap items-center justify-center gap-2.5">
        {CHIPS.map((c, i) => (
          <motion.span key={c.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="chip">
            <c.icon size={14} className="text-orange-500" />
            {c.label}
          </motion.span>
        ))}
      </div>
    </section>
  )
}

function AboutExperience() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />The Experience</span>
          <h2 className="heading-display mt-4">A Real Construction <span className="accent">Play Experience</span></h2>
          <p className="mt-5 text-muted leading-relaxed">
            RC Cafe brings the excitement of construction machines into a safe, fun and interactive arena. Guests can control RC machines while enjoying a cafe environment designed for families, kids and groups.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { icon: ShieldCheck, t: 'Safe & supervised', d: 'Trained staff guide every session.' },
              { icon: Truck, t: 'Real RC machines', d: 'Excavators, trucks, cranes, loaders & more.' },
              { icon: Coffee, t: 'Cafe on-site', d: 'Coffee, smoothies, shakes and fresh snacks.' }
            ].map((b) => (
              <li key={b.t} className="flex gap-3">
                <div className="flex-shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-orange-100 text-orange-600"><b.icon size={18} /></div>
                <div><div className="font-bold text-charcoal-300">{b.t}</div><div className="text-sm text-muted">{b.d}</div></div>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex gap-3">
            <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
            <Link to="/about" className="btn-outline">About RC Cafe</Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft"><img src="/images/kids-rc-construction.jpg" alt="Kid operating an RC excavator" className="w-full h-72 object-cover" /></div>
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft mt-8"><img src="/images/family-cafe-activity.jpg" alt="Family cafe activity" className="w-full h-72 object-cover" /></div>
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft col-span-2"><img src="/images/indoor-arena.jpg" alt="Indoor RC construction arena" className="w-full h-48 object-cover" /></div>
        </motion.div>
      </div>
    </section>
  )
}

function MachinesSection() {
  return (
    <section className="section-soft py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading eyebrow="The Fleet" title={<>Machines You Can <span className="accent">Control</span></>} subtitle="Five different RC construction machine types ready for hands-on arena play." />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MACHINES.map((m, i) => <MachineCard m={m} key={m.id} index={i} />)}
        </div>
        <div className="mt-10 text-center"><Link to="/machines" className="btn-outline">View All Machines <ArrowRight size={16} /></Link></div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading eyebrow="RC + Food Garage" title={<>Package <span className="accent">Pricing</span></>} subtitle="Choose a play package with any toastie and any hot coffee." />
        <div className="mt-10 sm:mt-12 grid md:grid-cols-3 gap-5">
          {PRICING.map((p, i) => {
            const featured = p.id === 'power'
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={`relative rounded-2xl border p-7 transition ${featured ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white shadow-soft hover:shadow-card'}`}>
                {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Most Popular</div>}
                <div className="text-xs uppercase tracking-widest font-bold text-orange-600">{p.label}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-5xl font-extrabold text-charcoal-300">${p.price}</span>
                  <span className="mb-1.5 text-sm text-muted">{p.unit}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-charcoal-100">
                  {p.perks.map((x) => <li key={x} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" /> {x}</li>)}
                </ul>
                <Link to={`/booking?package=${encodeURIComponent(p.label)}#calendar`} className={`mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-bold transition ${featured ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-charcoal-300 text-white hover:bg-charcoal-100'}`}>
                  Book Package <ArrowRight size={14} className="ml-2" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CorporateSection() {
  return (
    <section className="section-soft py-14 sm:py-20">
      <div className="container-x grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow"><Building2 size={14} />Corporate Bookings</span>
          <h2 className="heading-display mt-4">Events, Parties & <span className="accent">Free Venue Hire</span></h2>
          <p className="mt-4 text-muted leading-relaxed">
            Plan corporate events, birthday parties, school visits, group bookings and special functions with RC play and food packages.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/booking#events" className="btn-primary">Plan an Event <ArrowRight size={16} /></Link>
            <a href={`tel:${SITE.phoneTel}`} className="btn-outline"><Phone size={16} /> {SITE.phone}</a>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border bg-white shadow-soft">
          <img src="/images/birthday-party.jpg" alt="RC Cafe event booking" className="h-80 w-full object-cover" />
        </div>
      </div>
    </section>
  )
}

function GalleryPreview() {
  const items = GALLERY.slice(0, 6)
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading align="left" eyebrow="Inside The Arena" title={<>A Glimpse Into <span className="accent">RC Cafe</span></>} subtitle="Real moments from our arena, machines and cafe." />
          <Link to="/gallery" className="btn-outline self-start md:self-auto">View Gallery <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 [grid-auto-rows:160px] sm:[grid-auto-rows:200px]">
          {items.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-soft group ${i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'row-span-2' : ''}`}>
              <img src={g.src} alt={g.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal-300/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition"><div className="text-white text-[10px] uppercase tracking-widest font-bold">{g.category}</div></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GroupsSection() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading eyebrow="Groups & Parties" title={<>Perfect for Groups, Kids & <span className="accent">Celebrations</span></>} subtitle="From birthdays to school visits, we host exciting RC arena experiences in Auckland." />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {GROUPS.map((g, i) => (
            <motion.div key={g.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} className="card card-hover p-6">
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600"><g.icon size={20} /></div>
              <div className="font-display text-xl font-extrabold mt-4 text-charcoal-300">{g.title}</div>
              <p className="mt-1.5 text-sm text-muted">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section-soft py-14 sm:py-20">
      <div className="container-x grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <SectionHeading align="left" eyebrow="FAQ" title={<>Got <span className="accent">Questions?</span></>} subtitle="Everything you need to know before you book and play at RC Cafe Auckland." />
          <Link to="/contact" className="btn-outline mt-6">Ask Us Anything</Link>
        </div>
        <div className="lg:col-span-7 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`rounded-2xl border transition ${isOpen ? 'border-orange-300 bg-orange-50' : 'border-border bg-white'}`}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-bold text-charcoal-300">{f.q}</span>
                  <ChevronDown size={18} className={`flex-shrink-0 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm text-muted">{f.a}</div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section id="booking" className="relative section-light py-14 sm:py-20 overflow-hidden">
      <div className="container-x">
        <div className="relative rounded-3xl border border-border bg-bg-soft p-10 lg:p-14 overflow-hidden">
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Ready When You Are</span>
              <h2 className="heading-display mt-4">Ready to Build Your Own Mini <span className="accent">Construction Site?</span></h2>
              <p className="mt-4 text-muted max-w-lg">Book your RC Cafe package and enjoy Auckland's unique family-friendly construction arena and cafe.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
                <a href={`tel:${SITE.phoneTel}`} className="btn-outline"><Phone size={16} /> {SITE.phone}</a>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border bg-white shadow-soft">
              <img src="/images/rc-excavator-arena.jpg" alt="RC excavator arena" className="w-full h-72 object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

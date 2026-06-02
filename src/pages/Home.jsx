import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Coffee, Cake, GraduationCap, Users, Gift, Truck,
  ChevronDown, Heart, Sparkles, ShieldCheck, Star, Phone
} from 'lucide-react'
import SectionHeading from '../components/SectionHeading.jsx'
import MachineCard from '../components/MachineCard.jsx'
import VideoRail from '../components/VideoRail.jsx'
import ArenaMoments from '../components/ArenaMoments.jsx'
import { MACHINES } from '../data/machines.js'
import { PRICING, SITE } from '../data/site.js'
import { GALLERY } from '../data/gallery.js'

const CHIPS = [
  { icon: Heart, label: 'Family Friendly' },
  { icon: Truck, label: 'RC Construction Arena' },
  { icon: Coffee, label: 'Café Experience' },
  { icon: Cake, label: 'Birthday Friendly' },
  { icon: Sparkles, label: 'Easy Online Booking' }
]

const GROUPS = [
  { icon: Cake, title: 'Birthday Parties', desc: 'Unforgettable RC-themed birthdays for kids and adults.' },
  { icon: GraduationCap, title: 'School Visits', desc: 'Hands-on learning with real construction machinery.' },
  { icon: Users, title: 'Family Fun', desc: 'A perfect indoor outing for the whole whānau.' },
  { icon: Gift, title: 'Group Bookings', desc: 'From 16+ guests with 3 × 30-min play sessions.' },
  { icon: Truck, title: 'Bring Your Own RC', desc: 'Hobbyists welcome — full arena access $10/hr.' }
]

const FAQS = [
  { q: 'Do I need to book in advance?', a: 'Yes, advance booking is highly recommended — slots fill up quickly, especially on weekends and school holidays. Walk-ins are welcome subject to availability.' },
  { q: 'How long is each session?', a: 'We offer 15-minute and 30-minute play sessions. You can also bring your own RC machine and pay $10 per hour for arena access.' },
  { q: 'Can I bring my own RC toy?', a: 'Absolutely. Our Bring Your Own option is $10/hour and gives you full access to the construction sand arena.' },
  { q: 'Are group bookings available?', a: 'Yes. Group bookings are available for groups of 16 or more, with a minimum of 3 × 30-minute play sessions. Perfect for birthdays, school visits and team outings.' },
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
      <GalleryPreview />
      <ArenaMoments />
      <GroupsSection />
      <FAQSection />
      <FinalCTA />
    </>
  )
}

/* ---------------------------------- Hero --------------------------------- */
function Hero() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-[72vh] md:min-h-[78vh] flex items-center overflow-hidden bg-charcoal-300">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/videos/hero-rc-gameplay.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/38 to-black/12" />

      {/* Content */}
      <div className="relative z-10 container-x px-4 sm:px-6 md:px-8 py-[96px] md:py-0">
        <div className="max-w-[760px] text-white">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-orange-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Auckland • Family Friendly • Open Daily
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 sm:mt-5 text-[clamp(42px,13vw,64px)] leading-[0.95] font-extrabold tracking-tight"
          >
            Drive. Dig. Build. Play.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed max-w-[95%] text-gray-200"
          >
            New Zealand's first family-friendly RC construction arena where kids, families and groups operate real RC construction machines.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            <button
              onClick={() => scrollToSection('booking')}
              className="btn-primary w-full justify-center"
            >
              Book Your Session
            </button>
            <button
              onClick={() => scrollToSection('videos')}
              className="btn-outline w-full justify-center bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Watch The Experience
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3"
          >
            {[
              { icon: Truck, label: 'Real RC Machines' },
              { icon: Coffee, label: 'Cafe & Snacks' },
              { icon: Cake, label: 'Birthday Friendly' },
              { icon: Users, label: 'Family Friendly' }
            ].map((item, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white">
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

/* ----------------------------- Highlights bar ---------------------------- */
function HighlightsBar() {
  return (
    <section className="bg-bg-soft border-y border-border">
      <div className="container-x py-6 flex flex-wrap items-center justify-center gap-2.5">
        {CHIPS.map((c, i) => (
          <motion.span
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="chip"
          >
            <c.icon size={14} className="text-orange-500" />
            {c.label}
          </motion.span>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------- About experience --------------------------- */
function AboutExperience() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />The Experience</span>
          <h2 className="heading-display mt-4">A Real Construction <span className="accent">Play Experience</span></h2>
          <p className="mt-5 text-muted leading-relaxed">
            RC Cafe brings the excitement of construction machines into a safe, fun and interactive
            arena. Guests can control RC excavators, trucks and machines while enjoying a café-style
            environment designed for families, kids and groups.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              { icon: ShieldCheck, t: 'Safe & supervised', d: 'Trained staff guide every session.' },
              { icon: Truck, t: 'Real RC machines', d: 'Excavators, trucks, cranes, loaders & more.' },
              { icon: Coffee, t: 'Café on-site', d: 'Coffee, bubble tea, smoothies & snacks.' }
            ].map((b) => (
              <li key={b.t} className="flex gap-3">
                <div className="flex-shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-orange-100 text-orange-600">
                  <b.icon size={18} />
                </div>
                <div>
                  <div className="font-bold text-charcoal-300">{b.t}</div>
                  <div className="text-sm text-muted">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex gap-3">
            <Link to="/booking" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
            <Link to="/about" className="btn-outline">About RC Cafe</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft">
            <img src="/images/kids-rc-construction.jpg" alt="Kid operating an RC excavator" className="w-full h-72 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft mt-8">
            <img src="/images/family-cafe-activity.jpg" alt="Family café activity" className="w-full h-72 object-cover" />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-soft col-span-2">
            <img src="/images/indoor-arena.jpg" alt="Indoor RC construction arena" className="w-full h-48 object-cover" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ----------------------------- Machines section -------------------------- */
function MachinesSection() {
  return (
    <section className="section-soft py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="The Fleet"
          title={<>Machines You Can <span className="accent">Control</span></>}
          subtitle="Choose from five different types of RC construction machines, each with its own real-world feel and mission."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MACHINES.map((m, i) => <MachineCard m={m} key={m.id} index={i} />)}
        </div>
        <div className="mt-10 text-center">
          <Link to="/machines" className="btn-outline">View All Machines <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Pricing --------------------------------- */
function PricingSection() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Booking & Pricing"
          title={<>Simple, Family-Friendly <span className="accent">Pricing</span></>}
          subtitle="Quick rides, full sessions or bring your own RC — pick what suits you best."
        />
        <div className="mt-10 sm:mt-12 grid md:grid-cols-3 gap-5">
          {PRICING.map((p, i) => {
            const featured = p.id === '30min'
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`relative rounded-2xl border p-7 transition ${
                  featured ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white shadow-soft hover:shadow-card'
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
                )}
                <div className="text-xs uppercase tracking-widest font-bold text-orange-600">{p.label}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-5xl font-extrabold text-charcoal-300">${p.price}</span>
                  <span className="mb-1.5 text-sm text-muted">{p.unit}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-charcoal-100">
                  {p.perks.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" /> {x}
                    </li>
                  ))}
                </ul>
                <Link to="/booking" className={`mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-bold transition ${featured ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-charcoal-300 text-white hover:bg-charcoal-100'}`}>
                  Book Now <ArrowRight size={14} className="ml-2" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center gap-2 text-orange-700 font-bold uppercase tracking-widest text-xs"><Users size={14} /> Group Booking</div>
            <p className="mt-2 text-charcoal-300 font-semibold">Available for groups from 16 people. Minimum 3 × 30-minute play sessions.</p>
            <Link to="/contact" className="mt-3 inline-flex text-sm font-bold text-orange-700 hover:text-orange-800">Enquire for groups <ArrowRight size={14} className="ml-1" /></Link>
          </div>
          <div className="rounded-2xl border border-border bg-bg-soft p-5">
            <div className="flex items-center gap-2 text-charcoal-300 font-bold uppercase tracking-widest text-xs"><ShieldCheck size={14} className="text-orange-600" /> Friendly Reminder</div>
            <p className="mt-2 text-muted text-sm">Return RC toys to staff after your session ends. Any damage due to misuse may be charged.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- Gallery preview --------------------------- */
function GalleryPreview() {
  const items = GALLERY.slice(0, 6)
  return (
    <section className="section-soft py-14 sm:py-20">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Inside The Arena"
            title={<>A Glimpse Into <span className="accent">RC Cafe</span></>}
            subtitle="Real moments from our arena, machines and café."
          />
          <Link to="/gallery" className="btn-outline self-start md:self-auto">View Gallery <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 [grid-auto-rows:160px] sm:[grid-auto-rows:200px]">
          {items.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-border bg-white shadow-soft group ${
                i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'row-span-2' : ''
              }`}
            >
              <img src={g.src} alt={g.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal-300/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
                <div className="text-white text-[10px] uppercase tracking-widest font-bold">{g.category}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Groups --------------------------------- */
function GroupsSection() {
  return (
    <section className="section-light py-14 sm:py-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Groups & Parties"
          title={<>Perfect for Groups, Kids & <span className="accent">Celebrations</span></>}
          subtitle="From birthdays to school visits, we host the most exciting RC arena experiences in Auckland."
        />
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {GROUPS.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="card card-hover p-6"
            >
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition">
                <g.icon size={20} />
              </div>
              <div className="font-display text-xl font-extrabold mt-4 text-charcoal-300">{g.title}</div>
              <p className="mt-1.5 text-sm text-muted">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------- FAQ --------------------------------- */
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
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold text-charcoal-300">{f.q}</span>
                  <ChevronDown size={18} className={`flex-shrink-0 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
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

/* ------------------------------- Final CTA ------------------------------ */
function FinalCTA() {
  return (
    <section id="booking" className="relative section-light py-14 sm:py-20 overflow-hidden">
      <div className="container-x">
        <div className="relative rounded-3xl border border-border bg-bg-soft p-10 lg:p-14 overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-orange-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-orange-100 blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Ready When You Are</span>
              <h2 className="heading-display mt-4">Ready to Build Your Own Mini <span className="accent">Construction Site?</span></h2>
              <p className="mt-4 text-muted max-w-lg">Book your RC Cafe session and enjoy Auckland’s most unique family-friendly construction arena and café.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/booking" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
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

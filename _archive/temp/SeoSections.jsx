import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Heart, Users, Sparkles, MapPin, CalendarCheck, HandHeart,
  Cake, Building2, GraduationCap, CloudRain, Coffee, Gift, ArrowRight,
  CheckCircle2, Truck, Star, BookOpen, Play, Clock, PartyPopper, Building,
  Sun, Grid3x3, Quote
} from 'lucide-react'
import { AREAS_SERVED } from '../data/seo.js'

function Eyebrow({ icon: Icon, children }) {
  return (
    <span className="eyebrow"><Icon size={14} /> {children}</span>
  )
}

/* ----------------------- Why RCC is unique (intro) ----------------------- */
export function WhyUnique() {
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow icon={Sparkles}>Auckland's Most Unique Indoor Activity</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-charcoal-300 sm:text-4xl">
            Why RCC is Auckland's most unique indoor activity
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Remote Control Cafe is unlike anything else in Auckland. Instead of watching a screen or
            standing in a queue, you take the controls of real remote control construction machines —
            diggers, dump trucks, cranes and loaders — and put them to work in a purpose-built indoor arena.
            It is hands-on, screen-free fun for kids, families and groups, paired with a relaxed cafe.
            Whether it is a rainy day, a birthday, the school holidays or a team outing, RCC turns an
            ordinary day into a genuinely memorable one.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/booking#calendar" className="btn-primary">Book Your Session <ArrowRight size={16} /></Link>
            <Link to="/about" className="btn-outline">Learn About RCC</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- E-E-A-T: Why Choose RCC ------------------------ */
const TRUST = [
  { icon: ShieldCheck, title: 'Safe Environment', desc: 'A family-friendly arena designed for safe, supervised play with staff on hand.' },
  { icon: HandHeart, title: 'Staff Assistance', desc: 'Friendly trained staff help you get started and make every visit easy.' },
  { icon: CalendarCheck, title: 'No Advance Payment', desc: 'Request a weekday slot online and pay on the day — simple and low-commitment.' },
  { icon: Heart, title: 'Family First', desc: 'Built for kids, parents and groups to enjoy a shared experience together.' },
  { icon: MapPin, title: 'Local Auckland Business', desc: 'Proudly based on Mount Eden Road, serving families across the Auckland region.' },
  { icon: Truck, title: 'Real RC Machines', desc: 'An authentic fleet of remote control construction machines built for play.' }
]

export function WhyChooseRCC() {
  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={ShieldCheck}>Why Choose RCC</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            A safe, friendly, family-first experience
          </h2>
          <p className="mt-3 text-muted">
            Everything at Remote Control Cafe is designed around a great, stress-free visit.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card p-6"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                <t.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-extrabold text-charcoal-300">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------- Why families & kids love RCC (two columns) -------------- */
const FAMILY_POINTS = [
  'A shared activity everyone enjoys together — not separate entertainment for different ages',
  'Weatherproof indoor fun, perfect for Auckland rainy days',
  'A relaxed cafe so parents can enjoy a coffee while the kids play',
  'Easy weekday online booking with no advance payment'
]
const KIDS_POINTS = [
  'They drive real RC diggers, dump trucks, cranes and loaders',
  'Active, screen-free play that builds focus and coordination',
  'Fun mini challenges and friendly competition in the arena',
  'A surprise gift to work towards with the RCC Reward Card'
]

export function WhyLove() {
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x grid gap-6 lg:grid-cols-2">
        <LoveCard
          icon={Heart}
          eyebrow="Why Families Love RCC"
          title="A family day out that actually brings everyone together"
          points={FAMILY_POINTS}
          ctaTo="/family-activities-auckland"
          ctaLabel="Family Activities in Auckland"
        />
        <LoveCard
          icon={Star}
          eyebrow="Why Kids Love RCC"
          title="Kids are in control from start to finish"
          points={KIDS_POINTS}
          ctaTo="/kids-activities-auckland"
          ctaLabel="Kids Activities in Auckland"
        />
      </div>
    </section>
  )
}

function LoveCard({ icon: Icon, eyebrow, title, points, ctaTo, ctaLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card p-7"
    >
      <Eyebrow icon={Icon}>{eyebrow}</Eyebrow>
      <h3 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300">{title}</h3>
      <ul className="mt-5 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-charcoal-200">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-orange-500" />
            <span className="leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>
      <Link to={ctaTo} className="mt-6 inline-flex items-center gap-1.5 font-bold text-orange-600">
        {ctaLabel} <ArrowRight size={15} />
      </Link>
    </motion.div>
  )
}

/* -------------------- Experiences (occasion cards) ---------------------- */
const EXPERIENCES = [
  { icon: Cake, title: 'Birthday Party Experience', desc: 'A unique birthday venue where guests drive RC machines and celebrate in the cafe.', to: '/birthday-party-venue-auckland', cta: 'Birthday Parties' },
  { icon: GraduationCap, title: 'School Holiday Activities', desc: 'Keep kids active and engaged these school holidays with hands-on indoor fun.', to: '/school-holiday-activities-auckland', cta: 'School Holidays' },
  { icon: Building2, title: 'Corporate Team Building', desc: 'A light-hearted RC machine challenge that gets teams talking and laughing.', to: '/team-building-auckland', cta: 'Team Building' },
  { icon: CloudRain, title: 'Rainy Day Indoor Fun', desc: 'Fully indoors and weatherproof — the reliable Auckland wet-weather plan.', to: '/indoor-activities-auckland', cta: 'Indoor Activities' },
  { icon: Users, title: 'Group Bookings', desc: 'Corporate days, school groups, birthdays and private functions all welcome.', to: '/group-bookings-auckland', cta: 'Group Bookings' },
  { icon: Coffee, title: 'Family Entertainment', desc: 'A shared, hands-on outing for the whole family, with cafe food and drinks.', to: '/family-activities-auckland', cta: 'Family Activities' }
]

export function Experiences() {
  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Sparkles}>Experiences For Every Occasion</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            One venue, every kind of celebration
          </h2>
          <p className="mt-3 text-muted">From birthdays and school holidays to team days and rainy afternoons.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="card card-hover group p-6"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                <e.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-extrabold text-charcoal-300">{e.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.desc}</p>
              <Link to={e.to} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600">
                {e.cta} <ArrowRight size={15} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Areas We Serve ------------------------------- */
export function AreasServed() {
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={MapPin}>Areas We Serve</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            Welcoming families and groups from across Auckland
          </h2>
          <p className="mt-3 text-muted">
            Based on Mount Eden Road, RCC is an easy trip from right across the Auckland region.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS_SERVED.map((a, i) => (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.04 }}
              className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft"
            >
              <MapPin size={18} className="mt-0.5 flex-shrink-0 text-orange-500" />
              <div>
                <div className="font-extrabold text-charcoal-300">{a.name}</div>
                <div className="mt-0.5 text-sm leading-relaxed text-muted">{a.note}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------- Auckland Local Activity Guide -------------------- */
const GUIDE_LINKS = [
  { to: '/kids-activities-auckland', label: 'Kids Activities Auckland' },
  { to: '/indoor-activities-auckland', label: 'Indoor Activities Auckland' },
  { to: '/things-to-do-with-kids-auckland', label: 'Things To Do With Kids Auckland' },
  { to: '/family-activities-auckland', label: 'Family Activities Auckland' },
  { to: '/birthday-party-venue-auckland', label: 'Birthday Party Venue Auckland' },
  { to: '/school-holiday-activities-auckland', label: 'School Holiday Activities Auckland' },
  { to: '/team-building-auckland', label: 'Team Building Auckland' },
  { to: '/blog', label: 'Auckland Activity Guides & Blog' }
]

export function LocalGuide() {
  return (
    <section className="section-soft py-12 sm:py-16">
      <div className="container-x grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Eyebrow icon={BookOpen}>Auckland Local Activity Guide</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
            Planning something to do in Auckland?
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Whether you are looking for kids activities, an indoor option for a rainy day, a unique birthday
            venue, school holiday fun or a corporate team day, RCC has you covered. Explore our guides to find
            the perfect Auckland outing — then book your session in just a few taps.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
            <Link to="/contact" className="btn-outline">Group & Party Enquiries</Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDE_LINKS.map((g) => (
              <Link
                key={g.to}
                to={g.to}
                className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 font-semibold text-charcoal-100 shadow-soft transition hover:border-orange-300 hover:text-orange-600"
              >
                {g.label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Rewards CTA strip ------------------------------ */
export function RewardsStrip() {
  return (
    <section className="section-light py-12 sm:py-16">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-50 p-7 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <Eyebrow icon={Gift}>RCC Reward Card</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300">
                Come back, collect stamps, unlock a gift
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Create your free digital Reward Card, collect a stamp on every visit, and unlock a surprise
                gift after seven visits. It is the perfect reason to make RCC your family's regular outing.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/rewards" className="btn-primary">Create Reward Card <ArrowRight size={16} /></Link>
                <Link to="/booking#calendar" className="btn-outline">Book a Visit</Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="grid h-28 w-28 place-items-center rounded-full bg-orange-500/10 text-orange-600">
                <Gift size={56} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- First Visit Guide ------------------------------ */
export function FirstVisitGuide() {
  return (
    <section className="section-soft py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Play}>First Visit?</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            What to expect on your first visit
          </h2>
          <p className="mt-3 text-sm text-muted">
            Arrive, get a quick introduction to the RC machines, and start playing. Staff are on hand to help everyone get started safely.
          </p>
          <Link to="/why-rcc-cafe" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            Learn More About RCC <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Birthday Party Guide --------------------------- */
export function BirthdayPartyGuide() {
  return (
    <section className="section-light py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Cake}>Birthday Parties</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            A birthday party guests will remember
          </h2>
          <p className="mt-3 text-sm text-muted">
            Unique RC construction experience with arena time, cafe space for food and cake, and flexible party packages.
          </p>
          <Link to="/birthday-packages-auckland" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            View Birthday Packages <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- School Holiday Guide -------------------------- */
export function SchoolHolidayGuide() {
  return (
    <section className="section-soft py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={GraduationCap}>School Holidays</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            Keep kids busy these school holidays
          </h2>
          <p className="mt-3 text-sm text-muted">
            Hands-on indoor activity with multi-visit packages and holiday programme options.
          </p>
          <Link to="/school-holiday-packages" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            View Holiday Packages <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Corporate Team Building Guide ----------------- */
export function CorporateTeamBuildingGuide() {
  return (
    <section className="section-light py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Building2}>Team Building</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            Team building that actually works
          </h2>
          <p className="mt-3 text-sm text-muted">
            Light-hearted RC machine challenges that break down hierarchies and get teams talking.
          </p>
          <Link to="/corporate-packages-auckland" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            View Corporate Packages <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Rainy Day Activity Guide ---------------------- */
export function RainyDayActivityGuide() {
  return (
    <section className="section-soft py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={CloudRain}>Rainy Day?</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            Weatherproof indoor fun
          </h2>
          <p className="mt-3 text-sm text-muted">
            Fully indoors and weatherproof — your plans never get cancelled due to rain.
          </p>
          <Link to="/indoor-activities-auckland" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            Book Indoor Session <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Auckland Family Entertainment Guide ------------- */
export function AucklandFamilyEntertainmentGuide() {
  return (
    <section className="section-light py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Users}>Family Entertainment</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            A family outing everyone enjoys
          </h2>
          <p className="mt-3 text-sm text-muted">
            Hands-on activity that works for all ages, with cafe food and drinks for parents.
          </p>
          <Link to="/family-activities-auckland" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            Book Family Visit <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Activity Categories Hub ----------------------- */
const CATEGORIES = [
  { icon: Star, title: 'Kids Activities', to: '/kids-activities-auckland' },
  { icon: CloudRain, title: 'Indoor Activities', to: '/indoor-activities-auckland' },
  { icon: Cake, title: 'Birthday Parties', to: '/birthday-party-venue-auckland' },
  { icon: Building2, title: 'Team Building', to: '/team-building-auckland' },
  { icon: GraduationCap, title: 'School Holidays', to: '/school-holiday-activities-auckland' },
  { icon: Users, title: 'Family Activities', to: '/family-activities-auckland' }
]

export function ActivityCategoriesHub() {
  return (
    <section className="section-soft py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Grid3x3}>Explore Activities</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            Find the perfect activity
          </h2>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={cat.to}
                className="flex items-center gap-3 rounded-2xl border border-border bg-white px-5 py-4 font-semibold text-charcoal-100 shadow-soft transition hover:border-orange-300 hover:text-orange-600"
              >
                <cat.icon size={18} className="text-orange-500" />
                {cat.title}
                <ArrowRight size={15} className="ml-auto" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------- Customer Reviews Section ----------------------- */
export function CustomerReviewsSection() {
  return (
    <section className="section-light py-10 sm:py-12">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={Quote}>Customer Reviews</Eyebrow>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">
            What Auckland families say
          </h2>
          <p className="mt-3 text-sm text-muted">
            Real experiences from families, birthday parties, and corporate teams.
          </p>
          <Link to="/why-rcc-cafe" className="mt-4 inline-flex items-center gap-1.5 font-bold text-orange-600 text-sm">
            Read All Reviews <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, Truck, Users, ArrowRight, ArrowLeft, CheckCircle2, Mail, Phone, User, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { MACHINE_OPTIONS_FOR_BOOKING } from '../data/machines.js'
import { SLOTS_15, SLOTS_30, SLOTS_BYO } from '../data/slots.js'
import { PRICING } from '../data/site.js'

const STEPS = ['Date', 'Duration', 'Machine', 'Time', 'Details', 'Summary']

function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function isSameDay(a, b) { return a && b && a.toDateString() === b.toDateString() }
function fmtDate(d) {
  if (!d) return ''
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Booking() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState({
    date: null, duration: null, machine: null, timeSlot: null,
    name: '', phone: '', email: '', quantity: 1, notes: ''
  })

  const update = (patch) => setData((s) => ({ ...s, ...patch }))

  const slots = useMemo(() => {
    if (data.duration === '15min') return SLOTS_15
    if (data.duration === '30min') return SLOTS_30
    if (data.duration === 'byo') return SLOTS_BYO
    return []
  }, [data.duration])

  const total = useMemo(() => {
    const q = Number(data.quantity) || 1
    if (data.duration === '15min') return q * 10
    if (data.duration === '30min') return q * 18
    if (data.duration === 'byo') return q * 10
    return 0
  }, [data.quantity, data.duration])

  const canNext = () => {
    switch (step) {
      case 0: return !!data.date
      case 1: return !!data.duration
      case 2: return !!data.machine
      case 3: return !!data.timeSlot
      case 4: return data.name.trim() && data.phone.trim() && data.email.trim() && Number(data.quantity) > 0
      default: return true
    }
  }

  const submit = () => setSubmitted(true)
  const reset = () => { setSubmitted(false); setStep(0); setData({ date: null, duration: null, machine: null, timeSlot: null, name: '', phone: '', email: '', quantity: 1, notes: '' }) }

  return (
    <>
      <PageHero
        breadcrumbs={['Booking']}
        eyebrow="Reserve Your Slot"
        title={<>Book Your <span className="accent">Session</span></>}
        subtitle="Pick a date, choose duration, machine and time — then enter your details. All bookings follow Auckland, New Zealand local time."
        image="/images/indoor-arena.svg"
      />

      <section className="section-light py-12 lg:py-16">
        <div className="container-x">
          {submitted ? (
            <SuccessCard data={data} total={total} onReset={reset} />
          ) : (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Stepper step={step} setStep={setStep} />
                <div className="mt-6 card p-6 sm:p-8 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>
                      {step === 0 && <StepDate date={data.date} onSelect={(d) => update({ date: d })} />}
                      {step === 1 && <StepDuration duration={data.duration} onSelect={(d) => update({ duration: d, timeSlot: null })} />}
                      {step === 2 && <StepMachine machine={data.machine} onSelect={(m) => update({ machine: m })} />}
                      {step === 3 && <StepTime slots={slots} value={data.timeSlot} onSelect={(t) => update({ timeSlot: t })} duration={data.duration} />}
                      {step === 4 && <StepDetails data={data} update={update} />}
                      {step === 5 && <StepSummary data={data} total={total} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button
                      onClick={() => canNext() && setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                      disabled={!canNext()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={submit} className="btn-primary">Submit Booking <CheckCircle2 size={16} /></button>
                  )}
                </div>
              </div>

              <aside className="lg:col-span-4">
                <SummarySidebar data={data} total={total} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

/* ------------------------------- Stepper -------------------------------- */
function Stepper({ step, setStep }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const active = i === step
        const done = i < step
        return (
          <button
            key={s}
            onClick={() => i <= step && setStep(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition whitespace-nowrap ${
              active
                ? 'bg-orange-500 text-white border-orange-500 shadow-glow'
                : done
                ? 'border-orange-300 bg-orange-50 text-orange-700'
                : 'border-border bg-white text-muted'
            }`}
          >
            <span className={`grid place-items-center w-5 h-5 rounded-full text-[10px] ${active ? 'bg-white text-orange-600' : done ? 'bg-orange-500 text-white' : 'bg-bg-soft text-charcoal-100'}`}>{i + 1}</span>
            {s}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ Step 0: Date ----------------------------- */
function StepDate({ date, onSelect }) {
  const [view, setView] = useState(startOfMonth(date || new Date()))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const monthName = view.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
  const firstDay = startOfMonth(view).getDay()
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d))

  return (
    <div>
      <Heading title="Select a Date" sub="Pick your preferred play day. We’re open every day in Auckland." />
      <div className="mt-6 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView(addMonths(view, -1))} className="grid place-items-center w-9 h-9 rounded-md border border-border bg-white hover:border-orange-500 hover:text-orange-600"><ChevronLeft size={16} /></button>
          <div className="font-display text-xl font-extrabold text-charcoal-300">{monthName}</div>
          <button onClick={() => setView(addMonths(view, 1))} className="grid place-items-center w-9 h-9 rounded-md border border-border bg-white hover:border-orange-500 hover:text-orange-600"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-widest text-muted mb-2 font-bold">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />
            const past = c < today
            const selected = isSameDay(c, date)
            return (
              <button
                key={i}
                disabled={past}
                onClick={() => onSelect(c)}
                className={`aspect-square rounded-md text-sm font-semibold transition border ${
                  selected ? 'bg-orange-500 border-orange-500 text-white shadow-glow' : past ? 'border-transparent text-muted/40 cursor-not-allowed' : 'border-border bg-white text-charcoal-300 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {c.getDate()}
              </button>
            )
          })}
        </div>
        {date && (
          <div className="mt-4 rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-charcoal-300">
            Selected: <span className="font-bold text-orange-700">{fmtDate(date)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- Step 1: Duration --------------------------- */
function StepDuration({ duration, onSelect }) {
  return (
    <div>
      <Heading title="Choose Session Duration" sub="Pick the play length that suits you." />
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {PRICING.map((p) => {
          const active = duration === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`text-left rounded-2xl border p-5 transition ${active ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white hover:border-orange-300'}`}
            >
              <div className="text-[11px] uppercase tracking-widest font-bold text-orange-600">{p.label}</div>
              <div className="font-display text-3xl font-extrabold mt-2 text-charcoal-300">${p.price}<span className="text-sm text-muted ml-1 font-normal">{p.unit}</span></div>
              <ul className="mt-3 space-y-1.5 text-xs text-charcoal-100">
                {p.perks.map((x) => <li key={x} className="flex gap-2"><span className="mt-1.5 h-1 w-1 rounded-full bg-orange-500" /> {x}</li>)}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------- Step 2: Machine ---------------------------- */
function StepMachine({ machine, onSelect }) {
  return (
    <div>
      <Heading title="Choose Your Machine" sub="Pick your construction machine — or bring your own." />
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MACHINE_OPTIONS_FOR_BOOKING.map((m) => {
          const active = machine === m.id
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`text-left rounded-2xl border p-5 transition ${active ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white hover:border-orange-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-orange-100 text-orange-600"><Truck size={20} /></div>
                <div>
                  <div className="font-display text-lg font-extrabold text-charcoal-300">{m.name}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted">
                    {m.id === 'byo' ? 'BYO machine' : `Capacity ${m.capacity}/slot`}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ----------------------------- Step 3: Time ------------------------------ */
function StepTime({ slots, value, onSelect, duration }) {
  return (
    <div>
      <Heading title="Pick a Time Slot" sub={duration === '15min' ? '15-minute slots between 8:30 AM and 2:15 PM (5 min reset between slots).' : duration === '30min' ? 'Standard 30-minute play sessions.' : 'Hourly slots for Bring Your Own RC.'} />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {slots.map((s) => {
          const active = value === s
          return (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className={`rounded-md border px-3 py-3 text-sm font-semibold transition ${active ? 'border-orange-500 bg-orange-500 text-white shadow-glow' : 'border-border bg-white text-charcoal-300 hover:border-orange-500 hover:text-orange-600'}`}
            >
              {s}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted">All times shown in Auckland, New Zealand local time.</p>
    </div>
  )
}

/* ---------------------------- Step 4: Details ---------------------------- */
function StepDetails({ data, update }) {
  return (
    <div>
      <Heading title="Your Details" sub="We’ll use these to confirm your booking." />
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" icon={User} value={data.name} onChange={(v) => update({ name: v })} required />
        <Field label="Phone Number" icon={Phone} value={data.phone} onChange={(v) => update({ phone: v })} required />
        <Field label="Email Address" icon={Mail} value={data.email} onChange={(v) => update({ email: v })} type="email" required className="sm:col-span-2" />
        <Field label="Number of Players / Quantity" icon={Users} value={data.quantity} onChange={(v) => update({ quantity: v.replace(/\D/g, '') || '' })} type="number" required />
        <Field label="Notes (optional)" icon={MessageSquare} value={data.notes} onChange={(v) => update({ notes: v })} className="sm:col-span-2" />
      </div>
    </div>
  )
}

/* ---------------------------- Step 5: Summary ---------------------------- */
function StepSummary({ data, total }) {
  return (
    <div>
      <Heading title="Booking Summary" sub="Review your details before submitting." />
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <SummaryRow icon={Calendar} label="Date" value={fmtDate(data.date)} />
        <SummaryRow icon={Clock} label="Duration" value={durationLabel(data.duration)} />
        <SummaryRow icon={Truck} label="Machine" value={machineLabel(data.machine)} />
        <SummaryRow icon={Clock} label="Time Slot" value={data.timeSlot} />
        <SummaryRow icon={User} label="Name" value={data.name} />
        <SummaryRow icon={Phone} label="Phone" value={data.phone} />
        <SummaryRow icon={Mail} label="Email" value={data.email} />
        <SummaryRow icon={Users} label="Quantity" value={data.quantity} />
        {data.notes && <SummaryRow icon={MessageSquare} label="Notes" value={data.notes} className="sm:col-span-2" />}
      </div>
      <div className="mt-6 rounded-2xl border border-orange-300 bg-orange-50 p-5 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-orange-700 font-bold">Estimated Total</div>
          <div className="text-xs text-muted mt-1">{calcBreakdown(data)}</div>
        </div>
        <div className="font-display text-3xl font-extrabold text-orange-600">${total}</div>
      </div>
      <p className="mt-3 text-[11px] text-muted">Submitting will send a booking request. Our team will confirm availability and contact you shortly.</p>
    </div>
  )
}

function calcBreakdown(d) {
  const q = Number(d.quantity) || 1
  if (d.duration === '15min') return `${q} × $10 (15 min)`
  if (d.duration === '30min') return `${q} × $18 (30 min)`
  if (d.duration === 'byo') return `${q} × $10/hr (BYO)`
  return ''
}

/* ------------------------- Sidebar / Success ----------------------------- */
function SummarySidebar({ data, total }) {
  return (
    <div className="sticky top-28 card p-6">
      <div className="text-[11px] uppercase tracking-widest text-orange-600 font-bold">Live Summary</div>
      <div className="mt-4 space-y-3 text-sm">
        <SidebarLine label="Date" value={data.date ? fmtDate(data.date) : '—'} />
        <SidebarLine label="Duration" value={durationLabel(data.duration) || '—'} />
        <SidebarLine label="Machine" value={machineLabel(data.machine) || '—'} />
        <SidebarLine label="Time" value={data.timeSlot || '—'} />
        <SidebarLine label="Players" value={data.quantity || '—'} />
      </div>
      <div className="mt-5 rounded-xl bg-bg-soft border border-border p-4 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted font-bold">Total</div>
        <div className="font-display text-2xl font-extrabold text-orange-600">${total}</div>
      </div>
      <Link to="/menu" className="btn-outline mt-4 w-full">Browse Café Menu</Link>
    </div>
  )
}

function SidebarLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted text-xs uppercase tracking-widest font-bold">{label}</span>
      <span className="text-charcoal-300 font-semibold text-right truncate max-w-[60%]">{value}</span>
    </div>
  )
}

function SuccessCard({ data, total, onReset }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center card p-10">
      <CheckCircle2 size={64} className="text-orange-500 mx-auto" />
      <h2 className="font-display text-3xl font-extrabold mt-4 text-charcoal-300">Booking Submitted!</h2>
      <p className="mt-3 text-muted">Thank you{data.name ? `, ${data.name}` : ''}! Your booking request has been submitted. Our team will contact you shortly to confirm.</p>
      <div className="mt-6 rounded-xl border border-border bg-bg-soft p-5 text-left text-sm space-y-2">
        <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-semibold text-charcoal-300">{fmtDate(data.date)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Duration</span><span className="font-semibold text-charcoal-300">{durationLabel(data.duration)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Machine</span><span className="font-semibold text-charcoal-300">{machineLabel(data.machine)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Time</span><span className="font-semibold text-charcoal-300">{data.timeSlot}</span></div>
        <div className="flex justify-between text-orange-600"><span>Total</span><span className="font-display text-lg font-extrabold">${total}</span></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReset} className="btn-outline">Make Another Booking</button>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </motion.div>
  )
}

/* ----------------------------- Small bits -------------------------------- */
function Heading({ title, sub }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-charcoal-300">{title}</h2>
      {sub && <p className="mt-1.5 text-sm text-muted max-w-xl">{sub}</p>}
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, type = 'text', required, className = '' }) {
  return (
    <div className={className}>
      <label className="field-label flex items-center gap-1.5">
        {Icon && <Icon size={12} />}{label}{required && <span className="text-orange-500">*</span>}
      </label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="field-input" />
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-white p-3 ${className}`}>
      <div className="grid place-items-center w-9 h-9 rounded-md bg-orange-100 text-orange-600 flex-shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted font-bold">{label}</div>
        <div className="text-sm font-semibold text-charcoal-300 break-words">{value || '—'}</div>
      </div>
    </div>
  )
}

function durationLabel(id) {
  if (id === '15min') return '15 Minutes — $10'
  if (id === '30min') return '30 Minutes — $18'
  if (id === 'byo') return 'Bring Your Own — $10/hr'
  return ''
}
function machineLabel(id) {
  const m = MACHINE_OPTIONS_FOR_BOOKING.find((x) => x.id === id)
  return m ? m.name : ''
}

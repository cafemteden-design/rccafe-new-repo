import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, Users, ArrowRight, ArrowLeft, CheckCircle2, Mail, Phone, User, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import {
  generateSlotsForDate,
  getAvailableDates,
  formatDateDisplay,
  getSlotTime,
  saveBooking,
  validateBookingData,
  BOOKING_CONFIG
} from '../data/bookingConfig.js'

const STEPS = ['Date', 'Time', 'Details', 'Confirm']

function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function isSameDay(a, b) { return a && b && a.toDateString() === b.toDateString() }

export default function Booking() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [data, setData] = useState({
    date: null,
    slotIndex: null,
    name: '',
    phone: '',
    email: '',
    groupSize: 1
  })

  const [availableDates] = useState(getAvailableDates())
  const [slots, setSlots] = useState([])
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()))

  // Generate slots when date changes
  useEffect(() => {
    if (data.date) {
      setSlots(generateSlotsForDate(data.date))
    } else {
      setSlots([])
    }
  }, [data.date])

  const update = (patch) => setData((s) => ({ ...s, ...patch }))

  const canNext = () => {
    switch (step) {
      case 0: return !!data.date
      case 1: return data.slotIndex !== null && slots[data.slotIndex]?.available > 0
      case 2: return data.name.trim() && data.phone.trim() && data.email.trim() && data.groupSize > 0
      default: return true
    }
  }

  const submit = () => {
    const validation = validateBookingData(data)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    const bookingData = {
      ...data,
      slotTime: getSlotTime(data.slotIndex)
    }

    const success = saveBooking(bookingData)
    if (success) {
      setBookingId(bookingData.id)
      setSubmitted(true)
    } else {
      setErrors({ submit: 'This slot is now fully booked. Please select another time.' })
    }
  }

  const reset = () => {
    setSubmitted(false)
    setBookingId(null)
    setStep(0)
    setErrors({})
    setData({ date: null, slotIndex: null, name: '', phone: '', email: '', groupSize: 1 })
  }

  return (
    <>
      <PageHero
        breadcrumbs={['Booking']}
        eyebrow="Reserve Your Slot"
        title={<>Book Your <span className="accent">45-Minute Session</span></>}
        subtitle="Select a date (Mon-Fri), pick a time slot (9AM-4PM), and enter your details. Each slot accommodates up to 5 bookings."
        image="/images/indoor-arena.jpg"
      />

      <section className="section-light py-12 lg:py-16">
        <div className="container-x">
          {submitted ? (
            <SuccessCard data={data} bookingId={bookingId} onReset={reset} />
          ) : (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Stepper step={step} setStep={setStep} />
                <div className="mt-6 card p-6 sm:p-8 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>
                      {step === 0 && <StepDate date={data.date} availableDates={availableDates} viewMonth={viewMonth} setViewMonth={setViewMonth} onSelect={(d) => update({ date: d, slotIndex: null })} />}
                      {step === 1 && <StepTime slots={slots} slotIndex={data.slotIndex} onSelect={(i) => update({ slotIndex: i })} />}
                      {step === 2 && <StepDetails data={data} update={update} errors={errors} />}
                      {step === 3 && <StepConfirm data={data} slots={slots} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {errors.submit && (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <X size={16} /> {errors.submit}
                  </div>
                )}

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
                    <button onClick={submit} className="btn-primary">Confirm Booking <CheckCircle2 size={16} /></button>
                  )}
                </div>
              </div>

              <aside className="lg:col-span-4">
                <SummarySidebar data={data} slots={slots} />
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
function StepDate({ date, availableDates, viewMonth, setViewMonth, onSelect }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const monthName = viewMonth.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
  const firstDay = startOfMonth(viewMonth).getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))

  return (
    <div>
      <Heading title="Select a Date" sub="We're open Monday to Friday. Select your preferred day." />
      <div className="mt-6 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(addMonths(viewMonth, -1))} className="grid place-items-center w-9 h-9 rounded-md border border-border bg-white hover:border-orange-500 hover:text-orange-600"><ChevronLeft size={16} /></button>
          <div className="font-display text-xl font-extrabold text-charcoal-300">{monthName}</div>
          <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="grid place-items-center w-9 h-9 rounded-md border border-border bg-white hover:border-orange-500 hover:text-orange-600"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-widest text-muted mb-2 font-bold">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />
            const past = c < today
            const isAvailable = availableDates.some(d => isSameDay(d, c))
            const selected = isSameDay(c, date)
            return (
              <button
                key={i}
                disabled={past || !isAvailable}
                onClick={() => onSelect(c)}
                className={`aspect-square rounded-md text-sm font-semibold transition border ${
                  selected ? 'bg-orange-500 border-orange-500 text-white shadow-glow' : past || !isAvailable ? 'border-transparent text-muted/40 cursor-not-allowed' : 'border-border bg-white text-charcoal-300 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {c.getDate()}
              </button>
            )
          })}
        </div>
        {date && (
          <div className="mt-4 rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-charcoal-300">
            Selected: <span className="font-bold text-orange-700">{formatDateDisplay(date)}</span>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Operating days: Monday – Friday only</p>
      </div>
    </div>
  )
}

/* ----------------------------- Step 1: Time ------------------------------ */
function StepTime({ slots, slotIndex, onSelect }) {
  return (
    <div>
      <Heading title="Select Time Slot" sub="45-minute sessions from 9:00 AM to 4:00 PM. Each slot can accommodate up to 5 bookings." />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const selected = slotIndex === slot.index
          const isFull = slot.available === 0
          const statusColor = slot.status === 'available' ? 'bg-green-50 border-green-300 text-green-700' : slot.status === 'almost-full' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-red-50 border-red-300 text-red-700'
          
          return (
            <button
              key={slot.index}
              disabled={isFull}
              onClick={() => !isFull && onSelect(slot.index)}
              className={`rounded-xl border p-4 text-left transition ${
                selected 
                  ? 'border-orange-500 bg-orange-50 shadow-glow' 
                  : isFull 
                    ? 'border-border bg-bg-soft opacity-60 cursor-not-allowed'
                    : 'border-border bg-white hover:border-orange-300'
              }`}
            >
              <div className="font-display text-lg font-extrabold text-charcoal-300">{slot.time}</div>
              <div className={`mt-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md inline-block ${statusColor}`}>
                {isFull ? 'Fully Booked' : slot.available === 1 ? '1 Spot Left' : `${slot.available} Spots Left`}
              </div>
            </button>
          )
        })}
      </div>
      {slots.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-bg-soft p-4 text-center text-muted">
          No slots available for this date. Please select another day.
        </div>
      )}
    </div>
  )
}

/* ---------------------------- Step 2: Details ---------------------------- */
function StepDetails({ data, update, errors }) {
  return (
    <div>
      <Heading title="Your Details" sub="We'll use these to confirm your booking." />
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" icon={User} value={data.name} onChange={(v) => update({ name: v })} required error={errors.name} />
        <Field label="Mobile Number" icon={Phone} value={data.phone} onChange={(v) => update({ phone: v })} required error={errors.phone} placeholder="021 123 4567" />
        <Field label="Email Address" icon={Mail} value={data.email} onChange={(v) => update({ email: v })} type="email" required error={errors.email} className="sm:col-span-2" />
        <Field label="Group Size" icon={Users} value={data.groupSize} onChange={(v) => update({ groupSize: v.replace(/\D/g, '') || '1' })} type="number" required error={errors.groupSize} min="1" max="20" />
      </div>
      <p className="mt-4 text-xs text-muted">All fields are required. Phone must be a valid NZ mobile number.</p>
    </div>
  )
}

/* ---------------------------- Step 3: Confirm ---------------------------- */
function StepConfirm({ data, slots }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  return (
    <div>
      <Heading title="Confirm Booking" sub="Review your booking details before submitting." />
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <SummaryRow icon={Calendar} label="Date" value={formatDateDisplay(data.date)} />
        <SummaryRow icon={Clock} label="Time" value={selectedSlot?.time || '—'} />
        <SummaryRow icon={Clock} label="Duration" value="45 Minutes" />
        <SummaryRow icon={Users} label="Group Size" value={data.groupSize} />
        <SummaryRow icon={User} label="Name" value={data.name} />
        <SummaryRow icon={Phone} label="Phone" value={data.phone} />
        <SummaryRow icon={Mail} label="Email" value={data.email} className="sm:col-span-2" />
      </div>
      <div className="mt-6 rounded-xl border border-orange-300 bg-orange-50 p-4">
        <div className="text-xs text-orange-700 font-bold uppercase tracking-widest">Session Details</div>
        <div className="mt-2 text-sm text-charcoal-300">
          Each 45-minute session gives you full access to our RC construction arena. 
          Arrive 5 minutes early for check-in.
        </div>
      </div>
    </div>
  )
}

/* ------------------------- Sidebar / Success ----------------------------- */
function SummarySidebar({ data, slots }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  return (
    <div className="sticky top-28 card p-6">
      <div className="text-[11px] uppercase tracking-widest text-orange-600 font-bold">Booking Summary</div>
      <div className="mt-4 space-y-3 text-sm">
        <SidebarLine label="Date" value={data.date ? formatDateDisplay(data.date) : '—'} />
        <SidebarLine label="Time" value={selectedSlot?.time || '—'} />
        <SidebarLine label="Duration" value="45 Minutes" />
        <SidebarLine label="Group Size" value={data.groupSize || '—'} />
      </div>
      {selectedSlot && (
        <div className="mt-5 rounded-xl bg-bg-soft border border-border p-4">
          <div className="text-xs uppercase tracking-widest text-muted font-bold">Availability</div>
          <div className={`mt-2 text-sm font-bold ${
            selectedSlot.status === 'available' ? 'text-green-600' : selectedSlot.status === 'almost-full' ? 'text-orange-600' : 'text-red-600'
          }`}>
            {selectedSlot.available} of {selectedSlot.maxCapacity} spots available
          </div>
        </div>
      )}
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

function SuccessCard({ data, bookingId, onReset }) {
  const slotTime = getSlotTime(data.slotIndex)
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center card p-6 sm:p-10">
      <CheckCircle2 size={48} sm:size={64} className="text-orange-500 mx-auto" />
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-4 text-charcoal-300">Booking Request Submitted Successfully!</h2>
      <p className="mt-3 text-muted text-sm sm:text-base">Thank you{data.name ? `, ${data.name}` : ''}! Your booking request has been submitted. Our team will contact you shortly to confirm.</p>
      <div className="mt-6 rounded-xl border border-border bg-bg-soft p-4 sm:p-5 text-left text-sm space-y-2">
        <div className="flex justify-between"><span className="text-muted">Booking ID</span><span className="font-semibold text-charcoal-300">{bookingId}</span></div>
        <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-semibold text-charcoal-300">{formatDateDisplay(data.date)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Time</span><span className="font-semibold text-charcoal-300">{slotTime}</span></div>
        <div className="flex justify-between"><span className="text-muted">Duration</span><span className="font-semibold text-charcoal-300">45 Minutes</span></div>
        <div className="flex justify-between"><span className="text-muted">Group Size</span><span className="font-semibold text-charcoal-300">{data.groupSize}</span></div>
        <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-semibold text-charcoal-300">{data.name}</span></div>
        <div className="flex justify-between"><span className="text-muted">Phone</span><span className="font-semibold text-charcoal-300">{data.phone}</span></div>
        <div className="flex justify-between"><span className="text-muted">Email</span><span className="font-semibold text-charcoal-300">{data.email}</span></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReset} className="btn-outline">Make Another Booking</button>
        <Link to="/" className="btn-primary">Return Home</Link>
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

function Field({ label, icon: Icon, value, onChange, type = 'text', required, error, className = '', placeholder = '', min, max }) {
  return (
    <div className={className}>
      <label className="field-label flex items-center gap-1.5">
        {Icon && <Icon size={12} />}{label}{required && <span className="text-orange-500">*</span>}
      </label>
      <input 
        type={type} 
        value={value} 
        required={required} 
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)} 
        className={`field-input ${error ? 'border-red-300 focus:border-red-500' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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

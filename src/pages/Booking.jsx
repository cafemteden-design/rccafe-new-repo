import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Calendar, Clock, Users, ArrowRight, ArrowLeft, CheckCircle2, Mail, Phone, User, ChevronLeft, ChevronRight, X, Coffee, Cake, Building2, GraduationCap, Gift
} from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { BOOKING_OPTIONS } from '../data/menu.js'
import { SITE } from '../data/site.js'
import {
  generateSlotsForDate,
  fetchSlotAvailability,
  getAvailableDates,
  getAucklandToday,
  formatDateKey,
  formatDateDisplay,
  submitBooking,
  validateBookingData
} from '../data/bookingConfig.js'

const STEPS = ['Select Date', 'Select Package', 'Select Slot', 'Fill Details', 'Submit']

const EVENT_BOOKINGS = [
  { icon: Cake, title: 'Birthday Parties', desc: 'RC-themed birthdays for kids and adults.' },
  { icon: Building2, title: 'Corporate Bookings', desc: 'Team outings, corporate events and special functions.' },
  { icon: GraduationCap, title: 'School Visits', desc: 'Hands-on learning with real construction machinery.' },
  { icon: Users, title: 'Group Bookings', desc: 'Food + RC play packages for families, friends and teams.' },
  { icon: Gift, title: 'Special Functions', desc: 'Free venue hire available for special functions and events.' }
]

function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function isSameDay(a, b) { return a && b && a.toDateString() === b.toDateString() }

export default function Booking() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const calendarRef = useRef(null)
  const initialPackage = getPackageFromParam(searchParams.get('package'))
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [data, setData] = useState({
    date: null,
    slotIndex: null,
    name: '',
    phone: '',
    email: '',
    groupSize: 1,
    packageId: initialPackage?.id || '',
    toastieChoice: '',
    coffeeChoice: ''
  })

  const [availableDates] = useState(getAvailableDates())
  const [slots, setSlots] = useState([])
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()))

  useEffect(() => {
    let ignore = false
    const selectedPackage = BOOKING_OPTIONS.find((item) => item.id === data.packageId)

    if (data.date && selectedPackage) {
      setIsLoadingSlots(true)
      setErrors((current) => ({ ...current, availability: '' }))
      setSlots([])

      fetchSlotAvailability(data.date)
        .then((availability) => {
          if (!ignore) setSlots(generateSlotsForDate(data.date, availability, selectedPackage.durationMinutes))
        })
        .catch(() => {
          if (!ignore) {
            setSlots(generateSlotsForDate(data.date, {}, selectedPackage.durationMinutes))
            setErrors((current) => ({ ...current, availability: '' }))
          }
        })
        .finally(() => {
          if (!ignore) setIsLoadingSlots(false)
        })
    } else {
      setSlots([])
      setIsLoadingSlots(false)
    }

    return () => { ignore = true }
  }, [data.date, data.packageId])

  useEffect(() => {
    if (initialPackage?.id) {
      setData((current) => ({
        ...current,
        packageId: initialPackage.id,
        slotIndex: null,
        toastieChoice: '',
        coffeeChoice: ''
      }))
    }
  }, [initialPackage?.id])

  useEffect(() => {
    if (location.hash === '#calendar') {
      window.setTimeout(() => {
        calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [location.hash])

  const update = (patch) => {
    setErrors({})
    setData((s) => ({ ...s, ...patch }))
  }

  const canNext = () => {
    switch (step) {
      case 0: return !!data.date
      case 1: {
        const selectedPackage = BOOKING_OPTIONS.find((item) => item.id === data.packageId)
        return Boolean(selectedPackage)
      }
      case 2: {
        const selectedSlot = slots.find(s => s.index === data.slotIndex)
        return selectedSlot && selectedSlot.status !== 'full' && selectedSlot.available > 0
      }
      case 3: return data.name.trim() && data.phone.trim() && data.email.trim() && data.groupSize > 0
      default: return true
    }
  }

  const submit = async () => {
    if (isSubmitting) return

    const validation = validateBookingData(data)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    const selectedSlot = slots.find(s => s.index === data.slotIndex)
    const selectedPackage = BOOKING_OPTIONS.find((item) => item.id === data.packageId)
    if (!selectedSlot || selectedSlot.status === 'full' || selectedSlot.available <= 0) {
      setErrors({ submit: 'This slot is fully booked. Please choose another available slot.' })
      return
    }
    if (!selectedPackage) {
      setErrors({ submit: 'Please select a package or play option.' })
      return
    }

    const bookingData = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      groupSize: Number(data.groupSize),
      date: formatDateKey(data.date),
      slotTime: selectedSlot.startTime || selectedSlot.time,
      packageName: selectedPackage.name,
      packagePrice: selectedPackage.price,
      playTime: selectedPackage.playTime,
      toastieChoice: '',
      coffeeChoice: ''
    }
    const bookingSummaryData = {
      ...bookingData,
      slotTimeDisplay: selectedSlot.time
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await submitBooking(bookingData)
      const status = result?.status || result?.result || (result?.success ? 'success' : '')

      if (status === 'success') {
        setSubmittedData({ ...bookingSummaryData, bookingId: result?.bookingId || '' })
        setSubmitted(true)
      } else if (status === 'slot_full') {
        setErrors({ submit: 'This slot is fully booked. Please choose another available slot.' })
        setSlots((currentSlots) => currentSlots.map((slot) => (
          slot.time === selectedSlot.time ? { ...slot, available: 0, status: 'full' } : slot
        )))
      } else if (status === 'validation_error') {
        setErrors({ submit: result?.message || 'Please check your booking details and try again.' })
      } else if (status === 'error') {
        setErrors({ submit: getFriendlySubmitError(result, bookingData) })
      } else {
        setErrors({ submit: 'Unable to check availability right now. Please try again or contact us.' })
      }
    } catch (error) {
      setErrors({ submit: 'Unable to check availability right now. Please try again or contact us.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setSubmitted(false)
    setSubmittedData(null)
    setStep(0)
    setErrors({})
    setData({ date: null, slotIndex: null, name: '', phone: '', email: '', groupSize: 1, packageId: '', toastieChoice: '', coffeeChoice: '' })
  }

  return (
    <>
      <PageHero
        breadcrumbs={['Booking']}
        eyebrow="Reserve Your Slot"
        title={<>Book Your <span className="accent">RC Cafe Package</span></>}
        subtitle="Select a date, pick your package, choose an available slot, and enter your details. Each slot accommodates up to 5 bookings."
        image="/images/indoor-arena.jpg"
      />

      <section id="calendar" ref={calendarRef} className="section-light scroll-mt-28 py-12 lg:py-16">
        <div className="container-x">
          {submitted ? (
            <SuccessCard data={submittedData} onReset={reset} />
          ) : (
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="min-w-0 lg:col-span-8">
                <Stepper step={step} setStep={setStep} />
                <div className="mt-6 card min-w-0 p-6 sm:p-8 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>
                      {step === 0 && <StepDate date={data.date} availableDates={availableDates} viewMonth={viewMonth} setViewMonth={setViewMonth} onSelect={(d) => { update({ date: d, slotIndex: null }); setStep(data.packageId ? 2 : 1) }} error={errors.date} />}
                      {step === 1 && <StepPackage data={data} update={(patch) => { update(patch); if (patch.packageId) setStep(2) }} />}
                      {step === 2 && <StepTime slots={slots} slotIndex={data.slotIndex} selectedPackage={BOOKING_OPTIONS.find((item) => item.id === data.packageId)} onSelect={(i) => { update({ slotIndex: i }); setStep(3) }} isLoading={isLoadingSlots} error={errors.slotIndex || errors.availability} />}
                      {step === 3 && <StepDetails data={data} update={update} errors={errors} />}
                      {step === 4 && <StepConfirm data={data} slots={slots} />}
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
                      {step < 3 ? 'Continue' : 'Review Booking'} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={submit} disabled={isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Submitting...' : 'Submit Booking Request'} <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <aside className="min-w-0 lg:col-span-4">
                <SummarySidebar data={data} slots={slots} />
              </aside>
            </div>
          )}
        </div>
      </section>

      <EventsBookingSection />
    </>
  )
}

function getFriendlySubmitError(result, bookingData) {
  const rawMessage = String(result?.message || result?.error || '').trim()

  if (!bookingData.phone) {
    return 'Please enter your phone number'
  }

  const normalizedMessage = rawMessage.toLowerCase()

  if (normalizedMessage.includes('phone') && normalizedMessage.includes('not defined')) {
    return 'Unable to submit booking request right now. Please contact us to complete your booking.'
  }

  return rawMessage || 'Unable to submit booking request right now. Please try again or contact us.'
}

function EventsBookingSection() {
  return (
    <section id="events" className="section-soft py-12 sm:py-16 lg:py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow"><Users size={14} />Events & Groups</span>
          <h2 className="heading-display mt-4">Events, Parties & <span className="accent">Group Bookings</span></h2>
          <p className="mt-4 text-muted leading-relaxed">
            For birthdays, corporate bookings, school visits and special functions, please contact us directly so we can arrange the best package for your group.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {EVENT_BOOKINGS.map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="card card-hover p-5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600">
                <Icon size={19} />
              </div>
              <h3 className="mt-4 font-display text-lg font-extrabold text-charcoal-300">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-orange-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-orange-600">Free Venue Hire Available</div>
              <p className="mt-2 text-sm text-muted">Contact RC Cafe for event booking, group package planning and weekend enquiries.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="btn-primary">Contact for Event Booking <ArrowRight size={16} /></Link>
              <a href={`tel:${SITE.phoneTel}`} className="btn-outline"><Phone size={16} /> Call Now</a>
              <a href={SITE.socials.whatsapp} target="_blank" rel="noreferrer" className="btn-outline">WhatsApp Enquiry</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function getPackageFromParam(value) {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return BOOKING_OPTIONS.find((item) => (
    item.id.toLowerCase() === normalized || item.name.toLowerCase() === normalized
  )) || null
}

/* ------------------------------- Stepper -------------------------------- */
function Stepper({ step, setStep }) {
  return (
    <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-2">
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
function StepDate({ date, availableDates, viewMonth, setViewMonth, onSelect, error }) {
  const today = getAucklandToday()
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
        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-muted">Operating days: Monday-Friday only</p>
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs leading-relaxed text-charcoal-300">
          Saturday & Sunday online bookings are not available. We are open on weekends, but weekend sessions must be booked directly at the cafe or by contacting us.
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Step 1: Time ------------------------------ */
function StepTime({ slots, slotIndex, selectedPackage, onSelect, isLoading, error }) {
  return (
    <div>
      <Heading
        title="Select Time Slot"
        sub={selectedPackage ? `${selectedPackage.name} runs for ${selectedPackage.durationMinutes} minutes. Each slot can accommodate up to 5 bookings.` : 'Please select a package first.'}
      />
      {isLoading && <p className="mt-4 text-sm font-semibold text-orange-700">Checking live availability...</p>}
      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const selected = slotIndex === slot.index
          const isFull = slot.status === 'full' || slot.available === 0
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
              <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">{slot.durationMinutes} minutes</div>
              <div className={`mt-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md inline-block ${statusColor}`}>
                {isFull ? 'Fully Booked' : slot.available === 1 ? '1 Spot Left' : `${slot.available} Spots Left`}
              </div>
            </button>
          )
        })}
      </div>
      {slots.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-bg-soft p-4 text-center text-muted">
          {selectedPackage ? 'No slots available for this date. Please select another day.' : 'Select a package before choosing a slot.'}
        </div>
      )}
    </div>
  )
}

/* ---------------------------- Step 2: Details ---------------------------- */
function StepPackage({ data, update }) {
  return (
    <div>
      <Heading title="Select Package" sub="Choose your play package. Cafe food and drink choices are handled at the restaurant." />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {BOOKING_OPTIONS.map((item) => {
          const selected = data.packageId === item.id
          return (
            <button
              key={item.id}
              onClick={() => update({ packageId: item.id, slotIndex: null, toastieChoice: '', coffeeChoice: '' })}
              className={`relative rounded-xl border p-4 text-left transition ${
                selected ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white hover:border-orange-300'
              }`}
            >
              {item.badge && <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">{item.badge}</span>}
              <div className="pr-28">
                <div className="font-display text-xl font-extrabold text-charcoal-300">{item.name}</div>
                <div className="mt-1 text-sm font-semibold text-orange-700">{item.summary}</div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-widest text-muted font-bold">{item.playTime}</span>
                <span className="font-display text-3xl font-extrabold text-orange-600">${item.price}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------- Step 3: Details ---------------------------- */
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
      <p className="mt-4 text-xs text-muted">All fields are required. No machine or game selection is needed.</p>
    </div>
  )
}

/* ---------------------------- Step 4: Confirm ---------------------------- */
function StepConfirm({ data, slots }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  const selectedPackage = BOOKING_OPTIONS.find((item) => item.id === data.packageId)
  return (
    <div>
      <Heading title="Confirm Booking" sub="Review your booking details before submitting." />
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <SummaryRow icon={Calendar} label="Date" value={formatDateDisplay(data.date)} />
        <SummaryRow icon={Coffee} label="Package" value={selectedPackage ? `${selectedPackage.name} - $${selectedPackage.price}` : '-'} />
        <SummaryRow icon={Coffee} label="Package Price" value={selectedPackage ? `$${selectedPackage.price}` : '-'} />
        <SummaryRow icon={Clock} label="Play Time" value={selectedPackage?.playTime || '-'} />
        <SummaryRow icon={Clock} label="Slot Time" value={selectedSlot?.time || '-'} />
        <SummaryRow icon={Users} label="Group Size" value={data.groupSize} />
        <SummaryRow icon={User} label="Name" value={data.name} />
        <SummaryRow icon={Phone} label="Phone" value={data.phone} />
        <SummaryRow icon={Mail} label="Email" value={data.email} className="sm:col-span-2" />
      </div>
      <div className="mt-6 rounded-xl border border-orange-300 bg-orange-50 p-4">
        <div className="text-xs text-orange-700 font-bold uppercase tracking-widest">Session Details</div>
        <div className="mt-2 text-sm text-charcoal-300">
          Your selected package gives you full access to our RC construction arena for {selectedPackage?.playTime || 'your play time'}. 
          Arrive 5 minutes early for check-in.
        </div>
      </div>
    </div>
  )
}

/* ------------------------- Sidebar / Success ----------------------------- */
function SummarySidebar({ data, slots }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  const selectedPackage = BOOKING_OPTIONS.find((item) => item.id === data.packageId)
  return (
    <div className="sticky top-28 card p-6">
      <div className="text-[11px] uppercase tracking-widest text-orange-600 font-bold">Booking Summary</div>
      <div className="mt-4 space-y-3 text-sm">
        <SidebarLine label="Date" value={data.date ? formatDateDisplay(data.date) : '-'} />
        <SidebarLine label="Package" value={selectedPackage?.name || '-'} />
        <SidebarLine label="Price" value={selectedPackage ? `$${selectedPackage.price}` : '-'} />
        <SidebarLine label="Play Time" value={selectedPackage?.playTime || '-'} />
        <SidebarLine label="Slot" value={selectedSlot?.time || '-'} />
        <SidebarLine label="Group Size" value={data.groupSize || '-'} />
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
      <Link to="/menu" className="btn-outline mt-4 w-full">Browse Cafe Menu</Link>
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

function SuccessCard({ data, onReset }) {
  const date = data?.date ? new Date(`${data.date}T00:00:00`) : null
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center card p-6 sm:p-10">
      <CheckCircle2 size={48} sm:size={64} className="text-orange-500 mx-auto" />
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-4 text-charcoal-300">Booking Request Submitted Successfully!</h2>
      <p className="mt-3 text-muted text-sm sm:text-base">Thank you{data.name ? `, ${data.name}` : ''}! Your booking request has been submitted. Our team will contact you shortly to confirm.</p>
      <div className="mt-6 rounded-xl border border-border bg-bg-soft p-4 sm:p-5 text-left text-sm space-y-2">
        <div className="flex justify-between gap-4"><span className="text-muted">Booking ID</span><span className="font-semibold text-charcoal-300 text-right">{data.bookingId || '-'}</span></div>
        <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-semibold text-charcoal-300">{data.name}</span></div>
        <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-semibold text-charcoal-300">{formatDateDisplay(date)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Slot Time</span><span className="font-semibold text-charcoal-300">{data.slotTimeDisplay || data.slotTime}</span></div>
        <div className="flex justify-between"><span className="text-muted">Package</span><span className="font-semibold text-charcoal-300">{data.packageName}</span></div>
        <div className="flex justify-between"><span className="text-muted">Price</span><span className="font-semibold text-charcoal-300">${data.packagePrice}</span></div>
        <div className="flex justify-between"><span className="text-muted">Group Size</span><span className="font-semibold text-charcoal-300">{data.groupSize}</span></div>
        <div className="flex justify-between"><span className="text-muted">Play Time</span><span className="font-semibold text-charcoal-300">{data.playTime}</span></div>
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
        <div className="text-sm font-semibold text-charcoal-300 break-words">{value || '-'}</div>
      </div>
    </div>
  )
}

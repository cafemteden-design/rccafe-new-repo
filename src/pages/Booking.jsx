import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Calendar, Clock, Users, ArrowRight, ArrowLeft, CheckCircle2, Mail, Phone, User, ChevronLeft, ChevronRight, X, Coffee, Cake, Building2, GraduationCap, Gift
} from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { PLAY_UPGRADES, RC_PACKAGES } from '../data/menu.js'
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

const TRUST_ITEMS = [
  'Instant Booking Request',
  'No Advance Payment Required',
  'Family Friendly Environment',
  'Friendly Staff Assistance',
  'WhatsApp Booking Support',
  'Easy Rescheduling Support'
]

const IMPORTANT_INFO = [
  'Your booking request will be reviewed by our team.',
  'We will confirm your slot via WhatsApp or phone call.',
  'Please arrive 10 minutes before your session.',
  'Need to make changes? Our team will be happy to assist.'
]

function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
function isSameDay(a, b) { return a && b && a.toDateString() === b.toDateString() }
function formatMinutes(minutes) { return `${Number(minutes) || 0} Min` }

function getSelectedPackage(packageId) {
  return RC_PACKAGES.find((item) => item.id === packageId) || null
}

function getSelectedUpgrade(upgradeId) {
  return PLAY_UPGRADES.find((item) => item.id === upgradeId) || PLAY_UPGRADES[0]
}

function getBookingTotals(packageId, upgradeId) {
  const selectedPackage = getSelectedPackage(packageId)
  const selectedUpgrade = getSelectedUpgrade(upgradeId)
  const baseDuration = Number(selectedPackage?.durationMinutes || 0)
  const extraDuration = Number(selectedUpgrade?.durationMinutes || 0)
  const basePrice = Number(selectedPackage?.price || 0)
  const upgradePrice = Number(selectedUpgrade?.price || 0)
  const totalDuration = baseDuration + extraDuration
  const totalPrice = basePrice + upgradePrice

  return {
    selectedPackage,
    selectedUpgrade,
    baseDuration,
    extraDuration,
    totalDuration,
    basePrice,
    upgradePrice,
    totalPrice,
    basePlayTime: selectedPackage ? formatMinutes(baseDuration) : '',
    extraPlayTime: extraDuration ? `+${formatMinutes(extraDuration)}` : 'No Extra Time',
    totalPlayTime: selectedPackage ? formatMinutes(totalDuration) : ''
  }
}

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
    upgradeId: 'none',
    toastieChoice: '',
    coffeeChoice: '',
    confirmAttendance: false
  })

  const [availableDates] = useState(getAvailableDates())
  const [slots, setSlots] = useState([])
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()))

  useEffect(() => {
    let ignore = false
    const { selectedPackage, totalDuration } = getBookingTotals(data.packageId, data.upgradeId)

    if (data.date && selectedPackage && totalDuration > 0) {
      setIsLoadingSlots(true)
      setErrors((current) => ({ ...current, availability: '' }))
      setSlots([])

      fetchSlotAvailability(data.date)
        .then((availability) => {
          if (!ignore) setSlots(generateSlotsForDate(data.date, availability, totalDuration))
        })
        .catch(() => {
          if (!ignore) {
            setSlots(generateSlotsForDate(data.date, {}, totalDuration))
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
  }, [data.date, data.packageId, data.upgradeId])

  useEffect(() => {
    if (initialPackage?.id) {
      setData((current) => ({
        ...current,
        packageId: initialPackage.id,
        upgradeId: 'none',
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
        const selectedPackage = getSelectedPackage(data.packageId)
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
    const totals = getBookingTotals(data.packageId, data.upgradeId)
    const { selectedPackage, selectedUpgrade } = totals
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
      packagePrice: totals.totalPrice,
      playTime: `${totals.totalPlayTime} Play`,
      baseDuration: totals.baseDuration,
      basePlayTime: totals.basePlayTime,
      upgradeSelected: selectedUpgrade.name,
      upgradeName: selectedUpgrade.name,
      extraDuration: totals.extraDuration,
      extraPlayTime: totals.extraPlayTime,
      totalPlayTime: `${totals.totalPlayTime} Play`,
      basePrice: totals.basePrice,
      upgradePrice: totals.upgradePrice,
      totalPrice: totals.totalPrice,
      bookingStatus: 'Pending Confirmation',
      adminStatus: 'Pending Confirmation',
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
    setData({ date: null, slotIndex: null, name: '', phone: '', email: '', groupSize: 1, packageId: '', upgradeId: 'none', toastieChoice: '', coffeeChoice: '', confirmAttendance: false })
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
                      {step === 0 && <StepDate date={data.date} availableDates={availableDates} viewMonth={viewMonth} setViewMonth={setViewMonth} onSelect={(d) => { update({ date: d, slotIndex: null }); setStep(1) }} error={errors.date} />}
                      {step === 1 && <StepPackage data={data} update={update} />}
                      {step === 2 && <StepTime slots={slots} slotIndex={data.slotIndex} totals={getBookingTotals(data.packageId, data.upgradeId)} onSelect={(i) => { update({ slotIndex: i }); setStep(3) }} isLoading={isLoadingSlots} error={errors.slotIndex || errors.availability} />}
                      {step === 3 && <StepDetails data={data} update={update} errors={errors} />}
                      {step === 4 && <StepConfirm data={data} slots={slots} update={update} error={errors.confirmAttendance} />}
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
                    <button
                      onClick={submit}
                      disabled={isSubmitting}
                      className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 hover:shadow-orange-500/45 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[230px]"
                    >
                      {isSubmitting ? 'Submitting...' : 'Reserve My Slot'} <CheckCircle2 size={18} />
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
  return RC_PACKAGES.find((item) => (
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

/* ----------------------------- Step 2: Time ------------------------------ */
function StepTime({ slots, slotIndex, totals, onSelect, isLoading, error }) {
  const selectedPackage = totals.selectedPackage
  return (
    <div>
      <Heading
        title="Select Time Slot"
        sub={selectedPackage ? `${selectedPackage.name} with ${totals.extraPlayTime.toLowerCase()} runs for ${totals.totalDuration} minutes. Each slot can accommodate up to 5 bookings.` : 'Please select a package first.'}
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

/* ---------------------------- Step 1: Package ---------------------------- */
function StepPackage({ data, update }) {
  const totals = getBookingTotals(data.packageId, data.upgradeId)
  return (
    <div>
      <Heading title="Select Package" sub="Choose your play package. Cafe food and drink choices are handled at the restaurant." />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {RC_PACKAGES.map((item) => {
          const selected = data.packageId === item.id
          return (
            <button
              key={item.id}
              onClick={() => update({ packageId: item.id, upgradeId: 'none', slotIndex: null, toastieChoice: '', coffeeChoice: '' })}
              className={`relative min-h-[210px] rounded-2xl border p-5 text-left transition ${
                selected ? 'border-orange-500 bg-orange-50 shadow-glow' : 'border-border bg-white hover:border-orange-300'
              }`}
            >
              {item.badge && <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">{item.badge}</span>}
              <div className="pr-20">
                <div className="font-display text-xl font-extrabold text-charcoal-300">{item.name}</div>
                <div className="mt-1 text-sm font-semibold text-orange-700">{item.summary}</div>
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
                <span className="text-xs uppercase tracking-widest text-muted font-bold">{item.playTime}</span>
                <span className="font-display text-3xl font-extrabold text-orange-600">${item.price}</span>
              </div>
              {selected && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700">
                  <CheckCircle2 size={14} /> Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {totals.selectedPackage && (
        <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Optional</div>
              <h3 className="font-display text-xl font-extrabold text-charcoal-300">Upgrade Your Play Time</h3>
              <p className="mt-1 text-sm text-muted">No extra time is selected by default.</p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-charcoal-300 shadow-sm">
              Total: {totals.totalPlayTime} • ${totals.totalPrice}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PLAY_UPGRADES.map((upgrade) => {
              const selected = data.upgradeId === upgrade.id
              const price = upgrade.price === 0 ? '$0' : `+$${upgrade.price}`

              return (
                <button
                  key={upgrade.id}
                  onClick={() => update({ upgradeId: upgrade.id, slotIndex: null })}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected ? 'border-orange-500 bg-white shadow-glow' : 'border-orange-100 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-base font-extrabold text-charcoal-300">{upgrade.name}</div>
                    {selected && <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />}
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">{upgrade.summary}</div>
                  <div className="mt-3 text-2xl font-extrabold text-orange-600">{price}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
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
function StepConfirm({ data, slots, update, error }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  const totals = getBookingTotals(data.packageId, data.upgradeId)
  const selectedPackage = totals.selectedPackage
  return (
    <div>
      <Heading title="Review Your Booking" sub="Everything looks good? Reserve your preferred session and our team will confirm it shortly." />

      <div className="mt-6 rounded-2xl border border-orange-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Booking Summary</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PremiumSummaryRow icon={Calendar} label="Date" value={formatDateDisplay(data.date)} />
          <PremiumSummaryRow icon={Clock} label="Time" value={selectedSlot?.time || '-'} />
          <PremiumSummaryRow icon={Coffee} label="Package" value={selectedPackage ? `${selectedPackage.name} - $${totals.basePrice}` : '-'} />
          <PremiumSummaryRow icon={Clock} label="Base Play Time" value={totals.basePlayTime || '-'} />
          <PremiumSummaryRow icon={Clock} label="Extra Play Time" value={totals.extraPlayTime || '-'} />
          <PremiumSummaryRow icon={Clock} label="Total Play Time" value={totals.totalPlayTime || '-'} />
          <PremiumSummaryRow icon={Coffee} label="Total Price" value={selectedPackage ? `$${totals.totalPrice}` : '-'} />
          <PremiumSummaryRow icon={User} label="Customer Name" value={data.name} />
          <PremiumSummaryRow icon={Phone} label="Phone Number" value={data.phone} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <InfoListCard title="Why Book With Us?" items={TRUST_ITEMS} />
        <InfoListCard title="Important Information" items={IMPORTANT_INFO} subtle />
      </div>

      <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 text-sm leading-relaxed shadow-soft transition ${data.confirmAttendance ? 'border-orange-300 bg-orange-50' : 'border-border hover:border-orange-200'}`}>
        <input
          type="checkbox"
          checked={data.confirmAttendance}
          onChange={(event) => update({ confirmAttendance: event.target.checked })}
          className="mt-1 h-5 w-5 flex-shrink-0 accent-orange-500"
        />
        <span className="font-medium text-charcoal-300">
          I confirm that I will attend the selected session or inform the team in advance if I need to reschedule.
        </span>
      </label>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

      <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
        No advance payment required. Our team will contact you to confirm the booking.
      </div>
    </div>
  )
}

/* ------------------------- Sidebar / Success ----------------------------- */
function SummarySidebar({ data, slots }) {
  const selectedSlot = slots.find(s => s.index === data.slotIndex)
  const totals = getBookingTotals(data.packageId, data.upgradeId)
  const selectedPackage = totals.selectedPackage
  return (
    <div className="sticky top-28 card p-6">
      <div className="text-[11px] uppercase tracking-widest text-orange-600 font-bold">Booking Summary</div>
      <div className="mt-4 space-y-3 text-sm">
        <SidebarLine label="Date" value={data.date ? formatDateDisplay(data.date) : '-'} />
        <SidebarLine label="Package" value={selectedPackage?.name || '-'} />
        <SidebarLine label="Base Play" value={totals.basePlayTime || '-'} />
        <SidebarLine label="Extra Play" value={selectedPackage ? totals.extraPlayTime : '-'} />
        <SidebarLine label="Total Play" value={totals.totalPlayTime || '-'} />
        <SidebarLine label="Total Price" value={selectedPackage ? `$${totals.totalPrice}` : '-'} />
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
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-3xl">🎉</div>
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-4 text-charcoal-300">Booking Request Received!</h2>
      <p className="mt-3 text-muted text-sm sm:text-base">Thank you for choosing Remote Control Cafe.</p>
      <p className="mt-3 text-sm leading-relaxed text-charcoal-300 sm:text-base">
        Our team will contact you shortly via WhatsApp or phone call to confirm your selected session.
      </p>
      <p className="mt-3 text-sm font-semibold text-charcoal-300 sm:text-base">
        Please keep your phone available for confirmation.
      </p>
      <p className="mt-2 text-sm text-muted sm:text-base">We look forward to seeing you soon!</p>
      <div className="mt-6 rounded-xl border border-border bg-bg-soft p-4 sm:p-5 text-left text-sm space-y-2">
        <div className="flex justify-between gap-4"><span className="text-muted">Booking ID</span><span className="font-semibold text-charcoal-300 text-right">{data.bookingId || '-'}</span></div>
        <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-semibold text-charcoal-300">{data.name}</span></div>
        <div className="flex justify-between"><span className="text-muted">Date</span><span className="font-semibold text-charcoal-300">{formatDateDisplay(date)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Slot Time</span><span className="font-semibold text-charcoal-300">{data.slotTimeDisplay || data.slotTime}</span></div>
        <div className="flex justify-between"><span className="text-muted">Package</span><span className="font-semibold text-charcoal-300">{data.packageName}</span></div>
        <div className="flex justify-between"><span className="text-muted">Base Play Time</span><span className="font-semibold text-charcoal-300">{data.basePlayTime || '-'}</span></div>
        <div className="flex justify-between"><span className="text-muted">Extra Play Time</span><span className="font-semibold text-charcoal-300">{data.extraPlayTime || '-'}</span></div>
        <div className="flex justify-between"><span className="text-muted">Total Price</span><span className="font-semibold text-charcoal-300">${data.totalPrice ?? data.packagePrice}</span></div>
        <div className="flex justify-between"><span className="text-muted">Group Size</span><span className="font-semibold text-charcoal-300">{data.groupSize}</span></div>
        <div className="flex justify-between"><span className="text-muted">Total Play Time</span><span className="font-semibold text-charcoal-300">{data.totalPlayTime || data.playTime}</span></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary">Return to Home</Link>
        <button onClick={onReset} className="btn-outline">Book Another Session</button>
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
  const generatedId = useId()
  const inputId = `booking-${generatedId}`

  return (
    <div className={className}>
      <label htmlFor={inputId} className="field-label flex items-center gap-1.5">
        {Icon && <Icon size={12} />}{label}{required && <span className="text-orange-500">*</span>}
      </label>
      <input 
        id={inputId}
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

function PremiumSummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-soft p-3">
      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 size={17} />
      </div>
      <Icon size={16} className="hidden flex-shrink-0 text-orange-600 sm:block" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</div>
        <div className="truncate text-sm font-extrabold text-charcoal-300">{value || '-'}</div>
      </div>
    </div>
  )
}

function InfoListCard({ title, items, subtle = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${subtle ? 'border-border bg-bg-soft' : 'border-orange-200 bg-orange-50'}`}>
      <div className={`text-sm font-extrabold ${subtle ? 'text-charcoal-300' : 'text-orange-800'}`}>{title}</div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-charcoal-300">
            <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

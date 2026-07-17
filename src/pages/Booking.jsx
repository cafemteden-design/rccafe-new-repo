import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  ChevronDown, Clock3, Coffee, Gamepad2, Lock, Mail, MessageSquare, Minus, Phone,
  Plus, RefreshCw, Sandwich, Send, User, X
} from 'lucide-react'
import SEO from '../components/SEO.jsx'
import AnnouncementStrip from '../components/AnnouncementStrip.jsx'
import { PAGE_SEO } from '../data/seo.js'
import { BOOKING_DRINK_CHOICES, TOASTIE_CHOICES } from '../data/menu.js'
import { formatDateDisplay, formatDateKey, getAucklandToday } from '../data/bookingConfig.js'
import { BUSINESS_HOURS_ROWS, businessHoursSnapshot, formatBusinessHours, generateHourlySlots } from '../data/businessHours.js'
import { useBookingSettings } from '../hooks/useBookingSettings.js'
import { trackBookingSubmission } from '../hooks/useAnalytics.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { createConfirmedBooking, fetchConfirmedSlotUsage, subscribeToSlotCapacity } from '../services/bookingV2.js'
import { bookingToSheetPayload, syncGoogleSheet } from '../services/googleSheetSync.js'

const STEPS = ['Date', 'Time', 'Remotes', 'Gameplay', 'Food', 'Details', 'Summary']
const DEFAULT_DURATIONS = [
  { minutes: 45, price: 45 },
  { minutes: 60, price: 55 }
]
const ENQUIRY_COPY = 'Need more than 8 remotes or a larger group session? Please contact us through the enquiry form. Extra arrangements may be available depending on staff and timing.'
const ADD_ON_COPY = 'If you would like to extend your gameplay after your booked session, additional gameplay time may be arranged in-store depending on availability.'

export default function Booking() {
  const location = useLocation()
  const flowRef = useRef(null)
  const { settings, loading: settingsLoading, error: settingsError, retry: retrySettings } = useBookingSettings()
  const [step, setStep] = useState(0)
  const [viewMonth, setViewMonth] = useState(startOfMonth(getAucklandToday()))
  const [availability, setAvailability] = useState({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [availabilityVersion, setAvailabilityVersion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [errors, setErrors] = useState({})
  const [remoteEditorOpen, setRemoteEditorOpen] = useState(false)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  const [data, setData] = useState({
    date: null,
    slotIndex: null,
    remotes: 0,
    durationMinutes: 0,
    foodSelections: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    termsAccepted: false
  })

  const maxCapacity = Math.min(Number(settings.maxCapacity || 8), 8)
  const durations = useMemo(() => DEFAULT_DURATIONS.map((option) => ({ ...option, price: Number(settings.gameplayPrices?.[option.minutes] ?? option.price) })), [settings.gameplayPrices])
  const duration = durations.find((item) => item.minutes === data.durationMinutes) || null
  const totalPrice = duration ? data.remotes * duration.price : 0
  const availableDates = useMemo(() => createAvailableDates(settings), [settings])
  const baseSlots = useMemo(() => data.date ? generateHourlySlots(data.date, settings.businessHours) : [], [data.date, settings.businessHours])
  const slots = useMemo(() => slotsWithAvailability(baseSlots, availability, maxCapacity), [baseSlots, availability, maxCapacity])
  const selectedSlot = data.slotIndex === null ? null : slots[data.slotIndex] || null

  useEffect(() => {
    if (location.hash === '#calendar') window.setTimeout(() => flowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [location.hash])

  useEffect(() => {
    if (!data.date) return undefined
    let active = true
    const load = async () => {
      setAvailabilityLoading(true)
      setAvailabilityError('')
      try {
        const dateKey = formatDateKey(data.date)
        if (!isSupabaseConfigured) throw new Error('Supabase booking service is not configured.')
        const rows = await fetchConfirmedSlotUsage(dateKey)
        if (active) setAvailability(Object.fromEntries(rows.map((row) => [normalizeStart(row.slot_time), Number(row.approved_spots || 0)])))
      } catch {
        if (active) {
          setAvailability({})
          setAvailabilityError('Live availability is temporarily unavailable. Slots are shown with fallback capacity. Please try again or contact RCC if the issue continues.')
        }
      } finally {
        if (active) setAvailabilityLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [data.date, availabilityVersion, maxCapacity])

  useEffect(() => {
    if (!data.date || !isSupabaseConfigured) return undefined
    return subscribeToSlotCapacity(formatDateKey(data.date), () => setAvailabilityVersion((value) => value + 1))
  }, [data.date])

  useEffect(() => {
    const capacityReduced = Boolean(selectedSlot && data.remotes > selectedSlot.remaining)
    if (!capacityReduced) return
    setErrors((current) => ({ ...current, remotes: `Only ${selectedSlot.remaining} remotes are now available for this slot. Please reduce your selection to continue.` }))
    setRemoteEditorOpen(true)
    setMobileSummaryOpen(true)
  }, [data.remotes, selectedSlot?.remaining])

  useEffect(() => {
    if (step === 6) setMobileSummaryOpen(true)
  }, [step])

  useEffect(() => {
    if (!remoteEditorOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [remoteEditorOpen])

  const update = (patch) => {
    setErrors({})
    setData((current) => ({ ...current, ...patch }))
  }

  const selectDate = (date) => {
    update({ date, slotIndex: null, remotes: 0, durationMinutes: 0, foodSelections: [] })
    setAvailability({})
    setStep(1)
  }

  const selectSlot = (slot) => {
    if (slot.remaining <= 0) return
    update({ slotIndex: slot.index, remotes: 0, durationMinutes: 0, foodSelections: [] })
    setStep(2)
  }

  const selectRemotes = (count) => {
    if (!selectedSlot || count > selectedSlot.remaining) {
      setErrors({ remotes: `Only ${selectedSlot?.remaining || 0} remote spots remain in this hour.` })
      return
    }
    setData((current) => ({ ...current, remotes: count, foodSelections: resizeFoodSelections(current.foodSelections, count) }))
    setErrors({})
    setStep(3)
  }

  const editRemotes = (count) => {
    if (!selectedSlot || count < 1 || count > selectedSlot.remaining) {
      setErrors((current) => ({ ...current, remotes: `Only ${selectedSlot?.remaining || 0} remote spots remain in this hour.` }))
      setRemoteEditorOpen(true)
      return
    }
    setData((current) => ({ ...current, remotes: count, foodSelections: resizeFoodSelections(current.foodSelections, count) }))
    setErrors({})
  }

  const selectDuration = (minutes) => {
    update({ durationMinutes: minutes })
    setStep(4)
  }

  const next = () => {
    const stepErrors = validateStep(step, data, selectedSlot)
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors)
      return
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const submit = async () => {
    if (submitting) return
    const validation = validateAll(data, selectedSlot)
    if (Object.keys(validation).length) {
      setErrors(validation)
      setStep(firstInvalidStep(validation))
      return
    }

    const selectedDuration = durations.find((item) => item.minutes === data.durationMinutes)
    const firstFood = data.foodSelections[0] || {}
    const hoursSnapshot = businessHoursSnapshot(data.date, settings.businessHours)
    const payload = {
      date: formatDateKey(data.date),
      bookingDate: formatDateKey(data.date),
      slot_start: selectedSlot.startTime,
      slot_end: selectedSlot.endTime,
      slot_label: selectedSlot.label,
      slotTime: selectedSlot.startTime,
      bookingTime: selectedSlot.startTime,
      group_size: data.remotes,
      groupSize: data.remotes,
      players: data.remotes,
      remoteSpots: data.remotes,
      duration_minutes: selectedDuration.minutes,
      packageDuration: selectedDuration.minutes,
      baseDuration: selectedDuration.minutes,
      price_per_remote: selectedDuration.price,
      pricePerRemote: selectedDuration.price,
      total_price: totalPrice,
      totalPrice,
      packagePrice: totalPrice,
      packageName: `${selectedDuration.minutes} Minute Gameplay`,
      playTime: `${selectedDuration.minutes} Minutes`,
      toastie_selection: firstFood.toastie,
      toastieSelection: firstFood.toastie,
      toastieChoice: firstFood.toastie,
      drink_selection: firstFood.coffee,
      drinkSelection: firstFood.coffee,
      coffeeChoice: firstFood.coffee,
      per_remote_selections: data.foodSelections,
      perRemoteSelections: data.foodSelections,
      food_items: data.foodSelections,
      business_hours_snapshot: hoursSnapshot,
      businessHoursSnapshot: hoursSnapshot,
      customer_name: data.customerName.trim(),
      customerName: data.customerName.trim(),
      name: data.customerName.trim(),
      customer_email: data.customerEmail.trim(),
      customerEmail: data.customerEmail.trim(),
      email: data.customerEmail.trim(),
      customer_phone: data.customerPhone.trim(),
      customerPhone: data.customerPhone.trim(),
      phone: data.customerPhone.trim(),
      notes: data.notes.trim(),
      status: 'confirmed',
      bookingStatus: 'confirmed',
      source: 'website-v4'
    }

    setSubmitting(true)
    setErrors({})
    try {
      const bookingId = generateBookingReference(payload.bookingDate)
      const confirmedPayload = {
        ...payload,
        booking_id: bookingId,
        bookingId,
        booking_date: payload.bookingDate,
        booking_time: payload.bookingTime,
        customer_name: payload.customerName,
        customer_email: payload.customerEmail,
        customer_phone: payload.customerPhone,
        group_size: payload.groupSize,
        gameplay_duration: payload.duration_minutes,
        price_per_remote: payload.price_per_remote,
        total_price: payload.totalPrice,
        source: 'website-v4-apps-script-primary',
        status: 'confirmed'
      }

      const syncResult = await syncGoogleSheet('bookingCreated', bookingToSheetPayload(confirmedPayload))
      if (!syncResult.success) throw new Error(syncResult.message || 'Google Apps Script booking failed.')

      if (isSupabaseConfigured) {
        void withTimeout(createConfirmedBooking(confirmedPayload), 10000, 'Supabase booking timed out.').then((confirmedResult) => {
          const confirmed = Array.isArray(confirmedResult) ? confirmedResult[0] : confirmedResult
          if (confirmed?.id) void recordPublicSheetSync(confirmed, syncResult)
        }).catch((supabaseError) => {
          if (import.meta.env.DEV) console.warn('[booking] Apps Script confirmed booking, Supabase will need to catch up:', supabaseError.message)
        })
      }

      trackBookingSubmission({
        booking_date: payload.bookingDate,
        booking_time: payload.bookingTime,
        group_size: payload.groupSize,
        duration_minutes: payload.duration_minutes,
        total_price: payload.totalPrice
      })
      setSubmitted({ ...payload, bookingId })
    } catch (error) {
      setErrors({ submit: friendlySubmitError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <SuccessView booking={submitted} onReset={() => window.location.reload()} />

  const capacityReduced = Boolean(selectedSlot && data.remotes > selectedSlot.remaining)

  return (
    <>
      <SEO {...PAGE_SEO['/booking']} path="/booking" />
      <AnnouncementStrip />
      <section id="calendar" ref={flowRef} className="scroll-mt-24 bg-[#fffdfa] py-7 sm:py-10">
        <div className="container-x">
          <div className="max-w-3xl">
            <span className="eyebrow"><CalendarDays size={14} />Online Booking</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-charcoal-300 sm:text-4xl">Book Your Remote Control Cafe Session</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">Choose a date, select a time slot, pick your remotes and choose your gameplay duration.</p>
          </div>

          <Progress step={step} onStep={setStep} />

          <div className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <main className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-soft sm:p-6">
              {step === 0 && <DateStep data={data} viewMonth={viewMonth} setViewMonth={setViewMonth} availableDates={availableDates} onSelect={selectDate} settingsLoading={settingsLoading} settingsError={settingsError} retrySettings={retrySettings} error={errors.date} businessHours={settings.businessHours} />}
              {step === 1 && <SlotStep slots={slots} loading={availabilityLoading} error={availabilityError || errors.slot} onSelect={selectSlot} retry={() => setAvailabilityVersion((value) => value + 1)} />}
              {step === 2 && <RemoteStep remaining={selectedSlot?.remaining || 0} selected={data.remotes} onSelect={selectRemotes} error={errors.remotes} />}
              {step === 3 && <DurationStep options={durations} selected={data.durationMinutes} remotes={data.remotes} onSelect={selectDuration} error={errors.duration} />}
              {step === 4 && <FoodStep data={data} update={update} errors={errors} />}
              {step === 5 && <DetailsStep data={data} update={update} errors={errors} remaining={selectedSlot?.remaining || 0} onEditRemotes={editRemotes} onOpenRemoteEditor={() => setRemoteEditorOpen(true)} />}
              {step === 6 && <ReviewStep data={data} slot={selectedSlot} duration={duration} totalPrice={totalPrice} update={update} error={errors.submit} termsError={errors.terms} />}

              {capacityReduced && step >= 3 && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-relaxed text-red-700">
                  Only {selectedSlot.remaining} remotes are now available for this slot. Please reduce your selection to continue.
                </div>
              )}

              {step >= 5 && <BookingSummary data={data} slot={selectedSlot} duration={duration} totalPrice={totalPrice} inline collapsible open={mobileSummaryOpen} onToggle={() => setMobileSummaryOpen((value) => !value)} onEditRemotes={() => setRemoteEditorOpen(true)} />}

              <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
                <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || submitting} className="btn-outline min-h-12 disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={16} />Back</button>
                {step < 6 ? (
                  <button type="button" onClick={next} disabled={step <= 3 || submitting} className={`btn-primary min-h-12 ${step <= 3 ? 'invisible' : ''}`}>Continue <ArrowRight size={16} /></button>
                ) : (
                  <button type="button" onClick={submit} disabled={submitting || capacityReduced || !data.termsAccepted} className="btn-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><RefreshCw className="animate-spin" size={17} />Submitting...</> : <><Send size={17} />Confirm Booking</>}</button>
                )}
              </div>
            </main>

            <BookingSummary data={data} slot={selectedSlot} duration={duration} totalPrice={totalPrice} onEditRemotes={() => setRemoteEditorOpen(true)} />
          </div>
        </div>
      </section>

      <RemoteEditorModal open={remoteEditorOpen} selected={data.remotes} remaining={selectedSlot?.remaining || 0} onSelect={editRemotes} onClose={() => setRemoteEditorOpen(false)} />
    </>
  )
}

function Progress({ step, onStep }) {
  return (
    <div className="mt-6 flex max-w-full gap-2 overflow-x-auto pb-2" aria-label="Booking progress">
      {STEPS.map((label, index) => (
        <button key={label} type="button" onClick={() => index < step && onStep(index)} disabled={index > step} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest ${index === step ? 'border-orange-500 bg-orange-500 text-white' : index < step ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-border bg-white text-muted'}`}>
          <span className={`grid h-5 w-5 place-items-center rounded-full ${index === step ? 'bg-white text-orange-600' : 'bg-bg-soft'}`}>{index < step ? <Check size={12} /> : index + 1}</span>{label}
        </button>
      ))}
    </div>
  )
}

function DateStep({ data, viewMonth, setViewMonth, availableDates, onSelect, settingsLoading, settingsError, retrySettings, error, businessHours }) {
  const today = getAucklandToday()
  const firstDay = startOfMonth(viewMonth).getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1))]
  return (
    <div>
      <StepHeading icon={CalendarDays} title="Select Date" text="Online bookings are available Monday to Sunday." />
      {settingsLoading && <InlineNotice>Loading live booking settings...</InlineNotice>}
      {settingsError && <InlineNotice>{settingsError} <button onClick={retrySettings} className="font-bold underline">Retry</button></InlineNotice>}
      <div className="mt-6 max-w-md">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -1))} className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-white"><ChevronLeft size={17} /></button>
          <div className="font-display text-xl font-extrabold">{viewMonth.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}</div>
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-white"><ChevronRight size={17} /></button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <div key={day}>{day}</div>)}</div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} />
            const enabled = availableDates.some((item) => sameDay(item, date))
            const selected = sameDay(data.date, date)
            const past = date < today
            return <button key={date.toISOString()} type="button" disabled={!enabled || past} onClick={() => onSelect(date)} className={`aspect-square rounded-xl border text-sm font-bold transition ${selected ? 'border-orange-500 bg-orange-500 text-white shadow-glow' : enabled && !past ? 'border-border bg-white hover:border-orange-400 hover:text-orange-700' : 'cursor-not-allowed border-transparent text-muted/35'}`}>{date.getDate()}</button>
          })}
        </div>
        {data.date && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">Selected: <strong>{formatDateDisplay(data.date)}</strong></div>}
        {error && <ErrorText>{error}</ErrorText>}
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-bg-soft p-4"><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">Official RCC Opening Hours</div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{BUSINESS_HOURS_ROWS.map(([key, label]) => <div key={key} className="rounded-xl bg-white px-3 py-2 text-xs"><strong className="block">{label}</strong><span className="text-muted">{formatBusinessHours(businessHours[key])}</span></div>)}</div></div>
    </div>
  )
}

function SlotStep({ slots, loading, error, onSelect, retry }) {
  return (
    <div>
      <StepHeading icon={Clock3} title="Select 1-Hour Time Slot" text="Choose one fixed hour. Gameplay duration is selected in the next steps." />
      {loading && <InlineNotice>Checking confirmed remote reservations...</InlineNotice>}
      {error && <InlineNotice>{error} <button type="button" onClick={retry} className="font-bold underline">Retry</button></InlineNotice>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          const full = slot.remaining <= 0
          return (
            <button key={slot.startTime} type="button" disabled={full} onClick={() => onSelect(slot)} className={`min-h-28 min-w-0 rounded-2xl border p-3 text-left transition sm:p-4 ${full ? 'cursor-not-allowed border-red-200 bg-red-50/70 opacity-70' : 'border-border bg-white hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-soft'}`}>
              <div className="min-w-0"><div className="font-display text-sm font-extrabold leading-snug text-charcoal-300 sm:text-lg">{slot.label}</div><div className="mt-1 hidden text-xs font-semibold text-muted sm:block">Fixed 1-hour booking slot</div></div>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider sm:text-[10px] ${full ? 'bg-red-100 text-red-700' : slot.remaining <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{full ? 'Fully Booked' : `${slot.remaining} left`}</span>
              {full && <p className="mt-3 text-xs leading-relaxed text-red-700">All 8 remotes are already reserved for this hour.</p>}
            </button>
          )
        })}
      </div>
      <EnquiryNote />
    </div>
  )
}

function RemoteStep({ remaining, selected, onSelect, error }) {
  return (
    <div>
      <StepHeading icon={Gamepad2} title="Select Number of Remotes" text="1 person = 1 remote. Each time slot supports up to 8 remotes." />
      <div className="mt-6 grid grid-cols-4 gap-3 lg:grid-cols-8">
        {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => {
          const disabled = count > remaining
          const active = selected === count
          return <button key={count} type="button" disabled={disabled} onClick={() => onSelect(count)} aria-label={`${count} remotes`} className={`relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-2xl border transition ${active ? 'border-orange-500 bg-orange-500 text-white shadow-glow' : disabled ? 'cursor-not-allowed border-red-100 bg-red-50 text-red-300' : 'border-border bg-white text-charcoal-300 hover:border-orange-400 hover:bg-orange-50'}`}>{disabled && <Lock className="absolute right-2 top-2" size={12} />}<Gamepad2 size={22} /><span className="mt-1 text-sm font-extrabold">{count}</span></button>
        })}
      </div>
      <div className="mt-4 text-sm font-extrabold text-orange-700">{selected || 0} Remote{selected === 1 ? '' : 's'} Selected</div>
      {error && <ErrorText>{error}</ErrorText>}
      <EnquiryNote />
    </div>
  )
}

function DurationStep({ options, selected, remotes, onSelect, error }) {
  return (
    <div>
      <StepHeading icon={Clock3} title="Select Gameplay Duration" text="Both gameplay options take place inside your selected 1-hour booking slot." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected === option.minutes
          return <button key={option.minutes} type="button" onClick={() => onSelect(option.minutes)} className={`rounded-3xl border p-5 text-left transition ${active ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' : 'border-border bg-white hover:border-orange-300'}`}><div className="flex items-start justify-between gap-3"><div><div className="font-display text-2xl font-extrabold">{option.minutes} Minutes</div><div className="mt-1 text-sm font-bold text-orange-700">${option.price} per remote</div></div>{active && <CheckCircle2 className="text-green-600" size={22} />}</div><div className="mt-4 space-y-2 text-sm text-charcoal-300"><div className="flex items-center gap-2"><Sandwich size={16} className="text-orange-600" />Includes Any Toastie</div><div className="flex items-center gap-2"><Coffee size={16} className="text-orange-600" />Includes Any Hot Coffee</div></div>{remotes > 0 && <div className="mt-4 border-t border-border pt-3 text-sm font-extrabold">{remotes} x ${option.price} = ${remotes * option.price}</div>}</button>
        })}
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <InlineNotice>{ADD_ON_COPY}</InlineNotice>
    </div>
  )
}

function FoodStep({ data, update, errors }) {
  const updateFood = (index, key, value) => {
    const next = resizeFoodSelections(data.foodSelections, data.remotes)
    next[index] = { ...next[index], [key]: value }
    update({ foodSelections: next })
  }
  return (
    <div>
      <StepHeading icon={Sandwich} title="Choose Food & Drink For Each Remote" text="Every remote includes one toastie and one drink. Complete both selections for every player." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {resizeFoodSelections(data.foodSelections, data.remotes).map((selection, index) => (
          <article key={index} className="rounded-2xl border border-orange-200 bg-[#fffdfa] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Included Food & Coffee</div><h3 className="mt-1 font-display text-xl font-extrabold">Remote {index + 1}</h3></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-700"><Gamepad2 size={19} /></span>
            </div>
            <label className="mt-4 block"><span className="field-label">1. Select Toastie <span className="text-red-500">*</span></span><select value={selection.toastie} onChange={(event) => updateFood(index, 'toastie', event.target.value)} className="field-input min-h-12 text-base"><option value="">Choose toastie</option>{TOASTIE_CHOICES.map((option) => <option key={option}>{option}</option>)}</select></label>
            <fieldset className="mt-4">
              <legend className="field-label">2. Choose One Coffee <span className="text-red-500">*</span></legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`Choose one coffee for remote ${index + 1}`}>
                {BOOKING_DRINK_CHOICES.map((option) => {
                  const id = `drink-${index}-${option.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  return (
                    <label key={option} htmlFor={id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm font-bold transition ${selection.coffee === option ? 'border-orange-500 bg-orange-50 text-charcoal-300 ring-2 ring-orange-100' : 'border-border bg-white text-charcoal-300 hover:border-orange-300'}`}>
                      <input id={id} type="radio" name={`drink-${index}`} value={option} checked={selection.coffee === option} onChange={(event) => updateFood(index, 'coffee', event.target.value)} className="h-4 w-4 accent-orange-500" />
                      <span className="leading-tight">{option}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </article>
        ))}
      </div>
      {errors.food && <ErrorText>{errors.food}</ErrorText>}
    </div>
  )
}

function DetailsStep({ data, update, errors, remaining, onEditRemotes, onOpenRemoteEditor }) {
  return (
    <div>
      <StepHeading icon={User} title="Customer Details" text="We will use these details for your confirmed booking." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" icon={User} value={data.customerName} onChange={(value) => update({ customerName: value })} error={errors.name} />
        <Field label="Email" icon={Mail} type="email" value={data.customerEmail} onChange={(value) => update({ customerEmail: value })} error={errors.email} />
        <Field label="Phone" icon={Phone} value={data.customerPhone} onChange={(value) => update({ customerPhone: value })} error={errors.phone} />
        <div><label className="field-label">Selected Remotes</label><RemoteQuantityControl value={data.remotes} remaining={remaining} onChange={onEditRemotes} onEdit={onOpenRemoteEditor} /></div>
        <label className="sm:col-span-2"><span className="field-label">Notes / Special Request <span className="font-normal text-muted">(optional)</span></span><div className="relative"><MessageSquare className="absolute left-3 top-3 text-muted" size={17} /><textarea rows={4} value={data.notes} onChange={(event) => update({ notes: event.target.value })} className="field-input resize-y pl-10 text-base" /></div></label>
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, type = 'text', value, onChange, error }) {
  return <label><span className="field-label">{label} <span className="text-red-500">*</span></span><div className="relative"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`field-input pl-10 text-base ${error ? 'border-red-400' : ''}`} /></div>{error && <ErrorText>{error}</ErrorText>}</label>
}

function ReviewStep({ data, slot, duration, totalPrice, update, error, termsError }) {
  return <div><StepHeading icon={CheckCircle2} title="Review & Confirm" text="Check your selections before confirming your RCC booking." />
    <section className="mt-6 rounded-2xl border border-orange-200 bg-white p-4 shadow-soft sm:p-5" aria-labelledby="booking-terms-title">
      <h3 id="booking-terms-title" className="font-display text-xl font-extrabold">Booking Details & Terms</h3>
      <div className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <ReviewItem label="Date" value={data.date ? formatDateDisplay(data.date) : '-'} />
        <ReviewItem label="Time" value={slot?.label || '-'} />
        <ReviewItem label="Remote Spots" value={data.remotes} />
        <ReviewItem label="Gameplay" value={duration ? `${duration.minutes} Minutes` : '-'} />
        <ReviewItem label="Customer" value={data.customerName || '-'} />
        <ReviewItem label="Phone" value={data.customerPhone || '-'} />
        <ReviewItem label="Email" value={data.customerEmail || '-'} />
        <ReviewItem label="Total" value={`NZD $${totalPrice}`} strong />
        {data.notes && <div className="sm:col-span-2"><ReviewItem label="Notes" value={data.notes} /></div>}
      </div>
      <FoodBreakdown selections={data.foodSelections} className="mt-5" />
      <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-relaxed text-muted">
        <li>Your booking is confirmed immediately after successful submission.</li><li>Please arrive on time for your selected session.</li><li>Extra gameplay time can be arranged in-store depending on availability.</li><li>To request a cancellation, reply to your confirmation email or contact RCC Cafe with your booking reference, name, date and time.</li><li>Cancellation requests should be submitted at least 30 minutes before the scheduled booking time.</li>
      </ul>
      <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${termsError ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
        <input type="checkbox" checked={data.termsAccepted} onChange={(event) => update({ termsAccepted: event.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500" />
        <span className="text-sm font-bold leading-relaxed text-charcoal-300">I confirm my booking details are correct and understand this booking will be confirmed immediately.</span>
      </label>
      {termsError && <ErrorText>{termsError}</ErrorText>}
    </section>
    {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
  </div>
}

function ReviewItem({ label, value, strong = false }) { return <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-2"><span className="text-muted">{label}</span><span className={`min-w-0 text-right ${strong ? 'font-extrabold text-orange-700' : 'font-bold text-charcoal-300'}`}>{value}</span></div> }

function BookingSummary({ data, slot, duration, totalPrice, inline = false, collapsible = false, open = true, onToggle, onEditRemotes }) {
  const contentVisible = !collapsible || open
  return (
    <aside className={`${inline ? 'mt-6 lg:hidden' : 'hidden lg:block lg:sticky lg:top-28'} min-w-0 rounded-3xl border border-orange-200 bg-white p-5 shadow-card`}>
      {collapsible ? (
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-4 text-left">
          <span><span className="block text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Your RCC Session</span><span className="mt-1 block font-display text-xl font-extrabold">Booking Summary</span></span>
          <ChevronDown size={20} className={`shrink-0 text-orange-600 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : <><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Live Booking Summary</div><h2 className="mt-2 font-display text-xl font-extrabold">Your RCC Session</h2></>}
      {contentVisible && <div className="mt-5 space-y-3 text-sm">
        <SummaryRow label="Date" value={data.date ? formatDateDisplay(data.date) : 'Not selected'} />
        <SummaryRow label="Time" value={slot?.label || 'Not selected'} />
        <div className="flex items-center justify-between gap-4"><span className="text-muted">Remotes</span><span className="flex items-center gap-2"><strong>{data.remotes || 'Not selected'}</strong>{data.remotes > 0 && <button type="button" onClick={onEditRemotes} className="min-h-10 rounded-full border border-orange-200 px-3 text-xs font-extrabold text-orange-700 transition hover:bg-orange-50">Edit</button>}</span></div>
        <SummaryRow label="Gameplay" value={duration ? `${duration.minutes} Minutes` : 'Not selected'} />
        <SummaryRow label="Included" value="Any Toastie + One Drink" />
        <FoodBreakdown selections={data.foodSelections} compact />
        <div className="mt-5 flex items-end justify-between border-t border-border pt-4"><span className="text-xs font-extrabold uppercase tracking-widest text-muted">Total</span><span className="font-display text-3xl font-extrabold text-orange-600">${totalPrice}</span></div>
        {duration && data.remotes > 0 && <div className="mt-1 text-right text-xs text-muted">{data.remotes} x ${duration.price} per remote</div>}
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-xs leading-relaxed text-charcoal-300"><strong>Status: Confirmed</strong><br />Your slot is confirmed once this booking is saved successfully.</div>
        <p className="mt-4 text-xs leading-relaxed text-muted">{ADD_ON_COPY}</p>
        <div className="mt-4 border-t border-border pt-4"><p className="text-xs leading-relaxed text-muted">{ENQUIRY_COPY}</p><Link to="/contact" className="btn-outline mt-3 min-h-12 w-full">Send Enquiry</Link></div>
      </div>}
    </aside>
  )
}

function RemoteQuantityControl({ value, remaining, onChange, onEdit }) {
  return <div className="mt-1.5 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-bg-soft px-2"><button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease remotes" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white text-charcoal-300 disabled:opacity-35"><Minus size={17} /></button><button type="button" onClick={onEdit} className="min-h-10 min-w-0 flex-1 text-center font-extrabold text-charcoal-300"><Gamepad2 size={17} className="mr-2 inline text-orange-600" />{value} Remote{value === 1 ? '' : 's'} <span className="ml-1 text-xs text-orange-700">Edit</span></button><button type="button" onClick={() => onChange(value + 1)} disabled={value >= remaining} aria-label="Increase remotes" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white text-charcoal-300 disabled:opacity-35"><Plus size={17} /></button></div>
}

function RemoteEditorModal({ open, selected, remaining, onSelect, onClose }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="remote-editor-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-md rounded-3xl border border-orange-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Edit Booking</div><h2 id="remote-editor-title" className="mt-1 font-display text-2xl font-extrabold">Select Number of Remotes</h2><p className="mt-2 text-sm text-muted">Up to {remaining} remote{remaining === 1 ? '' : 's'} currently available.</p></div><button type="button" onClick={onClose} aria-label="Close remote editor" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-white"><X size={20} /></button></div>{remaining > 0 ? <div className="mt-6 grid grid-cols-4 gap-3">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => { const disabled = count > remaining; const active = count === selected; return <button key={count} type="button" disabled={disabled} onClick={() => { onSelect(count); onClose() }} className={`relative flex aspect-square min-h-14 items-center justify-center rounded-2xl border text-lg font-extrabold transition ${active ? 'border-orange-500 bg-orange-500 text-white shadow-glow' : disabled ? 'cursor-not-allowed border-red-100 bg-red-50 text-red-300' : 'border-border bg-white hover:border-orange-400 hover:bg-orange-50'}`}>{disabled && <Lock className="absolute right-1.5 top-1.5" size={11} />}{count}</button> })}</div> : <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">This slot is now fully booked. Please return to the time step and select another slot.</div>}<button type="button" onClick={onClose} className="btn-outline mt-6 min-h-12 w-full">Done</button></div></div>
}

function SummaryRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4"><span className="shrink-0 text-muted">{label}</span><span className="min-w-0 text-right font-bold text-charcoal-300">{value}</span></div>
}

function FoodBreakdown({ selections = [], className = '', compact = false }) {
  if (!selections.length) return <SummaryRow label="Food & Drink" value="Not selected" />
  return <div className={`${className} rounded-xl border border-orange-100 bg-orange-50/60 ${compact ? 'p-3' : 'p-4'}`}><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">Food & Drink By Remote</div><div className="mt-2 space-y-2">{selections.map((item, index) => <div key={index} className="flex items-start justify-between gap-3 text-xs"><strong className="shrink-0">Remote {index + 1}</strong><span className="min-w-0 text-right text-muted">{item.toastie || 'Toastie not selected'} + {item.coffee || 'Drink not selected'}</span></div>)}</div></div>
}

function EnquiryNote() {
  return <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4"><p className="text-sm leading-relaxed text-charcoal-300">{ENQUIRY_COPY}</p><Link to="/contact" className="btn-outline mt-3 min-h-10 w-fit">Send Enquiry <ArrowRight size={15} /></Link></div>
}

function SuccessView({ booking, onReset }) {
  return <section className="bg-[#fffdfa] py-12 sm:py-16"><SEO {...PAGE_SEO['/booking']} path="/booking" /><div className="container-x"><div className="mx-auto max-w-2xl rounded-3xl border border-green-200 bg-white p-6 shadow-card sm:p-8"><div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700"><CheckCircle2 size={28} /></div><h1 className="mt-5 font-display text-3xl font-extrabold">Booking Confirmed</h1><p className="mt-3 text-sm leading-relaxed text-muted">Your booking has been confirmed successfully.</p></div><div className="mt-6 rounded-2xl border border-border bg-bg-soft p-4"><SuccessRow label="Booking Reference" value={booking.bookingId} /><SuccessRow label="Name" value={booking.customerName} /><SuccessRow label="Date" value={booking.date ? formatDateDisplay(new Date(`${booking.date}T12:00:00`)) : '-'} /><SuccessRow label="Time" value={booking.slot_label || booking.slotTime} /><SuccessRow label="Guests" value={booking.remoteSpots} /><SuccessRow label="Gameplay" value={booking.playTime} /><SuccessRow label="Status" value="Confirmed" /><SuccessRow label="Total" value={`NZD $${booking.totalPrice}`} /><FoodBreakdown selections={booking.perRemoteSelections} className="mt-4" /></div><div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300"><p>To request a cancellation, please reply to your confirmation email or contact Remote Control Cafe with your booking reference, name, booking date and booking time. Cancellation requests should be submitted at least 30 minutes before the scheduled booking time.</p><p className="mt-2 font-bold">Your booking remains confirmed until you receive a cancellation confirmation from our team.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link to="/" className="btn-outline">Back to Home</Link><button type="button" onClick={onReset} className="btn-primary">Make Another Booking</button></div></div></div></section>
}

function SuccessRow({ label, value }) { return <div className="flex items-start justify-between gap-4 border-b border-white py-2 text-sm last:border-0"><span className="text-muted">{label}</span><strong className="text-right">{value || '-'}</strong></div> }

function StepHeading({ icon: Icon, title, text }) {
  return <div><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-orange-600"><Icon size={15} />Step</div><h2 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{text}</p></div>
}

function InlineNotice({ children }) {
  return <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">{children}</div>
}

function ErrorText({ children }) {
  return <p className="mt-2 text-xs font-semibold text-red-600">{children}</p>
}

function validateStep(step, data, slot) {
  if (step === 0 && !data.date) return { date: 'Please select a booking date.' }
  if (step === 1 && !slot) return { slot: 'Please select an available time slot.' }
  if (step === 2 && (!data.remotes || data.remotes > Number(slot?.remaining || 0))) return { remotes: 'Please select an available number of remotes.' }
  if (step === 3 && !DEFAULT_DURATIONS.some((item) => item.minutes === data.durationMinutes)) return { duration: 'Please select 45 or 60 minutes.' }
  if (step === 4 && !foodSelectionsComplete(data)) return { food: 'Please select one toastie and one drink for every remote.' }
  if (step === 5) return validateDetails(data)
  return {}
}

function validateAll(data, slot) {
  return {
    ...(!data.date ? { date: 'Please select a date.' } : {}),
    ...(!slot ? { slot: 'Please select a time slot.' } : {}),
    ...(!data.remotes || data.remotes > Number(slot?.remaining || 0) ? { remotes: 'Selected remotes exceed current availability.' } : {}),
    ...(!DEFAULT_DURATIONS.some((item) => item.minutes === data.durationMinutes) ? { duration: 'Please select gameplay duration.' } : {}),
    ...(!foodSelectionsComplete(data) ? { food: 'Complete the food and drink selection for every remote.' } : {}),
    ...(!data.termsAccepted ? { terms: 'Please confirm the booking details and terms.' } : {}),
    ...validateDetails(data)
  }
}

function validateDetails(data) {
  const errors = {}
  if (data.customerName.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail.trim())) errors.email = 'Please enter a valid email address.'
  if (data.customerPhone.replace(/\D/g, '').length < 6) errors.phone = 'Please enter your phone number.'
  return errors
}

function firstInvalidStep(errors) {
  if (errors.date) return 0
  if (errors.slot) return 1
  if (errors.remotes) return 2
  if (errors.duration) return 3
  if (errors.food) return 4
  if (errors.name || errors.email || errors.phone) return 5
  if (errors.terms) return 6
  return 6
}

async function recordPublicSheetSync(booking, result) {
  if (!supabase || !booking?.id) return
  try {
    await supabase.rpc('record_booking_sheet_sync_v3', {
      p_booking_id: booking.id,
      p_public_booking_id: booking.booking_id,
      p_success: Boolean(result?.success && !result?.skipped),
      p_message: result?.skipped ? 'Apps Script URL is not configured.' : result?.message || null
    })
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[booking] Could not record optional Sheet sync status:', error.message)
  }
}

function slotsWithAvailability(baseSlots, usage, capacity) {
  return baseSlots.map((slot) => {
    const used = Math.max(Number(usage[normalizeStart(slot.startTime)] || 0), 0)
    return { ...slot, used, remaining: Math.max(capacity - used, 0) }
  })
}

function resizeFoodSelections(selections = [], count = 0) {
  return Array.from({ length: Math.max(Number(count) || 0, 0) }, (_, index) => ({
    remote: index + 1,
    toastie: selections[index]?.toastie || '',
    coffee: selections[index]?.coffee || ''
  }))
}

function foodSelectionsComplete(data) {
  return data.remotes > 0 && data.foodSelections.length === data.remotes && data.foodSelections.every((item) => item.toastie && BOOKING_DRINK_CHOICES.includes(item.coffee))
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId))
}

function generateBookingReference(dateKey) {
  const compactDate = String(dateKey || formatDateKey(new Date())).replace(/\D/g, '')
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `RCC-${compactDate}-${time}${suffix}`
}

function createAvailableDates(settings) {
  const today = getAucklandToday()
  const blocked = new Set([...(settings.holidayDates || []), ...(settings.blackoutDates || [])])
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return date
  }).filter((date) => settings.onlineBookingEnabled !== false && (settings.operatingDays || []).includes(date.getDay()) && generateHourlySlots(date, settings.businessHours).length > 0 && !blocked.has(formatDateKey(date)))
}

function normalizeStart(value) {
  const text = String(value || '').trim().toUpperCase().split(/\s+-\s+/)[0]
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]} ${match[3]}` : text
}

function friendlySubmitError(error) {
  const message = String(error?.message || '')
  if (message.includes('CAPACITY_EXCEEDED') || message.toLowerCase().includes('capacity')) return 'The selected hour no longer has enough remotes. Please choose another time slot.'
  return 'We could not submit your booking request right now. Please retry or send an enquiry.'
}

function startOfMonth(date) { const value = new Date(date); value.setDate(1); value.setHours(0, 0, 0, 0); return value }
function addMonths(date, amount) { const value = new Date(date); value.setMonth(value.getMonth() + amount); return value }
function sameDay(a, b) { return Boolean(a && b && a.toDateString() === b.toDateString()) }

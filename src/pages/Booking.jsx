import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  ChevronDown, Clock3, Coffee, Gamepad2, Lock, Mail, MessageSquare, Minus, Phone,
  Plus, RefreshCw, Sandwich, Send, User, X
} from 'lucide-react'
import SEO from '../components/SEO.jsx'
import { PAGE_SEO } from '../data/seo.js'
import { COFFEE_CHOICES, TOASTIE_CHOICES } from '../data/menu.js'
import { fetchSlotAvailability, formatDateDisplay, formatDateKey, getAucklandToday, submitBooking } from '../data/bookingConfig.js'
import { useBookingSettings } from '../hooks/useBookingSettings.js'
import { trackBookingSubmission } from '../hooks/useAnalytics.js'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import { createPendingBooking, fetchApprovedSlotUsage, subscribeToSlotCapacity } from '../services/bookingV2.js'

const STEPS = ['Date', 'Time', 'Remotes', 'Gameplay', 'Food', 'Details', 'Summary']
const FIXED_SLOTS = Array.from({ length: 8 }, (_, index) => {
  const startHour = 9 + index
  return {
    index,
    startTime: formatHour(startHour),
    endTime: formatHour(startHour + 1),
    label: `${formatHour(startHour)} - ${formatHour(startHour + 1)}`
  }
})
const DURATIONS = [
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
    toastieSelection: '',
    drinkSelection: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  })

  const maxCapacity = Math.min(Number(settings.maxCapacity || 8), 8)
  const selectedSlot = data.slotIndex === null ? null : slotsWithAvailability(availability, maxCapacity)[data.slotIndex]
  const duration = DURATIONS.find((item) => item.minutes === data.durationMinutes) || null
  const totalPrice = duration ? data.remotes * duration.price : 0
  const availableDates = useMemo(() => createAvailableDates(settings), [settings])
  const slots = useMemo(() => slotsWithAvailability(availability, maxCapacity), [availability, maxCapacity])

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
        if (isSupabaseConfigured) {
          try {
            const rows = await fetchApprovedSlotUsage(dateKey)
            if (active) setAvailability(Object.fromEntries(rows.map((row) => [normalizeStart(row.slot_time), Number(row.approved_spots || 0)])))
          } catch {
            const result = await fetchSlotAvailability(data.date)
            if (active) setAvailability(appsAvailabilityToUsage(result, maxCapacity))
          }
        } else {
          const result = await fetchSlotAvailability(data.date)
          if (active) setAvailability(appsAvailabilityToUsage(result, maxCapacity))
        }
      } catch {
        if (active) {
          setAvailability({})
          setAvailabilityError('Live availability is temporarily unavailable. Slots are shown with fallback capacity and approval will be confirmed by RCC.')
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
    update({ date, slotIndex: null, remotes: 0 })
    setAvailability({})
    setStep(1)
  }

  const selectSlot = (slot) => {
    if (slot.remaining <= 0) return
    update({ slotIndex: slot.index, remotes: 0 })
    setStep(2)
  }

  const selectRemotes = (count) => {
    if (!selectedSlot || count > selectedSlot.remaining) {
      setErrors({ remotes: `Only ${selectedSlot?.remaining || 0} remote spots remain in this hour.` })
      return
    }
    update({ remotes: count })
    setStep(3)
  }

  const editRemotes = (count) => {
    if (!selectedSlot || count < 1 || count > selectedSlot.remaining) {
      setErrors((current) => ({ ...current, remotes: `Only ${selectedSlot?.remaining || 0} remote spots remain in this hour.` }))
      setRemoteEditorOpen(true)
      return
    }
    update({ remotes: count })
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

    const selectedDuration = DURATIONS.find((item) => item.minutes === data.durationMinutes)
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
      total_price: totalPrice,
      totalPrice,
      packagePrice: totalPrice,
      packageName: `${selectedDuration.minutes} Minute Gameplay`,
      playTime: `${selectedDuration.minutes} Minutes`,
      toastie_selection: data.toastieSelection,
      toastieSelection: data.toastieSelection,
      toastieChoice: data.toastieSelection,
      drink_selection: data.drinkSelection,
      drinkSelection: data.drinkSelection,
      coffeeChoice: data.drinkSelection,
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
      status: 'pending',
      bookingStatus: 'pending',
      source: 'website-v3'
    }

    setSubmitting(true)
    setErrors({})
    try {
      let pendingResult = null
      if (isSupabaseConfigured) {
        try {
          pendingResult = await createPendingBooking(payload)
        } catch {
          pendingResult = null
        }
      }
      const pending = Array.isArray(pendingResult) ? pendingResult[0] : pendingResult
      let bookingId = pending?.booking_id || ''

      if (pending) {
        submitBooking({ ...payload, bookingId }).catch(() => {})
      } else {
        const sheetResult = await submitBooking(payload)
        const status = sheetResult?.status || (sheetResult?.success ? 'success' : '')
        if (status !== 'success') throw new Error(sheetResult?.message || 'Booking request failed.')
        bookingId = sheetResult.bookingId || ''
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
              {step === 0 && <DateStep data={data} viewMonth={viewMonth} setViewMonth={setViewMonth} availableDates={availableDates} onSelect={selectDate} settingsLoading={settingsLoading} settingsError={settingsError} retrySettings={retrySettings} error={errors.date} />}
              {step === 1 && <SlotStep slots={slots} loading={availabilityLoading} error={availabilityError || errors.slot} onSelect={selectSlot} retry={() => setAvailabilityVersion((value) => value + 1)} />}
              {step === 2 && <RemoteStep remaining={selectedSlot?.remaining || 0} selected={data.remotes} onSelect={selectRemotes} error={errors.remotes} />}
              {step === 3 && <DurationStep selected={data.durationMinutes} remotes={data.remotes} onSelect={selectDuration} error={errors.duration} />}
              {step === 4 && <FoodStep data={data} update={update} errors={errors} />}
              {step === 5 && <DetailsStep data={data} update={update} errors={errors} remaining={selectedSlot?.remaining || 0} onEditRemotes={editRemotes} onOpenRemoteEditor={() => setRemoteEditorOpen(true)} />}
              {step === 6 && <ReviewStep error={errors.submit} />}

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
                  <button type="button" onClick={submit} disabled={submitting || capacityReduced} className="btn-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><RefreshCw className="animate-spin" size={17} />Submitting...</> : <><Send size={17} />Submit Booking Request</>}</button>
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

function DateStep({ data, viewMonth, setViewMonth, availableDates, onSelect, settingsLoading, settingsError, retrySettings, error }) {
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
    </div>
  )
}

function SlotStep({ slots, loading, error, onSelect, retry }) {
  return (
    <div>
      <StepHeading icon={Clock3} title="Select 1-Hour Time Slot" text="Choose one fixed hour. Gameplay duration is selected in the next steps." />
      {loading && <InlineNotice>Checking approved remote reservations...</InlineNotice>}
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

function DurationStep({ selected, remotes, onSelect, error }) {
  return (
    <div>
      <StepHeading icon={Clock3} title="Select Gameplay Duration" text="Both gameplay options take place inside your selected 1-hour booking slot." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {DURATIONS.map((option) => {
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
  return (
    <div>
      <StepHeading icon={Sandwich} title="Choose Your Included Food & Drink" text="Choose one toastie and one hot drink so the RCC team can prepare for your visit." />
      <ChoiceGrid title="Toastie Selection" icon={Sandwich} options={TOASTIE_CHOICES} value={data.toastieSelection} onChange={(value) => update({ toastieSelection: value })} error={errors.toastie} />
      <ChoiceGrid title="Hot Coffee Selection" icon={Coffee} options={COFFEE_CHOICES} value={data.drinkSelection} onChange={(value) => update({ drinkSelection: value })} error={errors.drink} />
    </div>
  )
}

function ChoiceGrid({ title, icon: Icon, options, value, onChange, error }) {
  return <div className="mt-6"><div className="flex items-center gap-2 text-sm font-extrabold"><Icon size={17} className="text-orange-600" />{title} <span className="text-red-500">*</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-sm font-bold transition ${value === option ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-border bg-white hover:border-orange-300'}`}><span>{option}</span>{value === option && <CheckCircle2 size={18} className="text-green-600" />}</button>)}</div>{error && <ErrorText>{error}</ErrorText>}</div>
}

function DetailsStep({ data, update, errors, remaining, onEditRemotes, onOpenRemoteEditor }) {
  return (
    <div>
      <StepHeading icon={User} title="Customer Details" text="We will use these details to review and confirm your booking request." />
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

function ReviewStep({ error }) {
  return <div><StepHeading icon={CheckCircle2} title="Review & Submit" text="Check your selections before sending the request to the RCC team." />{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}</div>
}

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
        <SummaryRow label="Included" value="Any Toastie + Any Hot Coffee" />
        <SummaryRow label="Toastie" value={data.toastieSelection || 'Not selected'} />
        <SummaryRow label="Coffee" value={data.drinkSelection || 'Not selected'} />
        <div className="mt-5 flex items-end justify-between border-t border-border pt-4"><span className="text-xs font-extrabold uppercase tracking-widest text-muted">Total</span><span className="font-display text-3xl font-extrabold text-orange-600">${totalPrice}</span></div>
        {duration && data.remotes > 0 && <div className="mt-1 text-right text-xs text-muted">{data.remotes} x ${duration.price} per remote</div>}
        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs leading-relaxed text-charcoal-300"><strong>Status: Pending Confirmation</strong><br />Your booking request will be reviewed by our team. Once approved, your slot will be confirmed.</div>
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

function EnquiryNote() {
  return <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4"><p className="text-sm leading-relaxed text-charcoal-300">{ENQUIRY_COPY}</p><Link to="/contact" className="btn-outline mt-3 min-h-10 w-fit">Send Enquiry <ArrowRight size={15} /></Link></div>
}

function SuccessView({ booking, onReset }) {
  return <section className="bg-[#fffdfa] py-12 sm:py-16"><SEO {...PAGE_SEO['/booking']} path="/booking" /><div className="container-x"><div className="mx-auto max-w-2xl rounded-3xl border border-green-200 bg-white p-6 text-center shadow-card sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700"><CheckCircle2 size={28} /></div><h1 className="mt-5 font-display text-3xl font-extrabold">Booking Request Received</h1><p className="mt-3 text-sm leading-relaxed text-muted">Your request is pending review. RCC will contact you when the selected session is approved.</p>{booking.bookingId && <div className="mt-5 rounded-xl bg-bg-soft px-4 py-3 text-sm"><span className="text-muted">Booking ID</span><strong className="ml-2">{booking.bookingId}</strong></div>}<div className="mt-6 grid gap-3 sm:grid-cols-2"><Link to="/" className="btn-outline">Return Home</Link><button type="button" onClick={onReset} className="btn-primary">Book Another Session</button></div></div></div></section>
}

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
  if (step === 3 && !DURATIONS.some((item) => item.minutes === data.durationMinutes)) return { duration: 'Please select 45 or 60 minutes.' }
  if (step === 4) return { ...(!data.toastieSelection ? { toastie: 'Please select a toastie.' } : {}), ...(!data.drinkSelection ? { drink: 'Please select a hot coffee.' } : {}) }
  if (step === 5) return validateDetails(data)
  return {}
}

function validateAll(data, slot) {
  return {
    ...(!data.date ? { date: 'Please select a date.' } : {}),
    ...(!slot ? { slot: 'Please select a time slot.' } : {}),
    ...(!data.remotes || data.remotes > Number(slot?.remaining || 0) ? { remotes: 'Selected remotes exceed current availability.' } : {}),
    ...(!DURATIONS.some((item) => item.minutes === data.durationMinutes) ? { duration: 'Please select gameplay duration.' } : {}),
    ...(!data.toastieSelection ? { toastie: 'Please select a toastie.' } : {}),
    ...(!data.drinkSelection ? { drink: 'Please select a hot coffee.' } : {}),
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
  if (errors.toastie || errors.drink) return 4
  if (errors.name || errors.email || errors.phone) return 5
  return 6
}

function slotsWithAvailability(usage, capacity) {
  return FIXED_SLOTS.map((slot) => {
    const used = Math.max(Number(usage[normalizeStart(slot.startTime)] || 0), 0)
    return { ...slot, used, remaining: Math.max(capacity - used, 0) }
  })
}

function appsAvailabilityToUsage(result, capacity) {
  const rows = Array.isArray(result) ? result : result?.slots || []
  return Object.fromEntries(rows.map((row) => {
    const remaining = Number(row.remainingSpots ?? row.available ?? capacity)
    return [normalizeStart(row.slot || row.slotTime || row.time), Math.max(capacity - remaining, 0)]
  }))
}

function createAvailableDates(settings) {
  const today = getAucklandToday()
  const blocked = new Set([...(settings.holidayDates || []), ...(settings.blackoutDates || [])])
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return date
  }).filter((date) => !blocked.has(formatDateKey(date)))
}

function normalizeStart(value) {
  const text = String(value || '').trim().toUpperCase().split(/\s+-\s+/)[0]
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]} ${match[3]}` : text
}

function formatHour(hour24) {
  const normalized = hour24 % 24
  const period = normalized >= 12 ? 'PM' : 'AM'
  const hour = normalized % 12 || 12
  return `${String(hour).padStart(2, '0')}:00 ${period}`
}

function friendlySubmitError(error) {
  const message = String(error?.message || '')
  if (message.includes('CAPACITY_EXCEEDED') || message.toLowerCase().includes('capacity')) return 'The selected hour no longer has enough remotes. Please choose another time slot.'
  return 'We could not submit your booking request right now. Please retry or send an enquiry.'
}

function startOfMonth(date) { const value = new Date(date); value.setDate(1); value.setHours(0, 0, 0, 0); return value }
function addMonths(date, amount) { const value = new Date(date); value.setMonth(value.getMonth() + amount); return value }
function sameDay(a, b) { return Boolean(a && b && a.toDateString() === b.toDateString()) }

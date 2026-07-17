import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, Lock, LockOpen, RefreshCw, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminAlert, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { generateHourlySlots } from '../../data/businessHours.js'
import { useBookingSettings } from '../../hooks/useBookingSettings.js'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CLOSURE_REASONS = [
  'Private booking',
  'Venue fully booked',
  'Public holiday',
  'Maintenance',
  'Staff unavailable',
  'Special event',
  'Operational closure',
  'Other'
]

function nzToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date())
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function AdminBookingCalendar() {
  const toast = useToast()
  const { settings } = useBookingSettings()
  const today = nzToday()
  const [year, setYear] = useState(Number(today.split('-')[0]))
  const [selectedDate, setSelectedDate] = useState(null)
  const [dateOverrides, setDateOverrides] = useState({})
  const [slotOverrides, setSlotOverrides] = useState({})
  const [bookingCounts, setBookingCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const [dateRes, slotRes, bookingRes] = await Promise.all([
      supabase.from('booking_date_overrides').select('*').gte('booking_date', startDate).lte('booking_date', endDate),
      supabase.from('booking_slot_overrides').select('*').gte('booking_date', startDate).lte('booking_date', endDate),
      supabase.from('bookings_mirror').select('booking_date,booking_time,group_size,status').gte('booking_date', startDate).lte('booking_date', endDate).in('status', ['pending', 'confirmed'])
    ])
    if (dateRes.error) setError(dateRes.error.message)
    const dateMap = {}
    for (const row of dateRes.data || []) dateMap[row.booking_date] = row
    setDateOverrides(dateMap)

    const slotMap = {}
    for (const row of slotRes.data || []) {
      if (!slotMap[row.booking_date]) slotMap[row.booking_date] = {}
      slotMap[row.booking_date][row.slot_start] = row
    }
    setSlotOverrides(slotMap)

    const countMap = {}
    for (const row of bookingRes.data || []) {
      const key = `${row.booking_date}|${row.booking_time}`
      if (!countMap[row.booking_date]) countMap[row.booking_date] = { total: 0, pending: 0, confirmed: 0, slots: {} }
      const remotes = Number(row.group_size || 0)
      countMap[row.booking_date].total += remotes
      countMap[row.booking_date][row.status] = (countMap[row.booking_date][row.status] || 0) + remotes
      if (!countMap[row.booking_date].slots[row.booking_time]) countMap[row.booking_date].slots[row.booking_time] = { pending: 0, confirmed: 0, total: 0 }
      countMap[row.booking_date].slots[row.booking_time][row.status] = (countMap[row.booking_date].slots[row.booking_time][row.status] || 0) + remotes
      countMap[row.booking_date].slots[row.booking_time].total += remotes
    }
    setBookingCounts(countMap)
    setLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  const toggleDayClosure = async (date, currentOverride) => {
    setWorking(true)
    if (currentOverride?.is_closed) {
      const { error: delError } = await supabase.from('booking_date_overrides').delete().eq('id', currentOverride.id)
      if (delError) { toast.error(delError.message); setWorking(false); return }
      toast.success(`${date} reopened.`)
    } else {
      const reason = await promptReason('Close this day?')
      if (reason === null) { setWorking(false); return }
      const { error: upsertError } = await supabase.from('booking_date_overrides').upsert({ booking_date: date, is_closed: true, reason: reason || 'Operational closure' }, { onConflict: 'booking_date' })
      if (upsertError) { toast.error(upsertError.message); setWorking(false); return }
      toast.success(`${date} closed: ${reason || 'Operational closure'}`)
    }
    setWorking(false)
    load()
  }

  const toggleSlotClosure = async (date, slotStart, currentOverride) => {
    setWorking(true)
    if (currentOverride?.is_closed) {
      const { error: delError } = await supabase.from('booking_slot_overrides').delete().eq('id', currentOverride.id)
      if (delError) { toast.error(delError.message); setWorking(false); return }
      toast.success(`${date} ${slotStart} reopened.`)
    } else {
      const reason = await promptReason(`Close ${slotStart}?`)
      if (reason === null) { setWorking(false); return }
      const { error: upsertError } = await supabase.from('booking_slot_overrides').upsert({ booking_date: date, slot_start: slotStart, is_closed: true, reason: reason || 'Operational closure' }, { onConflict: 'booking_date,slot_start' })
      if (upsertError) { toast.error(upsertError.message); setWorking(false); return }
      toast.success(`${date} ${slotStart} closed.`)
    }
    setWorking(false)
    load()
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Availability Management" title="Booking Calendar" description="Close full days or individual time slots to control booking availability. Existing bookings are preserved." action={<button onClick={load} disabled={loading} className="btn-outline min-h-11"><RefreshCw size={16} />Refresh</button>} />
      {error && <div className="mt-5"><AdminAlert type="error">{error}</AdminAlert></div>}
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => setYear(year - 1)} className="btn-outline min-h-11"><ChevronLeft size={16} /></button>
        <h2 className="font-display text-2xl font-extrabold">{year}</h2>
        <button onClick={() => setYear(year + 1)} className="btn-outline min-h-11"><ChevronRight size={16} /></button>
      </div>
      {loading ? <div className="mt-6 text-sm text-muted">Loading calendar data...</div> : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {MONTH_NAMES.map((name, month) => (
            <MonthCard key={month} name={name} year={year} month={month} today={today} dateOverrides={dateOverrides} slotOverrides={slotOverrides} bookingCounts={bookingCounts} maxCapacity={settings.maxCapacity || 8} onSelect={setSelectedDate} selectedDate={selectedDate} />
          ))}
        </div>
      )}
      {selectedDate && (
        <DateDetailPanel
          date={selectedDate}
          dateOverride={dateOverrides[selectedDate]}
          slotOverrides={slotOverrides[selectedDate] || {}}
          counts={bookingCounts[selectedDate] || { total: 0, pending: 0, confirmed: 0, slots: {} }}
          maxCapacity={settings.maxCapacity || 8}
          businessHours={settings.businessHours}
          working={working}
          onClose={() => setSelectedDate(null)}
          onToggleDay={() => toggleDayClosure(selectedDate, dateOverrides[selectedDate])}
          onToggleSlot={(slotStart) => toggleSlotClosure(selectedDate, slotStart, slotOverrides[selectedDate]?.[slotStart])}
        />
      )}
    </div>
  )
}

function MonthCard({ name, year, month, today, dateOverrides, slotOverrides, bookingCounts, maxCapacity, onSelect, selectedDate }) {
  const cells = useMemo(() => monthGrid(year, month), [year, month])
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <h3 className="mb-3 text-center text-xs font-extrabold uppercase tracking-widest text-orange-600">{name}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted">{DAY_LABELS.map((d) => <div key={d}>{d}</div>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <div key={`e${index}`} />
          const dk = dateKey(year, month, day)
          const isToday = dk === today
          const isPast = dk < today
          const isSelected = dk === selectedDate
          const isClosed = dateOverrides[dk]?.is_closed
          const hasSlotClosure = Object.values(slotOverrides[dk] || {}).some((s) => s.is_closed)
          const counts = bookingCounts[dk]
          const totalRemotes = counts?.total || 0
          const hasPending = (counts?.pending || 0) > 0
          const isFull = totalRemotes >= maxCapacity && !isClosed

          let bg = 'bg-white hover:bg-orange-50'
          if (isPast) bg = 'bg-gray-50 text-gray-400'
          else if (isClosed) bg = 'bg-red-50 text-red-700'
          else if (isFull) bg = 'bg-orange-100 text-orange-800'
          else if (totalRemotes > 0) bg = 'bg-green-50 text-green-800'

          return (
            <button key={day} onClick={() => onSelect(dk)} className={`relative flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold transition ${bg} ${isSelected ? 'ring-2 ring-orange-500' : ''} ${isToday ? 'ring-1 ring-orange-300' : ''}`}>
              {day}
              {isClosed && <Lock className="absolute right-0.5 top-0.5" size={8} />}
              {!isClosed && hasSlotClosure && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />}
              {hasPending && !isClosed && <span className="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-400" />}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold text-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" />Booked</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />Pending</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />Closed</span>
      </div>
    </div>
  )
}

function DateDetailPanel({ date, dateOverride, slotOverrides, counts, maxCapacity, businessHours, working, onClose, onToggleDay, onToggleSlot }) {
  const isClosed = dateOverride?.is_closed
  const slots = useMemo(() => generateHourlySlots(date, businessHours), [date, businessHours])
  const existingBookings = counts.total > 0
  const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland' })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold">{dayName}</h2>
            <p className="mt-1 text-xs text-muted">{isClosed ? `Day closed: ${dateOverride?.reason || 'No reason'}` : `${counts.total} of ${maxCapacity} max remotes active`}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border border-border"><X size={18} /></button>
        </div>

        {existingBookings && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div><strong>Existing bookings:</strong> {counts.pending || 0} pending, {counts.confirmed || 0} confirmed ({counts.total} remotes total). Closures do not cancel existing bookings.</div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button disabled={working} onClick={onToggleDay} className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition disabled:opacity-40 ${isClosed ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>
            {isClosed ? <><LockOpen size={15} />Reopen Day</> : <><Lock size={15} />Close Entire Day</>}
          </button>
          <Link to={`/admin/bookings?date=${date}`} className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-bold hover:bg-bg-soft">
            <Calendar size={15} />View Bookings
          </Link>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Time Slots</div>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border">
            {slots.length === 0 && <div className="p-4 text-center text-sm text-muted">No scheduled slots for this date.</div>}
            {slots.map((slot) => {
              const slotCounts = counts.slots?.[slot.startTime] || { pending: 0, confirmed: 0, total: 0 }
              const slotClosed = slotOverrides[slot.startTime]?.is_closed || isClosed
              const slotFull = slotCounts.total >= maxCapacity
              const remaining = Math.max(maxCapacity - slotCounts.total, 0)

              return (
                <div key={slot.startTime} className={`flex items-center justify-between gap-3 px-4 py-3 ${slotClosed ? 'bg-red-50/50' : slotFull ? 'bg-orange-50/50' : ''}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold">{slot.label || slot.startTime}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {slotClosed ? (
                        <span className="text-red-600">{isClosed ? 'Day closed' : slotOverrides[slot.startTime]?.reason || 'Closed'}</span>
                      ) : (
                        <>
                          {slotCounts.pending > 0 && <span className="text-orange-600">{slotCounts.pending} pending</span>}
                          {slotCounts.pending > 0 && slotCounts.confirmed > 0 && ' · '}
                          {slotCounts.confirmed > 0 && <span className="text-green-700">{slotCounts.confirmed} confirmed</span>}
                          {slotCounts.total > 0 && <span className="ml-1 text-muted">({remaining} left)</span>}
                          {slotCounts.total === 0 && <span>{maxCapacity} available</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CapacityBar used={slotCounts.total} max={maxCapacity} closed={slotClosed} />
                    {!isClosed && (
                      <button disabled={working} onClick={() => onToggleSlot(slot.startTime)} className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border text-xs transition disabled:opacity-40 ${slotClosed ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-red-200 text-red-500 hover:bg-red-50'}`} title={slotClosed ? 'Reopen slot' : 'Close slot'}>
                        {slotClosed ? <LockOpen size={14} /> : <Lock size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CapacityBar({ used, max, closed }) {
  const pct = Math.min((used / max) * 100, 100)
  let color = 'bg-green-400'
  if (closed) color = 'bg-red-400'
  else if (pct >= 100) color = 'bg-orange-500'
  else if (pct >= 50) color = 'bg-orange-300'
  return (
    <div className="h-2 w-16 rounded-full bg-gray-200" title={closed ? 'Closed' : `${used}/${max}`}>
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: closed ? '100%' : `${pct}%` }} />
    </div>
  )
}

function promptReason(title) {
  return new Promise((resolve) => {
    const reason = window.prompt(`${title}\n\nSelect a reason:\n${CLOSURE_REASONS.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nType a number or custom reason (Cancel to abort):`)
    if (reason === null) return resolve(null)
    const num = parseInt(reason, 10)
    if (num >= 1 && num <= CLOSURE_REASONS.length) return resolve(CLOSURE_REASONS[num - 1])
    resolve(reason.trim() || 'Operational closure')
  })
}

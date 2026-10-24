import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Ban, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, Lock, LockOpen, RefreshCw, ThumbsDown, ThumbsUp, X, XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminAlert, AdminBadge, AdminModal, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { generateHourlySlots } from '../../data/businessHours.js'
import { useBookingSettings } from '../../hooks/useBookingSettings.js'
import {
  approveBooking, cancelBooking, isConfirmedStatus,
  markConfirmationEmailSent, markRejectionEmailSent,
  rejectBooking, updateBookingStatus
} from '../../services/bookingV2.js'
import { bookingToSheetPayload, syncGoogleSheet } from '../../services/googleSheetSync.js'

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

const REJECTION_REASONS = [
  'Selected slot is no longer available',
  'Private event / full venue booking',
  'Operational closure',
  'Maintenance',
  'Capacity issue',
  'Other'
]

const MANAGE_ROLES = ['super_admin', 'admin', 'manager']

function nzToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date())
}

function fmtDateKey(year, month, day) {
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
  const { role } = useAdminAuth()
  const toast = useToast()
  const { settings } = useBookingSettings()
  const today = nzToday()
  const canManage = MANAGE_ROLES.includes(role)

  const todayParts = today.split('-')
  const [viewYear, setViewYear] = useState(Number(todayParts[0]))
  const [viewMonth, setViewMonth] = useState(Number(todayParts[1]) - 1)

  const [selectedDate, setSelectedDate] = useState(null)
  const [dateOverrides, setDateOverrides] = useState({})
  const [slotOverrides, setSlotOverrides] = useState({})
  const [bookingCounts, setBookingCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dateBookings, setDateBookings] = useState([])
  const [dateLoading, setDateLoading] = useState(false)
  const [expandedSlots, setExpandedSlots] = useState(new Set())

  const [working, setWorking] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [closureModal, setClosureModal] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const maxCapacity = settings.maxCapacity || 8
  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToday = () => {
    setViewYear(Number(todayParts[0]))
    setViewMonth(Number(todayParts[1]) - 1)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate()
    const startDate = fmtDateKey(viewYear, viewMonth, 1)
    const endDate = fmtDateKey(viewYear, viewMonth, lastDay)

    const [dateRes, slotRes, bookingRes] = await Promise.all([
      supabase.from('booking_date_overrides').select('*').gte('booking_date', startDate).lte('booking_date', endDate),
      supabase.from('booking_slot_overrides').select('*').gte('booking_date', startDate).lte('booking_date', endDate),
      supabase.from('bookings_mirror')
        .select('booking_date,booking_time,group_size,status')
        .gte('booking_date', startDate).lte('booking_date', endDate)
        .in('status', ['pending', 'confirmed', 'approved'])
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
      const st = row.status === 'approved' ? 'confirmed' : row.status
      if (!countMap[row.booking_date]) countMap[row.booking_date] = { total: 0, pending: 0, confirmed: 0, bookings: 0, slots: {} }
      const remotes = Number(row.group_size || 0)
      countMap[row.booking_date].total += remotes
      countMap[row.booking_date].bookings += 1
      countMap[row.booking_date][st] = (countMap[row.booking_date][st] || 0) + remotes
      const timeKey = row.booking_time || ''
      if (!countMap[row.booking_date].slots[timeKey]) countMap[row.booking_date].slots[timeKey] = { pending: 0, confirmed: 0, total: 0 }
      countMap[row.booking_date].slots[timeKey][st] = (countMap[row.booking_date].slots[timeKey][st] || 0) + remotes
      countMap[row.booking_date].slots[timeKey].total += remotes
    }
    setBookingCounts(countMap)
    setLoading(false)
  }, [viewYear, viewMonth])

  const loadDateDetail = useCallback(async (date) => {
    if (!date) return
    setDateLoading(true)
    const { data } = await supabase
      .from('bookings_mirror')
      .select('*')
      .eq('booking_date', date)
      .order('booking_time')
    setDateBookings(data || [])
    setDateLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (selectedDate) {
      loadDateDetail(selectedDate)
      setExpandedSlots(new Set())
    } else {
      setDateBookings([])
    }
  }, [selectedDate, loadDateDetail])

  useEffect(() => {
    const channel = supabase
      .channel('calendar-bookings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_mirror' }, () => {
        load()
        if (selectedDateRef.current) loadDateDetail(selectedDateRef.current)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load, loadDateDetail])

  const refreshAll = () => {
    load()
    if (selectedDate) loadDateDetail(selectedDate)
  }

  // ---- Booking Actions ----

  const recordSheetSync = async (id, result) => {
    await supabase.from('bookings_mirror').update({
      synced_to_sheet_at: result.success ? new Date().toISOString() : null,
      sheet_sync_error: result.success ? null : result.message
    }).eq('id', id)
  }

  const syncBookingAction = async (action, booking) => {
    const result = await syncGoogleSheet(action, bookingToSheetPayload(booking))
    await recordSheetSync(booking.id, result)
    if (!result.success) toast.warning(`Booking saved. ${result.message}`)
  }

  const handleApprove = async (booking) => {
    if (!canManage) return
    setWorkingId(booking.id)
    try {
      const updated = await approveBooking(booking.id)
      toast.success(`${booking.booking_id || 'Booking'} approved.`)

      if (!updated.confirmation_email_sent_at) {
        const emailResult = await syncGoogleSheet('sendEmail', {
          emailType: 'booking_confirmed',
          ...bookingToSheetPayload(updated)
        })
        if (emailResult.success) {
          await markConfirmationEmailSent(booking.id).catch(() => {})
          toast.success('Confirmation email sent.')
        } else {
          toast.warning(`Approved but email failed: ${emailResult.message}`)
        }
      }

      await syncBookingAction('bookingUpdated', updated)
    } catch (err) {
      const msg = err.message?.includes('CAPACITY_EXCEEDED')
        ? err.message.replace('CAPACITY_EXCEEDED:', '').trim()
        : err.message
      toast.error(msg)
    } finally {
      setWorkingId('')
      refreshAll()
    }
  }

  const handleReject = async (booking, reason, note) => {
    if (!canManage) return
    setWorkingId(booking.id)
    try {
      const updated = await rejectBooking(booking.id, reason, note)
      toast.success(`${booking.booking_id || 'Booking'} rejected.`)

      if (!updated.rejection_email_sent_at) {
        const emailResult = await syncGoogleSheet('sendEmail', {
          emailType: 'booking_rejected',
          rejectionReason: reason,
          ...bookingToSheetPayload(updated)
        })
        if (emailResult.success) {
          await markRejectionEmailSent(booking.id).catch(() => {})
        } else {
          toast.warning(`Rejected but email failed: ${emailResult.message}`)
        }
      }

      await syncBookingAction('bookingCancelled', updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkingId('')
      setRejectTarget(null)
      refreshAll()
    }
  }

  const confirmCancellation = async (booking, reason) => {
    if (!canManage) return
    setWorkingId(booking.id)
    try {
      const updated = await cancelBooking(booking.id, reason)
      toast.success(`${booking.booking_id || 'Booking'} cancelled.`)
      await syncBookingAction('bookingCancelled', updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkingId('')
      setCancelTarget(null)
      refreshAll()
    }
  }

  const changeStatus = async (booking, status) => {
    if (!canManage) return
    setWorkingId(booking.id)
    try {
      const updated = await updateBookingStatus(booking.id, status)
      toast.success(`${booking.booking_id || 'Booking'} marked ${status.replace('_', ' ')}.`)
      await syncBookingAction('bookingUpdated', updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkingId('')
      refreshAll()
    }
  }

  // ---- Closure Actions ----

  const closeDayWithReason = async (date, reason) => {
    setWorking(true)
    const { error: err } = await supabase.from('booking_date_overrides')
      .upsert({ booking_date: date, is_closed: true, reason: reason || 'Operational closure' }, { onConflict: 'booking_date' })
    setWorking(false)
    if (err) return toast.error(err.message)
    toast.success(`${date} closed: ${reason || 'Operational closure'}`)
    refreshAll()
  }

  const reopenDay = async (date, overrideId) => {
    setWorking(true)
    const { error: err } = await supabase.from('booking_date_overrides').delete().eq('id', overrideId)
    setWorking(false)
    if (err) return toast.error(err.message)
    toast.success(`${date} reopened.`)
    refreshAll()
  }

  const closeSlotWithReason = async (date, slotStart, reason) => {
    setWorking(true)
    const { error: err } = await supabase.from('booking_slot_overrides')
      .upsert({ booking_date: date, slot_start: slotStart, is_closed: true, reason: reason || 'Operational closure' }, { onConflict: 'booking_date,slot_start' })
    setWorking(false)
    if (err) return toast.error(err.message)
    toast.success(`${date} ${slotStart} closed.`)
    refreshAll()
  }

  const reopenSlot = async (date, slotStart, overrideId) => {
    setWorking(true)
    const { error: err } = await supabase.from('booking_slot_overrides').delete().eq('id', overrideId)
    setWorking(false)
    if (err) return toast.error(err.message)
    toast.success(`${date} ${slotStart} reopened.`)
    refreshAll()
  }

  const bulkCloseSlots = async (date, fromSlotStart, reason) => {
    setWorking(true)
    const slots = generateHourlySlots(date, settings.businessHours)
    const fromIndex = slots.findIndex(s => s.startTime === fromSlotStart)
    if (fromIndex < 0) { setWorking(false); return }
    const slotsToClose = slots.slice(fromIndex)
    const rows = slotsToClose.map(slot => ({
      booking_date: date, slot_start: slot.startTime, is_closed: true, reason: reason || 'Operational closure'
    }))
    const { error: err } = await supabase.from('booking_slot_overrides').upsert(rows, { onConflict: 'booking_date,slot_start' })
    setWorking(false)
    if (err) return toast.error(err.message)
    toast.success(`${slotsToClose.length} slot(s) closed from ${fromSlotStart}.`)
    refreshAll()
  }

  const handleClosureConfirm = (reason) => {
    if (!closureModal) return
    if (closureModal.type === 'day') closeDayWithReason(closureModal.date, reason)
    else if (closureModal.type === 'bulk') bulkCloseSlots(closureModal.date, closureModal.slotStart, reason)
    else closeSlotWithReason(closureModal.date, closureModal.slotStart, reason)
    setClosureModal(null)
  }

  const cells = useMemo(() => monthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const isCurrentMonth = viewYear === Number(todayParts[0]) && viewMonth === Number(todayParts[1]) - 1

  return (
    <div>
      <AdminPageHeader
        eyebrow="Availability Management"
        title="Booking Calendar"
        description="Manage daily availability, slot closures, and approve or reject bookings directly from the calendar."
        action={<button onClick={refreshAll} disabled={loading} className="btn-outline min-h-11"><RefreshCw size={16} />Refresh</button>}
      />

      {error && <div className="mt-5"><AdminAlert type="error">{error}</AdminAlert></div>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-outline min-h-11 !px-3"><ChevronLeft size={18} /></button>
          <h2 className="min-w-44 text-center font-display text-xl font-extrabold sm:min-w-52 sm:text-2xl">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button onClick={nextMonth} className="btn-outline min-h-11 !px-3"><ChevronRight size={18} /></button>
        </div>
        {!isCurrentMonth && (
          <button onClick={goToday} className="btn-outline min-h-11 text-xs">Today</button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted">Loading calendar data...</div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-white p-3 shadow-soft sm:p-5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <div key={`e${index}`} />
              const dk = fmtDateKey(viewYear, viewMonth, day)
              const isToday = dk === today
              const isPast = dk < today
              const isSelected = dk === selectedDate
              const isClosed = dateOverrides[dk]?.is_closed
              const hasSlotClosure = Object.values(slotOverrides[dk] || {}).some(s => s.is_closed)
              const counts = bookingCounts[dk]
              const pendingRemotes = counts?.pending || 0
              const confirmedRemotes = counts?.confirmed || 0
              const bookingCount = counts?.bookings || 0

              let bg = 'bg-white hover:bg-orange-50'
              if (isPast) bg = 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              else if (isClosed) bg = 'bg-red-50 text-red-700 hover:bg-red-100'
              else if (bookingCount > 0) bg = 'bg-green-50 text-green-800 hover:bg-green-100'

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dk === selectedDate ? null : dk)}
                  className={`relative flex min-h-14 w-full flex-col items-center justify-start gap-0.5 rounded-xl p-1 text-xs font-bold transition sm:min-h-20 sm:items-start sm:p-2 ${bg} ${isSelected ? 'ring-2 ring-orange-500' : ''} ${isToday ? 'ring-2 ring-orange-300' : ''}`}
                >
                  <span className={`text-sm font-extrabold ${isToday ? 'text-orange-600' : ''}`}>{day}</span>
                  {isClosed && <Lock className="text-red-500" size={11} />}
                  {!isClosed && bookingCount > 0 && (
                    <span className="hidden text-[10px] font-bold text-muted sm:block">
                      {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <div className="flex gap-0.5">
                    {!isClosed && pendingRemotes > 0 && <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />}
                    {!isClosed && confirmedRemotes > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                    {!isClosed && hasSlotClosure && <span className="h-1.5 w-1.5 rounded-full bg-red-400" />}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-[10px] font-bold text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />Confirmed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" />Pending</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />Closed</span>
          </div>
        </div>
      )}

      {selectedDate && (
        <DateDrawer
          date={selectedDate}
          dateOverride={dateOverrides[selectedDate]}
          slotOverrides={slotOverrides[selectedDate] || {}}
          bookings={dateBookings}
          bookingsLoading={dateLoading}
          maxCapacity={maxCapacity}
          businessHours={settings.businessHours}
          canManage={canManage}
          working={working}
          workingId={workingId}
          expandedSlots={expandedSlots}
          onClose={() => setSelectedDate(null)}
          onToggleSlotExpand={(slotTime) => setExpandedSlots(prev => {
            const next = new Set(prev)
            next.has(slotTime) ? next.delete(slotTime) : next.add(slotTime)
            return next
          })}
          onClosureRequest={setClosureModal}
          onReopenDay={() => reopenDay(selectedDate, dateOverrides[selectedDate]?.id)}
          onReopenSlot={(slotStart) => reopenSlot(selectedDate, slotStart, slotOverrides[selectedDate]?.[slotStart]?.id)}
          onApprove={handleApprove}
          onReject={setRejectTarget}
          onCancel={setCancelTarget}
          onComplete={(booking) => changeStatus(booking, 'completed')}
          onNoShow={(booking) => changeStatus(booking, 'no_show')}
        />
      )}

      {closureModal && (
        <ClosureReasonModal
          title={closureModal.type === 'day' ? `Close ${closureModal.date}` : closureModal.type === 'bulk' ? `Close slots from ${closureModal.slotStart}` : `Close ${closureModal.slotStart}`}
          working={working}
          onClose={() => setClosureModal(null)}
          onConfirm={handleClosureConfirm}
        />
      )}

      {rejectTarget && (
        <RejectBookingModal
          booking={rejectTarget}
          working={workingId === rejectTarget.id}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          working={workingId === cancelTarget.id}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancellation}
        />
      )}
    </div>
  )
}

function DateDrawer({
  date, dateOverride, slotOverrides, bookings, bookingsLoading,
  maxCapacity, businessHours, canManage, working, workingId,
  expandedSlots, onClose, onToggleSlotExpand, onClosureRequest,
  onReopenDay, onReopenSlot, onApprove, onReject, onCancel, onComplete, onNoShow
}) {
  const isClosed = dateOverride?.is_closed
  const slots = useMemo(() => generateHourlySlots(date, businessHours), [date, businessHours])
  const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland'
  })

  const bookingsBySlot = useMemo(() => {
    const map = {}
    for (const b of bookings) {
      const key = b.booking_time || ''
      if (!map[key]) map[key] = []
      map[key].push(b)
    }
    return map
  }, [bookings])

  const activeBookings = useMemo(() =>
    bookings.filter(b => b.status === 'pending' || isConfirmedStatus(b.status)),
    [bookings]
  )

  const pendingCount = activeBookings.filter(b => b.status === 'pending').length
  const confirmedCount = activeBookings.filter(b => isConfirmedStatus(b.status)).length
  const totalRemotes = activeBookings.reduce((sum, b) => sum + Number(b.group_size || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-border bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold">{dayName}</h2>
              {isClosed && <p className="mt-1 text-xs font-bold text-red-600">Day closed: {dateOverride?.reason || 'No reason'}</p>}
            </div>
            <button onClick={onClose} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border border-border">
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <SummaryStat label="Bookings" value={activeBookings.length} />
            <SummaryStat label="Remotes" value={totalRemotes} />
            <SummaryStat label="Pending" value={pendingCount} tone="orange" />
            <SummaryStat label="Confirmed" value={confirmedCount} tone="green" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {isClosed ? (
              <button disabled={working} onClick={onReopenDay} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-green-200 px-3 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-40">
                <LockOpen size={14} />Reopen Day
              </button>
            ) : (
              <button disabled={working} onClick={() => onClosureRequest({ type: 'day', date })} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40">
                <Lock size={14} />Close Day
              </button>
            )}
            <Link to={`/admin/bookings?date=${date}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold hover:bg-bg-soft">
              View in Bookings
            </Link>
          </div>

          {activeBookings.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-[11px] text-orange-800">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>Closures prevent new bookings but do not cancel existing ones.</span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Time Slots</div>
            {!isClosed && slots.length > 1 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) onClosureRequest({ type: 'bulk', date, slotStart: e.target.value })
                  e.target.value = ''
                }}
                className="rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-bold text-muted"
              >
                <option value="">Bulk close from...</option>
                {slots.map(slot => (
                  <option key={slot.startTime} value={slot.startTime}>{slot.startTime}</option>
                ))}
              </select>
            )}
          </div>

          {bookingsLoading ? (
            <div className="mt-3 text-sm text-muted">Loading bookings...</div>
          ) : (
            <div className="mt-3 space-y-2">
              {slots.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
                  No operating hours for this date.
                </div>
              )}
              {slots.map(slot => {
                const slotClosed = slotOverrides[slot.startTime]?.is_closed || isClosed
                const slotBookings = bookingsBySlot[slot.startTime] || []
                const activeSlotBookings = slotBookings.filter(b => b.status === 'pending' || isConfirmedStatus(b.status))
                const slotRemotes = activeSlotBookings.reduce((sum, b) => sum + Number(b.group_size || 0), 0)
                const isExpanded = expandedSlots.has(slot.startTime)
                const slotPending = activeSlotBookings.filter(b => b.status === 'pending')
                const slotConfirmed = activeSlotBookings.filter(b => isConfirmedStatus(b.status))
                const remaining = Math.max(maxCapacity - slotRemotes, 0)
                const isFull = slotRemotes >= maxCapacity

                return (
                  <div key={slot.startTime} className={`rounded-xl border ${slotClosed ? 'border-red-200 bg-red-50/30' : isFull ? 'border-orange-200 bg-orange-50/30' : 'border-border'}`}>
                    <div className="flex items-center gap-2 p-3">
                      <button
                        onClick={() => slotBookings.length > 0 && onToggleSlotExpand(slot.startTime)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold">{slot.label}</div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                            {slotClosed ? (
                              <span className="font-bold text-red-600">{isClosed ? 'Day closed' : slotOverrides[slot.startTime]?.reason || 'Closed'}</span>
                            ) : (
                              <>
                                <span className="font-bold text-muted">{slotRemotes}/{maxCapacity} remotes</span>
                                {slotPending.length > 0 && <span className="font-bold text-orange-600">{slotPending.length} pending</span>}
                                {slotConfirmed.length > 0 && <span className="font-bold text-green-700">{slotConfirmed.length} confirmed</span>}
                                {!isFull && <span className="text-muted">{remaining} available</span>}
                                {isFull && <span className="font-bold text-orange-700">Full</span>}
                              </>
                            )}
                          </div>
                        </div>
                        <CapacityBar used={slotRemotes} max={maxCapacity} closed={slotClosed} />
                        {slotBookings.length > 0 && (
                          isExpanded
                            ? <ChevronUp size={16} className="flex-shrink-0 text-muted" />
                            : <ChevronDown size={16} className="flex-shrink-0 text-muted" />
                        )}
                      </button>
                      {!isClosed && canManage && (
                        slotClosed ? (
                          <button disabled={working} onClick={() => onReopenSlot(slot.startTime)} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40" title="Reopen slot">
                            <LockOpen size={13} />
                          </button>
                        ) : (
                          <button disabled={working} onClick={() => onClosureRequest({ type: 'slot', date, slotStart: slot.startTime })} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40" title="Close slot">
                            <Lock size={13} />
                          </button>
                        )
                      )}
                    </div>

                    {isExpanded && slotBookings.length > 0 && (
                      <div className="border-t border-border/50">
                        {slotBookings.map(booking => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            canManage={canManage}
                            working={workingId === booking.id}
                            onApprove={onApprove}
                            onReject={onReject}
                            onCancel={onCancel}
                            onComplete={onComplete}
                            onNoShow={onNoShow}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingCard({ booking, canManage, working, onApprove, onReject, onCancel, onComplete, onNoShow }) {
  const isPending = booking.status === 'pending'
  const isConfirmed = isConfirmedStatus(booking.status)
  const isTerminal = ['cancelled', 'completed', 'no_show', 'rejected'].includes(booking.status)

  return (
    <div className={`flex flex-col gap-2 border-t border-border/40 px-3 py-3 first:border-t-0 ${isTerminal ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold">{booking.customer_name}</span>
          <AdminBadge value={booking.status} />
        </div>
        <div className="mt-0.5 text-[11px] text-muted">
          {booking.group_size} remote{Number(booking.group_size) !== 1 ? 's' : ''} &middot; {booking.gameplay_duration || booking.package_duration} min &middot; {booking.booking_id}
        </div>
        {booking.customer_phone && <div className="mt-0.5 text-[11px] text-muted">{booking.customer_phone}</div>}
      </div>
      {canManage && !isTerminal && (
        <div className="flex flex-wrap gap-1.5">
          {isPending && (
            <>
              <ActionBtn icon={ThumbsUp} label="Approve" tone="green" disabled={working} onClick={() => onApprove(booking)} />
              <ActionBtn icon={ThumbsDown} label="Reject" tone="red" disabled={working} onClick={() => onReject(booking)} />
            </>
          )}
          {isConfirmed && (
            <>
              <ActionBtn icon={CheckCircle2} label="Complete" tone="green" disabled={working} onClick={() => onComplete(booking)} />
              <ActionBtn icon={XCircle} label="No Show" disabled={working} onClick={() => onNoShow(booking)} />
              <ActionBtn icon={Ban} label="Cancel" tone="red" disabled={working} onClick={() => onCancel(booking)} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryStat({ label, value, tone }) {
  const color = tone === 'orange' ? 'text-orange-600' : tone === 'green' ? 'text-green-700' : 'text-charcoal-300'
  return (
    <div className="rounded-lg bg-bg-soft p-2 text-center">
      <div className={`text-lg font-extrabold leading-tight ${color}`}>{value}</div>
      <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div>
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
    <div className="h-2.5 w-16 flex-shrink-0 rounded-full bg-gray-200 sm:w-20" title={closed ? 'Closed' : `${used}/${max}`}>
      <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: closed ? '100%' : `${pct}%` }} />
    </div>
  )
}

function ActionBtn({ icon: Icon, label, tone, disabled, onClick }) {
  const colors = tone === 'green' ? 'border-green-200 text-green-700 hover:bg-green-50'
    : tone === 'red' ? 'border-red-200 text-red-700 hover:bg-red-50'
    : 'border-border text-charcoal-300 hover:bg-bg-soft'
  return (
    <button disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${colors}`}>
      <Icon size={12} />{label}
    </button>
  )
}

function ClosureReasonModal({ title, working, onClose, onConfirm }) {
  const [reason, setReason] = useState(CLOSURE_REASONS[0])
  const [custom, setCustom] = useState('')
  const selected = reason === 'Other' ? custom : reason
  return (
    <AdminModal title={title} description="Existing bookings are preserved. Only new bookings are blocked." onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose} disabled={working}>Cancel</button>
          <button className="btn-primary" disabled={working || (reason === 'Other' && !custom.trim())} onClick={() => onConfirm(selected)}>{working ? 'Closing...' : 'Confirm'}</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <label><span className="field-label">Reason</span>
          <select className="field-input" value={reason} onChange={e => setReason(e.target.value)}>
            {CLOSURE_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        {reason === 'Other' && (
          <label><span className="field-label">Custom Reason</span>
            <input className="field-input" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Enter reason..." />
          </label>
        )}
      </div>
    </AdminModal>
  )
}

function RejectBookingModal({ booking, working, onClose, onConfirm }) {
  const [reason, setReason] = useState(REJECTION_REASONS[0])
  const [note, setNote] = useState('')
  return (
    <AdminModal title="Reject this booking?" description={`${booking.booking_id} — ${booking.group_size} remote(s) will be released.`} onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose} disabled={working}>Keep</button>
          <button className="btn-primary" disabled={working} onClick={() => onConfirm(booking, reason, note)}>{working ? 'Rejecting...' : 'Reject'}</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoCell label="Customer" value={booking.customer_name || '-'} />
          <InfoCell label="Date & Time" value={`${booking.booking_date} ${booking.booking_time}`} />
        </div>
        <label><span className="field-label">Reason</span>
          <select className="field-input" value={reason} onChange={e => setReason(e.target.value)}>
            {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label><span className="field-label">Note for Customer <span className="font-normal text-muted">(optional)</span></span>
          <textarea rows={3} className="field-input resize-y" value={note} onChange={e => setNote(e.target.value)} />
        </label>
      </div>
    </AdminModal>
  )
}

function CancelBookingModal({ booking, working, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <AdminModal title="Cancel this booking?" description={booking.booking_id} onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={onClose} disabled={working}>Keep</button>
          <button className="btn-primary" disabled={working} onClick={() => onConfirm(booking, reason)}>{working ? 'Cancelling...' : 'Cancel Booking'}</button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCell label="Customer" value={booking.customer_name || '-'} />
        <InfoCell label="Date & Time" value={`${booking.booking_date} ${booking.booking_time}`} />
        <label className="sm:col-span-2"><span className="field-label">Reason <span className="font-normal text-muted">(optional)</span></span>
          <textarea rows={3} className="field-input resize-y" value={reason} onChange={e => setReason(e.target.value)} />
        </label>
      </div>
    </AdminModal>
  )
}

function InfoCell({ label, value }) {
  return (
    <div>
      <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold">{value}</div>
    </div>
  )
}

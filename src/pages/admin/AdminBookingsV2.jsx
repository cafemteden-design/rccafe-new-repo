import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, Clock3, Edit3, Eye, Mail, Plus, RefreshCw, Search, Sheet, ThumbsDown, ThumbsUp, Utensils, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { AdminAlert, AdminBadge, AdminEmpty, AdminModal, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { bookingToSheetPayload, syncGoogleSheet } from '../../services/googleSheetSync.js'
import { approveBooking, cancelBooking, isConfirmedStatus, markConfirmationEmailSent, markRejectionEmailSent, rejectBooking, updateBookingStatus } from '../../services/bookingV2.js'
import { BOOKING_DRINK_CHOICES, TOASTIE_CHOICES } from '../../data/menu.js'
import { generateHourlySlots } from '../../data/businessHours.js'
import { useBookingSettings } from '../../hooks/useBookingSettings.js'

const FILTERS = ['all', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show']
const CONFIRMED_STATUSES = ['confirmed', 'approved']
const MANAGE_ROLES = ['super_admin', 'admin', 'manager']
const PREP_ROLES = ['super_admin', 'admin', 'manager', 'staff']

const REJECTION_REASONS = [
  'Selected slot is no longer available',
  'Private event / full venue booking',
  'Operational closure',
  'Maintenance',
  'Capacity issue',
  'Other'
]

export default function AdminBookingsV2() {
  const { role } = useAdminAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [filter, setFilter] = useState(searchParams.get('status') || 'pending')
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [slotFilter, setSlotFilter] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(searchParams.get('new') === '1')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const canManage = MANAGE_ROLES.includes(role)
  const canPrep = PREP_ROLES.includes(role)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('bookings_mirror')
      .select('*')
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(500)
    if (loadError) setError(loadError.message)
    else setRows(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel('admin-bookings-v4-confirmed').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_mirror' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) =>
      (filter === 'all' || (filter === 'confirmed' ? isConfirmedStatus(row.status) : row.status === filter)) &&
      (!dateFilter || row.booking_date === dateFilter) &&
      (!slotFilter || row.booking_time === slotFilter) &&
      (!needle || [row.booking_id, row.customer_name, row.customer_phone, row.customer_email, row.booking_date, row.booking_time, row.drink_selection, row.toastie_selection].some((value) => String(value || '').toLowerCase().includes(needle)))
    )
  }, [rows, filter, query, dateFilter, slotFilter])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((item) => [item, item === 'all' ? rows.length : item === 'confirmed' ? rows.filter((row) => isConfirmedStatus(row.status)).length : rows.filter((row) => row.status === item).length])), [rows])

  const replaceRow = (row) => {
    setRows((current) => current.map((item) => item.id === row.id ? row : item))
    setSelected((current) => current?.id === row.id ? row : current)
  }

  const recordSheetSync = async (id, result) => {
    await supabase.from('bookings_mirror').update({
      synced_to_sheet_at: result.success ? new Date().toISOString() : null,
      sheet_sync_error: result.success ? null : result.message
    }).eq('id', id)
  }

  const syncBookingAction = async (action, booking) => {
    const sync = await syncGoogleSheet(action, bookingToSheetPayload(booking))
    await recordSheetSync(booking.id, sync)
    if (!sync.success) toast.warning(`Booking saved. ${sync.message}`)
    return sync
  }

  const handleApprove = async (booking) => {
    if (!canManage) return
    setWorkingId(booking.id)
    setError('')
    try {
      const updated = await approveBooking(booking.id)
      replaceRow(updated)
      toast.success(`${booking.booking_id || 'Booking'} approved and confirmed.`)

      if (!updated.confirmation_email_sent_at) {
        const emailResult = await syncGoogleSheet('sendEmail', {
          emailType: 'booking_confirmed',
          ...bookingToSheetPayload(updated)
        })
        if (emailResult.success) {
          await markConfirmationEmailSent(booking.id).catch(() => {})
          toast.success('Confirmation email sent.')
        } else {
          toast.warning(`Booking approved but email failed: ${emailResult.message}`)
        }
      }

      await syncBookingAction('bookingUpdated', updated)
    } catch (approveError) {
      const message = approveError.message?.includes('CAPACITY_EXCEEDED')
        ? approveError.message.replace('CAPACITY_EXCEEDED:', '').trim()
        : approveError.message
      setError(message)
      toast.error(message)
    } finally {
      setWorkingId('')
    }
  }

  const handleReject = async (booking, reason, note) => {
    if (!canManage) return
    setWorkingId(booking.id)
    setError('')
    try {
      const updated = await rejectBooking(booking.id, reason, note)
      replaceRow(updated)
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
          toast.warning(`Booking rejected but email failed: ${emailResult.message}`)
        }
      }

      await syncBookingAction('bookingCancelled', updated)
    } catch (rejectError) {
      setError(rejectError.message)
      toast.error(rejectError.message)
    } finally {
      setWorkingId('')
      setRejectTarget(null)
    }
  }

  const changeStatus = async (booking, status) => {
    if (!canManage) return
    setWorkingId(booking.id)
    setError('')
    try {
      const updated = await updateBookingStatus(booking.id, status)
      replaceRow(updated)
      toast.success(`${booking.booking_id || 'Booking'} marked ${status.replace('_', ' ')}.`)
      await syncBookingAction('bookingUpdated', updated)
    } catch (updateError) {
      const message = updateError.message?.includes('CAPACITY_EXCEEDED') ? updateError.message.replace('CAPACITY_EXCEEDED:', '').trim() : updateError.message
      setError(message)
      toast.error(message)
    } finally {
      setWorkingId('')
    }
  }

  const confirmCancellation = async (booking, reason) => {
    if (!canManage) return
    setWorkingId(booking.id)
    setError('')
    try {
      const updated = await cancelBooking(booking.id, reason)
      replaceRow(updated)
      toast.success(`${booking.booking_id || 'Booking'} cancelled.`)
      await syncBookingAction('bookingCancelled', updated)
    } catch (cancelError) {
      setError(cancelError.message)
      toast.error(cancelError.message)
    } finally {
      setWorkingId('')
      setCancelTarget(null)
    }
  }

  const saveEdit = async (values) => {
    setWorkingId(values.id)
    const selections = resizeFoodSelections(values.per_remote_selections, values.group_size, values)
    const firstSelection = selections[0] || {}
    const baseArgs = {
      p_booking_id: values.id,
      p_booking_date: values.booking_date,
      p_booking_time: values.booking_time,
      p_remote_spots: Number(values.group_size),
      p_gameplay_duration: Number(values.gameplay_duration),
      p_price_per_remote: Number(values.price_per_remote),
      p_toastie_selection: firstSelection.toastie || null,
      p_drink_selection: firstSelection.coffee || null,
      p_notes: values.notes || null,
      p_admin_notes: values.admin_notes || null,
      p_payment_status: values.payment_status || 'not_required'
    }
    let { data, error: saveError } = await supabase.rpc('update_booking_admin_v4', {
      ...baseArgs,
      p_business_hours_snapshot: values.business_hours_snapshot || {},
      p_per_remote_selections: selections
    })
    if (saveError && isMissingRpc(saveError, 'update_booking_admin_v4')) {
      const fallback = await supabase.rpc('update_booking_admin_v3', baseArgs)
      data = fallback.data
      saveError = fallback.error
    }
    setWorkingId('')
    if (saveError) return toast.error(saveError.message)
    replaceRow(data)
    setEditing(null)
    toast.success('Booking details updated.')
    await syncBookingAction('bookingUpdated', data)
  }

  const syncBooking = async (booking) => {
    setWorkingId(booking.id)
    const result = await syncGoogleSheet('bookingUpdated', bookingToSheetPayload(booking))
    await recordSheetSync(booking.id, result)
    setWorkingId('')
    result.success ? toast.success('Booking synced to Google Sheet.') : toast.warning(result.message)
  }

  const resendEmail = async (booking) => {
    setWorkingId(booking.id)
    const result = await syncGoogleSheet('sendEmail', { emailType: `booking_${booking.status}`, ...bookingToSheetPayload(booking) })
    setWorkingId('')
    result.success ? toast.success('Email request sent.') : toast.warning(result.message)
  }

  const toggleFoodPrepared = async (booking) => {
    setWorkingId(booking.id)
    const { data, error: prepError } = await supabase.from('bookings_mirror').update({ food_prepared: !booking.food_prepared, updated_at: new Date().toISOString() }).eq('id', booking.id).select().single()
    setWorkingId('')
    if (prepError) return toast.error(prepError.message)
    replaceRow(data)
    toast.success(data.food_prepared ? 'Food marked ready.' : 'Food marked not ready.')
  }

  const createOfflineBooking = async (values) => {
    setWorkingId('new')
    const selections = resizeFoodSelections(values.per_remote_selections, values.group_size, values)
    const firstSelection = selections[0] || {}
    const baseArgs = {
      p_customer_name: values.customer_name,
      p_customer_email: values.customer_email,
      p_customer_phone: values.customer_phone,
      p_booking_date: values.booking_date,
      p_booking_time: values.booking_time,
      p_gameplay_duration: Number(values.gameplay_duration),
      p_price_per_remote: Number(values.price_per_remote),
      p_remote_spots: Number(values.group_size),
      p_toastie_selection: firstSelection.toastie || null,
      p_drink_selection: firstSelection.coffee || null,
      p_notes: values.notes || null,
      p_source: 'admin-offline'
    }
    let { data: created, error: createError } = await supabase.rpc('create_booking_request_v4', {
      ...baseArgs,
      p_business_hours_snapshot: values.business_hours_snapshot || {},
      p_per_remote_selections: selections
    })
    if (createError && isMissingRpc(createError, 'create_booking_request_v4')) {
      const fallback = await supabase.rpc('create_booking_request_v3', baseArgs)
      created = fallback.data
      createError = fallback.error
    }
    setWorkingId('')
    if (createError) return toast.error(createError.message)
    setCreating(false)
    toast.success(`${created.booking_id} created as Pending.`)
    await syncBookingAction('bookingCreated', created)
    load()
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Live Reservations" title="Bookings" description="New bookings arrive as pending and require admin approval. Approved bookings can be completed, marked no-show, or cancelled." action={<div className="flex gap-2"><button type="button" onClick={load} disabled={loading} className="btn-outline min-h-11"><RefreshCw size={16} />Refresh</button>{canManage && <button type="button" onClick={() => setCreating(true)} className="btn-primary min-h-11"><Plus size={16} />Add Booking</button>}</div>} />
      {error && <div className="mt-5"><AdminAlert type="error">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></AdminAlert></div>}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-widest ${filter === item ? 'border-orange-500 bg-orange-500 text-white' : 'border-border bg-white text-charcoal-300'}`}>{labelStatus(item)} <span className="ml-1 opacity-75">{counts[item] || 0}</span></button>)}</div>
      <div className="mt-3 rounded-2xl border border-border bg-white shadow-soft">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(240px,1fr)_180px_180px_auto]"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-soft pl-10 pr-4 text-sm outline-none focus:border-orange-400" placeholder="Search booking, customer, phone or email..." /></label><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="field-input !mt-0" aria-label="Filter booking date" /><select value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)} className="field-input !mt-0" aria-label="Filter time slot"><option value="">All time slots</option>{[...new Set(rows.map(row => row.booking_time).filter(Boolean))].sort().map(slot => <option key={slot}>{slot}</option>)}</select><button type="button" onClick={() => { setQuery(''); setDateFilter(''); setSlotFilter('') }} className="btn-outline min-h-11">Clear</button></div>
        {loading ? <div className="p-4"><AdminSkeleton rows={7} /></div> : filtered.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1050px] text-left"><thead className="bg-bg-soft text-[10px] font-extrabold uppercase tracking-widest text-muted"><tr><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date & Time</th><th className="px-4 py-3">Remotes</th><th className="px-4 py-3">Gameplay</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{filtered.map(booking => <BookingDesktopRow key={booking.id} booking={booking} canManage={canManage} working={workingId === booking.id} onView={setSelected} onApprove={handleApprove} onReject={setRejectTarget} onCancel={setCancelTarget} onComplete={(row) => changeStatus(row, 'completed')} onNoShow={(row) => changeStatus(row, 'no_show')} />)}</tbody></table></div><div className="divide-y divide-border lg:hidden">{filtered.map((booking) => <BookingRow key={booking.id} booking={booking} canManage={canManage} canPrep={canPrep} working={workingId === booking.id} onView={setSelected} onEdit={setEditing} onSync={syncBooking} onEmail={resendEmail} onFood={toggleFoodPrepared} onApprove={handleApprove} onReject={setRejectTarget} onCancel={setCancelTarget} onComplete={(row) => changeStatus(row, 'completed')} onNoShow={(row) => changeStatus(row, 'no_show')} />)}</div></> : <div className="p-5"><AdminEmpty icon={Clock3} title={`No ${filter === 'all' ? '' : labelStatus(filter)} bookings`} description={filter === 'pending' ? 'New customer bookings will appear here for approval.' : 'Bookings matching this filter will appear here.'} /></div>}
      </div>
      {selected && <BookingDetail booking={selected} canManage={canManage} working={workingId === selected.id} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null) }} onApprove={handleApprove} onReject={setRejectTarget} onCancel={setCancelTarget} onComplete={(row) => changeStatus(row, 'completed')} onNoShow={(row) => changeStatus(row, 'no_show')} onSync={syncBooking} onEmail={resendEmail} />}
      {editing && <BookingEditor booking={editing} working={workingId === editing.id} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {creating && <NewBookingModal working={workingId === 'new'} onClose={() => setCreating(false)} onSave={createOfflineBooking} />}
      {cancelTarget && <CancelBookingModal booking={cancelTarget} working={workingId === cancelTarget.id} onClose={() => setCancelTarget(null)} onConfirm={confirmCancellation} />}
      {rejectTarget && <RejectBookingModal booking={rejectTarget} working={workingId === rejectTarget.id} onClose={() => setRejectTarget(null)} onConfirm={handleReject} />}
    </div>
  )
}

function BookingDesktopRow({ booking, canManage, working, onView, onApprove, onReject, onCancel, onComplete, onNoShow }) {
  return <tr className="text-sm"><td className="px-4 py-3 font-mono text-xs font-bold">{booking.booking_id}</td><td className="px-4 py-3"><div className="font-bold">{booking.customer_name}</div><div className="text-xs text-muted">{booking.customer_phone}</div></td><td className="px-4 py-3"><div className="font-bold">{booking.booking_date}</div><div className="text-xs text-muted">{booking.booking_time}</div></td><td className="px-4 py-3"><div className="font-extrabold">{booking.group_size}</div><div className="text-xs text-muted">{foodSelectionStatus(booking)}</div></td><td className="px-4 py-3">{booking.gameplay_duration || booking.package_duration} min</td><td className="px-4 py-3 font-bold">${Number(booking.total_price || booking.package_price || 0).toFixed(2)}</td><td className="px-4 py-3"><AdminBadge value={booking.status} /></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="grid h-10 w-10 place-items-center rounded-lg border border-border" onClick={() => onView(booking)} title="View details"><Eye size={16} /></button>{canManage && booking.status === 'pending' && <><button disabled={working} className="grid h-10 w-10 place-items-center rounded-lg border border-green-200 text-green-700 disabled:opacity-30" onClick={() => onApprove(booking)} title="Approve booking"><ThumbsUp size={16} /></button><button disabled={working} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-700 disabled:opacity-30" onClick={() => onReject(booking)} title="Reject booking"><ThumbsDown size={16} /></button></>}{canManage && isConfirmedStatus(booking.status) && <><button disabled={working} className="grid h-10 w-10 place-items-center rounded-lg border border-green-200 text-green-700 disabled:opacity-30" onClick={() => onComplete(booking)} title="Mark completed"><CheckCircle2 size={16} /></button><button disabled={working} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-700 disabled:opacity-30" onClick={() => onNoShow(booking)} title="Mark no show"><XCircle size={16} /></button><button disabled={working} className="grid h-10 w-10 place-items-center rounded-lg border border-border disabled:opacity-30" onClick={() => onCancel(booking)} title="Cancel Booking"><Ban size={16} /></button></>}</div></td></tr>
}

function BookingRow({ booking, canManage, canPrep, working, onView, onEdit, onSync, onEmail, onFood, onApprove, onReject, onCancel, onComplete, onNoShow }) {
  const duration = booking.gameplay_duration || booking.package_duration
  return <article className="p-4 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Cell label="Customer" value={booking.customer_name || '-'} detail={booking.customer_phone || booking.customer_email} />
      <Cell label="Session" value={`${booking.booking_date || '-'} | ${booking.booking_time || '-'}`} detail={`${booking.group_size || 0} remote spot${Number(booking.group_size) === 1 ? '' : 's'} / ${foodSelectionStatus(booking)}`} />
      <Cell label="Gameplay" value={duration ? `${duration} minutes` : '-'} detail={booking.total_price != null ? `NZD $${Number(booking.total_price || booking.package_price).toFixed(2)}` : ''} />
      <div><div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">Status</div><div className="mt-1"><AdminBadge value={booking.status} /></div><div className="mt-1 text-xs text-muted">{booking.booking_id}</div></div>
    </div>
    <div className="flex flex-wrap gap-2 xl:justify-end">
      <IconAction icon={Eye} label="View" onClick={() => onView(booking)} />
      {canManage && booking.status === 'pending' && <IconAction icon={ThumbsUp} label="Approve" tone="green" disabled={working} onClick={() => onApprove(booking)} />}
      {canManage && booking.status === 'pending' && <IconAction icon={ThumbsDown} label="Reject" tone="red" disabled={working} onClick={() => onReject(booking)} />}
      {canPrep && <IconAction icon={Utensils} label={booking.food_prepared ? 'Food Ready' : 'Prep Food'} tone={booking.food_prepared ? 'green' : undefined} disabled={working} onClick={() => onFood(booking)} />}
      {canManage && <IconAction icon={Edit3} label="Edit" onClick={() => onEdit(booking)} />}
      {canManage && isConfirmedStatus(booking.status) && <IconAction icon={CheckCircle2} label="Completed" tone="green" disabled={working} onClick={() => onComplete(booking)} />}
      {canManage && isConfirmedStatus(booking.status) && <IconAction icon={XCircle} label="No Show" tone="red" disabled={working} onClick={() => onNoShow(booking)} />}
      {canManage && (isConfirmedStatus(booking.status) || booking.status === 'pending') && <IconAction icon={Ban} label="Cancel" disabled={working} onClick={() => onCancel(booking)} />}
      {canManage && <IconAction icon={Mail} label="Email" disabled={working} onClick={() => onEmail(booking)} />}
      {canManage && <IconAction icon={Sheet} label="Sync" disabled={working} onClick={() => onSync(booking)} />}
    </div>
  </div></article>
}

function BookingDetail({ booking, canManage, working, onClose, onEdit, onApprove, onReject, onCancel, onComplete, onNoShow, onSync, onEmail }) {
  const fields = [['Booking Reference', booking.booking_id], ['Date', booking.booking_date], ['Time Slot', booking.slot_label || booking.booking_time], ['Remote Spots', booking.group_size], ['Gameplay', `${booking.gameplay_duration || booking.package_duration || '-'} minutes`], ['Payment', booking.payment_status], ['Total', `NZD $${Number(booking.total_price || booking.package_price || 0).toFixed(2)}`], ['Phone', booking.customer_phone], ['Email', booking.customer_email], ['Notes', booking.notes], ['Admin Notes', booking.admin_notes], ['Approved At', booking.approved_at], ['Rejected At', booking.rejected_at], ['Rejection Reason', booking.rejection_reason], ['Cancelled At', booking.cancelled_at], ['Cancellation Reason', booking.cancellation_reason], ['Cancelled By', booking.cancelled_by]]
  return <AdminModal title={booking.customer_name || 'Booking'} description={`${booking.booking_id || ''} | ${labelStatus(booking.status)}`} onClose={onClose} footer={<div className="flex flex-wrap justify-end gap-2">{canManage && booking.status === 'pending' && <><button className="btn-primary" disabled={working} onClick={() => onApprove(booking)}><ThumbsUp size={16} />Approve</button><button className="btn-outline" disabled={working} onClick={() => onReject(booking)}><ThumbsDown size={16} />Reject</button></>}{canManage && <button className="btn-outline" onClick={onEdit}><Edit3 size={16} />Edit</button>}<button className="btn-outline" disabled={working} onClick={() => onEmail(booking)}><Mail size={16} />Resend Email</button><button className="btn-outline" disabled={working} onClick={() => onSync(booking)}><Sheet size={16} />Sync Sheet</button>{canManage && isConfirmedStatus(booking.status) && <><button className="btn-outline" disabled={working} onClick={() => onComplete(booking)}><CheckCircle2 size={16} />Completed</button><button className="btn-outline" disabled={working} onClick={() => onNoShow(booking)}><XCircle size={16} />No Show</button><button className="btn-primary" disabled={working} onClick={() => onCancel(booking)}><Ban size={16} />Cancel</button></>}</div>}><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <Cell key={label} label={label} value={value || '-'} />)}</div><FoodBreakdown booking={booking} /></AdminModal>
}

function CancelBookingModal({ booking, working, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return <AdminModal title="Cancel this booking?" description={booking.booking_id} onClose={onClose} footer={<div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose} disabled={working}>Keep Booking</button><button className="btn-primary" disabled={working} onClick={() => onConfirm(booking, reason)}>{working ? 'Cancelling...' : 'Confirm Cancellation'}</button></div>}>
    <div className="grid gap-3 sm:grid-cols-2">
      <Cell label="Booking Reference" value={booking.booking_id || '-'} />
      <Cell label="Customer" value={booking.customer_name || '-'} />
      <Cell label="Date and Time" value={`${booking.booking_date || '-'} ${booking.booking_time || ''}`} />
      <Cell label="Status" value={labelStatus(booking.status)} />
      <label className="sm:col-span-2"><span className="field-label">Cancellation Reason <span className="font-normal text-muted">(optional)</span></span><textarea rows={4} className="field-input resize-y" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    </div>
  </AdminModal>
}

function RejectBookingModal({ booking, working, onClose, onConfirm }) {
  const [reason, setReason] = useState(REJECTION_REASONS[0])
  const [customNote, setCustomNote] = useState('')
  return <AdminModal title="Reject this booking?" description={`${booking.booking_id} — This will release ${booking.group_size} remote(s) and notify the customer.`} onClose={onClose} footer={<div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose} disabled={working}>Keep Booking</button><button className="btn-primary" disabled={working} onClick={() => onConfirm(booking, reason, customNote)}>{working ? 'Rejecting...' : 'Confirm Rejection'}</button></div>}>
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Cell label="Customer" value={booking.customer_name || '-'} />
        <Cell label="Date & Time" value={`${booking.booking_date || '-'} ${booking.booking_time || ''}`} />
        <Cell label="Remotes" value={booking.group_size || '-'} />
        <Cell label="Total" value={`NZD $${Number(booking.total_price || 0).toFixed(2)}`} />
      </div>
      <label><span className="field-label">Rejection Reason</span><select className="field-input" value={reason} onChange={(e) => setReason(e.target.value)}>{REJECTION_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
      <label><span className="field-label">Additional Note for Customer <span className="font-normal text-muted">(optional)</span></span><textarea rows={3} className="field-input resize-y" placeholder="Any extra details for the customer..." value={customNote} onChange={(e) => setCustomNote(e.target.value)} /></label>
    </div>
  </AdminModal>
}

function BookingEditor({ booking, working, onClose, onSave }) {
  const [form, setForm] = useState({ ...booking, gameplay_duration: booking.gameplay_duration || booking.package_duration || 45, price_per_remote: booking.price_per_remote || ((booking.gameplay_duration || booking.package_duration) === 60 ? 55 : 45), per_remote_selections: resizeFoodSelections(booking.per_remote_selections, booking.group_size, booking) })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return <AdminModal title="Edit Booking" description="Capacity is rechecked atomically whenever a confirmed booking is changed." onClose={onClose} footer={<div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={working} onClick={() => onSave(form)}>{working ? 'Saving...' : 'Save Changes'}</button></div>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Date"><input type="date" className="field-input" value={form.booking_date || ''} onChange={(e) => update('booking_date', e.target.value)} /></Field>
      <Field label="Time Slot"><input className="field-input" value={form.booking_time || ''} onChange={(e) => update('booking_time', e.target.value)} /></Field>
      <Field label="Remote Spots"><input type="number" min="1" max="8" className="field-input" value={form.group_size || 1} onChange={(e) => { const count = Math.min(8, Math.max(1, Number(e.target.value))); setForm(current => ({ ...current, group_size: count, per_remote_selections: resizeFoodSelections(current.per_remote_selections, count, current) })) }} /></Field>
      <Field label="Gameplay"><select className="field-input" value={form.gameplay_duration} onChange={(e) => { const duration = Number(e.target.value); update('gameplay_duration', duration); update('price_per_remote', duration === 60 ? 55 : 45) }}><option value="45">45 minutes</option><option value="60">60 minutes</option></select></Field>
      <Field label="Price Per Remote"><input type="number" min="0" className="field-input" value={form.price_per_remote || 0} onChange={(e) => update('price_per_remote', e.target.value)} /></Field>
      <Field label="Payment Status"><select className="field-input" value={form.payment_status || 'not_required'} onChange={(e) => update('payment_status', e.target.value)}><option value="not_required">Not Required</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></Field>
      <AdminFoodEditor selections={form.per_remote_selections} onChange={(per_remote_selections) => update('per_remote_selections', per_remote_selections)} />
      <Field label="Customer Notes" wide><textarea className="field-input min-h-20 resize-y" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} /></Field>
      <Field label="Admin Notes" wide><textarea className="field-input min-h-20 resize-y" value={form.admin_notes || ''} onChange={(e) => update('admin_notes', e.target.value)} /></Field>
    </div>
  </AdminModal>
}

function NewBookingModal({ working, onClose, onSave }) {
  const { settings } = useBookingSettings()
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', booking_date: '', booking_time: '', group_size: 1, gameplay_duration: 45, price_per_remote: 45, per_remote_selections: resizeFoodSelections([], 1), notes: '' })
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const slots = useMemo(() => form.booking_date ? generateHourlySlots(form.booking_date, settings.businessHours) : [], [form.booking_date, settings.businessHours])
  const valid = form.customer_name.trim() && form.customer_email.trim() && form.customer_phone.trim() && form.booking_date && form.booking_time && foodSelectionsComplete(form.per_remote_selections, form.group_size)
  return <AdminModal title="Add Booking" description="Creates a pending booking. Approve it afterwards to confirm." onClose={onClose} footer={<div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose}>Cancel</button><button disabled={working || !valid} className="btn-primary disabled:opacity-40" onClick={() => onSave(form)}>{working ? 'Saving...' : 'Create Pending Booking'}</button></div>}><div className="grid gap-4 sm:grid-cols-2"><Field label="Customer Name"><input className="field-input" value={form.customer_name} onChange={e => update('customer_name', e.target.value)} /></Field><Field label="Email"><input type="email" className="field-input" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} /></Field><Field label="Phone"><input className="field-input" value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} /></Field><Field label="Booking Date"><input type="date" className="field-input" value={form.booking_date} onChange={e => setForm(current => ({ ...current, booking_date: e.target.value, booking_time: '' }))} /></Field><Field label="Time Slot"><select className="field-input" value={form.booking_time} onChange={e => update('booking_time', e.target.value)} disabled={!form.booking_date}><option value="">Select time</option>{slots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}</select></Field><Field label="Remote Spots"><input type="number" min="1" max="8" className="field-input" value={form.group_size} onChange={e => { const count = Math.min(8, Math.max(1, Number(e.target.value))); setForm(current => ({ ...current, group_size: count, per_remote_selections: resizeFoodSelections(current.per_remote_selections, count, current) })) }} /></Field><Field label="Gameplay"><select className="field-input" value={form.gameplay_duration} onChange={e => { const value = Number(e.target.value); update('gameplay_duration', value); update('price_per_remote', value === 60 ? 55 : 45) }}><option value="45">45 Minutes</option><option value="60">60 Minutes</option></select></Field><Field label="Price Per Remote"><input type="number" min="0" className="field-input" value={form.price_per_remote} onChange={e => update('price_per_remote', e.target.value)} /></Field><AdminFoodEditor selections={form.per_remote_selections} onChange={(per_remote_selections) => update('per_remote_selections', per_remote_selections)} /><Field label="Notes" wide><textarea className="field-input min-h-20 resize-y" value={form.notes} onChange={e => update('notes', e.target.value)} /></Field></div></AdminModal>
}

function AdminFoodEditor({ selections, onChange }) {
  return <div className="sm:col-span-2"><div className="field-label">Food & Drink Per Remote</div><div className="mt-2 grid gap-3 md:grid-cols-2">{selections.map((item, index) => <div key={index} className="rounded-xl border border-border bg-bg-soft p-3"><div className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Remote {index + 1}</div><select className="field-input" value={item.toastie || ''} onChange={e => onChange(selections.map((row, rowIndex) => rowIndex === index ? { ...row, remote: index + 1, toastie: e.target.value } : row))}><option value="">Select toastie</option>{TOASTIE_CHOICES.map(choice => <option key={choice}>{choice}</option>)}</select><select className="field-input" value={item.coffee || ''} onChange={e => onChange(selections.map((row, rowIndex) => rowIndex === index ? { ...row, remote: index + 1, coffee: e.target.value } : row))}><option value="">Select drink</option>{BOOKING_DRINK_CHOICES.map(choice => <option key={choice}>{choice}</option>)}</select></div>)}</div></div>
}

function FoodBreakdown({ booking }) {
  const selections = normalizeFoodSelections(booking)
  return <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 p-4"><div className="text-xs font-extrabold uppercase tracking-wider text-orange-700">Food & Drink Breakdown</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{selections.map((item, index) => <div key={index} className="rounded-lg bg-white px-3 py-2 text-sm"><strong>Remote {item.remote || index + 1}</strong><div className="text-muted">{item.toastie || 'Not selected'} + {item.coffee || 'Not selected'}</div></div>)}</div>{booking.per_remote_selections == null && <p className="mt-2 text-xs text-muted">Legacy booking: the original shared selection is shown for each remote.</p>}</div>
}

function normalizeFoodSelections(booking) {
  let rows = booking?.per_remote_selections
  if (typeof rows === 'string') { try { rows = JSON.parse(rows) } catch { rows = [] } }
  if (Array.isArray(rows) && rows.length) return rows.map((item, index) => ({ remote: Number(item.remote) || index + 1, toastie: item.toastie || item.toastieSelection || '', coffee: item.coffee || item.drink || item.drinkSelection || '' }))
  return resizeFoodSelections([], booking?.group_size || 1, booking)
}

function resizeFoodSelections(rows, count, legacy = {}) {
  const target = Math.min(8, Math.max(1, Number(count) || 1))
  const source = Array.isArray(rows) ? rows : []
  return Array.from({ length: target }, (_, index) => ({ remote: index + 1, toastie: source[index]?.toastie || source[index]?.toastieSelection || legacy.toastie_selection || '', coffee: source[index]?.coffee || source[index]?.drink || source[index]?.drinkSelection || legacy.drink_selection || '' }))
}

function foodSelectionsComplete(rows, count) {
  return resizeFoodSelections(rows, count).every(item => item.toastie && BOOKING_DRINK_CHOICES.includes(item.coffee))
}

function foodSelectionStatus(booking) {
  const rows = normalizeFoodSelections(booking)
  return rows.every(item => item.toastie && BOOKING_DRINK_CHOICES.includes(item.coffee)) ? 'Food selected' : 'Food incomplete'
}

function isMissingRpc(error, name) {
  const message = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return message.includes('pgrst202') || (message.includes(name.toLowerCase()) && message.includes('schema cache'))
}

function labelStatus(value) {
  if (value === 'approved') return 'Confirmed'
  const text = String(value || '').replaceAll('_', ' ')
  return text ? text[0].toUpperCase() + text.slice(1) : 'All'
}

function Field({ label, children, wide }) {
  return <label className={wide ? 'sm:col-span-2' : ''}><span className="field-label">{label}</span>{children}</label>
}

function Cell({ label, value, detail }) {
  return <div className="min-w-0"><div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div><div className="mt-1 break-words text-sm font-extrabold text-charcoal-300">{value}</div>{detail && <div className="mt-0.5 break-words text-xs text-muted">{detail}</div>}</div>
}

function IconAction({ icon: Icon, label, tone, disabled, onClick }) {
  const colors = tone === 'green' ? 'border-green-200 text-green-700 hover:bg-green-50' : tone === 'red' ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-border text-charcoal-300 hover:bg-bg-soft'
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${colors}`}><Icon size={15} />{label}</button>
}

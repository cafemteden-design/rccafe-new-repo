import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, Check, Clock3, RefreshCw, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { AdminAlert, AdminBadge, AdminEmpty, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled']

export default function AdminBookingsV2() {
  const { role } = useAdminAuth()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [filter, setFilter] = useState('pending')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const canManage = ['super_admin', 'admin', 'manager'].includes(role)

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
    const channel = supabase
      .channel('admin-bookings-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_mirror' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false
      if (!needle) return true
      return [row.booking_id, row.customer_name, row.customer_phone, row.customer_email, row.package_name]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    })
  }, [rows, filter, query])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((item) => [
    item,
    item === 'all' ? rows.length : rows.filter((row) => row.status === item).length
  ])), [rows])

  const changeStatus = async (booking, status) => {
    if (!canManage) return
    setWorkingId(booking.id)
    setError('')
    const { data, error: updateError } = await supabase.rpc('set_booking_status', {
      p_booking_id: booking.id,
      p_status: status,
      p_admin_note: null
    })
    if (updateError) {
      const message = updateError.message?.includes('CAPACITY_EXCEEDED')
        ? updateError.message.replace('CAPACITY_EXCEEDED:', '').trim()
        : updateError.message
      setError(message)
      toast.error(message)
    } else {
      setRows((current) => current.map((row) => row.id === booking.id ? data : row))
      toast.success(`${booking.booking_id || 'Booking'} marked ${status}.`)
    }
    setWorkingId('')
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Live Reservations"
        title="Bookings"
        description="Pending requests reserve no capacity. Remote spots are committed only when an admin approves the booking."
        action={<button type="button" onClick={load} disabled={loading} className="btn-outline min-h-11"><RefreshCw size={16} />Refresh</button>}
      />

      {error && <div className="mt-5"><AdminAlert type="error">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></AdminAlert></div>}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-widest ${filter === item ? 'border-orange-500 bg-orange-500 text-white' : 'border-border bg-white text-charcoal-300'}`}>
            {item} <span className="ml-1 opacity-75">{counts[item]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-white shadow-soft">
        <div className="border-b border-border p-4">
          <label className="relative block max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-soft pl-10 pr-4 text-sm outline-none focus:border-orange-400" placeholder="Search booking, customer, phone or email..." />
          </label>
        </div>

        {loading ? <div className="p-4"><AdminSkeleton rows={7} /></div> : filtered.length ? (
          <div className="divide-y divide-border">
            {filtered.map((booking) => (
              <BookingRow key={booking.id} booking={booking} canManage={canManage} working={workingId === booking.id} onStatus={changeStatus} />
            ))}
          </div>
        ) : <div className="p-5"><AdminEmpty icon={Clock3} title={`No ${filter === 'all' ? '' : filter} bookings`} description="New customer booking requests will appear here instantly." /></div>}
      </div>
    </div>
  )
}

function BookingRow({ booking, canManage, working, onStatus }) {
  return (
    <article className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cell label="Customer" value={booking.customer_name || '-'} detail={booking.customer_phone || booking.customer_email} />
          <Cell label="Session" value={`${booking.booking_date || '-'} · ${booking.booking_time || '-'}`} detail={`${booking.group_size || 0} remote spot${Number(booking.group_size) === 1 ? '' : 's'}`} />
          <Cell label="Package" value={booking.package_name || '-'} detail={booking.package_duration ? `${booking.package_duration} minutes` : ''} />
          <div><div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">Status</div><div className="mt-1"><AdminBadge value={booking.status} /></div><div className="mt-1 text-xs text-muted">{booking.booking_id}</div></div>
        </div>
        {canManage && (
          <div className="grid shrink-0 grid-cols-3 gap-2 xl:w-[310px]">
            <Action icon={Check} label="Approve" tone="green" disabled={working || booking.status === 'approved'} onClick={() => onStatus(booking, 'approved')} />
            <Action icon={X} label="Reject" tone="red" disabled={working || booking.status === 'rejected'} onClick={() => onStatus(booking, 'rejected')} />
            <Action icon={Ban} label="Cancel" tone="dark" disabled={working || booking.status === 'cancelled'} onClick={() => onStatus(booking, 'cancelled')} />
          </div>
        )}
      </div>
    </article>
  )
}

function Cell({ label, value, detail }) {
  return <div className="min-w-0"><div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div><div className="mt-1 truncate text-sm font-extrabold text-charcoal-300">{value}</div>{detail && <div className="mt-0.5 truncate text-xs text-muted">{detail}</div>}</div>
}

function Action({ icon: Icon, label, tone, disabled, onClick }) {
  const colors = tone === 'green' ? 'border-green-200 text-green-700 hover:bg-green-50' : tone === 'red' ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-border text-charcoal-300 hover:bg-bg-soft'
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${colors}`}><Icon size={15} />{label}</button>
}

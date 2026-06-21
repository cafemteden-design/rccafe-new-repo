import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarClock, CalendarPlus, CircleDollarSign, Contact, Gift, History, Package, QrCode, Tags, Users, Utensils } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminBadge, AdminPageHeader, AdminStatCard, AdminStatSkeleton, AdminSkeleton } from '../../components/admin/AdminUI.jsx'

const INITIAL_STATS = {
  today: 0, pending: 0, approved: 0, approvedSpots: 0, remainingCapacity: 0, upcoming: 0, cards: 0, stamps: 0, redeemed: 0, leads: 0, revenue: 0
}

const QUICK_ACTIONS = [
  { to: '/admin/bookings', label: 'Add Booking', icon: CalendarPlus },
  { to: '/admin/packages', label: 'Add Package', icon: Package },
  { to: '/admin/menu', label: 'Add Menu Item', icon: Utensils },
  { to: '/admin/offers', label: 'Add Offer', icon: Tags },
  { to: '/admin/rewards/scanner', label: 'Open Scanner', icon: QrCode }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(INITIAL_STATS)
  const [activity, setActivity] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [recentCards, setRecentCards] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date())
      const requests = await Promise.all([
        supabase.from('bookings_mirror').select('id', { count: 'exact', head: true }).eq('booking_date', today),
        supabase.from('bookings_mirror').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings_mirror').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('reward_cards').select('id', { count: 'exact', head: true }),
        supabase.from('reward_events').select('id', { count: 'exact', head: true }).eq('event_type', 'stamp_added').gte('created_at', `${today}T00:00:00`),
        supabase.from('reward_events').select('id', { count: 'exact', head: true }).eq('event_type', 'reward_redeemed'),
        supabase.from('website_leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('bookings_mirror').select('package_price').in('status', ['approved', 'completed']),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('bookings_mirror').select('id, customer_name, booking_date, package_name, status').order('created_at', { ascending: false }).limit(5),
        supabase.from('reward_cards').select('id, rcc_card_id, full_name, current_stamps, reward_status').order('created_at', { ascending: false }).limit(5),
        supabase.from('website_leads').select('id, full_name, enquiry_type, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings_mirror').select('group_size').eq('booking_date', today).eq('status', 'approved'),
        supabase.from('bookings_mirror').select('id', { count: 'exact', head: true }).gte('booking_date', today).eq('status', 'approved'),
        supabase.from('booking_settings').select('capacity_per_slot,slot_count').eq('id', 1).maybeSingle()
      ])
      if (!active) return
      const firstError = requests.find((result) => result.error)?.error
      if (firstError) setNotice('Dashboard tables are ready in the app. Run the supplied Supabase SQL to activate live metrics.')
      const approvedSpots = (requests[12].data || []).reduce((sum, item) => sum + Number(item.group_size || 0), 0)
      const dailyCapacity = Number(requests[14].data?.capacity_per_slot || 8) * Number(requests[14].data?.slot_count || 8)
      setStats({
        today: requests[0].count || 0,
        pending: requests[1].count || 0,
        approved: requests[2].count || 0,
        approvedSpots,
        remainingCapacity: Math.max(dailyCapacity - approvedSpots, 0),
        upcoming: requests[13].count || 0,
        cards: requests[3].count || 0,
        stamps: requests[4].count || 0,
        redeemed: requests[5].count || 0,
        leads: requests[6].count || 0,
        revenue: (requests[7].data || []).reduce((sum, item) => sum + Number(item.package_price || 0), 0)
      })
      setActivity(requests[8].data || [])
      setRecentBookings(requests[9].data || [])
      setRecentCards(requests[10].data || [])
      setRecentLeads(requests[11].data || [])
      setLoading(false)
    }
    load()
    const channel = supabase.channel('admin-dashboard-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_mirror' }, load).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Operations Overview" title="Dashboard" description="A live view of bookings, customer activity, rewards and cafe follow-up." />
        <div className="mt-6"><AdminStatSkeleton count={8} /></div>
        <div className="mt-6"><AdminSkeleton rows={4} /></div>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations Overview" title="Dashboard" description="A live view of bookings, customer activity, rewards and cafe follow-up." />
      {notice && <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">{notice}</div>}

      <section className="mt-6">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Quick Actions</div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 font-bold text-charcoal-300 shadow-soft transition hover:border-orange-300 hover:bg-orange-50">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><action.icon size={18} /></span>
              <span className="text-sm leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={CalendarCheck} label="Today's Bookings" value={stats.today} />
        <AdminStatCard icon={Users} label="Approved Spots Today" value={stats.approvedSpots} tone="green" />
        <AdminStatCard icon={CalendarClock} label="Remaining Capacity" value={stats.remainingCapacity} tone="blue" />
        <AdminStatCard icon={CalendarCheck} label="Upcoming Approved" value={stats.upcoming} tone="dark" />
        <AdminStatCard icon={CalendarClock} label="Pending Bookings" value={stats.pending} tone="blue" />
        <AdminStatCard icon={CircleDollarSign} label="Estimated Revenue" value={`$${stats.revenue.toFixed(0)}`} tone="dark" />
        <AdminStatCard icon={QrCode} label="Reward Cards" value={stats.cards} />
        <AdminStatCard icon={Gift} label="Stamps Today" value={stats.stamps} tone="green" />
        <AdminStatCard icon={History} label="Gifts Redeemed" value={stats.redeemed} tone="blue" />
        <AdminStatCard icon={Contact} label="New Leads" value={stats.leads} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <PanelCard title="Recent Bookings" eyebrow="Operations" icon={CalendarCheck} to="/admin/bookings" empty="No bookings yet." rows={recentBookings}>
          {recentBookings.map((row) => (
            <PanelRow key={row.id} primary={row.customer_name || 'Walk-in'} secondary={`${row.package_name || 'Package'} \u00b7 ${row.booking_date || '-'}`} trailing={<AdminBadge value={row.status} />} />
          ))}
        </PanelCard>

        <PanelCard title="Recent Reward Cards" eyebrow="Loyalty" icon={Gift} to="/admin/rewards" empty="No reward cards yet." rows={recentCards}>
          {recentCards.map((row) => (
            <PanelRow key={row.id} primary={row.full_name || row.rcc_card_id} secondary={`${row.rcc_card_id} \u00b7 ${row.current_stamps}/7 stamps`} trailing={<AdminBadge value={row.reward_status} />} />
          ))}
        </PanelCard>

        <PanelCard title="Latest Leads" eyebrow="Pipeline" icon={Contact} to="/admin/leads" empty="No leads yet." rows={recentLeads}>
          {recentLeads.map((row) => (
            <PanelRow key={row.id} primary={row.full_name || 'Enquiry'} secondary={String(row.enquiry_type || 'website').replaceAll('_', ' ')} trailing={<AdminBadge value={row.status} />} />
          ))}
        </PanelCard>

        <PanelCard title="Staff Activity" eyebrow="Audit Trail" icon={History} empty="No activity yet." rows={activity}>
          {activity.map((item) => (
            <PanelRow key={item.id} primary={item.action} secondary={new Date(item.created_at).toLocaleString('en-NZ')} />
          ))}
        </PanelCard>
      </div>
    </div>
  )
}

function PanelCard({ title, eyebrow, icon: Icon, to, empty, rows, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">{eyebrow}</div>
          <h2 className="mt-1 font-display text-xl font-extrabold">{title}</h2>
        </div>
        {to ? (
          <Link to={to} className="text-xs font-bold text-orange-700 hover:underline">View all</Link>
        ) : (
          <Icon className="text-orange-500" size={22} />
        )}
      </div>
      {rows?.length ? (
        <div className="mt-4 divide-y divide-border">{children}</div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-orange-200 bg-bg-soft p-6 text-center text-sm font-semibold text-muted">{empty}</div>
      )}
    </section>
  )
}

function PanelRow({ primary, secondary, trailing }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-charcoal-300">{primary}</div>
        <div className="truncate text-xs text-muted">{secondary}</div>
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  )
}

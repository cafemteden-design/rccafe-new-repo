import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarCheck, CalendarClock, CheckCircle2, CircleDollarSign, Contact, ExternalLink, Gift, Image, MenuSquare, QrCode, RefreshCw, Send, Tags, Users } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { isGoogleSheetSyncConfigured } from '../../services/googleSheetSync.js'
import { AdminAlert, AdminBadge, AdminPageHeader, AdminSkeleton, AdminStatCard, AdminStatSkeleton } from '../../components/admin/AdminUI.jsx'

const EMPTY = { todayBookings:0,pendingBookings:0,confirmedBookings:0,cancelledBookings:0,completedBookings:0,noShowBookings:0,todayRevenue:0,remoteSpotsBooked:0,rewardCards:0,stampsToday:0,rewardsRedeemed:0,newLeads:0,failedSyncs:0,systemAlerts:0 }
const ACTIONS = [
  ['/admin/bookings?status=pending','Pending Bookings',CalendarCheck], ['/admin/bookings?new=1','Add Booking',CalendarCheck],
  ['/admin/booking-calendar','Booking Calendar',CalendarClock],
  ['/admin/rewards/scanner','Open Scanner',QrCode], ['/admin/offers','Create Offer',Tags],
  ['/admin/notifications','Send Notification',Send], ['/admin/menu','Manage Menu',MenuSquare],
  ['/','View Website',ExternalLink]
]

export default function AdminDashboard() {
  const [stats,setStats]=useState(EMPTY)
  const [panels,setPanels]=useState({schedule:[],confirmed:[],cards:[],stamps:[],leads:[],alerts:[]})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland'}).format(new Date())

  const load=useCallback(async()=>{
    setLoading(true); setError('')
    const results=await Promise.all([
      supabase.rpc('get_admin_dashboard_stats'),
      supabase.from('bookings_mirror').select('*').eq('booking_date',today).order('booking_time').limit(16),
      supabase.from('bookings_mirror').select('*').in('status',['confirmed','approved']).order('booking_date',{ascending:true}).order('booking_time',{ascending:true}).limit(8),
      supabase.from('reward_cards').select('id,rcc_card_id,full_name,current_stamps,cycle_number,reward_status,created_at').order('created_at',{ascending:false}).limit(6),
      supabase.from('reward_events').select('id,event_type,stamp_change,created_at,reward_cards(rcc_card_id,full_name)').order('created_at',{ascending:false}).limit(6),
      supabase.from('website_leads').select('id,full_name,enquiry_type,status,created_at').order('created_at',{ascending:false}).limit(6),
      supabase.from('bookings_mirror').select('id,booking_id,customer_name,sheet_sync_error,updated_at').not('sheet_sync_error','is',null).order('updated_at',{ascending:false}).limit(6)
    ])
    const firstError=results.find((result)=>result.error)?.error
    if(firstError)setError(firstError.message)
    setStats({...EMPTY,...(results[0].data||{})})
    setPanels({schedule:results[1].data||[],confirmed:results[2].data||[],cards:results[3].data||[],stamps:results[4].data||[],leads:results[5].data||[],alerts:results[6].data||[]})
    setLoading(false)
  },[today])

  useEffect(()=>{load();const channel=supabase.channel('admin-command-center').on('postgres_changes',{event:'*',schema:'public',table:'bookings_mirror'},load).on('postgres_changes',{event:'*',schema:'public',table:'reward_events'},load).subscribe();return()=>supabase.removeChannel(channel)},[load])

  if(loading)return <div><AdminPageHeader eyebrow="RCC Operations Command Center" title="Loading today's operations" description="Collecting live bookings, rewards, leads and system health."/><div className="mt-6"><AdminStatSkeleton count={12}/></div><div className="mt-6"><AdminSkeleton rows={5}/></div></div>

  const kpis=[
    [CalendarCheck,"Today's Bookings",stats.todayBookings],[CalendarClock,'Pending',stats.pendingBookings,'orange'],[CalendarClock,'Confirmed',stats.confirmedBookings,'green'],[AlertTriangle,'Cancelled',stats.cancelledBookings,'dark'],
    [CheckCircle2,'Completed',stats.completedBookings,'green'],[Users,'No Show',stats.noShowBookings,'dark'],[CircleDollarSign,'Revenue',`NZD $${Number(stats.todayRevenue||0).toFixed(0)}`],
    [Users,'Remote Spots Booked',stats.remoteSpotsBooked],
    [QrCode,'Reward Cards',stats.rewardCards],[Gift,'Stamps Today',stats.stampsToday],[Gift,'Rewards Redeemed',stats.rewardsRedeemed],
    [Contact,'New Leads',stats.newLeads],[RefreshCw,'Failed Syncs',stats.failedSyncs],[AlertTriangle,'System Alerts',stats.systemAlerts]
  ]
  return <div>
    <AdminPageHeader eyebrow="RCC Operations Command Center" title="Today at RCC" description={`${new Intl.DateTimeFormat('en-NZ',{timeZone:'Pacific/Auckland',dateStyle:'full'}).format(new Date())} | Live operational overview`} action={<button onClick={load} className="btn-outline min-h-11"><RefreshCw size={16}/>Refresh</button>}/>
    <div className="mt-5 flex flex-wrap gap-2"><StatusPill good={!error} label={error?'Supabase Needs Attention':'Supabase Live'}/><StatusPill good={isGoogleSheetSyncConfigured()} label={isGoogleSheetSyncConfigured()?'Sheet Sync Ready':'Sheet Sync Not Configured'}/><StatusPill good={stats.systemAlerts===0} label={stats.systemAlerts===0?'No Active Alerts':`${stats.systemAlerts} Alert(s)`}/></div>
    {error&&<div className="mt-5"><AdminAlert type="error">Live dashboard data could not fully load: {error} <button onClick={load} className="ml-2 underline">Retry</button></AdminAlert></div>}
    <section className="mt-6"><Label>Quick Actions</Label><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">{ACTIONS.map(([to,label,Icon])=><Link key={label} to={to} className="group flex min-h-24 flex-col justify-between rounded-2xl border border-border bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-orange-300"><Icon size={19} className="text-orange-600"/><span className="mt-3 text-xs font-extrabold leading-tight group-hover:text-orange-700">{label}</span></Link>)}</div></section>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([Icon,label,value,tone])=><AdminStatCard key={label} icon={Icon} label={label} value={value} tone={tone||'orange'}/>)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Panel title="Today's Schedule" to="/admin/bookings" rows={panels.schedule} empty="No bookings scheduled today.">{panels.schedule.map(row=><Row key={row.id} title={`${row.booking_time} | ${row.customer_name}`} detail={`${row.group_size} remotes | ${row.gameplay_duration||row.package_duration} min`} badge={row.status}/>)}</Panel>
      <Panel title="Upcoming Confirmed Bookings" to="/admin/bookings?status=confirmed" rows={panels.confirmed} empty="No upcoming confirmed bookings.">{panels.confirmed.map(row=><Row key={row.id} title={row.customer_name} detail={`${row.booking_date} ${row.booking_time} | ${row.group_size} remotes`} badge="confirmed"/>)}</Panel>
      <Panel title="Recent Reward Cards" to="/admin/rewards" rows={panels.cards} empty="No reward cards yet.">{panels.cards.map(row=><Row key={row.id} title={row.full_name||row.rcc_card_id} detail={`${row.rcc_card_id} | Cycle ${row.cycle_number} | ${row.current_stamps}/7`} badge={row.reward_status}/>)}</Panel>
      <Panel title="Latest Stamp Activity" to="/admin/rewards" rows={panels.stamps} empty="No stamp activity yet.">{panels.stamps.map(row=><Row key={row.id} title={row.reward_cards?.full_name||row.reward_cards?.rcc_card_id||'Reward card'} detail={`${String(row.event_type).replaceAll('_',' ')}${row.stamp_change?` | ${row.stamp_change} stamp(s)`:''}`}/>)}</Panel>
      <Panel title="Recent Leads" to="/admin/leads" rows={panels.leads} empty="No new enquiries.">{panels.leads.map(row=><Row key={row.id} title={row.full_name||'Website enquiry'} detail={String(row.enquiry_type||'website').replaceAll('_',' ')} badge={row.status}/>)}</Panel>
      <Panel title="Failed Sync / Email Alerts" to="/admin/diagnostics" rows={panels.alerts} empty="No failed booking syncs.">{panels.alerts.map(row=><Row key={row.id} title={row.booking_id||row.customer_name} detail={row.sheet_sync_error}/>)}</Panel>
    </div>
  </div>
}

function StatusPill({good,label}){return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${good?'border-green-200 bg-green-50 text-green-700':'border-orange-200 bg-orange-50 text-orange-800'}`}><span className={`h-2 w-2 rounded-full ${good?'bg-green-500':'bg-orange-500'}`}/>{label}</span>}
function Label({children}){return <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">{children}</div>}
function Panel({title,to,rows,empty,children}){return <section className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold">{title}</h2><Link to={to} className="text-xs font-bold text-orange-700">View all</Link></div>{rows.length?<div className="mt-3 divide-y divide-border">{children}</div>:<div className="mt-4 rounded-xl border border-dashed border-orange-200 bg-bg-soft p-6 text-center text-sm font-semibold text-muted">{empty}</div>}</section>}
function Row({title,detail,badge}){return <div className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-extrabold">{title}</div><div className="mt-0.5 truncate text-xs capitalize text-muted">{detail}</div></div>{badge&&<AdminBadge value={badge}/>}</div>}

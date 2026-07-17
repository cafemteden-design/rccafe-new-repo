import { useEffect, useMemo, useState } from 'react'
import { Ban, BadgeCheck, Bell, Copy, ExternalLink, Gift, History, PartyPopper, RefreshCw, Save, Search, ShieldCheck, Stamp, Undo2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { AdminBadge, AdminEmpty, AdminModal, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import DemoQrCode from '../../components/rewards/DemoQrCode.jsx'
import { rewardToSheetPayload, syncGoogleSheet } from '../../services/googleSheetSync.js'

const STATUS_FILTERS = ['all', 'active', 'unlocked', 'welcome gift', 'blocked', 'inactive']

export default function AdminRewardsManager() {
  const toast = useToast()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reward_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) toast.error('Reward cards are unavailable. Confirm the Supabase SQL is installed and this role has access.')
    setCards(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('admin-reward-cards-live').on('postgres_changes', { event: '*', schema: 'public', table: 'reward_cards' }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cards.filter((card) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'welcome gift' ? card.welcome_gift_unlocked && !card.welcome_gift_redeemed : statusFilter === 'inactive' ? !card.active : card.reward_status === statusFilter)
      const matchesQuery = !needle || ['rcc_card_id', 'full_name', 'mobile', 'email'].some((key) => String(card[key] ?? '').toLowerCase().includes(needle))
      return matchesStatus && matchesQuery
    })
  }, [cards, query, statusFilter])

  const onUpdated = (updated) => {
    setCards((current) => current.map((card) => (card.id === updated.id ? { ...card, ...updated } : card)))
    setSelected((current) => (current && current.id === updated.id ? { ...current, ...updated } : current))
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Loyalty" title="Reward Cards" description="Manage customer cards, stamps, reward cycles, welcome gifts, notifications and access." />

      <div className="mt-6 rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-bg-soft pl-10 pr-4 text-sm outline-none focus:border-orange-400" placeholder="Search by RCC ID, name, mobile or email..." />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold capitalize transition ${statusFilter === status ? 'bg-orange-500 text-white' : 'bg-bg-soft text-muted hover:text-charcoal-300'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-4"><AdminSkeleton rows={6} /></div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-bg-soft text-[10px] font-extrabold uppercase tracking-widest text-muted">
                  <tr>
                    <th className="px-4 py-3">Card ID</th><th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Email / Phone</th><th className="px-4 py-3">Stamps</th>
                    <th className="px-4 py-3">Cycle</th><th className="px-4 py-3">Welcome Gift</th><th className="px-4 py-3">Last Visit</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((card) => (
                    <tr key={card.id} className="text-sm">
                      <td className="px-4 py-3 font-mono font-bold">{card.rcc_card_id}</td>
                      <td className="px-4 py-3 font-semibold">{card.full_name || '-'}</td>
                      <td className="px-4 py-3 text-muted"><div>{card.email || '-'}</div><div className="text-xs">{card.mobile || '-'}</div></td>
                      <td className="px-4 py-3 font-bold">{card.current_stamps}/7</td>
                      <td className="px-4 py-3 text-muted">{card.cycle_number}</td>
                      <td className="px-4 py-3"><AdminBadge value={card.welcome_gift_redeemed ? 'redeemed' : card.welcome_gift_unlocked ? 'available' : 'locked'} /></td>
                      <td className="px-4 py-3 text-muted">{card.last_visit_date || '-'}</td>
                      <td className="px-4 py-3"><AdminBadge value={card.reward_status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => setSelected(card)} className="btn-outline min-h-9 py-1.5 text-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {filtered.map((card) => (
                <button key={card.id} type="button" onClick={() => setSelected(card)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{card.full_name || card.rcc_card_id}</div>
                    <div className="truncate text-xs text-muted">{card.rcc_card_id} · {card.current_stamps}/7 stamps</div>
                  </div>
                  <AdminBadge value={card.reward_status} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4"><AdminEmpty icon={Gift} title="No reward cards found" description="Reward cards appear here as customers register through the public rewards page." /></div>
        )}
      </div>

      {selected && <RewardDetail card={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />}
    </div>
  )
}

function RewardDetail({ card, onClose, onUpdated }) {
  const toast = useToast()
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [notes, setNotes] = useState(card.notes || '')
  const [working, setWorking] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [stampCount, setStampCount] = useState(1)
  const [notification, setNotification] = useState('')
  const [customer, setCustomer] = useState({ full_name: card.full_name || '', mobile: card.mobile || '', email: card.email || '', date_of_birth: card.date_of_birth || '' })

  const cardUrl = `${window.location.origin}/rewards/card/${card.secure_token}`
  const blocked = card.reward_status === 'blocked'

  const loadHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('reward_events')
      .select('*')
      .eq('reward_card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setHistory(data || [])
    setLoadingHistory(false)
  }

  const removeLastStamp = async () => {
    setConfirmingRemove(false)
    setWorking(true)
    const { data, error } = await supabase.rpc('undo_last_reward_stamp', {
      p_reward_card_id: card.id,
      p_note: 'Removed accidental stamp (Rewards Manager)'
    })
    setWorking(false)
    if (error) return toast.error(error.message)
    toast.success('Last stamp removed.')
    onUpdated(data)
    loadHistory()
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoadingHistory(true)
      const { data } = await supabase
        .from('reward_events')
        .select('*')
        .eq('reward_card_id', card.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (active) {
        setHistory(data || [])
        setLoadingHistory(false)
      }
    })()
    return () => { active = false }
  }, [card.id])

  const saveNotes = async () => {
    setWorking(true)
    const { error } = await supabase.from('reward_cards').update({ notes }).eq('id', card.id)
    setWorking(false)
    if (error) return toast.error(error.message)
    toast.success('Notes saved.')
    onUpdated({ id: card.id, notes })
  }

  const saveCustomer = async () => {
    if (!customer.full_name.trim() || !customer.email.trim() || !customer.mobile.trim()) return toast.error('Name, email and mobile are required.')
    setWorking(true)
    const { data, error } = await supabase.from('reward_cards').update({ ...customer, email: customer.email.trim().toLowerCase() }).eq('id', card.id).select().single()
    setWorking(false)
    if (error) return toast.error(error.message)
    onUpdated(data)
    toast.success('Customer details updated.')
  }

  const toggleBlock = async () => {
    setWorking(true)
    const nextStatus = blocked ? 'active' : 'blocked'
    const { error } = await supabase.from('reward_cards').update({ reward_status: nextStatus }).eq('id', card.id)
    setWorking(false)
    if (error) return toast.error(error.message)
    toast.success(blocked ? 'Card unblocked.' : 'Card blocked.')
    onUpdated({ id: card.id, reward_status: nextStatus })
  }

  const runRewardAction = async (rpc, args, successMessage) => {
    setWorking(true)
    const { data, error } = await supabase.rpc(rpc, { p_reward_card_id: card.id, ...args })
    setWorking(false)
    if (error) return toast.error(error.message)
    onUpdated(data)
    toast.success(successMessage)
    loadHistory()
    const action = rpc === 'add_reward_stamp' ? 'rewardStampAdded' : rpc === 'redeem_reward' ? 'rewardRedeemed' : 'welcomeGiftRedeemed'
    syncGoogleSheet(action, rewardToSheetPayload(data, { notes: args.p_note })).catch(() => {})
  }

  const sendNotification = async () => {
    if (!notification.trim()) return toast.error('Enter a notification message.')
    setWorking(true)
    const { error } = await supabase.from('reward_notifications').insert({
      title: 'Message from RCC', message: notification.trim(), target_reward_card_id: card.id,
      audience: 'customer', notification_type: 'customer', active: true
    })
    setWorking(false)
    if (error) return toast.error(error.message)
    setNotification('')
    toast.success('Customer notification published.')
  }

  const copyCardLink = async () => {
    await navigator.clipboard.writeText(cardUrl)
    toast.success('Card link copied.')
  }

  const syncCard = async () => {
    setWorking(true)
    const result = await syncGoogleSheet('rewardCardCreated', rewardToSheetPayload(card))
    setWorking(false)
    result.success ? toast.success('Reward card synced to Google Sheet.') : toast.warning(`Saved in Supabase. ${result.message}`)
  }

  return (
    <AdminModal
      title={card.full_name || card.rcc_card_id}
      description={`${card.rcc_card_id} · Cycle ${card.cycle_number}`}
      onClose={onClose}
      footer={(
        <div className="flex flex-wrap justify-end gap-2">
          <a href={cardUrl} target="_blank" rel="noreferrer" className="btn-outline"><ExternalLink size={16} />Open Card</a>
          <button type="button" disabled={working} onClick={copyCardLink} className="btn-outline"><Copy size={16} />Copy Link</button>
          <button type="button" disabled={working} onClick={syncCard} className="btn-outline"><RefreshCw size={16} />Sync Sheet</button>
          <button type="button" disabled={working} onClick={toggleBlock} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-white disabled:opacity-50 ${blocked ? 'bg-green-600' : 'bg-red-600'}`}>
            {blocked ? <ShieldCheck size={16} /> : <Ban size={16} />}{blocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      )}
    >
      <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
        <div>
          <DemoQrCode value={cardUrl} label={card.rcc_card_id} premium />
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Info label="Mobile" value={card.mobile} />
            <Info label="Email" value={card.email} />
            <Info label="DOB" value={card.date_of_birth} />
            <Info label="Last Visit" value={card.last_visit_date} />
            <Info label="Created" value={card.created_at ? new Date(card.created_at).toLocaleDateString('en-NZ') : '-'} />
            <Info label="Total Visits" value={card.total_visits} />
            <Info label="Lifetime Stamps" value={card.lifetime_stamps ?? card.total_stamps} />
            <Info label="Rewards Redeemed" value={card.rewards_redeemed ?? Math.max(Number(card.cycle_number || 1) - 1, 0)} />
            <Info label="Welcome Gift" value={card.welcome_gift_redeemed ? 'Redeemed' : card.welcome_gift_unlocked ? 'Available' : 'Locked'} />
            <Info label="Notifications" value={card.notification_enabled === false ? 'Disabled' : 'Enabled'} />
            <Info label="Card Status" value={card.active === false ? 'Inactive' : 'Active'} />
            <Info label="Status" value={<AdminBadge value={card.reward_status} />} />
          </div>
        </div>

        <div>
          <div className="rounded-xl bg-bg-soft p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted">Current Cycle</div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className={`grid aspect-square place-items-center rounded-lg border text-[11px] font-extrabold ${index < card.current_stamps ? 'border-orange-500 bg-orange-500 text-white' : index === 6 ? 'border-green-300 bg-green-50 text-green-700' : 'border-border bg-white text-muted'}`}>
                  {index === 6 ? <Gift size={14} /> : index < card.current_stamps ? <BadgeCheck size={14} /> : index + 1}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{card.current_stamps}/7 stamps</span>
              {confirmingRemove ? (
                <span className="flex items-center gap-1.5">
                  <button type="button" disabled={working} onClick={removeLastStamp} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-red-600 px-3 text-xs font-bold text-white disabled:opacity-50"><Undo2 size={13} />Confirm</button>
                  <button type="button" onClick={() => setConfirmingRemove(false)} className="min-h-8 rounded-full border border-border px-3 text-xs font-bold text-muted">Cancel</button>
                </span>
              ) : (
                <button type="button" disabled={working || card.current_stamps <= 0} onClick={() => setConfirmingRemove(true)} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-40"><Undo2 size={13} />Remove Last Stamp</button>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-white p-3">
            <div className="text-xs font-extrabold uppercase tracking-widest text-muted">Customer Details</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label><span className="field-label">Name</span><input className="field-input" value={customer.full_name} onChange={(event) => setCustomer((current) => ({ ...current, full_name: event.target.value }))} /></label>
              <label><span className="field-label">Mobile</span><input className="field-input" value={customer.mobile} onChange={(event) => setCustomer((current) => ({ ...current, mobile: event.target.value }))} /></label>
              <label><span className="field-label">Email</span><input type="email" className="field-input" value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} /></label>
              <label><span className="field-label">Date of Birth</span><input type="date" className="field-input" value={customer.date_of_birth} onChange={(event) => setCustomer((current) => ({ ...current, date_of_birth: event.target.value }))} /></label>
            </div>
            <button type="button" disabled={working} onClick={saveCustomer} className="btn-outline mt-3 min-h-11 w-full disabled:opacity-40"><Save size={15} />Update Customer</button>
          </div>

          <label className="mt-4 block">
            <span className="field-label">Internal Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="field-input min-h-24 resize-y" placeholder="Add a private note about this customer..." />
          </label>
          <button type="button" disabled={working} onClick={saveNotes} className="btn-outline mt-2 w-full disabled:opacity-50"><Save size={15} />Save Notes</button>
          <div className="mt-4 rounded-xl border border-border bg-white p-3">
            <label><span className="field-label">Add Stamps</span><input type="number" min="1" max="7" value={stampCount} onChange={(event) => setStampCount(event.target.value)} className="field-input" /></label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={working || blocked || card.reward_status === 'unlocked'} onClick={() => runRewardAction('add_reward_stamp', { p_stamp_count: Number(stampCount), p_note: 'Added from Rewards Manager' }, `${stampCount} stamp(s) added.`)} className="btn-primary min-h-11 disabled:opacity-40"><Stamp size={15} />Add Stamp</button>
              <button type="button" disabled={working || card.reward_status !== 'unlocked'} onClick={() => runRewardAction('redeem_reward', { p_note: 'Redeemed from Rewards Manager' }, 'Reward redeemed. New cycle started.')} className="btn-outline min-h-11 disabled:opacity-40"><Gift size={15} />Redeem Reward</button>
            </div>
            <button type="button" disabled={working || !card.welcome_gift_unlocked || card.welcome_gift_redeemed} onClick={() => runRewardAction('redeem_welcome_gift', { p_note: 'Redeemed from Rewards Manager' }, 'Welcome gift redeemed.')} className="btn-outline mt-2 min-h-11 w-full disabled:opacity-40"><PartyPopper size={15} />Redeem Welcome Gift</button>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-white p-3">
            <label><span className="field-label">Send Customer Notification</span><textarea value={notification} onChange={(event) => setNotification(event.target.value)} className="field-input min-h-20 resize-y" placeholder="Birthday offer, festival message or customer update..." /></label>
            <button type="button" disabled={working} onClick={sendNotification} className="btn-outline mt-2 min-h-11 w-full disabled:opacity-40"><Bell size={15} />Send Notification</button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-extrabold"><History size={16} className="text-orange-500" />Activity History</div>
        {loadingHistory ? (
          <div className="mt-3"><AdminSkeleton rows={3} /></div>
        ) : history.length ? (
          <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-border rounded-xl border border-border">
            {history.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-bold capitalize">{String(event.event_type).replaceAll('_', ' ')}{event.stamp_change ? ` (+${event.stamp_change})` : ''}</div>
                  {event.note && <div className="truncate text-xs text-muted">{event.note}</div>}
                </div>
                <div className="flex-shrink-0 text-xs text-muted">{new Date(event.created_at).toLocaleDateString('en-NZ')}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-orange-200 bg-bg-soft p-4 text-center text-sm font-semibold text-muted">No recorded activity yet.</p>
        )}
      </div>
    </AdminModal>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-bg-soft px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-0.5 truncate font-bold text-charcoal-300">{value ?? '-'}</div>
    </div>
  )
}

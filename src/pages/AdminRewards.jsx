import { useMemo, useState } from 'react'
import { BadgeCheck, Bell, Gift, History, Plus, RotateCcw, Sparkles, Users } from 'lucide-react'
import { getRewardStatus } from '../components/rewards/RewardCardDisplay.jsx'
import SEO from '../components/SEO.jsx'
import {
  addRewardNotification,
  addRewardOffer,
  getRewardCards,
  getRewardProgram,
  seedDemoRewardCard,
  updateSignupGift
} from '../data/rewardsDemo.js'

export default function AdminRewards() {
  const [cards, setCards] = useState(() => getRewardCards())
  const [program, setProgram] = useState(() => getRewardProgram())
  const [offer, setOffer] = useState({ type: 'Buy 1 Get 1', title: '', description: '' })
  const [notification, setNotification] = useState({ title: '', message: '' })
  const [gift, setGift] = useState(() => ({
    title: getRewardProgram().signupGift.title,
    description: getRewardProgram().signupGift.description
  }))
  const [message, setMessage] = useState('')
  const stats = useMemo(() => {
    return cards.reduce((totals, card) => {
      const status = getRewardStatus(card)
      totals.stamps += Number(card.stampCount || 0)
      if (status.key === 'unlocked') totals.unlocked += 1
      totals.redeemed += (card.history || []).filter((item) => item.type === 'reward_redeemed').length
      return totals
    }, { cards: cards.length, stamps: 0, unlocked: 0, redeemed: 0 })
  }, [cards])

  const createDemo = () => {
    seedDemoRewardCard()
    setCards(getRewardCards())
  }

  const saveOffer = (event) => {
    event.preventDefault()
    if (!offer.title.trim() || !offer.description.trim()) return
    setProgram(addRewardOffer(offer))
    setOffer((current) => ({ ...current, title: '', description: '' }))
    setMessage('Offer published to all reward card dashboards.')
  }

  const saveNotification = (event) => {
    event.preventDefault()
    if (!notification.title.trim() || !notification.message.trim()) return
    setProgram(addRewardNotification(notification))
    setNotification({ title: '', message: '' })
    setMessage('Notification published to all reward card dashboards.')
  }

  const saveGift = (event) => {
    event.preventDefault()
    if (!gift.title.trim() || !gift.description.trim()) return
    setProgram(updateSignupGift(gift))
    setMessage('Welcome gift updated for future registrations.')
  }

  return (
    <section className="section-light py-6 sm:py-10">
      <SEO title="Admin Rewards | RCC Cafe" description="RCC admin reward card panel." noindex />
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><Users size={14} />Admin Preview</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Rewards Dashboard</h1>
            <p className="mt-2 text-muted">Reward leads, stamp activity, unlocked rewards and redeemed gift history.</p>
          </div>
          <button onClick={createDemo} className="btn-primary w-fit">Create Sample Lead <Sparkles size={16} /></button>
        </div>

        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total Cards" value={stats.cards} />
            <StatCard icon={BadgeCheck} label="Total Stamps" value={stats.stamps} />
            <StatCard icon={Gift} label="Unlocked Rewards" value={stats.unlocked} />
            <StatCard icon={RotateCcw} label="Redeemed Rewards" value={stats.redeemed} />
          </div>

          {message && <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">{message}</div>}

          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            <AdminForm icon={Gift} title="Signup Gift" subtitle="Shown only after a customer creates a card." onSubmit={saveGift}>
              <input className="field-input" value={gift.title} onChange={(event) => setGift((current) => ({ ...current, title: event.target.value }))} placeholder="Gift title" />
              <textarea className="field-input min-h-24 resize-y" value={gift.description} onChange={(event) => setGift((current) => ({ ...current, description: event.target.value }))} placeholder="Gift details" />
              <button className="btn-primary w-full" type="submit">Update Gift</button>
            </AdminForm>

            <AdminForm icon={Sparkles} title="Create Offer" subtitle={`${program.offers.filter((item) => item.active).length} active offer(s)`} onSubmit={saveOffer}>
              <select className="field-input" value={offer.type} onChange={(event) => setOffer((current) => ({ ...current, type: event.target.value }))}>
                <option>Buy 1 Get 1</option>
                <option>Free Coffee</option>
                <option>Weekend Deal</option>
                <option>Birthday Offer</option>
              </select>
              <input className="field-input" value={offer.title} onChange={(event) => setOffer((current) => ({ ...current, title: event.target.value }))} placeholder="Offer title" />
              <textarea className="field-input min-h-20 resize-y" value={offer.description} onChange={(event) => setOffer((current) => ({ ...current, description: event.target.value }))} placeholder="Offer details" />
              <button className="btn-primary w-full" type="submit"><Plus size={16} />Publish Offer</button>
            </AdminForm>

            <AdminForm icon={Bell} title="Send Notification" subtitle={`${program.notifications.filter((item) => item.active).length} active notification(s)`} onSubmit={saveNotification}>
              <input className="field-input" value={notification.title} onChange={(event) => setNotification((current) => ({ ...current, title: event.target.value }))} placeholder="Notification title" />
              <textarea className="field-input min-h-24 resize-y" value={notification.message} onChange={(event) => setNotification((current) => ({ ...current, message: event.target.value }))} placeholder="Message for customers" />
              <button className="btn-primary w-full" type="submit"><Bell size={16} />Publish Notification</button>
            </AdminForm>
          </div>

          <div className="mt-8 rounded-3xl border border-orange-200 bg-[#fffaf3] p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Lead Cards</div>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">Reward customers</h2>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-orange-300 bg-white p-8 text-center">
                <Users size={42} className="mx-auto text-orange-500" />
                <h3 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">No reward leads yet</h3>
                <p className="mt-2 text-sm text-muted">Create a reward card from the customer page or generate a sample lead here.</p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-orange-100 bg-white">
                <div className="hidden grid-cols-[1.1fr_0.75fr_0.55fr_0.85fr_0.75fr_1fr] gap-4 border-b border-border bg-bg-soft px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted lg:grid">
                  <div>Customer</div>
                  <div>Card ID</div>
                  <div>Stamps</div>
                  <div>Status</div>
                  <div>Created</div>
                  <div>Latest Activity</div>
                </div>
                <div className="divide-y divide-border">
                  {cards.map((card) => (
                    <LeadRow key={card.id} card={card} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminForm({ icon: Icon, title, subtitle, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-orange-100 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600"><Icon size={20} /></span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-charcoal-300">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">{children}</div>
    </form>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-soft">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
        <Icon size={22} />
      </div>
      <div className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold text-charcoal-300">{value}</div>
    </div>
  )
}

function LeadRow({ card }) {
  const status = getRewardStatus(card)
  const latest = card.history?.[0]

  return (
    <div className="grid gap-3 px-5 py-4 lg:grid-cols-[1.1fr_0.75fr_0.55fr_0.85fr_0.75fr_1fr] lg:items-center">
      <div>
        <div className="font-extrabold text-charcoal-300">{card.name}</div>
        <div className="mt-1 text-sm text-muted">{card.email || 'Reward card customer'}</div>
      </div>
      <AdminCell label="Card ID" value={card.cardId} />
      <AdminCell label="Stamps" value={`${card.stampCount}/7`} />
      <div>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.key === 'unlocked' ? 'bg-green-100 text-green-700' : status.key === 'redeemed' ? 'bg-charcoal-300 text-white' : 'bg-orange-100 text-orange-700'}`}>
          {status.label}
        </div>
      </div>
      <AdminCell label="Created" value={card.createdAt ? new Date(card.createdAt).toLocaleDateString('en-NZ') : '-'} />
      <div className="rounded-2xl bg-bg-soft p-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          <History size={12} /> Latest
        </div>
        <div className="mt-1 text-sm font-semibold text-charcoal-300">{latest?.label || 'No activity'}</div>
      </div>
    </div>
  )
}

function AdminCell({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted lg:hidden">{label}</div>
      <div className="text-sm font-extrabold text-charcoal-300">{value}</div>
    </div>
  )
}

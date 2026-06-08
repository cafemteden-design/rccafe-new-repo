import { useMemo, useState } from 'react'
import { BadgeCheck, Gift, History, RotateCcw, Sparkles, Users } from 'lucide-react'
import { getRewardStatus } from '../components/rewards/RewardCardDisplay.jsx'
import { getRewardCards, seedDemoRewardCard } from '../data/rewardsDemo.js'

export default function AdminRewards() {
  const [cards, setCards] = useState(() => getRewardCards())
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

  return (
    <section className="section-light py-6 sm:py-10">
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><Users size={14} />Admin Demo</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Rewards Dashboard</h1>
            <p className="mt-2 text-muted">Demo leads, stamp activity, unlocked rewards and redeemed gift history.</p>
          </div>
          <button onClick={createDemo} className="btn-primary w-fit">Create Demo Lead <Sparkles size={16} /></button>
        </div>

        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total Cards" value={stats.cards} />
            <StatCard icon={BadgeCheck} label="Total Stamps" value={stats.stamps} />
            <StatCard icon={Gift} label="Unlocked Rewards" value={stats.unlocked} />
            <StatCard icon={RotateCcw} label="Redeemed Rewards" value={stats.redeemed} />
          </div>

          <div className="mt-8 rounded-3xl border border-orange-200 bg-[#fffaf3] p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Lead Cards</div>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">Demo reward customers</h2>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-orange-300 bg-white p-8 text-center">
                <Users size={42} className="mx-auto text-orange-500" />
                <h3 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">No demo leads yet</h3>
                <p className="mt-2 text-sm text-muted">Create a reward card from the customer page or generate a demo lead here.</p>
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
        <div className="mt-1 text-sm text-muted">{card.phone}</div>
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

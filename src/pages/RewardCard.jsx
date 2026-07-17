import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, BookmarkCheck, Calendar, Copy, Gift, History, LogOut, MessageCircle, QrCode, Smartphone, Tag, X } from 'lucide-react'
import { RewardCardFront } from '../components/rewards/RewardCardDisplay.jsx'
import SEO from '../components/SEO.jsx'
import { rewardSignupGiftTitle } from '../data/rewardsDemo.js'
import useInstallPrompt from '../hooks/useInstallPrompt.js'
import { trackRewardShare } from '../hooks/useAnalytics.js'
import { getDemoRewardCard, getRewardCardByToken, getRewardCardUrl } from '../services/rewards/rewardRepository.js'
import { clearRewardSession, createRewardSession, getRewardSession, isRewardSessionAuthorized } from '../services/rewards/rewardSession.js'
import { supabase } from '../lib/supabaseClient.js'

export default function RewardCard() {
  const navigate = useNavigate()
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const install = useInstallPrompt()
  const token = pathToken || searchParams.get('token')
  const isDemo = token === 'demo'

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      if (isDemo) {
        if (active) setCard(getDemoRewardCard())
        if (active) setLoading(false)
        return
      }
      const session = getRewardSession()
      if (!session || session.token !== token) {
        if (active) setCard(null)
        if (active) setLoading(false)
        return
      }
      try {
        const found = await getRewardCardByToken(token)
        if (active) setCard(isRewardSessionAuthorized(found) ? found : null)
      } catch {
        if (active) setCard(null)
      }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [isDemo, token])

  useEffect(() => {
    if (isDemo || !token || !card?.id || !supabase) return undefined
    let active = true
    const refresh = async () => {
      try {
        const latest = await getRewardCardByToken(token)
        if (active && isRewardSessionAuthorized(latest)) setCard(latest)
      } catch {
        // Keep the last valid card visible during a temporary network interruption.
      }
    }
    const channel = supabase.channel(`customer-reward-${card.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_cards', filter: `id=eq.${card.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_events', filter: `reward_card_id=eq.${card.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_notifications' }, refresh)
      .subscribe()
    const timer = window.setInterval(refresh, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [card?.id, isDemo, token])

  const cardUrl = useMemo(() => card ? getRewardCardUrl(card) : '', [card])
  const whatsappText = encodeURIComponent(`My RCC Reward Card: ${cardUrl}`)

  const copyLink = async () => {
    const didCopy = await copyText(cardUrl)
    setCopied(didCopy)
    if (didCopy) window.setTimeout(() => setCopied(false), 1800)
  }

  const saveCard = () => {
    if (!isDemo) createRewardSession(card, true)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const signOut = () => {
    clearRewardSession()
    navigate('/rewards#card-login')
  }

  return (
    <section className="min-h-[calc(100svh-5rem)] bg-[#fffdfa] py-5 sm:py-8">
      <SEO title="My RCC Reward Card | Remote Control Cafe Auckland" description="View your personal RCC digital reward card and stamp progress." noindex />
      <div className="container-x">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><QrCode size={14} />My Rewards</span>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">My RCC Reward Card</h1>
            <p className="mt-1 text-sm text-muted">Show this card to staff to collect stamps.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isDemo && card && <button type="button" onClick={signOut} className="btn-outline min-h-11 px-4"><LogOut size={16} />Sign Out</button>}
            <Link to="/rewards" className="btn-outline min-h-11 px-4"><ArrowLeft size={16} />My Rewards</Link>
          </div>
        </div>

        <div className="mt-5">
          {loading ? <LoadingCard /> : card ? (
            <>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:items-start">
                <section aria-labelledby="reward-card-title" className="min-w-0 lg:sticky lg:top-24">
                  <h2 id="reward-card-title" className="sr-only">RCC Reward Card</h2>
                  <RewardCardFront card={card} cardUrl={cardUrl} showQr />
                </section>

                <div className="min-w-0 space-y-5">
                  <QuickActions
                    cardUrl={cardUrl}
                    whatsappText={whatsappText}
                    copied={copied}
                    saved={saved}
                    onSave={saveCard}
                    onCopy={copyLink}
                    onInstall={install.requestInstall}
                  />
                  <NotificationOfferCenter card={card} />
                </div>
              </div>

              <VisitHistory card={card} />
            </>
          ) : <SignInRequired />}
        </div>
      </div>

      {install.showGuide && <InstallGuide isIOS={install.isIOS} onClose={() => install.setShowGuide(false)} />}
    </section>
  )
}

function QuickActions({ cardUrl, whatsappText, copied, saved, onSave, onCopy, onInstall }) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-4 shadow-card sm:p-5" aria-labelledby="quick-actions-title">
      <div className="flex items-center justify-between gap-3">
        <div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Daily Access</div><h2 id="quick-actions-title" className="mt-1 font-display text-xl font-extrabold text-charcoal-300">Quick Actions</h2></div>
        <Smartphone size={22} className="text-orange-500" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ActionButton icon={BookmarkCheck} label={saved ? 'Card Saved' : 'Save Card'} onClick={onSave} active={saved} />
        <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer" className="reward-action" onClick={() => trackRewardShare({ method: 'whatsapp' })}><MessageCircle size={18} /><span>Share on WhatsApp</span></a>
        <ActionButton icon={Copy} label={copied ? 'Link Copied' : 'Copy Card Link'} onClick={() => { onCopy(); trackRewardShare({ method: 'copy_link' }) }} active={copied} />
        <ActionButton icon={Smartphone} label="Add to Home Screen" onClick={onInstall} />
      </div>
      <p className="mt-4 rounded-xl bg-orange-50 px-3 py-2 text-xs leading-relaxed text-muted">Save Card keeps this secure card in your browser for quick access. Home screen installation always requires your confirmation.</p>
      <Link to="/booking#calendar" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-orange-700 transition hover:text-orange-600"><Calendar size={16} />Book your next RCC visit</Link>
    </section>
  )
}

function ActionButton({ icon: Icon, label, onClick, active = false }) {
  return <button type="button" onClick={onClick} className={`reward-action ${active ? 'border-green-300 bg-green-50 text-green-800' : ''}`}><Icon size={18} /><span>{label}</span></button>
}

function NotificationOfferCenter({ card }) {
  const notifications = Array.isArray(card.notifications) ? card.notifications : []
  const offers = [
    ...(card.signupGift ? [{ ...card.signupGift, type: 'Welcome Gift' }] : []),
    ...(Array.isArray(card.activeOffers) ? card.activeOffers : [])
  ]

  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-4 shadow-soft sm:p-5" aria-labelledby="notification-center-title">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600"><Bell size={18} /></span><div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Member Updates</div><h2 id="notification-center-title" className="font-display text-xl font-extrabold text-charcoal-300">Notifications & Offers</h2></div></div>

      <div className="mt-4 space-y-3">
        {notifications.length ? notifications.map((item) => <NoticeCard key={item.id || item.title} item={item} />) : (
          <EmptyMessage title="No new notifications yet." text="Check back for RCC offers and rewards." />
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-charcoal-300"><Tag size={14} className="text-orange-600" />Current Offers</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {offers.length ? offers.map((offer) => <OfferCard key={offer.id || offer.title} offer={offer} />) : (
            <EmptyMessage title="No active offers right now." text="New RCC member offers will appear here." />
          )}
        </div>
      </div>
    </section>
  )
}

function NoticeCard({ item }) {
  return (
    <article className="rounded-2xl border border-orange-100 bg-[#fffaf4] p-3.5">
      <div className="flex items-start justify-between gap-3"><div className="font-extrabold text-charcoal-300">{item.title || 'RCC Update'}</div><span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-orange-700">Notification</span></div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{item.message || item.description}</p>
      {item.createdAt && <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">{formatDate(item.createdAt)}</div>}
    </article>
  )
}

function OfferCard({ offer }) {
  const redeemed = offer.status === 'redeemed'
  return (
    <article className="rounded-2xl border border-green-200 bg-green-50 p-3.5">
      <div className="flex items-start justify-between gap-3"><div className="font-extrabold text-charcoal-300">{offer.title || rewardSignupGiftTitle}</div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${redeemed ? 'bg-charcoal-300 text-white' : 'bg-green-700 text-white'}`}>{redeemed ? 'Redeemed' : 'Available'}</span></div>
      {offer.description && <p className="mt-1 text-sm leading-relaxed text-muted">{offer.description}</p>}
      {offer.endDate && <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-green-800">Valid until {formatDate(offer.endDate)}</div>}
    </article>
  )
}

function VisitHistory({ card }) {
  const history = Array.isArray(card.history) ? card.history.slice(0, 8) : []
  return (
    <section className="mt-5 rounded-3xl border border-orange-100 bg-white p-4 shadow-soft sm:p-5" aria-labelledby="visit-history-title">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-600"><History size={18} /></span><div><div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Stamp Activity</div><h2 id="visit-history-title" className="font-display text-xl font-extrabold text-charcoal-300">Visit History</h2></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.length ? history.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-bg-soft p-4">
            <div className="font-extrabold text-charcoal-300">{item.label || 'Reward activity'}</div>
            <div className="mt-1 text-sm text-muted">{formatDate(item.createdAt)} · Cycle {item.cycle || 1}</div>
          </article>
        )) : <EmptyMessage title="No stamp history yet." text="Your eligible RCC visits will appear here." />}
      </div>
    </section>
  )
}

function InstallGuide({ isIOS, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal-300/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
      <div className="relative w-full max-w-md rounded-3xl border border-orange-200 bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close home screen instructions" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-border bg-white text-muted"><X size={18} /></button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600"><Smartphone size={22} /></span>
        <h2 id="install-guide-title" className="mt-4 pr-12 font-display text-2xl font-extrabold text-charcoal-300">Add RCC Rewards to Home Screen</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">Browsers do not allow automatic shortcut creation. Follow these steps and confirm the action on your phone.</p>
        <ol className="mt-5 space-y-3 text-sm font-semibold text-charcoal-300">
          {isIOS ? <><GuideStep number="1" text="Tap the Safari Share button." /><GuideStep number="2" text="Choose Add to Home Screen." /><GuideStep number="3" text="Tap Add to confirm." /></> : <><GuideStep number="1" text="Open your browser menu." /><GuideStep number="2" text="Choose Install or Add to Home screen." /><GuideStep number="3" text="Confirm the installation." /></>}
        </ol>
        <button type="button" onClick={onClose} className="btn-primary mt-6 min-h-12 w-full">Got It</button>
      </div>
    </div>
  )
}

function GuideStep({ number, text }) {
  return <li className="flex items-center gap-3 rounded-xl bg-orange-50 p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-extrabold text-white">{number}</span>{text}</li>
}

function EmptyMessage({ title, text }) {
  return <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-4"><div className="font-extrabold text-charcoal-300">{title}</div><p className="mt-1 text-sm text-muted">{text}</p></div>
}

function LoadingCard() {
  return <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-8 text-center shadow-soft"><div className="font-extrabold text-charcoal-300">Loading your secure reward card...</div></div>
}

function SignInRequired() {
  return <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-6 text-center shadow-soft sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-600"><QrCode size={24} /></div><h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">Sign In Required</h2><p className="mt-2 text-sm leading-relaxed text-muted">For your privacy, sign in using your email address and date of birth to open this reward card.</p><Link to="/rewards#card-login" className="btn-primary mt-6">Open My Reward Card</Link></div>
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const input = document.createElement('textarea')
      input.value = value
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      const copied = document.execCommand('copy')
      input.remove()
      return copied
    } catch {
      return false
    }
  }
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

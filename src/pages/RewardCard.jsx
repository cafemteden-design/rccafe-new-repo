import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, Calendar, Copy, Gift, History, LogOut, MessageCircle, QrCode, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import RewardCardDisplay from '../components/rewards/RewardCardDisplay.jsx'
import SEO from '../components/SEO.jsx'
import { rewardSignupGiftTitle } from '../data/rewardsDemo.js'
import { getDemoRewardCard, getRewardCardByToken, getRewardCardUrl } from '../services/rewards/rewardRepository.js'
import { clearRewardSession, getRewardSession, isRewardSessionAuthorized } from '../services/rewards/rewardSession.js'
import useInstallPrompt from '../hooks/useInstallPrompt.js'
import { trackRewardShare } from '../hooks/useAnalytics.js'

export default function RewardCard() {
  const navigate = useNavigate()
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
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
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const whatsappText = encodeURIComponent(`My RCC Reward Card: ${currentUrl}`)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const signOut = () => {
    clearRewardSession()
    navigate('/rewards#card-login')
  }

  return (
    <section className="section-light py-6 sm:py-10">
      <SEO title="My RCC Reward Card | Remote Control Cafe Auckland" description="View your personal RCC digital reward card and stamp progress." noindex />
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><QrCode size={14} />Digital Card</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">RCC Reward Card</h1>
            <p className="mt-2 text-muted">Show both sides of your digital loyalty card at the RCC counter.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isDemo && card && <button type="button" onClick={signOut} className="btn-outline"><LogOut size={16} />Sign Out</button>}
            <Link to="/rewards" className="btn-outline w-fit"><ArrowLeft size={16} />Back to Rewards</Link>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-8 text-center shadow-soft">
              <div className="font-extrabold text-charcoal-300">Loading your secure reward card...</div>
            </div>
          ) : card ? (
            <>
              <RewardCardDisplay card={card} cardUrl={getRewardCardUrl(card)} />
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
                  <div className="font-extrabold">Save this card link or add it to your phone home screen so you can open it anytime.</div>
                  <p className="mt-1">Open this card anytime to check your latest stamp progress and available offers.</p>
                  <p className="mt-2">Show your personal QR at the RCC counter so staff can add eligible stamps securely.</p>
                  {card.signupGift && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 font-extrabold text-green-900">
                      <Gift size={15} className="mr-1 inline" /> Welcome Gift: {card.signupGift.title || rewardSignupGiftTitle}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer" className="btn-primary" onClick={() => trackRewardShare({ method: 'whatsapp' })}><MessageCircle size={16} /> Share Card on WhatsApp</a>
                  <button onClick={() => { copyLink(); trackRewardShare({ method: 'copy_link' }); }} className="btn-outline"><Copy size={16} /> {copied ? 'Link Copied' : 'Copy Card Link'}</button>
                  <button onClick={install.requestInstall} className="btn-outline"><Smartphone size={16} /> Add to Home Screen</button>
                  <Link to="/booking#calendar" className="btn-outline"><Calendar size={16} /> Book Visit</Link>
                </div>
              </div>
              {install.showGuide && (
                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
                  <div className="font-extrabold">Add to Phone Home Screen</div>
                  {install.isIOS ? (
                    <p className="mt-2"><span className="font-bold">iPhone:</span> Tap the Safari Share icon, then choose Add to Home Screen.</p>
                  ) : (
                    <p className="mt-2"><span className="font-bold">Android:</span> Accept the install prompt, or open the browser menu and choose Add to Home screen.</p>
                  )}
                  <p className="mt-2 text-muted">This gives you quick app-like access to your reward card from your phone home screen.</p>
                </div>
              )}

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <DashboardPanel icon={Bell} title="Notifications" empty="No new notifications.">
                  {(card.notifications || []).map((notification) => (
                    <DashboardItem key={notification.id} title={notification.title} text={notification.message} />
                  ))}
                </DashboardPanel>
                <DashboardPanel icon={History} title="Reward History" empty="Your reward activity will appear here.">
                  {(card.history || []).slice(0, 6).map((item) => (
                    <DashboardItem
                      key={item.id}
                      title={item.label}
                      text={`${new Date(item.createdAt).toLocaleDateString('en-NZ')} - Cycle ${item.cycle || 1}`}
                    />
                  ))}
                </DashboardPanel>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-6 text-center shadow-soft sm:p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-600">
                <QrCode size={24} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">Sign In Required</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For your privacy, a card link cannot be opened without an active customer session. Sign in using your RCC Card ID and date of birth.
              </p>
              <Link to="/rewards#card-login" className="btn-primary mt-6">Sign In to My Card</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function DashboardPanel({ icon: Icon, title, empty, children }) {
  const items = Array.isArray(children) ? children : [children].filter(Boolean)
  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold text-charcoal-300">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-600"><Icon size={18} /></span>
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.length ? items : <p className="text-sm text-muted">{empty}</p>}
      </div>
    </section>
  )
}

function DashboardItem({ title, text }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft p-4">
      <div className="font-extrabold text-charcoal-300">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-muted">{text}</div>
    </div>
  )
}

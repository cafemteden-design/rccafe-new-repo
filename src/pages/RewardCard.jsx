import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Copy, MessageCircle, QrCode } from 'lucide-react'
import { useState } from 'react'
import RewardCardDisplay from '../components/rewards/RewardCardDisplay.jsx'
import { getRewardCardByToken, getRewardCardUrl, seedDemoRewardCard } from '../data/rewardsDemo.js'

export default function RewardCard() {
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const token = pathToken || searchParams.get('token')
  const card = token === 'demo' ? seedDemoRewardCard() : getRewardCardByToken(token)
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

  return (
    <section className="section-light py-6 sm:py-10">
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow"><QrCode size={14} />Digital Card</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">RCC Reward Card</h1>
            <p className="mt-2 text-muted">Show both sides of your digital loyalty card at the RCC counter.</p>
          </div>
          <Link to="/rewards" className="btn-outline w-fit"><ArrowLeft size={16} />Back to Rewards</Link>
        </div>

        <div className="mt-8">
          {card ? (
            <>
              <RewardCardDisplay card={card} cardUrl={getRewardCardUrl(card)} />
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
                  <div className="font-extrabold">Save this page link or share it to WhatsApp.</div>
                  <p className="mt-1">You can open this card anytime to check your latest stamps. In the final live setup, this card will always show your latest stamp count from the RCC database.</p>
                  <p className="mt-2">QR will be unique for every customer in the final live setup. Staff will scan this QR to add stamps securely.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer" className="btn-primary"><MessageCircle size={16} /> Share Card on WhatsApp</a>
                  <button onClick={copyLink} className="btn-outline"><Copy size={16} /> {copied ? 'Link Copied' : 'Copy Card Link'}</button>
                  <Link to="/booking#calendar" className="btn-outline"><Calendar size={16} /> Book Visit</Link>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-white p-5">
                <div className="text-sm font-extrabold text-charcoal-300">How will I see my card again?</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  After registration, your card opens with a unique link. Save the link, share it to your WhatsApp, or bookmark it.
                </p>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-6 text-center shadow-soft sm:p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-600">
                <QrCode size={24} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">Card Not Found</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                This demo card may have been created in another browser or local data may have been cleared.
              </p>
              <Link to="/rewards" className="btn-primary mt-6">Create Reward Card</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

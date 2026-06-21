import { BadgeCheck, Check, Cone, Gift, HardHat, QrCode, RadioTower, RotateCcw, Truck } from 'lucide-react'
import Logo from '../Logo.jsx'
import DemoQrCode from './DemoQrCode.jsx'

const STAMP_TOTAL = 7

export default function RewardCardDisplay({ card, cardUrl, compact = false }) {
  if (!card) return null

  return (
    <div>
      <div className={`grid gap-5 ${compact ? '' : 'lg:grid-cols-2'}`}>
        <RewardCardFront card={card} compact={compact} />
        {!compact && <RewardCardBack card={card} cardUrl={cardUrl} />}
      </div>
      {!compact && <OffersPanel card={card} />}
    </div>
  )
}

export function RewardCardFront({ card, compact = false }) {
  const status = getRewardStatus(card)
  const count = Math.min(Number(card.stampCount || 0), STAMP_TOTAL)

  return (
    <article className={`relative h-full overflow-hidden rounded-[24px] border border-orange-200 bg-white text-charcoal-300 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${compact ? 'p-4' : 'min-h-[330px] p-5 sm:p-6'}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-charcoal-300 to-orange-400" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-100" />
      <div className="absolute bottom-4 right-5 flex items-center gap-2 text-orange-200">
        <Truck size={compact ? 28 : 46} />
        <Cone size={compact ? 20 : 30} />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-orange-100">
          <Logo className={`${compact ? 'h-8' : 'h-10 sm:h-12'} w-auto max-w-[138px]`} />
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${status.className}`}>
          {status.key === 'unlocked' ? <Gift size={13} /> : <BadgeCheck size={13} />}
          {status.frontLabel}
        </span>
      </div>

      <div className="relative mt-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">
          <RadioTower size={13} /> RCC Reward Card
        </div>
        <h2 className={`${compact ? 'mt-3 text-lg' : 'mt-4 text-2xl sm:text-3xl'} max-w-[72%] font-display font-extrabold leading-tight text-charcoal-300`}>{card.name}</h2>
      </div>

      <div className={`relative mt-4 grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'} text-sm`}>
        <CardDetail icon={BadgeCheck} label="Card ID" value={card.cardId} />
        {!compact && <CardDetail icon={RotateCcw} label="Cycle" value={card.cycle} />}
        {compact && (
          <div className="grid place-items-center rounded-2xl border border-orange-100 bg-[#fff8ee] p-3">
            <QrCode size={22} className="text-charcoal-300" />
            <div className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-orange-700">QR</div>
          </div>
        )}
      </div>
      {!compact && (
        <div className="relative mt-3 rounded-2xl border border-orange-100 bg-white px-3 py-2 text-xs">
          <span className="font-bold text-muted">Mobile</span>
          <span className="ml-2 font-extrabold text-charcoal-300">{card.phone || 'Not provided'}</span>
        </div>
      )}

      <div className="relative mt-4 rounded-2xl border border-orange-100 bg-[#fff8ee] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Stamp Progress</div>
            <div className="mt-0.5 font-display text-xl font-extrabold text-charcoal-300">{count}/7</div>
          </div>
          <MiniStampRow count={count} compact={compact} />
        </div>
      </div>
      {!compact && <p className="relative mt-4 text-xs font-semibold text-muted">Show this card at the RCC counter.</p>}
    </article>
  )
}

export function RewardCardBack({ card, cardUrl, compact = false }) {
  const status = getRewardStatus(card)
  const count = Math.min(Number(card.stampCount || 0), STAMP_TOTAL)

  return (
    <article className={`relative h-full overflow-hidden rounded-[24px] border border-orange-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${compact ? 'p-4' : 'min-h-[330px] p-5 sm:p-6'}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-300 to-charcoal-300" />
      <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-orange-50" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Collect 7 Stamps</div>
          <h3 className={`${compact ? 'text-xl' : 'text-2xl'} mt-1 font-display font-extrabold text-charcoal-300`}>Stamp Card</h3>
          <p className="mt-1 text-sm text-muted">{count} of 7 stamps collected</p>
        </div>
        <div className="w-24 sm:w-28">
          <DemoQrCode value={cardUrl || card.token || card.cardId} label="Card QR" premium compact />
        </div>
      </div>

      <div className={`${compact ? 'mt-4' : 'mt-5'} relative`}>
        <StampGrid count={count} redeemed={status.key === 'redeemed'} compact={compact} />
      </div>

      <div className={`${compact ? 'mt-4' : 'mt-5'} relative grid gap-3 ${compact ? '' : 'sm:grid-cols-[1fr_190px]'}`}>
        <div className="rounded-2xl border border-orange-100 bg-[#fff8ee] p-3">
          <div className="font-extrabold text-charcoal-300">{compact ? 'Show QR at counter' : 'Complete 7 visits to unlock your surprise gift.'}</div>
        </div>
        {!compact && <div className="rounded-2xl border border-orange-100 bg-white p-4 text-sm leading-relaxed text-muted">
          <div className="flex items-center gap-2 font-extrabold text-charcoal-300"><QrCode size={15} /> Show this QR at RCC counter</div>
          <p className="mt-1 text-xs">Staff scans this personal QR to add eligible stamps to the card.</p>
        </div>}
      </div>
    </article>
  )
}

function OffersPanel({ card }) {
  const offers = [
    ...(card.signupGift ? [card.signupGift] : []),
    ...(card.activeOffers || [])
  ]
  if (!offers.length) return null

  return (
    <section className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-green-700">
        <Gift size={15} /> Current Offers
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id || offer.title} className="rounded-2xl border border-green-100 bg-white px-4 py-3">
            <div className="font-extrabold text-charcoal-300">{offer.title}</div>
            <div className="mt-1 text-sm leading-relaxed text-muted">{offer.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function getRewardStatus(card) {
  const redeemed = (card.history || []).some((item) => item.type === 'reward_redeemed')

  if (card.rewardStatus === 'unlocked') {
    return { key: 'unlocked', label: 'Surprise Gift Unlocked', frontLabel: 'Gift Unlocked', className: 'bg-green-100 text-green-700' }
  }

  if (redeemed && Number(card.stampCount || 0) === 0) {
    return { key: 'redeemed', label: 'Gift Redeemed', frontLabel: 'Redeemed', className: 'bg-charcoal-300 text-white' }
  }

  return { key: 'collecting', label: 'Keep Collecting', frontLabel: 'Active Card', className: 'bg-orange-500 text-white' }
}

function CardDetail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-[#fff8ee] p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
        <Icon size={13} /> {label}
      </div>
      <div className="mt-1 truncate font-extrabold text-charcoal-300">{value || '-'}</div>
    </div>
  )
}

function MiniStampRow({ count, compact = false }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: STAMP_TOTAL }).map((_, index) => {
        const active = index < count
        const gift = index === STAMP_TOTAL - 1
        return (
          <span key={index} className={`grid ${compact ? 'h-5 w-5' : 'h-6 w-6'} place-items-center rounded-full border text-[8px] font-extrabold ${active ? 'border-orange-500 bg-orange-500 text-white' : gift ? 'border-orange-300 bg-white text-orange-700' : 'border-orange-200 bg-white text-muted'}`}>
            {gift ? 'G' : active ? <Check size={compact ? 10 : 12} strokeWidth={3} /> : index + 1}
          </span>
        )
      })}
    </div>
  )
}

function StampGrid({ count, redeemed, compact = false }) {
  return (
    <div className={`grid grid-cols-7 ${compact ? 'gap-1.5' : 'gap-1.5 sm:gap-2'}`}>
      {Array.from({ length: STAMP_TOTAL }).map((_, index) => {
        const active = index < count
        const gift = index === STAMP_TOTAL - 1
        return (
          <div key={index} className={`grid ${compact ? 'min-h-[42px] rounded-xl' : 'min-h-[44px] rounded-xl sm:min-h-[58px] sm:rounded-2xl'} place-items-center border text-center text-xs font-extrabold ${active ? 'border-orange-500 bg-orange-500 text-white shadow-glow' : gift ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-orange-100 bg-white text-muted'}`}>
            <div>
              {gift ? <Gift size={compact ? 14 : 16} className="mx-auto sm:h-[18px] sm:w-[18px]" /> : active ? <BadgeCheck size={compact ? 14 : 16} className="mx-auto sm:h-[18px] sm:w-[18px]" /> : <HardHat size={compact ? 13 : 14} className="mx-auto sm:h-4 sm:w-4" />}
              <div className={`${compact ? 'mt-0.5 text-[7px]' : 'mt-0.5 text-[7px] sm:mt-1 sm:text-[9px]'} uppercase tracking-widest`}>{gift ? 'Gift' : redeemed ? 'New' : `#${index + 1}`}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

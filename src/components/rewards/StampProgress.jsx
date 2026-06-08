import { BadgeCheck, Circle, Gift, HardHat } from 'lucide-react'
import { REWARD_MAX_STAMPS } from '../../data/rewardsDemo.js'

export default function StampProgress({ count = 0, className = '', redeemed = false, compact = false }) {
  const current = Math.min(Number(count) || 0, REWARD_MAX_STAMPS)
  const unlocked = current >= REWARD_MAX_STAMPS

  return (
    <div className={className}>
      {!compact && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Stamp Progress</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">{current}/{REWARD_MAX_STAMPS}</div>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${unlocked ? 'bg-green-100 text-green-700' : redeemed ? 'bg-charcoal-300 text-white' : 'bg-orange-100 text-orange-700'}`}>
          {unlocked ? <Gift size={15} /> : redeemed ? <BadgeCheck size={15} /> : <HardHat size={15} />}
          {unlocked ? 'Surprise Gift Unlocked' : redeemed ? 'Gift Redeemed' : `${REWARD_MAX_STAMPS - current} stamps to go`}
        </div>
      </div>}

      {!compact && <p className="mt-3 text-sm font-medium text-charcoal-100">Collect 7 stamps and unlock a surprise gift.</p>}

      <div className={`${compact ? 'mt-0' : 'mt-4'} grid grid-cols-4 gap-2 sm:grid-cols-7`}>
        {Array.from({ length: REWARD_MAX_STAMPS }).map((_, index) => {
          const active = index < current
          const giftSlot = index === REWARD_MAX_STAMPS - 1
          return (
            <div
              key={index}
              className={`relative grid ${compact ? 'min-h-[58px]' : 'min-h-[70px]'} place-items-center rounded-2xl border text-sm font-extrabold transition ${
                active
                  ? 'border-orange-500 bg-orange-500 text-white shadow-glow'
                  : giftSlot
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-border bg-white text-muted'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {active ? (
                  giftSlot ? <Gift size={compact ? 18 : 21} /> : <BadgeCheck size={compact ? 18 : 21} />
                ) : (
                  giftSlot ? <Gift size={compact ? 18 : 21} /> : <Circle size={compact ? 16 : 18} />
                )}
                <span className="text-[10px] uppercase tracking-widest">{giftSlot ? 'GIFT' : `Stamp ${index + 1}`}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

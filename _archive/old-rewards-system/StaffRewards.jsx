import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarDays, CheckCircle2, Gift, History, LockKeyhole, QrCode, RotateCcw, ScanLine, Search, ShieldAlert, UserRound } from 'lucide-react'
import StampProgress from '../components/rewards/StampProgress.jsx'
import SEO from '../components/SEO.jsx'
import { getRewardStatus } from '../components/rewards/RewardCardDisplay.jsx'
import {
  addRewardStamp,
  getRewardCardByCardId,
  getRewardCards,
  redeemReward,
  seedDemoRewardCard
} from '../data/rewardsDemo.js'

export default function StaffRewards() {
  const [cards, setCards] = useState(() => getRewardCards())
  const [query, setQuery] = useState('')
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.cardId || '')
  const [message, setMessage] = useState(null)
  const [pin, setPin] = useState('')
  const [pinOk, setPinOk] = useState(false)
  const [pinError, setPinError] = useState('')
  const selectedCard = useMemo(() => {
    return cards.find((card) => card.cardId === selectedCardId) || null
  }, [cards, selectedCardId])

  const refresh = (cardId = selectedCardId) => {
    const nextCards = getRewardCards()
    setCards(nextCards)
    if (cardId) setSelectedCardId(cardId)
  }

  const runDemoScan = () => {
    const card = seedDemoRewardCard()
    refresh(card.cardId)
    setQuery(card.cardId)
    setMessage({ type: 'success', text: `Sample scan found ${card.cardId}.` })
  }

  const searchCard = (event) => {
    event.preventDefault()
    const card = getRewardCardByCardId(query)
    if (!card) {
      setMessage({ type: 'error', text: 'No card found for this Card ID.' })
      return
    }
    refresh(card.cardId)
    setMessage({ type: 'success', text: `${card.cardId} loaded.` })
  }

  const addStamp = () => {
    if (!selectedCard) return
    const result = addRewardStamp(selectedCard.cardId)
    refresh(selectedCard.cardId)
    setMessage({ type: result.ok ? 'success' : 'error', text: result.message })
  }

  const redeem = () => {
    if (!selectedCard) return
    const result = redeemReward(selectedCard.cardId)
    refresh(selectedCard.cardId)
    setMessage({ type: result.ok ? 'success' : 'error', text: result.message })
  }

  const unlockStaff = (event) => {
    event.preventDefault()
    if (pin === '1234') {
      setPinOk(true)
      setPinError('')
      return
    }
    setPinError('Incorrect PIN. Use 1234 for staff preview access.')
  }

  return (
    <section className="section-light py-6 sm:py-10">
      <SEO title="Staff Rewards | RCC Cafe" description="RCC staff reward card panel." noindex />
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow"><ScanLine size={14} />Staff Panel</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Staff Reward Scanner</h1>
          <p className="mt-2 text-muted">Scan reward cards, add eligible visit stamps, and redeem unlocked gifts.</p>
        </div>

        {!pinOk ? (
          <form onSubmit={unlockStaff} className="mt-8 max-w-md rounded-3xl border border-orange-200 bg-[#fff8ee] p-5 shadow-soft sm:p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
              <LockKeyhole size={22} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">Enter Staff PIN</h2>
            <p className="mt-2 text-sm text-muted">Staff access only. Preview PIN: 1234</p>
            <input
              value={pin}
              onChange={(event) => { setPin(event.target.value); setPinError('') }}
              className="field-input mt-5"
              inputMode="numeric"
              placeholder="1234"
              type="password"
            />
            {pinError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{pinError}</div>}
            <button type="submit" className="btn-primary mt-5 w-full">Unlock Staff Panel</button>
            <button type="button" onClick={() => { setPin('1234'); setPinOk(true); setPinError('') }} className="btn-outline mt-3 w-full">
              Preview Unlock
            </button>
          </form>
        ) : (
          <div className="mt-8">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="card p-5 sm:p-6">
              <span className="eyebrow"><ScanLine size={14} />Scanner</span>
              <div className="mt-5 rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-5 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-orange-600 shadow-soft">
                  <QrCode size={28} />
                </div>
                <h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">Scanner Preview</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Staff scans a customer QR, opens the card, then adds eligible stamps.
                </p>
                <button onClick={runDemoScan} className="btn-primary mt-5 w-full">Scan Sample Card <ScanLine size={16} /></button>
              </div>

              <form onSubmit={searchCard} className="mt-5">
                <label className="field-label">Manual Card ID Lookup</label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="RCC1001"
                    className="field-input !mt-0"
                  />
                  <button type="submit" className="grid h-[46px] w-[52px] flex-shrink-0 place-items-center rounded-xl bg-charcoal-300 text-white">
                    <Search size={18} />
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}
            </div>

            <div className="mt-5 card p-5 sm:p-6">
              <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Reward Cards</div>
              <div className="mt-4 grid gap-3">
                {cards.length === 0 ? (
                  <EmptyState />
                ) : (
                  cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => { setSelectedCardId(card.cardId); setQuery(card.cardId); setMessage(null) }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedCardId === card.cardId ? 'border-orange-500 bg-orange-50' : 'border-border bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-charcoal-300">{card.cardId}</div>
                          <div className="mt-1 text-sm text-muted">{card.name}</div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-700">
                          {card.stampCount}/7
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedCard ? (
              <>
                <div className="overflow-hidden rounded-3xl border border-orange-200 bg-[#fffaf3] shadow-card">
                  <div className="border-b border-orange-100 bg-charcoal-300 p-5 text-white sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-orange-200">Staff Customer View</div>
                        <h2 className="mt-1 font-display text-3xl font-extrabold">{selectedCard.name}</h2>
                      </div>
                      <div className="rounded-full bg-orange-500 px-4 py-2 text-sm font-extrabold text-white">
                        {getRewardStatus(selectedCard).label}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
                    <StaffMetric icon={UserRound} label="Customer Name" value={selectedCard.name} />
                    <StaffMetric icon={BadgeCheck} label="Card ID" value={selectedCard.cardId} />
                    <StaffMetric icon={RotateCcw} label="Current Cycle" value={`Cycle ${selectedCard.cycle}`} />
                    <StaffMetric icon={CheckCircle2} label="Current Stamps" value={`${selectedCard.stampCount}/7`} />
                    <StaffMetric icon={CalendarDays} label="Latest Stamp Date" value={selectedCard.lastStampDate || 'No stamps yet'} />
                  </div>

                  <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className="rounded-3xl border border-orange-100 bg-white p-5">
                      <StampProgress count={selectedCard.stampCount} redeemed={getRewardStatus(selectedCard).key === 'redeemed'} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button onClick={addStamp} className="btn-primary min-h-[54px] text-base">
                    Add 1 Stamp <CheckCircle2 size={18} />
                  </button>
                  {selectedCard.rewardStatus === 'unlocked' && (
                    <button
                      onClick={redeem}
                      className="btn-outline min-h-[54px] text-base"
                    >
                      Redeem Gift <Gift size={18} />
                    </button>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 flex-shrink-0 text-orange-700" size={18} />
                    <span>Only one stamp can be added to the same reward card per Auckland calendar day. Duplicate attempts are blocked automatically.</span>
                  </div>
                </div>

                <HistoryPanel card={selectedCard} />
              </>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-3xl border border-border bg-bg-soft p-8 text-center">
                <div>
                  <UserRound size={46} className="mx-auto text-orange-500" />
                  <h2 className="mt-4 font-display text-2xl font-extrabold text-charcoal-300">No Card Selected</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">Create a customer reward card first or scan a sample card.</p>
                  <Link to="/rewards" className="btn-primary mt-5">Create Customer Card</Link>
                </div>
              </div>
            )}
          </div>
        </div>
          </div>
        )}
      </div>
    </section>
  )
}

function HistoryPanel({ card }) {
  return (
    <div className="mt-5 card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">History</div>
          <h3 className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">Stamp & Reward Activity</h3>
        </div>
        <RotateCcw className="text-orange-500" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {(card.history || []).length === 0 ? (
          <p className="text-sm text-muted">No reward activity yet.</p>
        ) : (
          card.history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-bg-soft p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-bold text-charcoal-300">{item.label}</div>
                <div className="text-xs font-semibold text-muted">{new Date(item.createdAt).toLocaleString('en-NZ')}</div>
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-orange-700">
                Cycle {item.cycle}{item.stampCount ? ` - ${item.stampCount}/7` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StaffMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <Icon size={19} className="text-orange-600" />
      <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 truncate text-base font-extrabold text-charcoal-300">{value || '-'}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft p-4 text-sm text-muted">
      No reward cards yet. Create one from the Rewards page or scan a sample card.
    </div>
  )
}

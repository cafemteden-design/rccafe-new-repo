import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Gift, QrCode, ShieldCheck, Sparkles, UserPlus } from 'lucide-react'
import RewardCardDisplay from '../components/rewards/RewardCardDisplay.jsx'
import { createRewardCard, getRewardCardUrl } from '../data/rewardsDemo.js'

const PREVIEW_CARD = {
  cardId: 'RCC-1001',
  token: 'preview-card',
  name: 'RCC Guest',
  phone: '09 558 7570',
  stampCount: 3,
  cycle: 1,
  rewardStatus: 'collecting',
  lastStampDate: '',
  history: []
}

export default function Rewards() {
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')
  const cardUrl = card ? getRewardCardUrl(card) : ''

  const update = (key) => (event) => {
    setError('')
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    const phoneDigits = form.phone.replace(/\D/g, '')

    if (form.name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (phoneDigits.length < 6) {
      setError('Please enter your mobile number.')
      return
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    setCard(createRewardCard(form))
  }

  return (
    <section className="section-light py-6 sm:py-10">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow"><Sparkles size={14} />Digital Loyalty Card</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">RCC Reward Card</h1>
          <p className="mt-2 text-muted">Create your digital loyalty card and collect 7 stamps.</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-5 sm:p-7">
              <span className="eyebrow"><UserPlus size={14} />Create Card</span>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-charcoal-300">Start collecting stamps</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Register once. Your digital card link can be saved and opened anytime.
              </p>

              {card ? (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 flex-shrink-0 text-green-700" size={20} />
                    <div>
                      <div className="font-extrabold text-green-900">Reward card created</div>
                      <p className="mt-1 text-sm text-green-800">Your demo card is ready below.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link to={`/rewards/card/${card.token}`} className="btn-primary">Open Card <ArrowRight size={16} /></Link>
                    <Link to="/staff-rewards" className="btn-outline">Staff Demo</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <Field label="Full Name" value={form.name} onChange={update('name')} required />
                  <Field label="Mobile Number" value={form.phone} onChange={update('phone')} required placeholder="021 123 4567" />
                  <Field label="Email Address" type="email" value={form.email} onChange={update('email')} placeholder="Optional for demo" />

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn-primary min-h-[54px] w-full text-base">
                    Create My Digital Card <Sparkles size={17} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            {card ? (
              <RewardCardDisplay card={card} cardUrl={cardUrl} />
            ) : (
              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Preview</div>
                    <h3 className="font-display text-2xl font-extrabold text-charcoal-300">Digital stamp card</h3>
                  </div>
                  <div className="hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 sm:block">Demo Preview</div>
                </div>
                <div className="mx-auto max-w-md">
                  <RewardCardDisplay card={PREVIEW_CARD} cardUrl="https://rccafe.example/reward-card" compact />
                </div>
                <div id="how-it-works" className="mt-5 grid scroll-mt-28 gap-4 sm:grid-cols-2">
                  <FeatureCard icon={QrCode} title="Save Card Link" text="Customers can open their card anytime from the saved link or WhatsApp message." />
                  <FeatureCard icon={Gift} title="7 Stamp Reward" text="After seven visits, the digital card shows Surprise Gift Unlocked." />
                  <FeatureCard icon={ShieldCheck} title="Duplicate Block" text="The demo staff panel blocks duplicate stamps for the same card on the same day." />
                  <FeatureCard icon={Sparkles} title="Premium Card UI" text="Designed to match the RCC orange, white and construction cafe theme." />
                </div>
              </motion.div>
            )}

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-orange-700">Demo Mode</div>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-300">
                Cards are stored only in this browser using localStorage. This does not affect booking, Google Sheets, Apps Script, emails or deployment settings.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-white p-5">
              <div className="text-sm font-extrabold text-charcoal-300">How will I see my card again?</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                After registration, your card opens with a unique link. Save the link, share it to your WhatsApp, or bookmark it. In the final live setup, this card will always show your latest stamp count from the RCC database.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                QR will be unique for every customer in the final live setup. Staff will scan this QR to add stamps securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="card card-hover p-5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-orange-600">
        <Icon size={21} />
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold text-charcoal-300">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

function Field({ label, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="field-label">{label}{props.required && <span className="text-orange-500"> *</span>}</label>
      <input {...props} className="field-input" />
    </div>
  )
}

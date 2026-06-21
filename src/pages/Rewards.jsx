import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Copy, Gift, KeyRound, QrCode, ShieldCheck, Smartphone, Sparkles, UserPlus, Repeat, Clock, Award, X } from 'lucide-react'
import RewardCardDisplay from '../components/rewards/RewardCardDisplay.jsx'
import FAQAccordion from '../components/FAQAccordion.jsx'
import SEO from '../components/SEO.jsx'
import { rewardSignupGiftTitle } from '../data/rewardsDemo.js'
import { authenticateRewardCard, createRewardCard, getRewardCardUrl } from '../services/rewards/rewardRepository.js'
import { createRewardSession } from '../services/rewards/rewardSession.js'
import useInstallPrompt from '../hooks/useInstallPrompt.js'
import { PAGE_SEO, faqSchema } from '../data/seo.js'
import { trackRewardRegistration } from '../hooks/useAnalytics.js'

const REWARDS_SEO = {
  ...PAGE_SEO,
  title: 'RCC Reward Card - Earn Free Gifts | Remote Control Cafe Auckland',
  description: 'Join the free RCC Reward Card program. Collect a stamp on every visit and unlock a surprise gift after 7 visits. No cost to join, real rewards for loyal customers.',
  keywords: ['reward card auckland', 'loyalty programme auckland', 'customer rewards auckland']
}

const REWARDS_FAQS = [
  {
    q: 'How does the RCC Reward Card work?',
    a: 'Create your free digital card, visit RCC and collect a stamp each time. After 7 stamps, you unlock a surprise gift. It is our way of thanking loyal customers.'
  },
  {
    q: 'Is the Reward Card really free?',
    a: 'Yes. Creating and using the Reward Card is completely free. There is no cost to join, no membership fees, and no hidden charges.'
  },
  {
    q: 'What kind of gift do I get after 7 stamps?',
    a: 'The surprise gift varies but is always something enjoyable. It could be a free session, food and drink credit, or RCC merchandise. The exact reward is revealed when you unlock it.'
  },
  {
    q: 'Do stamps expire?',
    a: 'Stamps do not expire. Take your time collecting them at your own pace. We want the Reward Card to be a genuine benefit, not a pressure.'
  },
  {
    q: 'Can I share my Reward Card with family?',
    a: 'The Reward Card is personal to you. Each family member should create their own card to collect their own stamps and earn their own rewards.'
  },
  {
    q: 'How do I get my card stamped?',
    a: 'When you visit RCC, show your digital card to our staff. They will scan your unique QR code and add a stamp to your card. It is quick and easy.'
  }
]

const BENEFITS = [
  {
    icon: Gift,
    title: 'Free Reward After 7 Visits',
    desc: 'Collect stamps on eligible visits and purchases, then unlock a surprise gift after completing your card.'
  },
  {
    icon: Repeat,
    title: 'Unlimited Cycles',
    desc: 'Once you complete a card, start a new one. There is no limit to how many rewards you can earn over time.'
  },
  {
    icon: Clock,
    title: 'No Expiry',
    desc: 'Your stamps never expire. One eligible stamp can be added to your card per Auckland calendar day.'
  },
  {
    icon: Award,
    title: 'Exclusive Member Benefits',
    desc: 'Reward Card holders get priority booking access and special offers throughout the year.'
  }
]

const PREVIEW_CARD = {
  cardId: 'RCC1001',
  token: 'preview-card',
  name: 'RCC Guest',
  phone: '',
  stampCount: 3,
  cycle: 1,
  rewardStatus: 'collecting',
  lastStampDate: '',
  history: []
}

export default function Rewards() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', dob: '', email: '' })
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')
  const [lookup, setLookup] = useState({ cardId: '', dob: '', remember: true })
  const [lookupError, setLookupError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const install = useInstallPrompt()
  const cardUrl = card ? getRewardCardUrl(card) : ''

  const copyCardLink = async () => {
    if (!cardUrl) return
    try {
      await navigator.clipboard.writeText(cardUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const update = (key) => (event) => {
    setError('')
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const submit = async (event) => {
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

    if (!form.dob) {
      setError('Please enter your date of birth.')
      return
    }

    if (new Date(`${form.dob}T00:00:00`) > new Date()) {
      setError('Date of birth cannot be in the future.')
      return
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const nextCard = await createRewardCard(form)
      createRewardSession(nextCard, true)
      setCard(nextCard)
      setShowSuccess(true)
    // Track reward card registration
      trackRewardRegistration({
        card_id: nextCard.cardId,
        customer_name: form.name
      })
    } catch (submitError) {
      setError(submitError.message || 'Unable to create your card right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const openSavedCard = async (event) => {
    event.preventDefault()
    setLookupError('')
    const code = lookup.cardId.trim().toUpperCase()

    if (!code || !lookup.dob) {
      setLookupError('Please enter your RCC Card ID and date of birth.')
      return
    }

    try {
      const savedCard = await authenticateRewardCard(code, lookup.dob)
      if (!savedCard) {
        setLookupError('Card ID or date of birth is incorrect. Please check your details or contact RCC.')
        return
      }
      createRewardSession(savedCard, lookup.remember)
      navigate(`/rewards/card/${savedCard.token}`)
    } catch (lookupFailure) {
      setLookupError(lookupFailure.message || 'Unable to open your card right now.')
    }
  }

  return (
    <>
      <SEO seo={REWARDS_SEO} schema={faqSchema(REWARDS_FAQS)} />
      {showSuccess && card && (
        <SuccessModal
          card={card}
          cardUrl={cardUrl}
          copied={copied}
          showInstallHelp={install.showGuide}
          onClose={() => setShowSuccess(false)}
          onCopy={copyCardLink}
          onInstallHelp={install.requestInstall}
          isIOS={install.isIOS}
        />
      )}

      <section className="section-soft py-10 sm:py-14">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Sparkles size={14} />Digital Loyalty Card</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-charcoal-300 sm:text-5xl lg:text-6xl">Create Your Free Reward Card</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Sign up for your free digital reward card and receive a welcome surprise after your card is created.
            </p>
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-orange-200 bg-white p-4 text-center shadow-soft">
              <div className="text-xs font-extrabold uppercase tracking-widest text-orange-700">Welcome Surprise</div>
              <p className="mt-1 text-sm font-semibold text-charcoal-300">Create your card to reveal your first RCC reward offer.</p>
            </div>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#create-card" className="btn-primary">Create My Reward Card <ArrowRight size={16} /></a>
              <Link to="/rewards/card/demo" className="btn-outline">View Demo Card</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="card-login" className="section-soft scroll-mt-28 border-y border-orange-100 py-8 sm:py-10">
        <div className="container-x">
          <div className="mx-auto grid max-w-4xl gap-5 rounded-3xl border border-orange-200 bg-white p-5 shadow-soft sm:p-7 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <span className="eyebrow"><QrCode size={14} />Returning Member</span>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Already have a Reward Card?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Sign in securely with your RCC Card ID and date of birth.</p>
            </div>
            <form onSubmit={openSavedCard} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="reward-card-code">RCC Card ID</label>
                  <input
                    id="reward-card-code"
                    value={lookup.cardId}
                    onChange={(event) => {
                      setLookup((current) => ({ ...current, cardId: event.target.value }))
                      setLookupError('')
                    }}
                    className="field-input !mt-1.5 uppercase"
                    placeholder="RCC1001"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="reward-card-password">Password (Date of Birth)</label>
                  <input
                    id="reward-card-password"
                    value={lookup.dob}
                    onChange={(event) => {
                      setLookup((current) => ({ ...current, dob: event.target.value }))
                      setLookupError('')
                    }}
                    className="field-input !mt-1.5"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-charcoal-300">
                <input
                  type="checkbox"
                  checked={lookup.remember}
                  onChange={(event) => {
                    setLookup((current) => ({ ...current, remember: event.target.checked }))
                  }}
                  className="h-4 w-4 accent-orange-500"
                />
                Remember me on this device
              </label>
              {lookupError && <p className="mt-2 text-sm font-semibold text-red-700">{lookupError}</p>}
              <button type="submit" className="btn-dark min-h-12 w-full sm:w-fit">Open My Card <KeyRound size={16} /></button>
            </form>
          </div>
        </div>
      </section>

      <section id="create-card" className="section-light scroll-mt-28 py-10 sm:py-14">
        <div className="container-x">
          <div className="mb-7 max-w-2xl">
            <span className="eyebrow"><UserPlus size={14} />Free Registration</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Create your card in seconds</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Register once, save your personal card link and show it whenever you visit RCC.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-12">
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
                        <p className="mt-1 text-sm text-green-800">Your reward card is ready below.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Link to={`/rewards/card/${card.token}`} className="btn-primary">Open Card <ArrowRight size={16} /></Link>
                      <button type="button" onClick={() => setShowSuccess(true)} className="btn-outline">Show Card Details</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submit} className="mt-6 space-y-4">
                    <Field label="Full Name" value={form.name} onChange={update('name')} required />
                    <Field label="Mobile Number" value={form.phone} onChange={update('phone')} required placeholder="Mobile number" />
                    <Field label="Date of Birth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={update('dob')} required />
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-charcoal-300">
                      <div className="font-extrabold text-orange-700">Welcome surprise after signup</div>
                      <p className="mt-1">Create your card to unlock your first RCC offer.</p>
                    </div>
                    <Field label="Email Address" type="email" value={form.email} onChange={update('email')} placeholder="Optional" />

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                      </div>
                    )}

                    <button type="submit" disabled={submitting} className="btn-primary min-h-[54px] w-full text-base disabled:opacity-60">
                      {submitting ? 'Creating Your Card...' : 'Create My Digital Card'} <Sparkles size={17} />
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
                    <div className="hidden rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 sm:block">Live Preview</div>
                  </div>
                  <div className="mx-auto max-w-md">
                    <RewardCardDisplay card={PREVIEW_CARD} cardUrl="https://rccafe.example/reward-card" compact />
                  </div>
                  <div id="how-it-works" className="mt-5 grid scroll-mt-28 gap-4 sm:grid-cols-2">
                    <FeatureCard icon={QrCode} title="Save Your Card" text="Open your card anytime from its saved link or a message to yourself." />
                    <FeatureCard icon={Gift} title="Unlock at 7 Stamps" text="Complete your stamp card to unlock a surprise RCC reward." />
                    <FeatureCard icon={ShieldCheck} title="Quick Counter Scan" text="Show your personal QR at the RCC counter when you make an eligible visit." />
                    <FeatureCard icon={Sparkles} title="Keep Collecting" text="Redeem your gift and begin a fresh reward cycle while keeping your history." />
                  </div>
                </motion.div>
              )}

              <div className="mt-4 rounded-2xl border border-border bg-white p-5">
                <div className="text-sm font-extrabold text-charcoal-300">How will I see my card again?</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  After registration, your card opens with a unique link. Save it, share it to yourself or add it to your phone home screen for quick access.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Show the card QR at the RCC counter and our staff will update your stamp progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">Why join RCC Rewards?</h2>
            <p className="mt-3 text-muted">A simple, free way to make every RCC visit count.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card card-hover p-5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-600">
                  <benefit.icon size={21} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-charcoal-300">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-8">
              <FAQAccordion items={REWARDS_FAQS} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">
              Ready to Start Collecting?
            </h2>
            <p className="mt-4 text-muted">
              Create your free Reward Card and earn rewards on every visit.
            </p>
            <div className="mt-8">
              <Link to="/booking#calendar" className="btn-primary">Book Your First Visit <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function SuccessModal({ card, cardUrl, copied, showInstallHelp, onClose, onCopy, onInstallHelp, isIOS }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-charcoal-300/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-orange-200 bg-white shadow-card"
      >
        <div className="relative bg-gradient-to-br from-orange-50 via-white to-green-50 p-6 sm:p-7">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-border bg-white p-2 text-muted transition hover:text-charcoal-300" aria-label="Close">
            <X size={18} />
          </button>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500 text-white shadow-glow">
            <Gift size={26} />
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold text-charcoal-300">Congratulations!</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Your Remote Control Cafe reward card is ready.</p>

          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
            <div className="text-xs font-extrabold uppercase tracking-widest text-green-700">You have unlocked your welcome gift</div>
            <div className="mt-1 font-display text-2xl font-extrabold">{rewardSignupGiftTitle}</div>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-muted">Card ID</span>
              <span className="font-extrabold text-charcoal-300">{card.cardId}</span>
            </div>
            <div className="mt-2 truncate text-xs text-muted">{cardUrl}</div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link to={`/rewards/card/${card.token}`} className="btn-primary min-h-12 whitespace-nowrap px-3">View My Card</Link>
            <button type="button" onClick={onCopy} className="btn-outline min-h-12 whitespace-nowrap px-3"><Copy size={16} /> {copied ? 'Copied' : 'Copy Card Link'}</button>
            <button type="button" onClick={onInstallHelp} className="btn-outline min-h-12 px-3 text-center leading-tight"><Smartphone size={16} /> Add to Home Screen</button>
          </div>

          {showInstallHelp && <HomeScreenInstructions isIOS={isIOS} />}
        </div>
      </motion.div>
    </div>
  )
}

function HomeScreenInstructions({ isIOS }) {
  return (
    <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
      <div className="font-extrabold">Add to Home Screen</div>
      {isIOS ? (
        <p className="mt-2"><span className="font-bold">iPhone:</span> Tap the Safari Share icon, then choose Add to Home Screen.</p>
      ) : (
        <p className="mt-2"><span className="font-bold">Android:</span> Accept the install prompt, or open the browser menu and choose Add to Home screen.</p>
      )}
    </div>
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
  const id = props.id || `reward-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}{props.required && <span className="text-orange-500"> *</span>}</label>
      <input {...props} id={id} className="field-input" />
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, CheckCircle2, Gift, KeyRound, Mail, ShieldCheck, Sparkles, UserPlus, X } from 'lucide-react'
import SEO from '../components/SEO.jsx'
import { rewardSignupGiftTitle } from '../data/rewardsDemo.js'
import { authenticateRewardCardByEmail, createRewardCard, findRewardIdentityDuplicate } from '../services/rewards/rewardRepository.js'
import { createRewardSession, getRewardSession } from '../services/rewards/rewardSession.js'
import { trackRewardRegistration } from '../hooks/useAnalytics.js'

const REWARDS_SEO = {
  title: 'My Rewards | RCC Digital Reward Card Auckland',
  description: 'Create or open your RCC digital reward card, collect seven stamps and unlock surprise rewards.'
}

export default function Rewards() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', dob: '', email: '' })
  const [lookup, setLookup] = useState({ email: '', dob: '', remember: true })
  const [createdCard, setCreatedCard] = useState(null)
  const [formError, setFormError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [savedSession] = useState(() => getRewardSession())

  const updateForm = (key) => (event) => {
    setFormError('')
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const createCard = async (event) => {
    event.preventDefault()
    setFormError('')
    const validation = validateRegistration(form)
    if (validation) {
      setFormError(validation)
      return
    }

    setSubmitting(true)
    try {
      const duplicate = await findRewardIdentityDuplicate(form)
      if (duplicate === 'email') throw new Error('A reward card already exists for this email address. Please open your existing card.')
      if (duplicate === 'mobile') throw new Error('A reward card already exists for this mobile number. Please open your existing card.')

      const card = await createRewardCard(form)
      createRewardSession(card, true)
      setCreatedCard(card)
      trackRewardRegistration({ card_id: card.cardId, customer_name: form.name })
    } catch (error) {
      setFormError(friendlyRegistrationError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const openCard = async (event) => {
    event.preventDefault()
    setLookupError('')
    const email = lookup.email.trim().toLowerCase()
    if (!isValidEmail(email) || !lookup.dob) {
      setLookupError('Please enter your email address and date of birth.')
      return
    }

    setSigningIn(true)
    try {
      const card = await authenticateRewardCardByEmail(email, lookup.dob)
      if (!card) {
        setLookupError('Email address or date of birth is incorrect. Please check your details.')
        return
      }
      createRewardSession(card, lookup.remember)
      navigate(`/rewards/card/${card.token}`)
    } catch (error) {
      setLookupError(error.message || 'Unable to open your reward card right now.')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <>
      <SEO {...REWARDS_SEO} path="/rewards" />
      <section className="min-h-[calc(100svh-5rem)] bg-[#fffdfa] py-6 sm:py-10">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-widest text-muted">
            <Link to="/" className="transition hover:text-orange-600">Home</Link>
            <span className="mx-2 text-orange-400">/</span>
            <span className="text-orange-700">My Rewards</span>
          </nav>
          <div className="mt-3 max-w-2xl">
            <span className="eyebrow"><Sparkles size={14} />RCC Loyalty</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-charcoal-300 sm:text-4xl">My Rewards</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">Create your digital reward card or securely open an existing card.</p>
          </div>

          {savedSession?.token && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-700 text-white"><ShieldCheck size={18} /></span><div><div className="font-extrabold text-charcoal-300">Your reward card is saved on this device</div><p className="mt-1 text-sm text-muted">Open your secure RCC card without entering your details again.</p></div></div>
              <Link to={`/rewards/card/${savedSession.token}`} className="btn-primary min-h-12 shrink-0">Open My Saved Card <ArrowRight size={16} /></Link>
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
            <section id="create-card" className="scroll-mt-28 rounded-3xl border border-orange-200 bg-white p-5 shadow-card sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-white"><UserPlus size={20} /></span>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Section 1</div>
                  <h2 className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">Create New Reward Card</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">Register once and start collecting stamps on every eligible visit.</p>
                </div>
              </div>

              <form onSubmit={createCard} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                <Field id="create-name" label="Full Name" value={form.name} onChange={updateForm('name')} autoComplete="name" required />
                <Field id="create-phone" label="Mobile Number" type="tel" value={form.phone} onChange={updateForm('phone')} autoComplete="tel" inputMode="tel" required />
                <Field id="create-dob" label="Date of Birth" type="date" max={todayKey()} value={form.dob} onChange={updateForm('dob')} autoComplete="bday" required />
                <Field id="create-email" label="Email Address" type="email" value={form.email} onChange={updateForm('email')} autoComplete="email" inputMode="email" required />
                <div className="sm:col-span-2 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-relaxed text-charcoal-300">
                  <div className="flex items-center gap-2 font-extrabold text-orange-700"><Gift size={16} />A welcome surprise is waiting</div>
                  <p className="mt-1">Create your card to reveal it. Your details are used only for your RCC reward membership.</p>
                </div>
                {formError && <Alert className="sm:col-span-2">{formError}</Alert>}
                <button type="submit" disabled={submitting} className="btn-primary min-h-[52px] w-full text-base disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                  {submitting ? 'Creating Your Card...' : 'Create My Reward Card'} <ArrowRight size={17} />
                </button>
              </form>
            </section>

            <section id="card-login" className="scroll-mt-28 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-charcoal-300 text-white"><KeyRound size={20} /></span>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Section 2</div>
                  <h2 className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">Open Existing Card</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">Use the email and date of birth registered with your card.</p>
                </div>
              </div>

              <form onSubmit={openCard} className="mt-6 space-y-4" noValidate>
                <Field id="login-email" label="Email Address" type="email" value={lookup.email} onChange={(event) => { setLookupError(''); setLookup((current) => ({ ...current, email: event.target.value })) }} autoComplete="email" inputMode="email" required />
                <Field id="login-dob" label="Date of Birth" type="date" max={todayKey()} value={lookup.dob} onChange={(event) => { setLookupError(''); setLookup((current) => ({ ...current, dob: event.target.value })) }} autoComplete="bday" required />
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-3 text-sm font-semibold text-charcoal-300">
                  <input type="checkbox" checked={lookup.remember} onChange={(event) => setLookup((current) => ({ ...current, remember: event.target.checked }))} className="h-5 w-5 accent-orange-500" />
                  Remember me on this device
                </label>
                {lookupError && <Alert>{lookupError}</Alert>}
                <button type="submit" disabled={signingIn} className="btn-dark min-h-[52px] w-full text-base disabled:cursor-not-allowed disabled:opacity-60">
                  {signingIn ? 'Opening Your Card...' : 'Open My Reward Card'} <ArrowRight size={17} />
                </button>
              </form>

              <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
                <MiniStep icon={Mail} title="Use Email" text="No card ID needed" />
                <MiniStep icon={CalendarDays} title="Enter DOB" text="Secure verification" />
                <MiniStep icon={ShieldCheck} title="Open Card" text="Your data stays intact" />
              </div>
            </section>
          </div>

          <div className="mt-5 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="font-extrabold text-charcoal-300">How RCC Rewards works</div><p className="mt-1 text-sm text-muted">Show your digital card at the counter, collect 7 stamps and unlock your surprise reward.</p></div>
              <Link to="/rewards/card/demo" className="btn-outline min-h-12 shrink-0">View Demo Card</Link>
            </div>
          </div>
        </div>
      </section>

      {createdCard && <WelcomeModal card={createdCard} onClose={() => setCreatedCard(null)} />}
    </>
  )
}

function WelcomeModal({ card, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal-300/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-orange-200 bg-white p-6 text-center shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close welcome message" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-border bg-white text-muted"><X size={19} /></button>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500 text-white shadow-glow"><Sparkles size={28} /></div>
        <div className="mt-5 text-xs font-extrabold uppercase tracking-widest text-orange-600">Card {card.cardId}</div>
        <h2 id="welcome-title" className="mt-2 font-display text-3xl font-extrabold text-charcoal-300">Welcome to RCC Rewards!</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">Your digital reward card has been created and you are securely signed in.</p>
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
          <CheckCircle2 className="mx-auto text-green-700" size={24} />
          <div className="mt-2 text-sm font-extrabold uppercase tracking-widest text-green-700">Welcome Surprise Unlocked</div>
          <div className="mt-1 font-display text-2xl font-extrabold">{card.signupGift?.title || rewardSignupGiftTitle}</div>
        </div>
        <Link to={`/rewards/card/${card.token}`} className="btn-primary mt-6 min-h-[52px] w-full text-base">View My Reward Card <ArrowRight size={17} /></Link>
      </div>
    </div>
  )
}

function Field({ id, label, required, ...props }) {
  return <label htmlFor={id} className="min-w-0"><span className="field-label">{label}{required && <span className="text-red-500"> *</span>}</span><input {...props} id={id} required={required} className="field-input min-h-12 text-base" /></label>
}

function Alert({ children, className = '' }) {
  return <div role="alert" className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-700 ${className}`}>{children}</div>
}

function MiniStep({ icon: Icon, title, text }) {
  return <div className="flex items-center gap-2 sm:block"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600"><Icon size={16} /></span><div className="sm:mt-2"><div className="text-xs font-extrabold text-charcoal-300">{title}</div><div className="text-[11px] text-muted">{text}</div></div></div>
}

function validateRegistration(form) {
  if (form.name.trim().length < 2) return 'Please enter your full name.'
  if (form.phone.replace(/\D/g, '').length < 7) return 'Please enter a valid mobile number.'
  if (!form.dob) return 'Please enter your date of birth.'
  if (form.dob > todayKey()) return 'Date of birth cannot be in the future.'
  if (!isValidEmail(form.email)) return 'Please enter a valid email address.'
  return ''
}

function friendlyRegistrationError(error) {
  const message = String(error?.message || '')
  if (/email/i.test(message) && /exists|duplicate|unique/i.test(message)) return 'A reward card already exists for this email address. Please open your existing card.'
  if (/mobile|phone/i.test(message) && /exists|duplicate|unique/i.test(message)) return 'A reward card already exists for this mobile number. Please open your existing card.'
  return message || 'Unable to create your reward card right now. Please try again.'
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import SEO from '../../components/SEO.jsx'
import { useAdminAuth } from '../../admin/AdminAuthContext.jsx'
import { AdminAlert } from '../../components/admin/AdminUI.jsx'

export default function AdminLogin() {
  const auth = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.user && auth.role) navigate(location.state?.from || '/admin/dashboard', { replace: true })
  }, [auth.user, auth.role, navigate, location.state])

  if (!auth.loading && auth.user && auth.role) return <Navigate to="/admin/dashboard" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      setError('Enter your admin email and password.')
      return
    }
    setSubmitting(true)
    const { error: signInError } = await auth.signIn(form.email.trim(), form.password)
    if (signInError) {
      setError(signInError.message || 'Unable to sign in.')
    } else {
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
    }
    setSubmitting(false)
  }

  return (
    <div className="grid min-h-screen bg-[#f6f6f4] lg:grid-cols-[1fr_0.9fr]">
      <SEO title="RCC Admin Login" description="Secure RCC Cafe administration." noindex />
      <section className="hidden bg-charcoal-300 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="h-20 w-auto max-w-[190px] rounded-xl bg-white p-2" />
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-extrabold uppercase tracking-widest">
            <ShieldCheck size={15} />Secure Operations
          </div>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight">Run RCC with clarity, from bookings to rewards.</h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">One role-aware workspace for managers and staff, designed for fast service during busy cafe hours.</p>
        </div>
        <p className="text-xs text-white/45">Remote Control Cafe · Auckland, New Zealand</p>
      </section>

      <section className="grid place-items-center p-4 sm:p-8">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-card sm:p-8">
          <Logo className="h-16 w-auto max-w-[170px] lg:hidden" />
          <div className="mt-6 grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-700 lg:mt-0">
            <LockKeyhole size={22} />
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold text-charcoal-300">Admin sign in</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Use the Supabase Auth account assigned to your RCC role.</p>

          {!auth.configured && <div className="mt-5"><AdminAlert type="error">Supabase environment variables are not configured.</AdminAlert></div>}
          {error && <div className="mt-5"><AdminAlert type="error">{error}</AdminAlert></div>}

          <div className="mt-6 grid gap-4">
            <label>
              <span className="field-label">Email Address</span>
              <input type="email" className="field-input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" />
            </label>
            <label>
              <span className="field-label">Password</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="field-input pr-12" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 mt-0.5 grid h-9 w-9 -translate-y-1/2 place-items-center text-muted" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button type="submit" disabled={submitting || !auth.configured} className="btn-primary min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Signing In...' : 'Sign In Securely'}
            </button>
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted">Access is controlled by Supabase Auth and the role assigned to your active RCC profile.</p>
        </form>
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Database, FunctionSquare, HardDrive, KeyRound, RefreshCw, UserCog, XCircle } from 'lucide-react'
import { runDiagnostics } from '../../admin/diagnostics.js'
import { AdminLoading, AdminPageHeader } from '../../components/admin/AdminUI.jsx'

const STATUS_STYLES = {
  ok: { icon: CheckCircle2, className: 'text-green-600', badge: 'bg-green-100 text-green-700', label: 'Pass' },
  warn: { icon: AlertTriangle, className: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Warning' },
  fail: { icon: XCircle, className: 'text-red-600', badge: 'bg-red-100 text-red-700', label: 'Fail' }
}

export default function AdminDiagnostics() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const run = async () => {
    setLoading(true)
    setResult(await runDiagnostics())
    setLoading(false)
  }

  useEffect(() => { run() }, [])

  if (loading) return <AdminLoading label="Running Supabase health checks..." />

  if (!result?.configured) {
    return (
      <div>
        <AdminPageHeader eyebrow="System" title="Supabase Diagnostics" description="Verify the live backend before building on top of it." />
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code>, then reload.
        </div>
      </div>
    )
  }

  const { summary } = result

  return (
    <div>
      <AdminPageHeader
        eyebrow="System"
        title="Supabase Diagnostics"
        description="Read-only health checks. No data is created, modified, or deleted by this page."
        action={<button type="button" onClick={run} className="btn-outline min-h-11"><RefreshCw size={16} />Re-run</button>}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard tone="green" label="Passing" value={summary.ok} />
        <SummaryCard tone="orange" label="Warnings" value={summary.warn} />
        <SummaryCard tone="red" label="Failing" value={summary.fail} />
      </div>

      <IdentityPanel identity={result.identity} />

      <CheckGroup icon={KeyRound} title="Authentication" rows={result.auth} />
      <CheckGroup icon={Database} title="Tables" rows={result.tables} />
      <CheckGroup icon={FunctionSquare} title="RPC Functions (read-only probes)" rows={result.rpcs} />
      <CheckGroup icon={HardDrive} title="Storage" rows={result.storage} />

      <div className="mt-6 rounded-2xl border border-border bg-white p-4 text-xs leading-relaxed text-muted sm:p-5">
        <strong className="text-charcoal-300">Note:</strong> Mutating RPCs ({result.mutatingRpcs?.join(', ')}) are intentionally
        not auto-tested here because they write customer data. Verify them through the Rewards Scanner with a real test card.
        A <em>Warning</em> on a table usually means it exists but RLS is correctly blocking this role.
      </div>
    </div>
  )
}

function IdentityPanel({ identity }) {
  if (!identity) return null
  if (!identity.available) {
    return (
      <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm sm:p-5">
        <div className="flex items-center gap-2 font-extrabold text-orange-800"><UserCog size={17} />Identity &amp; Access</div>
        <p className="mt-2 text-orange-900">{identity.reason || 'Identity diagnostics unavailable.'}</p>
      </section>
    )
  }

  const rows = [
    ['auth.uid()', identity.uid || '- (not signed in)'],
    ['Email', identity.email || '-'],
    ['Profile role', identity.role || '- (no role assigned)'],
    ['Profile active', String(identity.active ?? false)],
    ['Profile row exists', String(identity.profileExists ?? false)],
    ['is_staff()', String(identity.isStaff ?? false)],
    ['is_admin()', String(identity.isAdmin ?? false)],
    ['is_super_admin()', String(identity.isSuperAdmin ?? false)]
  ]

  const blocked = !identity.isAdmin

  return (
    <section className="mt-6 rounded-2xl border border-border bg-white shadow-soft">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-700"><UserCog size={17} /></div>
        <h2 className="font-display text-lg font-extrabold">Identity &amp; Access</h2>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
            <span className="font-mono text-xs font-bold text-muted">{label}</span>
            <span className="truncate font-mono text-sm font-bold text-charcoal-300">{value}</span>
          </div>
        ))}
      </div>
      {blocked && (
        <div className="border-t border-border bg-red-50 p-4 text-sm font-semibold text-red-800">
          This account is not admin/manager (is_admin() = false), so admin modules (Content, Offers, Media, SEO, Settings) will be blocked.
          Set an active role in <code>public.profiles</code>: <code>update public.profiles set role='super_admin', active=true where id='{identity.uid}';</code>
        </div>
      )}
    </section>
  )
}

function SummaryCard({ tone, label, value }) {
  const tones = {
    green: 'border-green-200 bg-green-50 text-green-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700'
  }
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em]">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold">{value}</div>
    </div>
  )
}

function CheckGroup({ icon: Icon, title, rows }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-white shadow-soft">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-700"><Icon size={17} /></div>
        <h2 className="font-display text-lg font-extrabold">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => {
          const style = STATUS_STYLES[row.status] || STATUS_STYLES.warn
          const StatusIcon = style.icon
          return (
            <div key={row.name} className="flex items-start gap-3 px-4 py-3">
              <StatusIcon className={`mt-0.5 flex-shrink-0 ${style.className}`} size={18} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-charcoal-300">{row.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${style.badge}`}>{style.label}</span>
                </div>
                <p className="mt-1 break-words text-xs text-muted">{row.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

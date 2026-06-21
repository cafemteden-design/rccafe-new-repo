import { AlertTriangle, CheckCircle2, LoaderCircle, X } from 'lucide-react'

export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-600">{eyebrow}</div>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function AdminStatCard({ icon: Icon, label, value, detail, tone = 'orange' }) {
  const tones = {
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-sky-100 text-sky-700',
    dark: 'bg-charcoal-300 text-white'
  }
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-soft sm:p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone] || tones.orange}`}>
        <Icon size={19} />
      </div>
      <div className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold text-charcoal-300">{value}</div>
      {detail && <div className="mt-1 text-xs text-muted">{detail}</div>}
    </article>
  )
}

export function AdminLoading({ label = 'Loading data...' }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-border bg-white">
      <div className="text-center text-sm font-semibold text-muted">
        <LoaderCircle className="mx-auto mb-3 animate-spin text-orange-500" size={25} />
        {label}
      </div>
    </div>
  )
}

export function AdminSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-xl bg-bg-soft" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded bg-bg-soft" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-bg-soft" />
          </div>
          <div className="h-7 w-16 flex-shrink-0 animate-pulse rounded-full bg-bg-soft" />
        </div>
      ))}
    </div>
  )
}

export function AdminStatSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border bg-white p-5">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-bg-soft" />
          <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-bg-soft" />
          <div className="mt-2 h-6 w-1/3 animate-pulse rounded bg-bg-soft" />
        </div>
      ))}
    </div>
  )
}

export function AdminEmpty({ icon: Icon, title = 'Nothing here yet', description, action }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-center">
      <div>
        {Icon && <Icon className="mx-auto text-orange-500" size={34} />}
        <h2 className="mt-3 font-display text-xl font-extrabold text-charcoal-300">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

export function AdminAlert({ type = 'info', children }) {
  const error = type === 'error'
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
      error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'
    }`}>
      {error ? <AlertTriangle className="mt-0.5 flex-shrink-0" size={17} /> : <CheckCircle2 className="mt-0.5 flex-shrink-0" size={17} />}
      <span>{children}</span>
    </div>
  )
}

export function AdminModal({ title, description, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal-300/55 p-3 backdrop-blur-sm sm:p-6">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-white shadow-card">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-charcoal-300">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-border text-muted hover:text-charcoal-300" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="sticky bottom-0 border-t border-border bg-white p-4">{footer}</div>}
      </div>
    </div>
  )
}

export function AdminBadge({ value }) {
  const normalized = String(value ?? '').toLowerCase()
  const positive = ['active', 'approved', 'confirmed', 'completed', 'ready', 'converted', 'unlocked', 'true'].includes(normalized)
  const warning = ['new', 'pending', 'preparing', 'follow_up', 'contacted'].includes(normalized)
  const negative = ['rejected', 'cancelled', 'no_show', 'lost', 'false'].includes(normalized)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize ${
      positive ? 'bg-green-100 text-green-700' :
      negative ? 'bg-red-100 text-red-700' :
      warning ? 'bg-orange-100 text-orange-700' :
      'bg-bg-soft text-charcoal-100'
    }`}>
      {String(value ?? '-').replaceAll('_', ' ')}
    </span>
  )
}

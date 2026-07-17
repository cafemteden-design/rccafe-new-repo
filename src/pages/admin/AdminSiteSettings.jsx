import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '../../hooks/usePublicSiteSettings.js'
import { AdminAlert, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function AdminSiteSettings() {
  const toast = useToast()
  const [value, setValue] = useState(DEFAULT_PUBLIC_SITE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('settings').select('value').eq('key', 'public_site').maybeSingle()
    if (loadError) setError(loadError.message)
    else if (data?.value) setValue(merge(data.value))
    setLoading(false)
  }
  const save = async () => {
    setSaving(true); setError('')
    const { error: saveError } = await supabase.from('settings').upsert({ key: 'public_site', value }, { onConflict: 'key' })
    setSaving(false)
    if (saveError) { setError(saveError.message); toast.error(saveError.message) }
    else toast.success('Public website settings are live.')
  }
  const setSocial = (key, next) => setValue((current) => ({ ...current, socials: { ...current.socials, [key]: next } }))
  const setHours = (key, next) => setValue((current) => ({ ...current, openingHours: { ...current.openingHours, [key]: next } }))
  const setAnnouncement = (key, next) => setValue((current) => ({ ...current, announcement: { ...current.announcement, [key]: next } }))

  return <div>
    <AdminPageHeader eyebrow="Website" title="Public Website Settings" description="Manage social links, opening hours and the live announcement strip." action={<button type="button" onClick={save} disabled={saving || loading} className="btn-primary min-h-11"><Save size={17} />{saving ? 'Saving...' : 'Save Settings'}</button>} />
    {error && <div className="mt-5"><AdminAlert type="error">{error}</AdminAlert></div>}
    {loading ? <div className="mt-6"><AdminSkeleton rows={7} /></div> : <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <SettingsCard title="Social Media" description="Leave a URL blank to hide that icon everywhere.">
        {['instagram', 'facebook', 'tiktok', 'youtube'].map((key) => <TextField key={key} label={`${title(key)} URL`} type="url" value={value.socials[key] || ''} onChange={(next) => setSocial(key, next)} />)}
      </SettingsCard>
      <SettingsCard title="Announcement Strip" description="Shown near the top of Home and Booking when active.">
        <Toggle label="Announcement Active" checked={value.announcement.active} onChange={(next) => setAnnouncement('active', next)} />
        <TextField label="Announcement Text" value={value.announcement.text || ''} onChange={(next) => setAnnouncement('text', next)} />
        <TextField label="CTA Label" value={value.announcement.ctaLabel || ''} onChange={(next) => setAnnouncement('ctaLabel', next)} />
        <TextField label="CTA URL" value={value.announcement.ctaUrl || ''} onChange={(next) => setAnnouncement('ctaUrl', next)} />
      </SettingsCard>
      <SettingsCard title="Opening Hours" description="Enter the client-approved Google hours exactly as displayed, for example 9:00 AM - 5:00 PM.">
        {DAYS.map((day) => <TextField key={day} label={`${title(day)} Hours`} value={value.openingHours[day] || ''} onChange={(next) => setHours(day, next)} />)}
      </SettingsCard>
      <SettingsCard title="Opening Hours Display" description="Used on Home and Contact pages.">
        <TextField label="Highlight Line" value={value.openingHighlight || ''} onChange={(next) => setValue((current) => ({ ...current, openingHighlight: next }))} />
        <TextField label="Google Hours URL" type="url" value={value.googleHoursUrl || ''} onChange={(next) => setValue((current) => ({ ...current, googleHoursUrl: next }))} />
      </SettingsCard>
    </div>}
  </div>
}

function SettingsCard({ title: heading, description, children }) { return <section className="rounded-2xl border border-border bg-white p-5 shadow-soft"><h2 className="font-display text-xl font-extrabold">{heading}</h2><p className="mt-1 text-sm text-muted">{description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div></section> }
function TextField({ label, value, onChange, type = 'text' }) { return <label><span className="field-label">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input text-base" /></label> }
function Toggle({ label, checked, onChange }) { return <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-4 sm:col-span-2"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-orange-500" /><span className="text-sm font-bold">{label}</span></label> }
function title(value) { return value.charAt(0).toUpperCase() + value.slice(1) }
function merge(value) { return { ...DEFAULT_PUBLIC_SITE_SETTINGS, ...value, socials: { ...DEFAULT_PUBLIC_SITE_SETTINGS.socials, ...(value.socials || {}) }, openingHours: { ...DEFAULT_PUBLIC_SITE_SETTINGS.openingHours, ...(value.openingHours || {}) }, announcement: { ...DEFAULT_PUBLIC_SITE_SETTINGS.announcement, ...(value.announcement || {}) } } }


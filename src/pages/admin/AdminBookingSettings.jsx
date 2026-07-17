import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminAlert, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'
import { BUSINESS_HOURS_ROWS, OFFICIAL_BUSINESS_HOURS, mergeBusinessHours } from '../../data/businessHours.js'

const DEFAULTS = {
  id: 1, online_booking_enabled: true, capacity_per_slot: 8, max_group_size: 8,
  slot_count: 8, slot_duration: 60, weekend_enabled: true,
  monday_enabled: true, tuesday_enabled: true, wednesday_enabled: true,
  thursday_enabled: true, friday_enabled: true, saturday_enabled: true, sunday_enabled: true,
  opening_time: '09:00', closing_time: '17:00', slot_interval_minutes: 60,
  business_hours: OFFICIAL_BUSINESS_HOURS,
  holiday_dates: [], blackout_dates: [], gameplay_prices: { 45: 45, 60: 55 },
  currency: 'NZD',
  notice_text: 'Online bookings are available every day. Each time slot has a maximum of 8 remote spots.',
  large_group_message: 'Need more than 8 remotes? Please contact us at cafemteden@gmail.com.',
  gameplay_extension_message: 'Extra gameplay is available in-store only.'
}

const DAYS = BUSINESS_HOURS_ROWS.map(([key, label]) => [`${key}_enabled`, label, key])

export default function AdminBookingSettings() {
  const toast = useToast()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase.from('booking_settings').select('*').eq('id', 1).maybeSingle()
    if (loadError) setError(`Booking settings could not load: ${loadError.message}`)
    else setSettings({ ...DEFAULTS, ...(data || {}), business_hours: mergeBusinessHours(data?.business_hours), gameplay_prices: { ...DEFAULTS.gameplay_prices, ...(data?.gameplay_prices || {}) } })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true)
    setError('')
    const capacity = Number(settings.capacity_per_slot)
    const maxGroup = Number(settings.max_group_size)
    const businessHours = mergeBusinessHours(settings.business_hours)
    const daySlots = Object.values(businessHours).map((hours) => Math.max((timeMinutes(hours.close) - timeMinutes(hours.open)) / 60, 0))
    const payload = {
      ...settings, id: 1, slot_capacity: capacity, capacity_per_slot: capacity,
      maximum_group_size: maxGroup, max_group_size: maxGroup,
      slot_count: Math.max(...daySlots), slots_per_day: Math.max(...daySlots),
      slot_duration: Number(settings.slot_duration), slot_interval_minutes: Number(settings.slot_interval_minutes),
      opening_time: Object.values(businessHours).map((hours) => hours.open).sort()[0],
      closing_time: Object.values(businessHours).map((hours) => hours.close).sort().at(-1),
      operating_hours: { start: Object.values(businessHours).map((hours) => hours.open).sort()[0], end: Object.values(businessHours).map((hours) => hours.close).sort().at(-1) },
      business_hours: businessHours,
      holiday_dates: cleanDates(settings.holiday_dates), blackout_dates: cleanDates(settings.blackout_dates),
      gameplay_prices: {
        45: Number(settings.gameplay_prices?.[45] ?? settings.gameplay_prices?.['45'] ?? 45),
        60: Number(settings.gameplay_prices?.[60] ?? settings.gameplay_prices?.['60'] ?? 55)
      }
    }
    if (maxGroup > capacity) {
      setError('Maximum group size cannot exceed slot capacity.')
      setSaving(false)
      return
    }
    if (Object.entries(businessHours).some(([, hours]) => timeMinutes(hours.close) <= timeMinutes(hours.open))) {
      setError('Every enabled day must close later than it opens.')
      setSaving(false)
      return
    }
    const { error: saveError } = await supabase.from('booking_settings').upsert(payload, { onConflict: 'id' })
    if (saveError) setError(saveError.message)
    else toast.success('Booking settings are live.')
    setSaving(false)
    if (!saveError) load()
  }

  return (
    <div>
      <AdminPageHeader eyebrow="Operations" title="Booking Settings" description="Control live online booking, remote capacity, gameplay prices, hours and customer messages." action={<button type="button" onClick={save} disabled={saving || loading} className="btn-primary min-h-11"><Save size={17} />{saving ? 'Saving...' : 'Save Settings'}</button>} />
      {error && <div className="mt-5"><AdminAlert type="error">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></AdminAlert></div>}
      {loading ? <div className="mt-6 rounded-2xl border border-border bg-white p-5"><AdminSkeleton rows={8} /></div> : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <SettingsCard title="Capacity & Timing" icon={CalendarClock}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle label="Online Booking Enabled" checked={settings.online_booking_enabled} onChange={(value) => update('online_booking_enabled', value)} wide />
              <NumberField label="Remotes Per Slot" value={settings.capacity_per_slot} min={1} max={50} onChange={(value) => update('capacity_per_slot', value)} />
              <NumberField label="Maximum Group Size" value={settings.max_group_size} min={1} max={50} onChange={(value) => update('max_group_size', value)} />
              <NumberField label="Slot Interval (minutes)" value={settings.slot_interval_minutes} min={5} max={240} onChange={(value) => update('slot_interval_minutes', value)} />
            </div>
          </SettingsCard>

          <SettingsCard title="Day-wise Business Hours" icon={CalendarClock}>
            <div className="space-y-3">
              {DAYS.map(([enabledKey, label, dayKey]) => <div key={dayKey} className="grid gap-3 rounded-xl border border-border bg-bg-soft p-3 sm:grid-cols-[1fr_120px_120px]"><Toggle label={label} checked={settings[enabledKey]} onChange={(value) => update(enabledKey, value)} /><TimeField label="Open" value={settings.business_hours?.[dayKey]?.open || ''} onChange={(value) => update('business_hours', { ...settings.business_hours, [dayKey]: { ...settings.business_hours?.[dayKey], open: value } })} /><TimeField label="Close" value={settings.business_hours?.[dayKey]?.close || ''} onChange={(value) => update('business_hours', { ...settings.business_hours, [dayKey]: { ...settings.business_hours?.[dayKey], close: value } })} /></div>)}
            </div>
          </SettingsCard>

          <SettingsCard title="Gameplay Pricing" icon={ShieldCheck}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="45 Minutes (NZD / remote)" value={settings.gameplay_prices?.[45] ?? settings.gameplay_prices?.['45']} min={0} max={500} onChange={(value) => update('gameplay_prices', { ...settings.gameplay_prices, 45: value })} />
              <NumberField label="60 Minutes (NZD / remote)" value={settings.gameplay_prices?.[60] ?? settings.gameplay_prices?.['60']} min={0} max={500} onChange={(value) => update('gameplay_prices', { ...settings.gameplay_prices, 60: value })} />
              <label className="sm:col-span-2"><span className="field-label">Currency</span><select value={settings.currency||'NZD'} onChange={(event)=>update('currency',event.target.value)} className="field-input"><option value="NZD">NZD - New Zealand Dollar</option></select></label>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">Toastie and hot coffee remain included. Extra gameplay is sold in-store only.</p>
          </SettingsCard>

          <SettingsCard title="Holiday & Blackout Dates" icon={CalendarClock}>
            <DateList label="Holiday Dates" value={settings.holiday_dates} onChange={(value) => update('holiday_dates', value)} />
            <DateList label="Blackout Dates" value={settings.blackout_dates} onChange={(value) => update('blackout_dates', value)} />
            <p className="mt-3 text-xs leading-relaxed text-muted">Use YYYY-MM-DD, separated by commas.</p>
          </SettingsCard>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft xl:col-span-2">
            <label className="field-label">Public Booking Notice</label>
            <textarea rows={3} value={settings.notice_text || ''} onChange={(event) => update('notice_text', event.target.value)} className="field-input resize-y" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label><span className="field-label">Large Group Message</span><textarea rows={3} value={settings.large_group_message || ''} onChange={(event) => update('large_group_message', event.target.value)} className="field-input resize-y" /></label>
              <label><span className="field-label">Gameplay Extension Message</span><textarea rows={3} value={settings.gameplay_extension_message || ''} onChange={(event) => update('gameplay_extension_message', event.target.value)} className="field-input resize-y" /></label>
            </div>
            <div className="mt-4 flex justify-end"><button type="button" onClick={load} disabled={saving} className="btn-outline min-h-11"><RefreshCw size={16} />Reload</button></div>
          </section>
        </div>
      )}
    </div>
  )
}

function SettingsCard({ title, icon: Icon, children }) {
  return <section className="rounded-2xl border border-border bg-white p-5 shadow-soft"><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-700"><Icon size={19} /></span><h2 className="font-display text-xl font-extrabold">{title}</h2></div>{children}</section>
}
function NumberField({ label, value, min, max, onChange }) { return <label><span className="field-label">{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" /></label> }
function TimeField({ label, value, onChange }) { return <label><span className="field-label">{label}</span><input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="field-input" /></label> }
function Toggle({ label, checked, onChange, wide = false }) { return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-3 text-sm font-bold ${wide ? 'sm:col-span-2' : ''}`}><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-orange-500" />{label}</label> }
function DateList({ label, value, onChange }) { return <label className="mt-3 block first:mt-0"><span className="field-label">{label}</span><input value={(value || []).join(', ')} onChange={(event) => onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="field-input" placeholder="2026-12-25, 2027-01-01" /></label> }
function cleanDates(values) { return [...new Set((values || []).map((value) => String(value).trim()).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)))] }
function trimTime(value) { return String(value || '').slice(0, 5) }
function timeMinutes(value) { const [hour, minute] = trimTime(value).split(':').map(Number); return hour * 60 + minute }

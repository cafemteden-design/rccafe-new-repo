import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import { AdminAlert, AdminPageHeader, AdminSkeleton } from '../../components/admin/AdminUI.jsx'
import { useToast } from '../../components/admin/ToastContext.jsx'

const DEFAULTS = {
  id: 1,
  slot_capacity: 8,
  capacity_per_slot: 8,
  maximum_group_size: 8,
  max_group_size: 8,
  slot_count: 8,
  slot_duration: 60,
  weekend_enabled: true,
  operating_hours: { start: '09:00', end: '17:00' },
  monday_enabled: true,
  tuesday_enabled: true,
  wednesday_enabled: true,
  thursday_enabled: true,
  friday_enabled: true,
  saturday_enabled: true,
  sunday_enabled: true,
  opening_time: '09:00',
  closing_time: '17:00',
  slot_interval_minutes: 60,
  holiday_dates: [],
  blackout_dates: [],
  notice_text: 'Online bookings are available every day. Each time slot has a maximum of 8 remote spots. One person uses one remote spot.'
}

const DAYS = [
  ['monday_enabled', 'Monday'], ['tuesday_enabled', 'Tuesday'],
  ['wednesday_enabled', 'Wednesday'], ['thursday_enabled', 'Thursday'],
  ['friday_enabled', 'Friday'], ['saturday_enabled', 'Saturday'],
  ['sunday_enabled', 'Sunday']
]

export default function AdminBookingSettings() {
  const toast = useToast()
  const [settings, setSettings] = useState(DEFAULTS)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [settingsResult, packagesResult] = await Promise.all([
      supabase.from('booking_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('packages').select('id,name,slug,duration_minutes,price,active').order('sort_order')
    ])
    if (settingsResult.error) setError(`Booking settings could not load: ${settingsResult.error.message}`)
    else setSettings({ ...DEFAULTS, ...(settingsResult.data || {}) })
    if (packagesResult.error) setError((current) => `${current ? `${current} ` : ''}Packages could not load: ${packagesResult.error.message}`)
    else setPackages(packagesResult.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
  const togglePackage = (id) => setPackages((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item))

  const save = async () => {
    setSaving(true)
    setError('')
    const payload = {
      ...settings,
      id: 1,
      slot_capacity: Number(settings.capacity_per_slot ?? settings.slot_capacity),
      capacity_per_slot: Number(settings.capacity_per_slot ?? settings.slot_capacity),
      maximum_group_size: Number(settings.max_group_size ?? settings.maximum_group_size),
      max_group_size: Number(settings.max_group_size ?? settings.maximum_group_size),
      slot_count: Number(settings.slot_count),
      slot_duration: Number(settings.slot_duration),
      slot_interval_minutes: Number(settings.slot_interval_minutes),
      operating_hours: { start: trimTime(settings.opening_time), end: trimTime(settings.closing_time) },
      holiday_dates: cleanDates(settings.holiday_dates),
      blackout_dates: cleanDates(settings.blackout_dates)
    }
    if (payload.max_group_size > payload.capacity_per_slot) {
      setError('Maximum group size cannot exceed slot capacity.')
      setSaving(false)
      return
    }
    if (payload.opening_time >= payload.closing_time) {
      setError('Closing time must be later than opening time.')
      setSaving(false)
      return
    }

    const settingsResult = await supabase.from('booking_settings').upsert(payload, { onConflict: 'id' })
    if (settingsResult.error) {
      setError(settingsResult.error.message)
      setSaving(false)
      return
    }

    const packageResults = await Promise.all(packages.map((item) => (
      supabase.from('packages').update({ active: item.slug === 'mini' ? false : item.active }).eq('id', item.id)
    )))
    const packageError = packageResults.find((result) => result.error)?.error
    if (packageError) setError(`Settings saved, but package status failed: ${packageError.message}`)
    else toast.success('Booking settings are live.')
    setSaving(false)
    load()
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Booking Settings"
        description="Control public booking capacity, available days, hours, exceptions and package availability."
        action={<button type="button" onClick={save} disabled={saving || loading} className="btn-primary min-h-11"><Save size={17} />{saving ? 'Saving...' : 'Save Settings'}</button>}
      />

      {error && <div className="mt-5"><AdminAlert type="error">{error} <button type="button" onClick={load} className="ml-2 underline">Retry</button></AdminAlert></div>}
      {loading ? <div className="mt-6 rounded-2xl border border-border bg-white p-5"><AdminSkeleton rows={8} /></div> : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <SettingsCard title="Capacity & Timing" icon={CalendarClock}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Remotes Per Slot" value={settings.capacity_per_slot ?? settings.slot_capacity} min={1} max={50} onChange={(value) => update('capacity_per_slot', value)} />
              <NumberField label="Maximum Group Size" value={settings.max_group_size ?? settings.maximum_group_size} min={1} max={50} onChange={(value) => update('max_group_size', value)} />
              <NumberField label="Slots Per Day" value={settings.slot_count} min={1} max={30} onChange={(value) => update('slot_count', value)} />
              <NumberField label="Slot Duration (minutes)" value={settings.slot_duration} min={5} max={240} onChange={(value) => update('slot_duration', value)} />
              <TimeField label="Opening Time" value={trimTime(settings.opening_time)} onChange={(value) => update('opening_time', value)} />
              <TimeField label="Closing Time" value={trimTime(settings.closing_time)} onChange={(value) => update('closing_time', value)} />
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-4 sm:self-end"><input type="checkbox" checked={Boolean(settings.weekend_enabled)} onChange={(event) => update('weekend_enabled', event.target.checked)} className="h-4 w-4 accent-orange-500" /><span className="text-sm font-bold">Weekend Booking Enabled</span></label>
            </div>
          </SettingsCard>

          <SettingsCard title="Online Booking Days" icon={CalendarClock}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DAYS.map(([key, label]) => (
                <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg-soft px-3 text-sm font-bold">
                  <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => update(key, event.target.checked)} className="h-4 w-4 accent-orange-500" />
                  {label}
                </label>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard title="Holiday & Blackout Dates" icon={CalendarClock}>
            <DateList label="Holiday Dates" value={settings.holiday_dates} onChange={(value) => update('holiday_dates', value)} />
            <DateList label="Blackout Dates" value={settings.blackout_dates} onChange={(value) => update('blackout_dates', value)} />
            <p className="mt-3 text-xs leading-relaxed text-muted">Use `YYYY-MM-DD`, separated by commas. Blackout dates cannot be booked online.</p>
          </SettingsCard>

          <SettingsCard title="Package Availability" icon={ShieldCheck}>
            <div className="space-y-3">
              {packages.map((item) => {
                const locked = item.slug === 'mini'
                return (
                  <label key={item.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${locked ? 'border-border bg-bg-soft opacity-65' : 'border-border bg-white'}`}>
                    <span><span className="block font-extrabold">{item.name}</span><span className="text-xs text-muted">{item.duration_minutes} min · ${Number(item.price).toFixed(0)}</span></span>
                    <span className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" disabled={locked} checked={!locked && item.active} onChange={() => togglePackage(item.id)} className="h-4 w-4 accent-orange-500" />{locked ? 'Unavailable' : item.active ? 'Active' : 'Inactive'}</span>
                  </label>
                )
              })}
            </div>
          </SettingsCard>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft xl:col-span-2">
            <label className="field-label">Public Booking Notice</label>
            <textarea rows={4} value={settings.notice_text || ''} onChange={(event) => update('notice_text', event.target.value)} className="field-input resize-y" />
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

function NumberField({ label, value, min, max, onChange }) {
  return <label><span className="field-label">{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} className="field-input" /></label>
}

function TimeField({ label, value, onChange }) {
  return <label><span className="field-label">{label}</span><input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="field-input" /></label>
}

function DateList({ label, value, onChange }) {
  return <label className="mt-3 block first:mt-0"><span className="field-label">{label}</span><input value={(value || []).join(', ')} onChange={(event) => onChange(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="field-input" placeholder="2026-12-25, 2027-01-01" /></label>
}

function cleanDates(values) {
  return [...new Set((values || []).map((value) => String(value).trim()).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)))]
}

function trimTime(value) {
  return String(value || '').slice(0, 5)
}

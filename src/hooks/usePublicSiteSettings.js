import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE } from '../data/site.js'
import { BUSINESS_HOURS_ROWS, OFFICIAL_BUSINESS_HOURS, formatBusinessHours } from '../data/businessHours.js'
import { supabase } from '../lib/supabaseClient.js'

export const DEFAULT_PUBLIC_SITE_SETTINGS = {
  socials: { ...SITE.socials },
  openingHours: {
    ...Object.fromEntries(BUSINESS_HOURS_ROWS.map(([key]) => [key, formatBusinessHours(OFFICIAL_BUSINESS_HOURS[key])]))
  },
  openingHighlight: 'We are open every day, including Sunday.',
  googleHoursUrl: 'https://share.google/Mx2HXIvNXeD8sNr43',
  announcement: {
    active: true,
    text: 'Good news! RCC Cafe is open on Sundays too - book your RC session today.',
    ctaLabel: 'Book Now',
    ctaUrl: '/booking#calendar'
  }
}

export function usePublicSiteSettings() {
  const channelName = useRef(`public-site-settings-${Math.random().toString(36).slice(2)}`)
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_SITE_SETTINGS)
  const [loading, setLoading] = useState(Boolean(supabase))

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'public_site').maybeSingle()
    if (!error && data?.value) setSettings(mergeSettings(data.value))
    else if (error && import.meta.env.DEV) console.warn('[public-site] Using safe defaults:', error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    if (!supabase) return undefined
    const channel = supabase.channel(channelName.current).on('postgres_changes', {
      event: '*', schema: 'public', table: 'settings', filter: 'key=eq.public_site'
    }, load).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  return { settings, loading, reload: load }
}

function mergeSettings(value) {
  const suppliedHours = value.openingHours || {}
  const openingHours = Object.fromEntries(BUSINESS_HOURS_ROWS.map(([key]) => [
    key,
    String(suppliedHours[key] || '').trim() || DEFAULT_PUBLIC_SITE_SETTINGS.openingHours[key]
  ]))
  return {
    ...DEFAULT_PUBLIC_SITE_SETTINGS,
    ...value,
    socials: { ...DEFAULT_PUBLIC_SITE_SETTINGS.socials, ...(value.socials || {}) },
    openingHours,
    announcement: { ...DEFAULT_PUBLIC_SITE_SETTINGS.announcement, ...(value.announcement || {}) }
  }
}

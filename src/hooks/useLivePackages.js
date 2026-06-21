import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { RC_PACKAGES } from '../data/menu.js'

/**
 * Maps a Supabase `packages` row to the shape the public Menu/Booking UI expects.
 */
function mapPackage(row) {
  return {
    id: row.slug || row.id,
    name: row.name,
    playTime: row.duration_minutes ? `${row.duration_minutes} Min Play` : '',
    durationMinutes: row.duration_minutes ?? null,
    price: Number(row.price ?? 0),
    badge: row.badge || (row.is_popular ? 'Most Popular' : undefined),
    includesToastie: true,
    includesCoffee: true,
    summary: row.description || ''
  }
}

/**
 * Returns active booking packages.
 *
 * Starts with the static `RC_PACKAGES` so the page never flashes empty and never
 * crashes if Supabase is unavailable. If live rows are returned they replace the
 * fallback. `source` is 'live' or 'static' for debugging only.
 */
export function useLivePackages() {
  const [packages, setPackages] = useState(RC_PACKAGES)
  const [source, setSource] = useState('static')

  useEffect(() => {
    if (!supabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (!active) return
      if (error) {
        console.warn('[packages] Falling back to static data:', error.message)
        return
      }
      if (data && data.length) {
        setPackages(data.map(mapPackage))
        setSource('live')
      }
    })()
    return () => { active = false }
  }, [])

  return { packages, source }
}

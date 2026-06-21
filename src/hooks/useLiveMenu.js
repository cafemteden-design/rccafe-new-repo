import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { MENU } from '../data/menu.js'

/**
 * Groups Supabase `menu_items` rows into the category map shape the public
 * Menu page expects: { [category]: [{ name, price, ... }] }.
 */
function groupByCategory(rows) {
  return rows.reduce((acc, row) => {
    const category = row.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push({ name: row.name, price: Number(row.price ?? 0), description: row.description || '' })
    return acc
  }, {})
}

/**
 * Returns the cafe menu grouped by category.
 *
 * Defaults to the static `MENU` so the page never flashes empty or crashes.
 * Live `menu_items` replace the fallback when available.
 */
export function useLiveMenu() {
  const [menu, setMenu] = useState(MENU)
  const [source, setSource] = useState('static')

  useEffect(() => {
    if (!supabase) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (!active) return
      if (error) {
        console.warn('[menu] Falling back to static data:', error.message)
        return
      }
      if (data && data.length) {
        setMenu(groupByCategory(data))
        setSource('live')
      }
    })()
    return () => { active = false }
  }, [])

  return { menu, source }
}

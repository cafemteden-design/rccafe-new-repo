import { supabase } from '../lib/supabaseClient.js'

export async function fetchRows(config, limit = 100) {
  if (!supabase) return { data: [], error: new Error('Supabase is not configured.') }
  const orderColumn = config.order || 'created_at'
  const result = await supabase
    .from(config.table)
    .select(config.select || '*')
    .order(orderColumn, { ascending: false })
    .limit(limit)

  // If the configured order column does not exist on this table (Postgres 42703),
  // retry once without ordering so the module still loads its rows.
  if (result.error && (result.error.code === '42703' || /column .* does not exist/i.test(result.error.message || ''))) {
    return supabase.from(config.table).select(config.select || '*').limit(limit)
  }
  return result
}

export async function saveRow(config, values, id) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  const payload = normalizePayload(config, values)
  return id
    ? supabase.from(config.table).update(payload).eq(config.primaryKey || 'id', id).select().single()
    : supabase.from(config.table).insert(payload).select().single()
}

export async function deleteRow(config, id) {
  if (!supabase) return { error: new Error('Supabase is not configured.') }
  return supabase.from(config.table).delete().eq(config.primaryKey || 'id', id)
}

function normalizePayload(config, values) {
  return Object.fromEntries((config.fields || []).map(([key, _label, type]) => {
    let value = values[key]
    if (type === 'number') value = value === '' ? null : Number(value)
    if (type === 'checkbox') value = Boolean(value)
    if (type === 'json') {
      try {
        value = typeof value === 'string' ? JSON.parse(value || '{}') : value
      } catch {
        value = {}
      }
    }
    return [key, value === '' ? null : value]
  }))
}

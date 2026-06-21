import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

/**
 * Loads editable CMS sections for a page from `website_sections`.
 *
 * Returns a `get(sectionKey, fallback)` helper that returns the live section
 * object when present, otherwise the provided static fallback. The site keeps
 * working with hard-coded content until an admin publishes a section, so this
 * is always safe to adopt incrementally.
 *
 * Usage:
 *   const cms = useCmsContent('home')
 *   const hero = cms.get('hero', { title: 'Default title' })
 */
export function useCmsContent(pageKey) {
  const [sections, setSections] = useState({})

  useEffect(() => {
    if (!supabase || !pageKey) return
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('website_sections')
        .select('*')
        .eq('page_key', pageKey)
        .eq('active', true)
      if (!active) return
      if (error) {
        console.warn(`[cms] '${pageKey}' falling back to static content:`, error.message)
        return
      }
      if (data && data.length) {
        const map = {}
        for (const row of data) {
          map[row.section_key] = {
            title: row.title,
            subtitle: row.subtitle,
            content: row.content || {},
            imageUrl: row.image_url,
            videoUrl: row.video_url
          }
        }
        setSections(map)
      }
    })()
    return () => { active = false }
  }, [pageKey])

  return useMemo(() => ({
    sections,
    get(sectionKey, fallback = null) {
      return sections[sectionKey] || fallback
    },
    field(sectionKey, fieldKey, fallback = '') {
      const section = sections[sectionKey]
      if (!section) return fallback
      if (fieldKey in section && section[fieldKey] != null) return section[fieldKey]
      if (section.content && fieldKey in section.content) return section.content[fieldKey]
      return fallback
    }
  }), [sections])
}

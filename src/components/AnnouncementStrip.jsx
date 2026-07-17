import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone } from 'lucide-react'
import { usePublicSiteSettings } from '../hooks/usePublicSiteSettings.js'

export default function AnnouncementStrip({ className = '' }) {
  const { settings } = usePublicSiteSettings()
  const announcement = settings.announcement
  if (!announcement?.active || !String(announcement.text || '').trim()) return null
  const ctaUrl = String(announcement.ctaUrl || '').trim()
  const content = <><span>{announcement.ctaLabel || 'Learn More'}</span><ArrowRight size={14} /></>
  return (
    <div className={`border-b border-orange-200 bg-orange-50 ${className}`} role="status">
      <div className="container-x flex min-h-11 flex-col items-center justify-center gap-1 py-2 text-center text-xs font-bold text-charcoal-300 sm:flex-row sm:gap-3 sm:text-sm">
        <span className="inline-flex items-center gap-2"><Megaphone size={15} className="shrink-0 text-orange-600" />{announcement.text}</span>
        {ctaUrl && (ctaUrl.startsWith('http') ? <a href={ctaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-600">{content}</a> : <Link to={ctaUrl} className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-600">{content}</Link>)}
      </div>
    </div>
  )
}


import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Mail, MapPin, Clock, Gift } from 'lucide-react'
import { SITE, NAV } from '../data/site.js'
import Logo from './Logo.jsx'
import { trackBookNowClick } from '../hooks/useAnalytics.js'
import { usePublicSiteSettings } from '../hooks/usePublicSiteSettings.js'

const SEO_LINKS = [
  { to: '/kids-activities-auckland', label: 'Kids Activities Auckland' },
  { to: '/indoor-activities-auckland', label: 'Indoor Activities Auckland' },
  { to: '/birthday-party-venue-auckland', label: 'Birthday Party Venue' },
  { to: '/school-holiday-activities-auckland', label: 'School Holiday Activities' },
  { to: '/team-building-auckland', label: 'Team Building Auckland' },
  { to: '/family-activities-auckland', label: 'Family Activities Auckland' },
  { to: '/blog', label: 'Blog & Guides' },
  { to: '/faq', label: 'FAQs' }
]

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7v0Z" />
    </svg>
  )
}

export default function Footer() {
  const { settings } = usePublicSiteSettings()
  return (
    <footer className="relative overflow-hidden border-t border-orange-100 bg-[#fffaf3] text-charcoal-300">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-charcoal-300 to-orange-400" />
      <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-white blur-3xl" />
      <div className="container-x relative grid grid-cols-1 gap-8 py-12 sm:py-14 md:grid-cols-12">
        <div className="rounded-3xl border border-orange-100 bg-white/78 p-5 shadow-soft backdrop-blur md:col-span-4">
          <Link to="/" className="inline-flex items-center" aria-label="Remote Control Cafe Home">
            <Logo className="h-24 w-auto max-w-[230px] sm:h-28 sm:max-w-[270px]" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            Remote Control Cafe combines great coffee, tasty food and hands-on remote-control
            construction fun for families, kids and groups in Auckland.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {settings.socials.instagram && <a href={settings.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 transition hover:border-orange-500 hover:text-orange-600"><Instagram size={18} /></a>}
            {settings.socials.facebook && <a href={settings.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 transition hover:border-orange-500 hover:text-orange-600"><Facebook size={18} /></a>}
            {settings.socials.tiktok && <a href={settings.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 transition hover:border-orange-500 hover:text-orange-600"><TikTokIcon className="h-[18px] w-[18px]" /></a>}
            {settings.socials.youtube && <a href={settings.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 transition hover:border-orange-500 hover:text-orange-600"><Youtube size={18} /></a>}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-base font-extrabold uppercase tracking-wider text-charcoal-300">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted transition hover:text-orange-600">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-display text-base font-extrabold uppercase tracking-wider text-charcoal-300">Resources</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {SEO_LINKS.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted transition hover:text-orange-600">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white/78 p-5 shadow-soft backdrop-blur md:col-span-4">
          <h4 className="font-display text-base font-extrabold uppercase tracking-wider text-charcoal-300">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3 text-charcoal-100"><Mail size={18} className="mt-0.5 text-orange-600" /><a href={`mailto:${SITE.email}`} className="transition hover:text-orange-600">Send Enquiry</a></li>
            <li className="flex items-start gap-3 text-charcoal-100"><MapPin size={18} className="mt-0.5 text-orange-600" /><a href={SITE.googleBusiness} target="_blank" rel="noreferrer" className="transition hover:text-orange-600">{SITE.location}</a></li>
            <li className="flex items-start gap-3 text-charcoal-100"><Clock size={18} className="mt-0.5 text-orange-600" /> {settings.openingHighlight}</li>
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/booking#calendar" className="btn-primary min-h-12 whitespace-nowrap px-4 text-center" onClick={() => trackBookNowClick({ location: 'footer' })}>Book Your Session</Link>
            <Link to="/rewards" className="btn-outline min-h-12 whitespace-nowrap px-4 text-center"><Gift size={16} /> RCC Reward Card</Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-orange-100 bg-white/50">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted sm:flex-row">
          <div>© {new Date().getFullYear()} {SITE.fullName}. All rights reserved.</div>
          <div>
            Developed by{' '}
            <a href={SITE.developer.url} target="_blank" rel="noreferrer" className="font-bold text-orange-600 hover:text-orange-700">
              {SITE.developer.name}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Phone, MapPin, Clock } from 'lucide-react'
import { SITE, NAV } from '../data/site.js'
import Logo from './Logo.jsx'

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7v0Z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="relative bg-bg-soft text-charcoal-300 border-t border-border">
      <div className="container-x grid grid-cols-1 md:grid-cols-12 gap-10 py-14">
        <div className="md:col-span-4">
          <Link to="/" className="inline-flex items-center" aria-label="RC Cafe — Home">
            <Logo className="h-24 w-auto max-w-[230px] sm:h-28 sm:max-w-[270px]" />
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-muted max-w-sm">
            Auckland’s hands-on remote-control construction arena and café — a fun, safe place for
            families, kids and groups to drive real RC construction machines.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href={SITE.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600 transition"><Instagram size={18} /></a>
            <a href={SITE.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600 transition"><Facebook size={18} /></a>
            <a href={SITE.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600 transition"><TikTokIcon className="h-[18px] w-[18px]" /></a>
            <a href={SITE.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600 transition"><Youtube size={18} /></a>
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="font-display text-base font-extrabold uppercase tracking-wider text-charcoal-300">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted hover:text-orange-600 transition">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-5">
          <h4 className="font-display text-base font-extrabold uppercase tracking-wider text-charcoal-300">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3 text-charcoal-100"><Phone size={18} className="mt-0.5 text-orange-600" /><a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a></li>
            <li className="flex items-start gap-3 text-charcoal-100"><MapPin size={18} className="mt-0.5 text-orange-600" /> {SITE.location}</li>
            <li className="flex items-start gap-3 text-charcoal-100"><Clock size={18} className="mt-0.5 text-orange-600" /> {SITE.hours}</li>
          </ul>
          <Link to="/booking#calendar" className="btn-primary mt-6">Book Your Session</Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-x flex flex-col sm:flex-row items-center justify-between gap-3 py-5 text-xs text-muted">
          <div>© {new Date().getFullYear()} {SITE.fullName}. All rights reserved.</div>
          <div>
            Developed by{' '}
            <a href={SITE.developer.url} target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-700 font-bold">
              {SITE.developer.name}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

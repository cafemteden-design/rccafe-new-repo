import { useState } from 'react'
import { Mail, MapPin, Clock, Instagram, Facebook, Youtube, Send, CheckCircle2 } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { SITE } from '../data/site.js'
import { PAGE_SEO, breadcrumbSchema } from '../data/seo.js'
import { trackEmailClick, trackContactSubmission } from '../hooks/useAnalytics.js'
import { usePublicSiteSettings } from '../hooks/usePublicSiteSettings.js'

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7v0Z" />
    </svg>
  )
}

export default function Contact() {
  const { settings } = usePublicSiteSettings()
  const [form, setForm] = useState({ name: '', email: '', enquiryType: 'General Enquiry', message: '' })
  const [sent, setSent] = useState(false)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Remote Control Cafe enquiry - ${form.enquiryType}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nEnquiry Type: ${form.enquiryType}\n\n${form.message}`)
    trackContactSubmission({ enquiry_type: form.enquiryType, method: 'mailto' })
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <>
      <SEO {...PAGE_SEO['/contact']} path="/contact" schema={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])} />
      <PageHero
        breadcrumbs={['Contact']}
        eyebrow="Contact"
        title={<>Contact <span className="accent">Remote Control Cafe</span></>}
        subtitle="Send an enquiry for everyday visits, event bookings, venue hire, school holiday sessions and private functions."
        image="/images/about-venue.jpg"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="grid gap-4">
              <InfoCard icon={Mail} title="Email Us" value="Send Enquiry" href={`mailto:${SITE.email}`} onClick={() => trackEmailClick({ location: 'contact_page' })} />
              <InfoCard icon={MapPin} title="Visit Us" value={SITE.location} href={SITE.googleBusiness} />
              <OpeningHoursCard settings={settings} />
            </div>
            <div className="mt-6 card p-5">
              <h3 className="font-display text-xl font-extrabold text-charcoal-300">Follow Remote Control Cafe</h3>
              <div className="mt-4 flex gap-3">
                {settings.socials.instagram && <Social href={settings.socials.instagram} label="Instagram" icon={Instagram} />}
                {settings.socials.facebook && <Social href={settings.socials.facebook} label="Facebook" icon={Facebook} />}
                {settings.socials.tiktok && <Social href={settings.socials.tiktok} label="TikTok" icon={TikTokIcon} />}
                {settings.socials.youtube && <Social href={settings.socials.youtube} label="YouTube" icon={Youtube} />}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={submit} className="card p-5 sm:p-7">
              <h2 className="font-display text-3xl font-extrabold text-charcoal-300">Send an enquiry</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Tell us what you are planning and our team will respond within 24 hours.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" value={form.name} onChange={set('name')} required />
                <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
                <div className="sm:col-span-2">
                  <label className="field-label">Enquiry Type</label>
                  <select value={form.enquiryType} onChange={(event) => set('enquiryType')(event.target.value)} className="field-input">
                    <option>General Enquiry</option>
                    <option>Party Booking</option>
                    <option>Venue Hire</option>
                    <option>Corporate / Event Booking</option>
                    <option>School Holiday / Public Holiday Booking</option>
                  </select>
                </div>
                <TextArea label="Message" value={form.message} onChange={set('message')} className="sm:col-span-2" required />
              </div>
              {sent && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                  <CheckCircle2 size={18} /> Your email app has opened with your enquiry details.
                </div>
              )}
              <button type="submit" className="btn-primary mt-6 min-h-[54px]">
                Send Enquiry <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

function InfoCard({ icon: Icon, title, value, href, onClick }) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-soft transition hover:border-orange-200">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600"><Icon size={20} /></div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-muted">{title}</div>
        <div className="mt-1 font-semibold text-charcoal-300">{value}</div>
      </div>
    </div>
  )

  if (href) return <a href={href} onClick={onClick} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>{content}</a>
  return content
}

function OpeningHoursCard({ settings }) {
  const rows = Object.entries(settings.openingHours || {}).filter(([, hours]) => String(hours || '').trim())
  return <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
    <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600"><Clock size={20} /></div><div><div className="text-xs font-bold uppercase tracking-widest text-muted">Opening Hours</div><div className="mt-1 font-semibold text-charcoal-300">{settings.openingHighlight}</div></div></div>
    {rows.length > 0 && <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">{rows.map(([day, hours]) => <div key={day} className="flex justify-between gap-4"><dt className="font-bold capitalize">{day}</dt><dd className="text-right text-muted">{hours}</dd></div>)}</dl>}
    {settings.googleHoursUrl && <a href={settings.googleHoursUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center text-sm font-extrabold text-orange-700 hover:text-orange-600">View current hours on Google</a>}
  </div>
}

function Social({ href, label, icon: Icon }) {
  return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-border bg-white p-3 text-charcoal-100 transition hover:border-orange-500 hover:text-orange-600"><Icon size={18} /></a>
}

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span className="text-orange-500">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="field-input" />
    </div>
  )
}

function TextArea({ label, value, onChange, required, className = '' }) {
  return (
    <div className={className}>
      <label className="field-label">{label}{required && <span className="text-orange-500">*</span>}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={5} className="field-input resize-y" />
    </div>
  )
}

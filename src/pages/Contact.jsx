import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, MapPin, Clock, Instagram, Facebook, Youtube, Send, CheckCircle2 } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import { SITE } from '../data/site.js'

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7v0Z" />
    </svg>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const submit = (e) => { e.preventDefault(); setSent(true) }

  return (
    <>
      <PageHero
        breadcrumbs={['Contact']}
        eyebrow="Get In Touch"
        title={<>Contact <span className="accent">RC Cafe</span></>}
        subtitle="Plan a group visit, ask about machines, or organise a birthday — we’d love to hear from you."
        image="/images/family-cafe-activity.svg"
      />
      <section className="section-light py-16">
        <div className="container-x grid lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-4">
            <InfoCard icon={Phone} title="Call Us" value={SITE.phone} href={`tel:${SITE.phoneTel}`} />
            <InfoCard icon={MapPin} title="Location" value={SITE.location} />
            <InfoCard icon={Clock} title="Opening" value={SITE.hours} />
            <div className="card p-5">
              <div className="text-xs uppercase tracking-widest text-orange-600 font-bold">Follow Us</div>
              <div className="mt-3 flex items-center gap-3">
                <a href={SITE.socials.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600"><Instagram size={18} /></a>
                <a href={SITE.socials.facebook} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600"><Facebook size={18} /></a>
                <a href={SITE.socials.tiktok} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600"><TikTokIcon className="h-[18px] w-[18px]" /></a>
                <a href={SITE.socials.youtube} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-white p-2.5 text-charcoal-100 hover:border-orange-500 hover:text-orange-600"><Youtube size={18} /></a>
              </div>
            </div>
          </motion.div>

          <motion.form initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} onSubmit={submit} className="lg:col-span-3 card p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-12">
                <CheckCircle2 size={56} className="text-orange-500 mx-auto" />
                <h3 className="font-display text-3xl font-extrabold mt-4 text-charcoal-300">Message Sent!</h3>
                <p className="mt-2 text-muted">Thank you for reaching out. Our team will reply soon.</p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-extrabold text-charcoal-300">Send a Message</h3>
                <p className="mt-1 text-muted text-sm">We respond Auckland local time, every day.</p>
                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.name} onChange={set('name')} required />
                  <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
                  <Input label="Phone" value={form.phone} onChange={set('phone')} className="sm:col-span-2" />
                  <div className="sm:col-span-2">
                    <label className="field-label">Message</label>
                    <textarea value={form.message} onChange={set('message')} required rows={5} className="field-input resize-none" placeholder="Tell us about your visit, group or query..." />
                  </div>
                </div>
                <button type="submit" className="btn-primary mt-6 w-full sm:w-auto">Send Message <Send size={16} /></button>
              </>
            )}
          </motion.form>
        </div>
      </section>
    </>
  )
}

function InfoCard({ icon: Icon, title, value, href }) {
  const Wrap = href ? 'a' : 'div'
  return (
    <Wrap href={href} className="flex items-start gap-4 card p-5 hover:border-orange-300 transition">
      <div className="grid place-items-center w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex-shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted font-bold">{title}</div>
        <div className="mt-0.5 font-bold text-charcoal-300">{value}</div>
      </div>
    </Wrap>
  )
}

function Input({ label, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      <input {...props} className="field-input" />
    </div>
  )
}

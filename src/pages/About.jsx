import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Truck, Heart, Award, Target } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import SEO from '../components/SEO.jsx'
import { PAGE_SEO } from '../data/seo.js'

const VALUES = [
  { icon: Truck, title: 'Real RC Machines', desc: 'A fleet of authentic RC construction vehicles built for serious play.' },
  { icon: Heart, title: 'Family First', desc: 'A safe, welcoming arena designed for kids, parents and hobbyists.' },
  { icon: Award, title: 'Premium Experience', desc: 'High-quality machines, fair pricing and friendly trained staff.' },
  { icon: Target, title: 'Pure Fun', desc: 'Real construction missions inside a sand arena with hands-on play.' }
]

export default function About() {
  return (
    <>
      <SEO {...PAGE_SEO['/about']} path="/about" />
      <PageHero
        breadcrumbs={['About']}
        eyebrow="Our Story"
        title={<>About <span className="accent">Remote Control Cafe</span></>}
        subtitle="Auckland's hands-on remote-control construction arena combined with a welcoming cafe experience for families and groups."
        image="/images/family-cafe-activity.jpg"
      />

      <section className="section-light py-14 sm:py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Who We Are</span>
            <h2 className="heading-display mt-4">Built for <span className="accent">Construction</span> Lovers</h2>
            <p className="mt-5 leading-relaxed text-muted">
              Remote Control Cafe is Auckland's unique destination where real remote-control construction machinery meets a relaxed cafe vibe.
              Whether you are 7 or 70, you can drive RC excavators, dump trucks, cranes, fire trucks and loaders inside our indoor sand arena.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              We built Remote Control Cafe because we believe play should be hands-on, real and exciting. While guests take on construction missions,
              the rest of the family can enjoy drinks, toasties and cafe bites.
            </p>
            <div className="mt-7 flex gap-3">
              <Link to="/booking#calendar" className="btn-primary">Book Now</Link>
              <Link to="/experience" className="btn-outline">View Experience</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
            <img className="h-72 w-full rounded-2xl border border-border object-cover" src="/images/rc-excavator-arena.jpg" alt="" loading="lazy" decoding="async" />
            <img className="mt-8 h-72 w-full rounded-2xl border border-border object-cover" src="/images/kids-rc-construction.jpg" alt="" loading="lazy" decoding="async" />
          </motion.div>
        </div>
      </section>

      <section className="section-soft py-14 sm:py-20">
        <div className="container-x">
          <SectionHeading eyebrow="What We Stand For" title={<>Our <span className="accent">Values</span></>} subtitle="Guiding principles behind every session in our arena." />
          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="card card-hover p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-white">
                  <v.icon size={20} />
                </div>
                <div className="mt-4 font-display text-xl font-extrabold text-charcoal-300">{v.title}</div>
                <p className="mt-1.5 text-sm text-muted">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light py-14 sm:py-20">
        <div className="container-x text-center">
          <h2 className="heading-display">Come Build With Us</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">Visit Remote Control Cafe in Auckland or send an enquiry to plan your group, party or first session.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/booking#calendar" className="btn-primary">Book a Slot</Link>
            <Link to="/contact" className="btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  )
}

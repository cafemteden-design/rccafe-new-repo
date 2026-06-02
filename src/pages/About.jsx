import PageHero from '../components/PageHero.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Truck, Heart, Award, Target } from 'lucide-react'

const VALUES = [
  { icon: Truck, title: 'Real RC Machines', desc: 'A fleet of authentic RC construction vehicles built for serious play.' },
  { icon: Heart, title: 'Family First', desc: 'A safe, welcoming arena designed for kids, parents and hobbyists.' },
  { icon: Award, title: 'Premium Experience', desc: 'High-quality machines, fair pricing and friendly trained staff.' },
  { icon: Target, title: 'Pure Fun', desc: 'Real construction missions inside a sand arena — no screens needed.' }
]

export default function About() {
  return (
    <>
      <PageHero
        breadcrumbs={['About']}
        eyebrow="Our Story"
        title={<>About <span className="accent">RC Cafe</span></>}
        subtitle="Auckland’s hands-on remote-control construction arena combined with a welcoming café experience for families and groups."
        image="/images/family-cafe-activity.svg"
      />

      <section className="section-light py-20">
        <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Who We Are</span>
            <h2 className="heading-display mt-4">Built for <span className="accent">Construction</span> Lovers</h2>
            <p className="mt-5 text-muted leading-relaxed">
              RC Cafe — also known as Remote Control Cafe — is Auckland’s unique destination where
              real remote-control construction machinery meets a relaxed café vibe. Whether you’re
              7 or 70, you can drive RC excavators, dump trucks, cranes, fire trucks and loaders
              inside our indoor sand arena.
            </p>
            <p className="mt-4 text-muted leading-relaxed">
              We built RC Cafe because we believe play should be hands-on, real and exciting. While
              you take on construction missions, the rest of the family can sip on barista coffee,
              bubble tea or fresh smoothies and snack on hot air-fried bites.
            </p>
            <div className="mt-7 flex gap-3">
              <Link to="/booking" className="btn-primary">Book Now</Link>
              <Link to="/machines" className="btn-outline">See Machines</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
            <img className="rounded-2xl border border-border h-72 w-full object-cover" src="/images/rc-excavator-arena.svg" alt="" />
            <img className="rounded-2xl border border-border h-72 w-full object-cover mt-8" src="/images/kids-rc-construction.svg" alt="" />
          </motion.div>
        </div>
      </section>

      <section className="section-soft py-20">
        <div className="container-x">
          <SectionHeading eyebrow="What We Stand For" title={<>Our <span className="accent">Values</span></>} subtitle="Guiding principles behind every session in our arena." />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="card card-hover p-6">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-orange-500 text-white">
                  <v.icon size={20} />
                </div>
                <div className="font-display text-xl font-extrabold mt-4 text-charcoal-300">{v.title}</div>
                <p className="mt-1.5 text-sm text-muted">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light py-20">
        <div className="container-x text-center">
          <h2 className="heading-display">Come Build With Us</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted">Visit RC Cafe in Auckland — call <a href="tel:+6495587570" className="text-orange-600 font-bold">09 558 7570</a> to plan your group, party or first session.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/booking" className="btn-primary">Book a Slot</Link>
            <Link to="/contact" className="btn-outline">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  )
}

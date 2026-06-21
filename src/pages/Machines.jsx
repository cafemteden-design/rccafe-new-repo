import PageHero from '../components/PageHero.jsx'
import MachineCard from '../components/MachineCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import SEO from '../components/SEO.jsx'
import { MACHINES } from '../data/machines.js'
import { PAGE_SEO } from '../data/seo.js'
import { Link } from 'react-router-dom'

export default function Machines() {
  return (
    <>
      <SEO {...PAGE_SEO['/machines']} path="/machines" />
      <PageHero
        breadcrumbs={['RC Machines']}
        eyebrow="The Fleet"
        title={<>Machines You Can <span className="accent">Control</span></>}
        subtitle="Five different RC construction machine types ready to deploy inside our family-friendly arena."
        image="/images/rc-excavator-arena.jpg"
      />
      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MACHINES.map((m, i) => <MachineCard m={m} key={m.id} index={i} />)}
          </div>
        </div>
      </section>
      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <SectionHeading
            eyebrow="RC + Food Garage"
            title={<>Choose a <span className="accent">Package</span></>}
            subtitle="Book MINI, POWER or MASTER packages with play time, any toastie and any hot coffee."
          />
          <div className="mt-8 text-center">
            <Link to="/booking#calendar" className="btn-primary">Book Package</Link>
          </div>
        </div>
      </section>
    </>
  )
}

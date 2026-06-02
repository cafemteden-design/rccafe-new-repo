import PageHero from '../components/PageHero.jsx'
import MachineCard from '../components/MachineCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { MACHINES } from '../data/machines.js'
import { Link } from 'react-router-dom'

export default function Machines() {
  return (
    <>
      <PageHero
        breadcrumbs={['RC Machines']}
        eyebrow="The Fleet"
        title={<>Machines You Can <span className="accent">Control</span></>}
        subtitle="Five different RC construction machine types ready to deploy inside our family-friendly arena."
        image="/images/rc-excavator-arena.svg"
      />
      <section className="section-light py-16">
        <div className="container-x">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MACHINES.map((m, i) => <MachineCard m={m} key={m.id} index={i} />)}
          </div>
        </div>
      </section>
      <section className="section-soft py-16">
        <div className="container-x">
          <SectionHeading eyebrow="Bring Your Own" title={<>Got Your Own <span className="accent">RC Toy?</span></>} subtitle="Use our sand construction arena with your personal RC vehicle for just $10 per hour." />
          <div className="mt-8 text-center">
            <Link to="/booking" className="btn-primary">Book BYO Slot</Link>
          </div>
        </div>
      </section>
    </>
  )
}

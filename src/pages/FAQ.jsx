import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import FAQAccordion from '../components/FAQAccordion.jsx'
import { PAGE_SEO, faqSchema, breadcrumbSchema } from '../data/seo.js'
import { FAQ_CATEGORIES, ALL_FAQS } from '../data/faqs.js'

export default function FAQ() {
  const schema = [
    faqSchema(ALL_FAQS),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'FAQs', path: '/faq' }
    ])
  ]

  return (
    <>
      <SEO {...PAGE_SEO['/faq']} path="/faq" schema={schema} />

      <PageHero
        breadcrumbs={['FAQs']}
        eyebrow="Help & Answers"
        title={<>Frequently Asked <span className="accent">Questions</span></>}
        subtitle="Everything you need to know about visiting Remote Control Cafe Auckland — bookings, parties, school holidays, groups, rewards and more."
        image="/images/family-cafe-activity.jpg"
        imageAlt="Family asking questions at Remote Control Cafe Auckland"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x max-w-4xl">
          <FAQAccordion groups={FAQ_CATEGORIES} />

          <div className="mt-12 rounded-3xl border border-orange-200 bg-orange-50 p-7 text-center sm:p-10">
            <h2 className="font-display text-2xl font-extrabold text-charcoal-300">Still have a question?</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted">
              Our team is happy to help with bookings, birthdays, school holidays and group enquiries.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
              <Link to="/contact" className="btn-outline">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

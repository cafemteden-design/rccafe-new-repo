import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowRight, Gift, HelpCircle, BookOpen } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import NearbyAreas from '../components/NearbyAreas.jsx'
import SEO from '../components/SEO.jsx'
import FAQAccordion from '../components/FAQAccordion.jsx'
import StickyCTA from '../components/StickyCTA.jsx'
import { getLandingPage, LANDING_PAGES } from '../data/landingPages.js'
import { BLOGS } from '../data/blogs.js'
import { breadcrumbSchema, faqSchema, serviceSchema } from '../data/seo.js'

export default function LandingPage() {
  const { slug } = useParams()
  const page = getLandingPage(slug)

  if (!page) return <Navigate to="/" replace />

  const path = `/${page.slug}`
  const sections = [...(page.sections || []), ...(page.moreSections || [])]
  const faqs = [...(page.faqs || []), ...(page.moreFaqs || [])]
  const related = LANDING_PAGES.filter((p) => p.slug !== page.slug).slice(0, 6)
  const relatedBlogs = BLOGS.slice(0, 4)
  const schema = [
    serviceSchema({ name: page.h1, description: page.metaDescription, path }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: page.h1, path }
    ]),
    faqSchema(faqs)
  ]

  return (
    <>
      <SEO
        title={page.metaTitle}
        description={page.metaDescription}
        path={path}
        keywords={page.keywords}
        ogImage={page.image}
        schema={schema}
      />
      <StickyCTA primaryLabel={page.primaryCta?.label || 'Book Now'} primaryTo={page.primaryCta?.to || '/booking#calendar'} />

      <PageHero
        breadcrumbs={[page.h1]}
        eyebrow={page.eyebrow}
        title={page.h1}
        subtitle={page.heroSubtitle}
        image={page.image}
        imageAlt={`${page.h1} at Remote Control Cafe Auckland`}
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="text-lg leading-relaxed text-charcoal-200">{page.intro}</p>

            {sections.map((section) => (
              <div key={section.heading} className="mt-8">
                <h2 className="font-display text-2xl font-extrabold text-charcoal-300">{section.heading}</h2>
                {section.body.map((paragraph, i) => (
                  <p key={i} className="mt-3 leading-relaxed text-muted">{paragraph}</p>
                ))}
              </div>
            ))}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to={page.primaryCta.to} className="btn-primary">
                {page.primaryCta.label} <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn-outline">Send Enquiry</Link>
            </div>
          </div>

          {/* Sidebar with internal links + CTAs */}
          <aside className="lg:col-span-4">
            <div className="card p-6 lg:sticky lg:top-28">
              <h3 className="font-display text-xl font-extrabold text-charcoal-300">Plan your visit</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <SidebarLink to="/booking#calendar" label="Book a play session" />
                <SidebarLink to="/rewards" label="Create your Reward Card" />
                <SidebarLink to="/gallery" label="See the gallery" />
                <SidebarLink to="/machines" label="Meet the RC machines" />
                <SidebarLink to="/contact" label="Ask about group bookings" />
              </ul>
              <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold text-orange-700">
                  <Gift size={16} /> RCC Reward Card
                </div>
                <p className="mt-1 text-sm text-charcoal-200">
                  Collect a stamp every visit and unlock a surprise gift after 7 visits.
                </p>
                <Link to="/rewards" className="btn-primary mt-3 w-full !py-2.5 text-sm">Create Reward Card</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Conversion band */}
      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6 text-center sm:p-8 lg:p-10">
            <h2 className="font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Ready to experience RCC in Auckland?</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted">
              Book a weekday play session online, or get in touch about birthdays, school holidays and group bookings.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
              <Link to="/contact" className="btn-outline">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="section-light py-12 sm:py-16">
          <div className="container-x max-w-3xl">
            <span className="eyebrow"><HelpCircle size={14} /> FAQs</span>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-6">
              <FAQAccordion items={faqs} />
            </div>
          </div>
        </section>
      )}

      {/* Related Auckland activities (internal linking) */}
      <section className="section-soft py-12 sm:py-16">
        <div className="container-x">
          <h2 className="font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Explore more Auckland activities</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/${r.slug}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 font-semibold text-charcoal-100 shadow-soft transition hover:border-orange-300 hover:text-orange-600"
              >
                {r.h1}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Guides (Blogs) */}
      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <h2 className="font-display text-2xl font-extrabold text-charcoal-300 sm:text-3xl">Related Guides</h2>
          <p className="mt-2 text-muted">Learn more about family activities in Auckland</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedBlogs.map((blog) => (
              <Link
                key={blog.slug}
                to={`/blog/${blog.slug}`}
                className="card p-5 hover:border-orange-300 transition"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                  <BookOpen size={14} />
                  <span>Guide</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-charcoal-300">{blog.title}</h3>
                <p className="mt-2 text-sm text-muted line-clamp-2">{blog.excerpt}</p>
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-orange-600">
                  Read More <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {page.showNearby && <NearbyAreas />}
    </>
  )
}

function SidebarLink({ to, label }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between rounded-xl border border-border bg-bg-soft px-4 py-3 font-semibold text-charcoal-100 transition hover:border-orange-300 hover:text-orange-600">
        {label}
        <ArrowRight size={15} />
      </Link>
    </li>
  )
}

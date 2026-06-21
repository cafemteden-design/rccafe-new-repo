import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { getBlog, BLOGS } from '../data/blogs.js'
import { getLandingPage } from '../data/landingPages.js'
import { articleSchema, breadcrumbSchema, faqSchema } from '../data/seo.js'

export default function BlogPost() {
  const { slug } = useParams()
  const blog = getBlog(slug)

  if (!blog) return <Navigate to="/blog" replace />

  const path = `/blog/${blog.slug}`
  const related = blog.relatedLanding ? getLandingPage(blog.relatedLanding) : null
  const relatedPosts = BLOGS.filter((b) => b.slug !== blog.slug).slice(0, 3)
  const schema = [
    articleSchema({
      title: blog.title,
      description: blog.metaDescription,
      path,
      datePublished: blog.date,
      image: blog.image
    }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: blog.title, path }
    ]),
    faqSchema(blog.faqs)
  ]

  return (
    <>
      <SEO
        title={blog.metaTitle}
        description={blog.metaDescription}
        path={path}
        keywords={blog.keywords}
        ogImage={blog.image}
        ogType="article"
        schema={schema}
      />

      <PageHero
        breadcrumbs={['Blog', blog.title]}
        eyebrow="RCC Blog"
        title={blog.title}
        subtitle={blog.excerpt}
        image={blog.image}
        imageAlt={`${blog.title} - Remote Control Cafe Auckland`}
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x max-w-3xl">
          <article>
            {blog.body.map((block, i) =>
              block.type === 'h2' ? (
                <h2 key={i} className="mt-8 font-display text-2xl font-extrabold text-charcoal-300">{block.text}</h2>
              ) : (
                <p key={i} className="mt-4 leading-relaxed text-muted">{block.text}</p>
              )
            )}
          </article>

          {/* Internal links / CTA */}
          <div className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
            <h3 className="font-display text-xl font-extrabold text-charcoal-300">Ready to visit RCC Cafe?</h3>
            <p className="mt-2 text-sm text-charcoal-200">
              Book a remote control play session, or get in touch about group and special bookings.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking#calendar" className="btn-primary">Book Now <ArrowRight size={16} /></Link>
              {related && (
                <Link to={`/${related.slug}`} className="btn-outline">{related.h1}</Link>
              )}
              <Link to="/contact" className="btn-outline">Contact Us</Link>
            </div>
          </div>

          {blog.faqs?.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-2xl font-extrabold text-charcoal-300">FAQs</h2>
              <div className="mt-5 space-y-4">
                {blog.faqs.map((faq) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="card p-5"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 flex-shrink-0 text-orange-500" size={20} />
                      <div>
                        <div className="font-extrabold text-charcoal-300">{faq.q}</div>
                        <p className="mt-1 leading-relaxed text-muted">{faq.a}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-charcoal-300">Related guides</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {relatedPosts.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-border bg-white p-4 font-semibold text-charcoal-100 shadow-soft transition hover:border-orange-300 hover:text-orange-600"
                  >
                    <span className="text-sm leading-snug">{p.title}</span>
                    <ArrowRight size={15} className="mt-0.5 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600">
              <ArrowLeft size={15} /> Back to all guides
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

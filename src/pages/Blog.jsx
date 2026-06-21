import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import PageHero from '../components/PageHero.jsx'
import SEO from '../components/SEO.jsx'
import { BLOGS } from '../data/blogs.js'
import { breadcrumbSchema } from '../data/seo.js'

export default function Blog() {
  const schema = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' }
  ])

  return (
    <>
      <SEO
        title="RCC Cafe Blog | Auckland Kids, Family & Activity Guides"
        description="Tips and guides on kids activities, indoor fun, birthday parties, school holidays and team building in Auckland from Remote Control Cafe."
        path="/blog"
        keywords={['Auckland activity guides', 'kids activities Auckland blog', 'family activities Auckland']}
        schema={schema}
      />

      <PageHero
        breadcrumbs={['Blog']}
        eyebrow="Resources & Guides"
        title={<>RCC Cafe <span className="accent">Blog</span></>}
        subtitle="Helpful guides on kids activities, indoor fun, birthdays, school holidays and team building across Auckland."
        image="/images/family-cafe-activity.jpg"
        imageAlt="Family enjoying activities at Remote Control Cafe Auckland"
      />

      <section className="section-light py-12 sm:py-16">
        <div className="container-x">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOGS.map((blog, i) => (
              <motion.article
                key={blog.slug}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card card-hover overflow-hidden"
              >
                <Link to={`/blog/${blog.slug}`} className="block">
                  <img
                    src={blog.image}
                    alt={`${blog.title} - Remote Control Cafe Auckland`}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-600">
                      <BookOpen size={13} /> Guide
                    </div>
                    <h2 className="mt-3 font-display text-lg font-extrabold leading-snug text-charcoal-300">{blog.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{blog.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600">
                      Read more <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

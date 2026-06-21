import { Helmet } from 'react-helmet-async'
import { DOMAIN, DEFAULT_OG_IMAGE, absoluteUrl } from '../data/seo.js'
import { TRACKING, hasSiteVerification } from '../data/tracking.js'

/**
 * Reusable SEO head manager.
 *
 * Props:
 * - title        : full <title> (unique per route)
 * - description  : meta description
 * - path         : route path used for the canonical URL (e.g. "/booking")
 * - canonical    : explicit canonical URL (overrides `path`)
 * - keywords     : array or string
 * - ogTitle / ogDescription / ogImage : OpenGraph overrides
 * - ogType       : defaults to "website"
 * - twitterCard  : defaults to "summary_large_image"
 * - noindex      : when true, adds robots noindex,nofollow
 * - schema       : a JSON-LD object or array of objects
 */
export default function SEO({
  seo,
  title,
  description,
  path,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  schema
}) {
  // Pages may pass a single `seo` object (e.g. PAGE_SEO entries). Individual
  // props always take precedence so callers can override any field.
  const merged = seo || {}
  const effectiveTitle = title ?? merged.title
  const effectiveDescription = description ?? merged.description
  const effectivePath = path ?? merged.path ?? '/'
  const effectiveKeywords = keywords ?? merged.keywords
  const effectiveOgTitle = ogTitle ?? merged.ogTitle
  const effectiveOgDescription = ogDescription ?? merged.ogDescription
  const effectiveOgImage = ogImage ?? merged.ogImage
  const effectiveCanonical = canonical ?? merged.canonical

  const canonicalUrl = effectiveCanonical || absoluteUrl(effectivePath)
  const image = absoluteUrl(effectiveOgImage || DEFAULT_OG_IMAGE)
  const keywordsContent = Array.isArray(effectiveKeywords) ? effectiveKeywords.join(', ') : effectiveKeywords
  const schemaList = schema ? (Array.isArray(schema) ? schema : [schema]).filter(Boolean) : []

  return (
    <Helmet prioritizeSeoTags>
      {effectiveTitle && <title>{effectiveTitle}</title>}
      {effectiveDescription && <meta name="description" content={effectiveDescription} />}
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* OpenGraph */}
      <meta property="og:site_name" content="Remote Control Cafe" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      {(effectiveOgTitle || effectiveTitle) && <meta property="og:title" content={effectiveOgTitle || effectiveTitle} />}
      {(effectiveOgDescription || effectiveDescription) && (
        <meta property="og:description" content={effectiveOgDescription || effectiveDescription} />
      )}
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_NZ" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      {(effectiveOgTitle || effectiveTitle) && <meta name="twitter:title" content={effectiveOgTitle || effectiveTitle} />}
      {(effectiveOgDescription || effectiveDescription) && (
        <meta name="twitter:description" content={effectiveOgDescription || effectiveDescription} />
      )}
      <meta name="twitter:image" content={image} />

      {/* Search Console verification (only when configured) */}
      {hasSiteVerification && (
        <meta name="google-site-verification" content={TRACKING.googleSiteVerification} />
      )}

      {/* JSON-LD structured data */}
      {schemaList.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  )
}

export { DOMAIN }

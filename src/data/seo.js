import { SITE } from './site.js'

// Production domain used for canonical URLs, OG tags and structured data.
export const DOMAIN = 'https://remotecontrolcafe.co.nz'

// Default sharing image (an existing public asset). Replace with a dedicated
// 1200x630 OG image when available.
export const DEFAULT_OG_IMAGE = '/images/family-cafe-activity.jpg'

export const DEFAULT_KEYWORDS = [
  'remote control cafe Auckland',
  'RC cafe Auckland',
  'kids activities Auckland',
  'indoor activities Auckland',
  'family activities Auckland',
  'birthday party venue Auckland',
  'school holiday activities Auckland',
  'team building Auckland',
  'things to do with kids Auckland',
  'family entertainment Auckland',
  'unique cafe Auckland',
  'RC construction experience New Zealand'
]

// Central business facts used across schema (NAP, geo, profiles).
export const BUSINESS = {
  name: SITE.fullName, // Remote Control Cafe
  alternateName: 'RCC Cafe',
  phone: SITE.phoneTel,
  phoneDisplay: SITE.phone,
  email: '', // add when available
  url: DOMAIN,
  logo: `${DOMAIN}/logo-rc-cafe-v2.png`,
  image: `${DOMAIN}${DEFAULT_OG_IMAGE}`,
  priceRange: '$$',
  hasMap: SITE.googleBusiness,
  plusCode: SITE.address.plusCode, // 4QH6+GF Auckland
  address: {
    streetAddress: '159 Mount Eden Road',
    addressLocality: 'Mount Eden, Auckland',
    addressRegion: 'Auckland',
    postalCode: '1024',
    addressCountry: 'NZ'
  },
  // Approximate coordinates for the Mount Eden Road location (plus code 4QH6+GF).
  // Confirm exact pin against the Google Business Profile if needed.
  geo: {
    latitude: '-36.8712',
    longitude: '174.7616'
  },
  sameAs: [
    SITE.socials.instagram,
    SITE.socials.facebook,
    SITE.socials.tiktok,
    SITE.socials.youtube,
    SITE.googleBusiness
  ].filter(Boolean),
  openingHours: 'Mo-Su 09:00-16:00'
}

// Auckland-wide supporting areas (used for soft local signals, NOT doorway pages).
export const NEARBY_AREAS = [
  'Auckland CBD',
  'Mount Eden',
  'Newmarket',
  'Onehunga',
  'Mount Wellington',
  'North Shore',
  'Takapuna',
  'Albany',
  'Henderson',
  'Manukau',
  'East Auckland',
  'West Auckland',
  'South Auckland'
]

// Richer "Areas We Serve" content for local relevance (NOT doorway pages).
// Each entry adds a short, honest, location-aware note.
export const AREAS_SERVED = [
  { name: 'Auckland CBD', note: 'A short trip from the central city for a hands-on indoor outing.' },
  { name: 'Mount Eden', note: 'Right on Mount Eden Road — our home base in the heart of Auckland.' },
  { name: 'Newmarket', note: 'Minutes away for families, shoppers and after-work groups.' },
  { name: 'Onehunga', note: 'An easy drive for a rainy-day or weekend family activity.' },
  { name: 'Mount Wellington', note: 'Popular with families looking for something different to do.' },
  { name: 'North Shore', note: 'Worth the trip across the bridge for a unique experience.' },
  { name: 'Takapuna', note: 'A fresh idea for North Shore family days and group outings.' },
  { name: 'Albany', note: 'Families travel down for birthdays and school holiday fun.' },
  { name: 'Henderson', note: 'A go-to indoor option for West Auckland families.' },
  { name: 'Manukau', note: 'Convenient for South Auckland groups and celebrations.' },
  { name: 'East Auckland', note: 'A memorable outing for families across the eastern suburbs.' },
  { name: 'West Auckland', note: 'Reliable indoor fun whatever the weather out west.' },
  { name: 'South Auckland', note: 'A unique activity for families, schools and teams down south.' }
]

// Per-route metadata for existing pages. Keys are pathnames.
export const PAGE_SEO = {
  '/': {
    title: 'RCC Cafe Auckland | Remote Control Construction Experience',
    description:
      'RCC Cafe is Auckland is unique indoor activity where kids, families and groups drive real remote control construction machines. Book your session today.',
    keywords: ['RCC Cafe Auckland', 'remote control cafe', 'RC construction Auckland', 'indoor activity Auckland']
  },
  '/about': {
    title: 'About Remote Control Cafe Auckland | Our RC Construction Arena',
    description:
      'Learn about Remote Control Cafe Auckland — a unique indoor RC construction arena and cafe for kids, families and groups across Auckland.',
    keywords: ['about RCC Cafe Auckland', 'remote control cafe Auckland', 'family entertainment Auckland']
  },
  '/machines': {
    title: 'RC Machines & Construction Games Auckland | RCC Cafe',
    description:
      'Explore remote control diggers, dump trucks, cranes, loaders and construction machines at RCC Cafe Auckland.',
    keywords: ['RC machines Auckland', 'remote control diggers', 'RC construction games Auckland']
  },
  '/booking': {
    title: 'Book RCC Cafe Auckland | RC Machine Play Sessions',
    description:
      'Book your Remote Control Cafe play session in Auckland. Choose your package, food and drink preferences, and enjoy a unique RC construction experience.',
    keywords: ['book RC cafe Auckland', 'RC play session Auckland', 'remote control cafe booking']
  },
  '/rewards': {
    title: 'RCC Digital Reward Card | Remote Control Cafe Auckland',
    description:
      'Create your RCC Digital Reward Card, collect stamps on every visit and unlock a surprise gift after 7 visits.',
    keywords: ['RCC reward card', 'cafe loyalty card Auckland', 'remote control cafe rewards']
  },
  '/menu': {
    title: 'Cafe Menu Auckland | RCC Food & Drinks',
    description:
      'View RCC Cafe food and drink options including toasties, hot coffee and family-friendly cafe choices in Auckland.',
    keywords: ['cafe menu Auckland', 'RCC food and drinks', 'family cafe Auckland']
  },
  '/gallery': {
    title: 'RCC Cafe Gallery Auckland | RC Machines, Kids Activities & Events',
    description:
      'View photos and videos from Remote Control Cafe Auckland, featuring RC machines, kids activities, family sessions and events.',
    keywords: ['RCC cafe gallery', 'RC machines photos Auckland', 'kids activities Auckland photos']
  },
  '/contact': {
    title: 'Contact Remote Control Cafe Auckland | Bookings & Enquiries',
    description:
      'Contact RCC Cafe Auckland for bookings, birthday parties, school holiday activities, group sessions and corporate events.',
    keywords: ['contact RCC cafe Auckland', 'RC cafe bookings Auckland', 'group bookings Auckland']
  },
  '/faq': {
    title: 'FAQs | Remote Control Cafe Auckland Bookings, Parties & More',
    description:
      'Answers to common questions about Remote Control Cafe Auckland — bookings, prices, birthday parties, school holidays, group events, rewards and visiting.',
    keywords: ['RCC cafe FAQ', 'remote control cafe Auckland questions', 'kids activities Auckland FAQ']
  },
  '/why-rcc-cafe': {
    title: 'Why Choose RCC Cafe Auckland | Our Story & Difference',
    description:
      'Discover why Remote Control Cafe is Auckland is unique indoor activity. Learn our story, values and what makes us different for kids, families and groups.',
    keywords: ['why RCC Cafe Auckland', 'remote control cafe story', 'unique Auckland activity']
  },
  '/birthday-packages': {
    title: 'Birthday Packages Auckland | RC Construction Party Venue',
    description:
      'Book unique birthday packages at RCC Cafe Auckland. Kids drive real RC construction machines with party packages for all ages.',
    keywords: ['birthday packages Auckland', 'RC construction party Auckland', 'kids birthday venue Auckland']
  },
  '/corporate-packages': {
    title: 'Corporate Packages Auckland | Team Building Activities',
    description:
      'Book corporate team building packages at RCC Cafe Auckland. Unique RC construction machine challenges for team bonding and corporate events.',
    keywords: ['corporate packages Auckland', 'team building Auckland', 'corporate events Auckland']
  },
  '/group-booking-packages': {
    title: 'Group Booking Packages Auckland | School & Private Groups',
    description:
      'Book group packages at RCC Cafe Auckland for schools, private functions and special events. RC construction fun for groups of all sizes.',
    keywords: ['group booking packages Auckland', 'school group activities Auckland', 'private function venue Auckland']
  },
  '/school-holiday-packages': {
    title: 'School Holiday Packages Auckland | Kids Holiday Activities',
    description:
      'Book school holiday packages at RCC Cafe Auckland. Hands-on RC construction activities for kids during school holidays.',
    keywords: ['school holiday packages Auckland', 'kids holiday activities Auckland', 'school holiday fun Auckland']
  }
}

export function absoluteUrl(path = '/') {
  if (!path) return DOMAIN
  if (path.startsWith('http')) return path
  return `${DOMAIN}${path.startsWith('/') ? '' : '/'}${path}`
}

// ---------------------------------------------------------------------------
// JSON-LD schema builders
// ---------------------------------------------------------------------------

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateName,
    url: BUSINESS.url,
    logo: BUSINESS.logo,
    sameAs: BUSINESS.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS.phone,
      contactType: 'customer service',
      areaServed: 'NZ',
      availableLanguage: 'English'
    }
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BUSINESS.name,
    url: BUSINESS.url
  }
}

export function localBusinessSchema() {
  const address = { '@type': 'PostalAddress' }
  if (BUSINESS.address.streetAddress) address.streetAddress = BUSINESS.address.streetAddress
  address.addressLocality = BUSINESS.address.addressLocality
  address.addressRegion = BUSINESS.address.addressRegion
  if (BUSINESS.address.postalCode) address.postalCode = BUSINESS.address.postalCode
  address.addressCountry = BUSINESS.address.addressCountry

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EntertainmentBusiness',
    '@id': `${DOMAIN}/#business`,
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateName,
    description:
      'Remote Control Cafe is a unique indoor RC construction arena and cafe in Auckland where kids, families and groups can drive real remote control diggers, dump trucks and cranes.',
    url: BUSINESS.url,
    telephone: BUSINESS.phone,
    image: BUSINESS.image,
    logo: BUSINESS.logo,
    priceRange: BUSINESS.priceRange,
    address,
    areaServed: { '@type': 'City', name: 'Auckland' },
    sameAs: BUSINESS.sameAs
  }

  if (BUSINESS.email) schema.email = BUSINESS.email
  if (BUSINESS.hasMap) schema.hasMap = BUSINESS.hasMap
  if (BUSINESS.geo.latitude && BUSINESS.geo.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude
    }
  }

  return schema
}

export function breadcrumbSchema(items = []) {
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  }
}

export function faqSchema(faqs = []) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  }
}

export function serviceSchema({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType: name,
    provider: { '@type': 'EntertainmentBusiness', name: BUSINESS.name, url: BUSINESS.url },
    areaServed: { '@type': 'City', name: 'Auckland' },
    url: absoluteUrl(path)
  }
}

export function articleSchema({ title, description, path, datePublished, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: absoluteUrl(image || DEFAULT_OG_IMAGE),
    datePublished,
    dateModified: datePublished,
    author: { '@type': 'Organization', name: BUSINESS.name },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      logo: { '@type': 'ImageObject', url: BUSINESS.logo }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) }
  }
}

export function videoSchema({ name, description, thumbnailUrl, contentUrl, uploadDate }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl: absoluteUrl(thumbnailUrl || DEFAULT_OG_IMAGE),
    contentUrl: absoluteUrl(contentUrl),
    uploadDate: uploadDate || '2024-01-01'
  }
}

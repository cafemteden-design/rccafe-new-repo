export const SITE = {
  name: 'Remote Control Cafe',
  fullName: 'Remote Control Cafe',
  tagline: "New Zealand's most unique cafe experience",
  email: 'cafemteden@gmail.com',
  phone: '',
  phoneTel: '',
  location: '159 Mount Eden Road, Mount Eden, Auckland 1024',
  hours: 'Open every day with day-specific hours.',
  address: {
    street: '159 Mount Eden Road',
    suburb: 'Mount Eden',
    city: 'Auckland',
    postcode: '1024',
    country: 'New Zealand',
    plusCode: '4QH6+GF Auckland'
  },
  googleBusiness: 'https://share.google/D8KsXN5Bh3nRMdIP7',
  socials: {
    instagram:
      'https://www.instagram.com/remotecontrolcafe?igsh=MTVhamJtanVxZ3RoMw%3D%3D&utm_source=qr',
    facebook: 'https://www.facebook.com/share/1C2kYoCgPK/?mibextid=wwXIfr',
    tiktok: 'https://www.tiktok.com/@remotecontrolcafe?_r=1&_t=ZS-94mpJUFvAof',
    youtube: 'https://youtube.com/@jay_zinzala?si=BJGrpt82DqqqBOKj',
    whatsapp: ''
  },
  developer: {
    name: 'The Gujarati Designer',
    url: 'https://www.thegujaratidesigner.in'
  }
}

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/rewards', label: 'My Rewards' },
  { to: '/booking', label: 'Booking' },
  { to: '/menu', label: 'Menu' },
  { to: '/experience', label: 'Experience' },
  { to: '/contact', label: 'Contact Us' }
]

export const PRICING = [
  {
    id: 'mini',
    label: 'MINI',
    price: 32,
    unit: '30 min play',
    available: false,
    badge: 'Currently Unavailable',
    perks: ['Any toastie', 'Any hot coffee', 'Food + RC play package']
  },
  {
    id: 'power',
    label: 'POWER',
    price: 45,
    unit: '45 min play',
    badge: 'Most Popular',
    available: true,
    perks: ['Any toastie', 'Any hot coffee', 'Most popular package']
  },
  {
    id: 'master',
    label: 'MASTER',
    price: 55,
    unit: '60 min play',
    available: true,
    perks: ['Any toastie', 'Any hot coffee', 'Extended RC play time']
  }
]

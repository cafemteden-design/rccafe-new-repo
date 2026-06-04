export const SITE = {
  name: 'RC Cafe',
  fullName: 'Remote Control Cafe',
  tagline: 'Auckland’s Remote Control Construction Arena',
  phone: '09 558 7570',
  phoneTel: '+6495587570',
  location: 'Auckland, New Zealand',
  hours: 'We Are Open Every Day!',
  socials: {
    instagram:
      'https://www.instagram.com/remotecontrolcafe?igsh=MTVhamJtanVxZ3RoMw%3D%3D&utm_source=qr',
    facebook: 'https://www.facebook.com/share/1C2kYoCgPK/?mibextid=wwXIfr',
    tiktok: 'https://www.tiktok.com/@remotecontrolcafe?_r=1&_t=ZS-94mpJUFvAof',
    youtube: 'https://youtube.com/@jay_zinzala?si=BJGrpt82DqqqBOKj',
    whatsapp: 'https://wa.me/6495587570'
  },
  developer: {
    name: 'The Gujarati Designer',
    url: 'https://www.thegujaratidesigner.in'
  }
}

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/machines', label: 'RC Machines' },
  { to: '/booking', label: 'Booking' },
  { to: '/menu', label: 'Menu' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' }
]

export const PRICING = [
  {
    id: 'mini',
    label: 'MINI',
    price: 32,
    unit: '30 min play',
    perks: ['Any toastie', 'Any hot coffee', 'Food + RC play package']
  },
  {
    id: 'power',
    label: 'POWER',
    price: 45,
    unit: '45 min play',
    badge: 'Most Popular',
    perks: ['Any toastie', 'Any hot coffee', 'Most popular package']
  },
  {
    id: 'master',
    label: 'MASTER',
    price: 55,
    unit: '60 min play',
    perks: ['Any toastie', 'Any hot coffee', 'Extended RC play time']
  }
]

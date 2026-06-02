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
    youtube: 'https://youtube.com/@jay_zinzala?si=BJGrpt82DqqqBOKj'
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
    id: '15min',
    label: '15 Minute Session',
    price: 10,
    unit: 'per session',
    perks: ['Quick arena ride', 'Choose any single machine', 'Perfect for first-timers']
  },
  {
    id: '30min',
    label: '30 Minute Session',
    price: 18,
    unit: 'per session',
    perks: ['Most popular slot', 'Full arena experience', 'Switch machines mid-session*']
  },
  {
    id: 'byo',
    label: 'Bring Your Own',
    price: 10,
    unit: 'per hour',
    perks: ['Use our sand arena', 'Bring your personal RC', 'Family & hobby friendly']
  }
]

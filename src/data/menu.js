export const MENU = {
  'Hot Drinks': [
    { name: 'Black (Espresso / Short Black / Americano / Long Black)', price: 4.5 },
    { name: 'Flat White', price: 5.5, prefix: 'from' },
    { name: 'Latte', price: 5.5, prefix: 'from' },
    { name: 'Cappuccino', price: 5.5, prefix: 'from' },
    { name: 'Mocca', price: 6.0, prefix: 'from' },
    { name: 'Hot Chocolate', price: 5.5, prefix: 'from' },
    { name: 'Dirty Chai', price: 7.0 },
    { name: 'Fluffy', price: 2.5 }
  ],
  'Non-Coffee': [
    { name: 'Matcha Latte', price: 7.0 },
    { name: 'Turmeric Latte', price: 7.0 },
    { name: 'Chai Latte', price: 7.0 },
    { name: 'Spicy Chai', price: 6.0 },
    { name: 'Ginger Lemon Honey', price: 4.5 }
  ],
  Tea: [
    { name: 'English Breakfast', price: 4.5 },
    { name: 'Earl Grey / Peppermint', price: 4.5 }
  ],
  'Cold Drinks': [
    { name: 'Iced Americano', price: 6.0 },
    { name: 'Iced Latte', price: 6.5 },
    { name: 'Iced Cappuccino', price: 6.5 },
    { name: 'Iced Mocha', price: 6.5 },
    { name: 'Iced Chocolate', price: 6.5 },
    { name: 'Iced Matcha', price: 7.0 },
    { name: 'Iced Strawberry Matcha', price: 8.0 },
    { name: 'Iced Caramel Latte', price: 9.0 },
    { name: 'Iced Pistachio Latte', price: 9.0 },
    { name: 'Iced Biscoff Latte', price: 9.0 },
    { name: 'Iced Turmeric Latte', price: 8.0 }
  ],
  'Frappé': [
    { name: 'Choco / Caramel', price: 9.0 },
    { name: 'Coffee / Mocha / Matcha', price: 9.0 },
    { name: 'Matcha Strawberry', price: 9.0 },
    { name: 'Biscoff / Pistachio', price: 9.0 }
  ],
  Smoothies: [
    { name: 'Berry / Banana / Mango', price: 10.0 }
  ],
  Shakes: [
    { name: 'Nutella / Oreo', price: 10.0 },
    { name: 'Biscoff / Pistachio', price: 10.0 },
    { name: 'Mango / Banana', price: 10.0 }
  ],
  Extras: [
    { name: 'Shot / Decaf / Vanilla / Caramel / Hazelnut', price: 0.5 },
    { name: 'Soy / Almond / Coconut / Oat Milk', price: 0.5 }
  ]
}

export const RC_PACKAGES = [
  {
    id: 'mini',
    name: 'MINI',
    playTime: '30 Min Play',
    price: 32,
    includesToastie: true,
    includesCoffee: true,
    summary: '30 Min Play + Toastie + Hot Coffee'
  },
  {
    id: 'power',
    name: 'POWER',
    playTime: '45 Min Play',
    price: 45,
    badge: 'Most Popular',
    includesToastie: true,
    includesCoffee: true,
    summary: '45 Min Play + Toastie + Hot Coffee'
  },
  {
    id: 'master',
    name: 'MASTER',
    playTime: '60 Min Play',
    price: 55,
    includesToastie: true,
    includesCoffee: true,
    summary: '60 Min Play + Toastie + Hot Coffee'
  }
]

export const UPGRADED_PLAY = [
  { id: 'upgrade-15', name: 'Upgraded Play 15 Min', playTime: '15 Min Play', price: 15, summary: '15 Min Play' },
  { id: 'upgrade-30', name: 'Upgraded Play 30 Min', playTime: '30 Min Play', price: 20, summary: '30 Min Play' }
]

export const BOOKING_OPTIONS = [...RC_PACKAGES, ...UPGRADED_PLAY]

export const TOASTIE_CHOICES = ['Ham & Cheese', 'Cheese Only', 'Butter Toast']

export const COFFEE_CHOICES = ['Any Black', 'Flat White / Latte', 'Hot Choco / Cappuccino', 'Fluffy']

export const FOOD_ITEMS = [
  { name: 'Turbo Wedges', price: 9.99 },
  { name: 'Turbo Nuggets', price: 9.99 },
  { name: 'Wedges + Nuggets', price: 17.99 },
  { name: 'RC Turbo Corn Chips + Dips', price: 8.99 },
  { name: 'Fresh Toastie', price: 8.99 },
  { name: 'Fresh Toastie + Corn Chips + Dips', price: 16.99 },
  { name: 'RC Corn Dog Turbo', price: 12.99 },
  { name: 'RC Jalapeno Bites', price: 9.99 },
  { name: 'RC Loaded Chicken Strips', price: 12.99 }
]

export const MENU_NOTES = {
  coffee: 'Every Coffee. Double Shot. No Extra Charge.',
  venue: 'Free venue hire available for birthday parties, corporate events & special functions.',
  allergen: 'We have taken care to ensure food safety, but we cannot fully guarantee that any dish is completely free of nuts, gluten, dairy and/or other allergens.'
}

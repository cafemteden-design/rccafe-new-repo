// Real client photos at /public/images/*.jpg
export const MACHINES = [
  {
    id: 'excavators',
    name: 'Excavators',
    capacity: 5,
    tag: 'Most Popular',
    description:
      'Dig, scoop and move sand like a real construction operator. Master the bucket and tracks.',
    image: '/images/rc-excavator-arena.jpg'
  },
  {
    id: 'dump-trucks',
    name: 'Dump Trucks',
    capacity: 2,
    tag: 'Heavy Hauler',
    description:
      'Load, transport and dump material across the arena. Team up with an excavator for full ops.',
    image: '/images/rc-dump-truck.jpg'
  },
  {
    id: 'cranes',
    name: 'Cranes',
    capacity: 2,
    tag: 'Skill Master',
    description:
      'Lift, move and complete fun construction challenges. Test your precision controls.',
    image: '/images/rc-crane.jpg'
  },
  {
    id: 'loaders',
    name: 'Loaders',
    capacity: 2,
    tag: 'Power Player',
    description:
      'Push, carry and clear the play zone like a pro. Strong, agile and beginner friendly.',
    image: '/images/rc-loader.jpg'
  },
  {
    id: 'fire-truck',
    name: 'Fire Truck',
    capacity: 1,
    tag: 'Kids Favourite',
    description:
      'A special machine experience for kids and RC lovers. Lights, sirens and fun missions.',
    image: '/images/rc-fire-truck.jpg'
  }
]

export const MACHINE_OPTIONS_FOR_BOOKING = [
  ...MACHINES.map((m) => ({ id: m.id, name: m.name, capacity: m.capacity })),
  { id: 'byo', name: 'Bring Your Own', capacity: 99 }
]

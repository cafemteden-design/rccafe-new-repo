// 30-minute play slots
export const SLOTS_30 = [
  '8:30 AM – 9:00 AM',
  '9:05 AM – 9:35 AM',
  '9:40 AM – 10:10 AM',
  '10:15 AM – 10:45 AM',
  '10:50 AM – 11:20 AM',
  '11:25 AM – 11:55 AM',
  '12:00 PM – 12:30 PM',
  '12:35 PM – 1:05 PM',
  '1:10 PM – 1:40 PM',
  '1:45 PM – 2:15 PM'
]

// Generate 15-minute slots between 8:30 AM and 2:15 PM with a 5 minute buffer
function fmt(mins) {
  const total = mins
  let h = Math.floor(total / 60)
  const m = total % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  if (h > 12) h -= 12
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

export const SLOTS_15 = (() => {
  const list = []
  let start = 8 * 60 + 30
  const end = 14 * 60 + 15
  while (start + 15 <= end) {
    list.push(`${fmt(start)} – ${fmt(start + 15)}`)
    start += 20 // 15 min play + 5 min buffer
  }
  return list
})()

// BYO uses hourly slots
export const SLOTS_BYO = (() => {
  const list = []
  let start = 8 * 60 + 30
  const end = 14 * 60 + 15
  while (start + 60 <= end + 45) {
    list.push(`${fmt(start)} – ${fmt(start + 60)}`)
    start += 60
  }
  return list
})()

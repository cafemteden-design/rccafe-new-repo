function hashValue(value) {
  return String(value || '').split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0
  }, 2166136261)
}

export default function DemoQrCode({ value, label = 'Demo QR', premium = false }) {
  const hash = hashValue(value)
  const cells = Array.from({ length: 121 }).map((_, index) => {
    const row = Math.floor(index / 11)
    const col = index % 11
    const inTopLeft = row < 3 && col < 3
    const inTopRight = row < 3 && col > 7
    const inBottomLeft = row > 7 && col < 3
    const finder = inTopLeft || inTopRight || inBottomLeft
    const filled = finder || ((hash + index * 17 + row * 31 + col * 13) % 5 < 2)

    return (
      <span
        key={index}
        className={`aspect-square rounded-[2px] ${filled ? 'bg-charcoal-300' : 'bg-white'}`}
      />
    )
  })

  return (
    <div className={`rounded-3xl border p-3 shadow-soft ${premium ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white' : 'border-border bg-white'}`}>
      <div className="rounded-2xl border border-orange-100 bg-white p-2">
        <div className="grid grid-cols-11 gap-1 rounded-xl bg-white" aria-label={label}>
          {cells}
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">
          {label}
        </div>
        <div className="mt-1 text-[10px] font-semibold text-muted">Demo QR Preview</div>
      </div>
    </div>
  )
}

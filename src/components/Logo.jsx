// Versioned logo path avoids stale Hostinger/browser cache after production uploads.
import { useState } from 'react'

const LOGO_SRC = '/logo-rc-cafe-v2.png'

export default function Logo({ className = 'h-12 w-auto', alt = 'RC Cafe' }) {
  const [src, setSrc] = useState(LOGO_SRC)
  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      decoding="async"
      onError={() => setSrc(LOGO_SRC)}
    />
  )
}

// Logo component: prefers /logo.png if user drops it, falls back to /logo.svg.
import { useState } from 'react'

export default function Logo({ className = 'h-12 w-auto', alt = 'RC Cafe' }) {
  const [src, setSrc] = useState('/logo.png')
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setSrc('/logo.svg')}
    />
  )
}

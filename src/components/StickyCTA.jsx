import { Link } from 'react-router-dom'
import { Calendar, Mail, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function StickyCTA({ primaryLabel = 'Book Now', primaryTo = '/booking#calendar', showContact = true }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (isDismissed) return
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  if (!isVisible || isDismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-lg">
      <div className="container-x">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={primaryTo} className="btn-primary text-sm">
              <Calendar size={16} /> {primaryLabel}
            </Link>
            {showContact && (
              <Link
                to="/contact"
                className="hidden items-center gap-2 rounded-full border border-border bg-bg-soft px-4 py-2 text-sm font-semibold text-charcoal-300 transition hover:border-orange-300 sm:flex"
              >
                <Mail size={16} />
                <span>Send Enquiry</span>
              </Link>
            )}
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="rounded-full p-2 text-muted transition hover:bg-bg-soft"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

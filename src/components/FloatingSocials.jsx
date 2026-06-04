import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Instagram, MessageCircle } from 'lucide-react'
import { SITE } from '../data/site.js'

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.6 6.7a5.7 5.7 0 0 1-3.4-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V12a3 3 0 1 0 2.1 2.9V2h2.5a5.5 5.5 0 0 0 3.4 4.7Z" />
    </svg>
  )
}

const LINKS = [
  { label: 'WhatsApp', href: SITE.socials.whatsapp, icon: MessageCircle, className: 'bg-green-500 text-white border-green-500 hover:bg-green-600' },
  { label: 'Instagram', href: SITE.socials.instagram || '#', icon: Instagram, className: 'bg-white text-charcoal-300 border-border hover:border-orange-500 hover:text-orange-600' },
  { label: 'TikTok', href: SITE.socials.tiktok || '#', icon: TikTokIcon, className: 'bg-charcoal-300 text-white border-charcoal-300 hover:bg-charcoal-100' }
]

export default function FloatingSocials() {
  const [pastHeader, setPastHeader] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setPastHeader(window.scrollY > 220)
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px', threshold: 0.02 }
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const shouldShow = pastHeader && !footerVisible

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 28, scale: 0.94 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 bottom-24 z-40 flex flex-col gap-3 sm:right-5 sm:bottom-[96px]"
        >
          {LINKS.map(({ label, href, icon: Icon, className }, index) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              aria-label={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.22 }}
              whileHover={{ y: -3, scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className={`grid h-11 w-11 place-items-center rounded-full border shadow-card transition-colors duration-300 sm:h-12 sm:w-12 ${className}`}
            >
              <Icon size={20} className="h-5 w-5" />
            </motion.a>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

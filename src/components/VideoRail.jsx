import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, X, Heart, Truck, MapPin } from 'lucide-react'
import { ARENA_VIDEOS } from '../data/videos.js'

const TRUST_CHIPS = [
  { icon: Play, label: 'Real Customer Videos' },
  { icon: Heart, label: 'Family Friendly' },
  { icon: Truck, label: 'RC Construction Arena' },
  { icon: MapPin, label: 'Auckland Experience' }
]

export default function VideoRail() {
  const railRef = useRef(null)
  const [lightbox, setLightbox] = useState(null) // index or null
  const [paused, setPaused] = useState(false)
  const pauseTimerRef = useRef(null)

  const scroll = (dir) => {
    const el = railRef.current
    if (!el) return
    const card = el.querySelector('[data-vcard]')
    const step = card ? card.clientWidth + 20 : 320
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    // Loop back to start when we reach the end
    if (dir > 0 && el.scrollLeft >= max - 4) next = 0
    if (dir < 0 && el.scrollLeft <= 4) next = max
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  // Pause auto-slide briefly on user interaction
  const nudgePause = () => {
    setPaused(true)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    pauseTimerRef.current = setTimeout(() => setPaused(false), 4000)
  }

  // Auto-slide every 2.8s while the rail is on screen, lightbox is closed and not paused
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    let inView = false
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting }, { threshold: 0.25 })
    io.observe(el)
    const id = setInterval(() => {
      if (!inView || paused || lightbox !== null) return
      if (document.hidden) return
      scroll(1)
    }, 2800)
    // Manual swipe / drag pauses briefly
    const onUserMove = () => nudgePause()
    el.addEventListener('pointerdown', onUserMove)
    el.addEventListener('wheel', onUserMove, { passive: true })
    el.addEventListener('touchstart', onUserMove, { passive: true })
    return () => {
      io.disconnect()
      clearInterval(id)
      el.removeEventListener('pointerdown', onUserMove)
      el.removeEventListener('wheel', onUserMove)
      el.removeEventListener('touchstart', onUserMove)
    }
  }, [paused, lightbox])

  return (
    <section className="section-light py-14 sm:py-20 overflow-hidden" id="videos">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Real Footage</span>
            <h2 className="heading-display mt-4">See RC Cafe <span className="accent">In Action</span></h2>
            <p className="mt-4 text-muted text-base sm:text-lg">Real visitors. Real machines. Real fun.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => scroll(-1)} aria-label="Previous video" className="grid place-items-center w-11 h-11 rounded-full border border-border bg-white text-charcoal-300 hover:border-orange-500 hover:text-orange-600 transition"><ChevronLeft size={20} /></button>
            <button onClick={() => scroll(1)} aria-label="Next video" className="grid place-items-center w-11 h-11 rounded-full border border-border bg-white text-charcoal-300 hover:border-orange-500 hover:text-orange-600 transition"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="mt-10 max-w-full overflow-hidden">
          <div
            ref={railRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-0 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {ARENA_VIDEOS.map((v, i) => (
              <VideoCard key={v.video} item={v} index={i} onExpand={() => setLightbox(i)} />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST_CHIPS.map((c) => (
            <span key={c.label} className="chip">
              <c.icon size={14} className="text-orange-500" />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox item={ARENA_VIDEOS[lightbox]} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ------------------------------ Video card ----------------------------- */
function VideoCard({ item, index, onExpand }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.35, rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <motion.div
      data-vcard
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="snap-start shrink-0 w-[78%] xs:w-[72%] sm:w-[52%] md:w-[42%] lg:w-[31%]"
    >
      <div className="group relative rounded-2xl overflow-hidden border-2 border-orange-200 bg-white shadow-soft hover:shadow-glow hover:border-orange-400 transition-all">
        <div className="relative aspect-[9/16] bg-bg-soft overflow-hidden">
          <video
            ref={videoRef}
            src={shouldLoad ? item.video : undefined}
            muted={muted}
            loop
            playsInline
            autoPlay
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover bg-bg-soft"
          />
          {/* Top badge */}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Real Customer Footage
          </div>
          {/* Mute toggle */}
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-white/90 text-charcoal-300 backdrop-blur hover:bg-orange-500 hover:text-white transition"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {/* Expand */}
          <button
            onClick={onExpand}
            aria-label="Open large player"
            className="absolute inset-0 grid place-items-center bg-charcoal-300/0 hover:bg-charcoal-300/30 transition"
          >
            <span className="opacity-0 group-hover:opacity-100 transition grid place-items-center w-14 h-14 rounded-full bg-orange-500 text-white shadow-glow">
              <Play size={22} fill="currentColor" />
            </span>
          </button>
        </div>
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-orange-600 font-bold">{item.tag}</div>
          <div className="mt-1 font-display text-lg font-extrabold text-charcoal-300">{item.title}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------ Lightbox ------------------------------- */
function Lightbox({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-charcoal-300/90 backdrop-blur flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <button onClick={onClose} aria-label="Close" className="absolute -top-12 right-0 grid place-items-center w-10 h-10 rounded-full bg-white text-charcoal-300 hover:bg-orange-500 hover:text-white transition">
          <X size={20} />
        </button>
        <div className="rounded-2xl overflow-hidden border-2 border-orange-400 bg-black shadow-glow">
          <video
            src={item.video}
            controls
            autoPlay
            playsInline
            className="w-full aspect-[9/16] object-contain bg-black"
          />
        </div>
        <div className="mt-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold">{item.tag}</div>
          <div className="mt-1 text-white font-display font-extrabold">{item.title}</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

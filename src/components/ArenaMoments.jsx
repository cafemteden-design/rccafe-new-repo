import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { ARENA_MOMENTS } from '../data/arenaMoments.js'

export default function ArenaMoments() {
  const containerRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const pauseTimerRef = useRef(null)

  // Auto-slide for mobile carousel
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let inView = false
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting }, { threshold: 0.25 })
    io.observe(el)

    const id = setInterval(() => {
      if (!inView || paused || window.innerWidth >= 768) return
      if (document.hidden) return
      el.scrollBy({ left: el.clientWidth, behavior: 'smooth' })
      
      // Loop back to start
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      }
    }, 3000)

    // Pause on user interaction
    const onUserMove = () => {
      setPaused(true)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => setPaused(false), 5000)
    }

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
  }, [paused])

  return (
    <section className="bg-gradient-to-b from-white to-orange-50/30 py-14 md:py-[56px]">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-3">
          <span className="eyebrow inline-flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            More Real Arena Moments
          </span>
          <h2 className="heading-display mt-3 text-2xl sm:text-3xl">See Customers Drive, Dig & <span className="accent">Play</span></h2>
          <p className="mt-2 text-muted max-w-[620px] mx-auto text-sm sm:text-base">
            Real gameplay videos from inside the RC Cafe construction arena. Watch customers operate excavators, 
            dump trucks, and cranes in our family-friendly environment.
          </p>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden md:grid md:grid-cols-[1.35fr_.85fr] gap-[18px] items-stretch">
          {/* Left: Large featured video */}
          <div>
            <VideoCard video={ARENA_MOMENTS[0]} featured />
          </div>
          {/* Right: Stacked videos */}
          <div className="grid grid-rows-2 gap-[18px]">
            {ARENA_MOMENTS.slice(1, 3).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div 
          ref={containerRef}
          className="md:hidden flex gap-[14px] overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ARENA_MOMENTS.map((video) => (
            <div key={video.id} className="snap-center shrink-0 w-[82vw]">
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 md:mt-4 text-center">
          <p className="text-charcoal-300 font-semibold mb-3 text-sm">Ready to try it yourself?</p>
          <Link to="/booking" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
            Book Your Slot
          </Link>
        </div>
      </div>
    </section>
  )
}

function VideoCard({ video, featured = false }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting)
        if (e.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)

    return () => io.disconnect()
  }, [])

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
    } else {
      el.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }

  const isVertical = video.orientation === 'vertical'
  
  // Desktop heights
  const desktopHeight = featured ? 'h-[360px]' : 'h-[170px]'
  // Mobile heights
  const mobileHeight = isVertical ? 'h-[330px]' : 'h-[220px]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative rounded-[22px] overflow-hidden border-2 border-orange-200 bg-white shadow-soft group cursor-pointer ${desktopHeight} md:block ${mobileHeight}`}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video}
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

      {/* Live badge */}
      <div className="absolute top-3 left-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live Gameplay
        </span>
      </div>

      {/* Play/Pause indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play size={20} className="text-orange-600 ml-1" fill={isPlaying ? 'none' : 'currentColor'} />
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-sm md:text-base">{video.title}</h3>
      </div>
    </motion.div>
  )
}

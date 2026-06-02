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
    <section className="bg-gradient-to-b from-white to-orange-50/30 py-14 sm:py-20">
      <div className="container-x">
        <div className="text-center mb-10 sm:mb-12">
          <span className="eyebrow inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            More Real Arena Moments
          </span>
          <h2 className="heading-display mt-4">See Customers Drive, Dig & <span className="accent">Play</span></h2>
          <p className="mt-3 text-muted max-w-2xl mx-auto">
            Real gameplay videos from inside the RC Cafe construction arena. Watch customers operate excavators, 
            dump trucks, and cranes in our family-friendly environment.
          </p>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 lg:gap-6">
          {/* Left: Large featured video */}
          <div className="md:col-span-7 lg:col-span-8">
            <VideoCard video={ARENA_MOMENTS[0]} featured />
          </div>
          {/* Right: Stacked videos */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            {ARENA_MOMENTS.slice(1, 3).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div 
          ref={containerRef}
          className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ARENA_MOMENTS.map((video) => (
            <div key={video.id} className="snap-center shrink-0 w-[85vw] max-w-[320px]">
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-charcoal-300 font-semibold mb-4">Ready to try it yourself?</p>
          <Link to="/booking" className="btn-primary inline-flex items-center gap-2">
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
  const aspectRatio = isVertical ? 'aspect-[9/16]' : 'aspect-video'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative rounded-[22px] overflow-hidden border-2 border-orange-200 bg-white shadow-soft group cursor-pointer ${aspectRatio} ${featured ? 'h-full' : ''}`}
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
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

      {/* Live badge */}
      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live Gameplay
        </span>
      </div>

      {/* Play/Pause indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play size={24} className="text-orange-600 ml-1" fill={isPlaying ? 'none' : 'currentColor'} />
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-semibold text-lg">{video.title}</h3>
      </div>
    </motion.div>
  )
}

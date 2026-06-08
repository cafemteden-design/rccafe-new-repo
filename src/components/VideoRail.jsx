import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Instagram, Play, RadioTower, Volume2, VolumeX } from 'lucide-react'
import { ARENA_VIDEOS } from '../data/videos.js'
import { SITE } from '../data/site.js'

const ROTATE_MS = 3800

export default function VideoRail() {
  const sectionRef = useRef(null)
  const railRef = useRef(null)
  const videoRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [userLocked, setUserLocked] = useState(false)
  const [soundIndex, setSoundIndex] = useState(null)

  const selectVideo = (index, lock = false) => {
    setActiveIndex(index)
    if (lock) setUserLocked(true)
    scrollToCard(index)
  }

  const scrollToCard = (index) => {
    const rail = railRef.current
    const card = rail?.querySelector(`[data-video-card="${index}"]`)
    if (!rail || !card) return
    const left = card.offsetLeft - rail.offsetLeft
    rail.scrollTo({ left, behavior: 'smooth' })
  }

  const move = (direction) => {
    const next = (activeIndex + direction + ARENA_VIDEOS.length) % ARENA_VIDEOS.length
    selectVideo(next, true)
  }

  const toggleSound = (index) => {
    setSoundIndex((current) => current === index ? null : index)
    selectVideo(index, true)
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const updateVisibility = () => {
      const rect = section.getBoundingClientRect()
      const visible = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15
      setIsVisible(visible)
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.18, rootMargin: '120px 0px' }
    )

    observer.observe(section)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return

      if (!isVisible || index !== activeIndex) {
        video.pause()
        if (index !== activeIndex) video.currentTime = 0
        return
      }

      video.muted = soundIndex !== index
      if (video.readyState === 0) video.load()
      video.play().catch(() => {})
    })
  }, [activeIndex, isVisible, soundIndex])

  useEffect(() => {
    if (!isVisible || userLocked) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % ARENA_VIDEOS.length
        window.requestAnimationFrame(() => scrollToCard(next))
        return next
      })
    }, ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [isVisible, userLocked])

  useEffect(() => {
    if (soundIndex === null) return undefined

    const timer = window.setTimeout(() => {
      setUserLocked(false)
      setSoundIndex(null)
    }, 15000)

    return () => window.clearTimeout(timer)
  }, [soundIndex])

  return (
    <section ref={sectionRef} className="section-light py-10 sm:py-14 overflow-hidden" id="videos">
      <div className="container-x">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow"><RadioTower size={14} />Live from RCC</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-charcoal-300 sm:text-4xl">RCC <span className="text-orange-500">Moments</span></h2>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">Watch the action, machines, and cafe experience.</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => move(-1)} aria-label="Previous video" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-charcoal-300 transition hover:border-orange-500 hover:text-orange-600">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => move(1)} aria-label="Next video" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-charcoal-300 transition hover:border-orange-500 hover:text-orange-600">
              <ChevronRight size={18} />
            </button>
            <a href={SITE.socials.instagram} target="_blank" rel="noreferrer" className="btn-outline !py-2.5">
              <Instagram size={16} /> Follow on Instagram
            </a>
          </div>
        </div>

        <div className="mt-7">
          <div
            ref={railRef}
            className="flex touch-pan-x touch-pan-y snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {ARENA_VIDEOS.map((item, index) => (
              <VideoCard
                key={item.video}
                item={item}
                index={index}
                active={activeIndex === index}
                muted={soundIndex !== index}
                setRef={(element) => { videoRefs.current[index] = element }}
                onSelect={() => selectVideo(index, true)}
                onToggleSound={() => toggleSound(index)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {ARENA_VIDEOS.map((item, index) => (
            <button
              key={item.video}
              onClick={() => selectVideo(index, true)}
              aria-label={`Show video ${index + 1}`}
              className={`h-2 rounded-full transition-all ${activeIndex === index ? 'w-8 bg-orange-500' : 'w-2 bg-orange-200 hover:bg-orange-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function VideoCard({ item, index, active, muted, setRef, onSelect, onToggleSound }) {
  return (
    <motion.article
      data-video-card={index}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="shrink-0 snap-start w-[82%] sm:w-[46%] lg:w-[31%]"
    >
      <div className={`relative overflow-hidden rounded-3xl border bg-white shadow-soft transition-all duration-300 ${active ? 'border-orange-400 shadow-glow' : 'border-orange-100 hover:border-orange-300 hover:shadow-card'}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-bg-soft">
          <video
            ref={setRef}
            src={item.video}
            muted={muted}
            playsInline
            preload={index === 0 ? 'metadata' : 'none'}
            autoPlay={active}
            controls={false}
            draggable={false}
            disablePictureInPicture
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />

          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-glow">
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${active ? 'animate-pulse' : ''}`} />
            {active ? 'Playing' : 'RCC Moment'}
          </div>

          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onToggleSound() }}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-charcoal-300 shadow-soft backdrop-blur transition hover:bg-orange-500 hover:text-white"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <button
            type="button"
            onClick={onSelect}
            aria-label={`Play ${item.title}`}
            className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl bg-white/92 px-3 py-2 text-left shadow-soft backdrop-blur transition hover:bg-white"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600">{item.tag}</div>
              <div className="mt-0.5 text-sm font-extrabold text-charcoal-300">{item.title}</div>
            </div>
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-orange-500 text-white">
              <Play size={16} fill="currentColor" />
            </span>
          </button>
        </div>
      </div>
    </motion.article>
  )
}

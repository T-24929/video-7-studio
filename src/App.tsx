import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Mail, MapPin, Menu, Play, Plus, X } from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'
import { Popover } from '@base-ui/react/popover'
import { Accordion } from '@base-ui/react/accordion'
import BlurText from './components/BlurText/BlurText'
import TiltedCard from './components/TiltedCard/TiltedCard'
import StrokeText from './components/StrokeText'
import CurvedLoop from './components/CurvedLoop'
import ScrollFloat from './components/ScrollFloat'
import ScrollReveal from './components/ScrollReveal'
import ScrollExpand from './components/ScrollExpand'
import GoogleReviews from './components/GoogleReviews'
import Preloader from './components/Preloader'
import { useEditorialScroll } from './hooks/useEditorialScroll'
import { films } from './data/films'
import logo from './assets/logo.svg'

const StoryCarousel = lazy(() => import('./components/StoryCarousel'))

function Instagram({ size = 19 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>
}
function Youtube({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg>
}

const categories = ['All stories', 'Weddings', 'Pre-weddings', 'Celebrations'] as const
type Category = typeof categories[number]
const stories = [
  { title: 'A garden kind of love', category: 'Weddings', note: 'The beginning of forever', image: '/images/story-garden.jpg', alt: 'A bride and groom sharing a quiet moment in a garden' },
  { title: 'Just the two of us', category: 'Pre-weddings', note: 'A little adventure, a lot of love', image: '/images/story-coast.jpg', alt: 'A couple together beside the ocean at sunset' },
  { title: 'Under a thousand lights', category: 'Celebrations', note: 'For the moments in between', image: '/images/story-celebration.jpg', alt: 'A warm wedding celebration filled with sparklers' },
]
const services = [
  { name: 'Weddings & homecomings', description: 'From the first look to the last dance, thoughtful photography and cinematic films that let you relive your day, just as it felt.' },
  { name: 'Pre-wedding stories', description: 'A little time away from the plans. A meaningful place, beautiful light, and the freedom to simply be yourselves.' },
  { name: 'Celebrations & events', description: 'Engagements, anniversaries, family milestones, and events of every kind. We are here for all the moments worth remembering.' },
]

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={`scroll-reveal ${className}`} data-reveal-delay={delay}>{children}</div>
}

function Modal({ children, label, onClose, className = '' }: { children: ReactNode; label: string; onClose: () => void; className?: string }) {
  const [open, setOpen] = useState(true)
  const [instant, setInstant] = useState(() => document.documentElement.dataset.inputMethod === 'keyboard')
  const previousFocus = useRef(document.activeElement as HTMLElement | null)
  return <Dialog.Root open={open} onOpenChange={(next, details) => {
    if (details.event instanceof KeyboardEvent || (details.event instanceof MouseEvent && details.event.detail === 0)) setInstant(true)
    setOpen(next)
  }} onOpenChangeComplete={next => { if (!next) onClose() }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="modal-backdrop" data-instant={instant || undefined} />
      <Dialog.Viewport className="modal-viewport" data-lenis-prevent>
        <Dialog.Popup className={`modal ${className}`} data-instant={instant || undefined} finalFocus={() => previousFocus.current?.isConnected ? previousFocus.current : document.querySelector<HTMLElement>('.menu-button')}>
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          <div className="modal-inner"><Dialog.Close className="modal-close icon-button" aria-label="Close dialog"><X size={22} /></Dialog.Close>{children}</div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>
}

function Inquiry({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [details, setDetails] = useState<Record<string, string>>({})
  const readyHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (draft) readyHeading.current?.focus() }, [draft])
  const today = new Date()
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setDetails(Object.fromEntries(data) as Record<string, string>)
    setDraft(`Hello Video 7 Studio,\n\nI'd love to hear more about your ${data.get('event')} photography and films.\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nDate: ${data.get('date') || 'Still deciding'}\nLocation: ${data.get('location') || 'Still deciding'}\n\n${data.get('message')}\n\nLooking forward to hearing from you!`)
  }
  return <Modal label="Tell us about your day" onClose={onClose} className="inquiry-modal">
    <span className="eyebrow">LET'S MAKE SOMETHING BEAUTIFUL</span>
    <h2>Every story starts<br />with a <em>hello.</em></h2>
    {draft ? <div className="inquiry-ready" aria-live="polite">
      <span className="ready-icon"><Check size={24} /></span>
      <h3 ref={readyHeading} tabIndex={-1}>Your note is ready.</h3>
      <p>Choose how you’d like to send it. We can’t wait to hear about your plans.</p>
      <a className="button button-dark" href={`https://wa.me/94777799777?text=${encodeURIComponent(draft)}`} target="_blank" rel="noopener noreferrer">Send on WhatsApp <ArrowUpRight size={17} /></a>
      <a className="button button-outline" href={`mailto:video7info@gmail.com?subject=${encodeURIComponent('An event inquiry for Video 7 Studio')}&body=${encodeURIComponent(draft)}`}>Open email draft <Mail size={16} /></a>
      <button className="text-link" onClick={async () => { try { await navigator.clipboard.writeText(draft); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied to clipboard' : 'Copy your message'}</button>
      <button className="text-link" onClick={() => setDraft('')}>Back to your details</button>
      <small>Your inquiry is sent only when you send it in WhatsApp or your email app.</small>
    </div> : <form className="inquiry-form" onSubmit={submit}>
      <label>Your name<input name="name" placeholder="The name behind the story" autoComplete="name" required maxLength={100} defaultValue={details.name} /></label>
      <label>Email address<input type="email" name="email" placeholder="you@example.com" autoComplete="email" required maxLength={150} defaultValue={details.email} /></label>
      <div className="form-pair"><label>The occasion<select name="event" defaultValue={details.event || 'wedding'}><option value="wedding">Wedding & homecoming</option><option value="pre-wedding">Pre-wedding</option><option value="engagement">Engagement</option><option value="event">Celebration or event</option></select></label><label>Your date<input type="date" name="date" min={minimumDate} defaultValue={details.date} /></label></div>
      <label>Where will it be?<input name="location" placeholder="Venue, city, or somewhere special" maxLength={200} defaultValue={details.location} /></label>
      <label>A little about your plans<textarea name="message" placeholder="Tell us what you’re dreaming of…" rows={3} maxLength={2500} defaultValue={details.message} /></label>
      <button className="button button-dark" type="submit">Prepare your inquiry <ArrowUpRight size={18} /></button>
      <p className="form-note">We’ll prepare a message for you to send by WhatsApp or email.</p>
    </form>}
  </Modal>
}

function App() {
  const reduced = useReducedMotion()
  const finePointer = useSyncExternalStore(
    useCallback((onChange) => { const query = matchMedia('(hover: hover) and (pointer: fine)'); query.addEventListener('change', onChange); return () => query.removeEventListener('change', onChange) }, []),
    () => matchMedia('(hover: hover) and (pointer: fine)').matches,
    () => false,
  )
  const [loading, setLoading] = useState(true)
  const finishLoading = useCallback(() => setLoading(false), [])
  useEffect(() => {
    if (!loading) return
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = overflow }
  }, [loading])
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState<Category>('All stories')
  const [galleryInstant, setGalleryInstant] = useState(false)
  const [galleryView, setGalleryView] = useState<'grid' | 'carousel'>('carousel')
  const filteredStories = useMemo(
    () => stories.filter(story => category === 'All stories' || story.category === category),
    [category]
  )
  const carouselStories = useMemo(
    () => filteredStories.map(story => ({ src: story.image, alt: story.alt, title: story.title, subtitle: story.category })),
    [filteredStories]
  )
  const [activeStory, setActiveStory] = useState<number | null>(null)
  const [activeFilm, setActiveFilm] = useState<number | null>(null)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [filmLoaded, setFilmLoaded] = useState(false)
  useEditorialScroll(loading || menuOpen || inquiryOpen || activeStory !== null || activeFilm !== null)
  const openInquiry = () => { setMenuOpen(false); setInquiryOpen(true) }
  const openFilm = (index: number) => { setFilmLoaded(false); setActiveFilm(index) }

  useEffect(() => {
    const keyboard = () => { document.documentElement.dataset.inputMethod = 'keyboard' }
    const pointer = () => { document.documentElement.dataset.inputMethod = 'pointer' }
    const resize = () => { if (window.innerWidth > 640) setMenuOpen(false) }
    document.addEventListener('keydown', keyboard)
    document.addEventListener('pointerdown', pointer)
    window.addEventListener('resize', resize)
    return () => { document.removeEventListener('keydown', keyboard); document.removeEventListener('pointerdown', pointer); window.removeEventListener('resize', resize) }
  }, [])

  return <>
    {loading && <Preloader onComplete={finishLoading} />}
    <div inert={loading} className="site-content" data-ready={!loading}>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="hero-scroll-frame">
    <section className="hero" id="home" aria-label="Video 7 Studio wedding photography">
      <img className="hero-image" src="/images/hero-wedding.jpg" alt="A bride and groom embracing in a sunlit garden" fetchPriority="high" />
      <div className="hero-shade" />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Video 7 Studio home"><img src={logo} alt="Video 7 Studio" /></a>
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#stories">Our stories</a><a href="#films">Wedding films</a><a href="#about">The studio</a><a href="#reviews">Kind words</a></nav>
        <button className="button button-header" onClick={openInquiry}>Let’s tell your story <ArrowUpRight size={16} /></button>
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger className="menu-button icon-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X /> : <Menu />}</Popover.Trigger>
          <Popover.Portal><Popover.Positioner sideOffset={16} align="end" className="mobile-nav-positioner"><Popover.Popup className="mobile-nav" aria-label="Mobile navigation" finalFocus={() => inquiryOpen ? false : true} data-lenis-prevent>
            <Popover.Title className="sr-only">Explore Video 7 Studio</Popover.Title>
            <nav aria-label="Mobile navigation"><a href="#stories" onClick={() => setMenuOpen(false)}>Our stories</a><a href="#films" onClick={() => setMenuOpen(false)}>Wedding films</a><a href="#about" onClick={() => setMenuOpen(false)}>The studio</a><a href="#reviews" onClick={() => setMenuOpen(false)}>Kind words</a><button onClick={openInquiry}>Tell us about your day <ArrowUpRight size={17} /></button></nav>
          </Popover.Popup></Popover.Positioner></Popover.Portal>
        </Popover.Root>
      </header>
      <div className="hero-content">
        <div className="hero-eyebrow"><span /> WEDDING PHOTOGRAPHY & CINEMATOGRAPHY</div>
        <h1>{loading || reduced || document.documentElement.dataset.inputMethod === 'keyboard' ? <span>For the moments</span> : <BlurText text="For the moments" delay={80} direction="bottom" stepDuration={0.45} easing={[0.23, 1, 0.32, 1]} animationFrom={{ opacity: 0, transform: 'translateY(12px)' }} animationTo={[{ opacity: 0.7, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }]} />}<span className="hero-title-line">that become</span><em className="hero-title-line">forever.</em></h1>
        <div className="hero-description"><p>Wedding photography and films from Colombo.<br />For your day, and everyone sharing it with you.</p><a className="button button-light" href="#stories">Explore our stories <ArrowUpRight size={17} /></a></div>
      </div>
      <div className="hero-bottom"><a className="scroll-cue" href="#intro" aria-label="Scroll to introduction"><span className="scroll-icon"><ArrowDown size={16} /></span><span className="scroll-label">A LITTLE SCROLL, A LOT OF LOVE</span></a><span className="hero-location"><MapPin size={13} /> COLOMBO, SRI LANKA</span><button className="hero-film" onClick={() => openFilm(0)}><span className="mini-play"><Play size={13} fill="currentColor" /></span><span>A story in motion<small>WATCH A WEDDING FILM</small></span><ArrowUpRight size={16} /></button></div>
    </section>
    </div>

    <main id="main">
      <section className="intro section-shell" id="intro">
        <Reveal className="intro-mark"><span className="small-star">✳</span><span className="eyebrow">PHOTOGRAPHS TO<br />COME HOME TO.</span></Reveal>
        <Reveal className="intro-heading" delay={0.04}><h2>Life moves fast.<br />Love deserves to <em>linger.</em></h2><span className="handwritten">That’s where we come in.</span></Reveal>
        <div className="intro-copy"><ScrollReveal enableBlur={false} baseOpacity={0.95} baseRotation={0} wordAnimationEnd="bottom 75%" containerClassName="intro-text-reveal">There’s a lot to take in on your wedding day. Your photographs give you time to come back to it.</ScrollReveal><p>We’re Video 7 Studio, based in Battaramulla, Colombo. We photograph and film weddings, pre-wedding shoots, and events of every kind.</p><a className="text-link" href="#about">A little about us <ArrowUpRight size={16} /></a></div>
      </section>

      <section className="stories-section" id="stories">
        <div className="section-shell">
          <div className="section-heading"><div><span className="eyebrow">01 / THE STORIES WE KEEP</span><ScrollFloat containerClassName="stories-float" animationDuration={1} ease="none" scrollStart="top 90%" scrollEnd="top 60%" stagger={0.025}>{'A little glimpse\nof forever.'}</ScrollFloat></div><p>Wedding days, pre-wedding sessions,<br />and celebrations with the people you love.</p></div>
          <div className="gallery-toolbar"><div className="category-tabs" aria-label="Filter stories">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={event => { setGalleryInstant(event.detail === 0); setCategory(item); }}>{item}{category === item && <span className="tab-dot" />}</button>)}</div><div className="gallery-tools"><span className="gallery-count">{String(category === 'All stories' ? stories.length : filteredStories.length).padStart(2, '0')} STORIES</span><div className="gallery-view-toggle" role="group" aria-label="Gallery view"><button aria-pressed={galleryView === 'grid'} onClick={() => setGalleryView('grid')}>Grid</button><button aria-pressed={galleryView === 'carousel'} onClick={() => setGalleryView('carousel')}>Carousel</button></div></div></div>
        </div>
        {galleryView === 'carousel' ? <div className="stories-carousel-fullwidth"><Suspense fallback={<div className="carousel-loading" role="status">Preparing your photographs…</div>}><StoryCarousel items={carouselStories} fit="portrait" cardHeight={0.50} gap={32} radius={12} tilt={0} onSelect={index => { const target = filteredStories[index]; const originalIndex = stories.findIndex(s => s.title === target?.title); setActiveStory(originalIndex >= 0 ? originalIndex : index); }} /></Suspense></div> : <div className="section-shell"><motion.div layout={!reduced && !galleryInstant} className={`stories-grid ${category !== 'All stories' ? 'filtered-grid' : ''}`}>
          <AnimatePresence mode="popLayout">{filteredStories.map((story, index) => <motion.article className={`story-card story-card-${index}`} key={story.title} layout={!reduced && !galleryInstant} initial={galleryInstant ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: galleryInstant ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}>
            <button className="story-image-button scroll-reveal" data-reveal-delay={index * 0.04} onClick={() => { const originalIndex = stories.findIndex(s => s.title === story.title); setActiveStory(originalIndex >= 0 ? originalIndex : index); }} aria-label={`View ${story.title} gallery`}><TiltedCard imageSrc={story.image} altText={story.alt} containerHeight="100%" containerWidth="100%" imageHeight="100%" imageWidth="100%" rotateAmplitude={reduced || !finePointer ? 0 : 2.3} scaleOnHover={reduced || !finePointer ? 1 : 1.025} showMobileWarning={false} showTooltip={false} /><span className="story-view"><ArrowUpRight size={23} /></span><span className="story-image-tag">{story.category}</span></button>
            <div className="story-meta"><span className="eyebrow">{story.category} <span> / </span> EDITORIAL PREVIEW</span><span>0{index + 1}</span></div><button className="story-title" onClick={() => { const originalIndex = stories.findIndex(s => s.title === story.title); setActiveStory(originalIndex >= 0 ? originalIndex : index); }}>{story.title}<ArrowUpRight size={20} /></button><p>{story.note}</p>
          </motion.article>)}</AnimatePresence>
        </motion.div></div>}
        <div className="section-shell"><div className="gallery-footer"><span>Planning a day of your own?</span><button className="text-link" onClick={openInquiry}>Your story could be next <ArrowUpRight size={17} /></button></div></div>
      </section>

      <section className="films-section" id="films">
        <div className="section-shell"><Reveal className="section-heading"><div><span className="eyebrow">02 / FEEL IT ALL OVER AGAIN</span><h2>Still moments.<br /><em>Moving stories.</em></h2></div><div className="films-intro"><p>Hear the vows again. See the people you love<br />as they were on your wedding day.</p><a className="text-link" href="https://www.youtube.com/@Video7Cinematography" target="_blank" rel="noopener noreferrer">Visit our YouTube <ArrowUpRight size={16} /></a></div></Reveal>
          <ScrollExpand src="/images/film-cover.jpg" alt="An intimate wedding moment, an illustrative preview of our cinematic approach" useWindowScroll startWidth={92} startHeight={92} startRadius={24} endRadius={0} mediaZoom={1.04} overlayScrim={1} className="featured-film-expand"><button className="featured-film-trigger" onClick={() => openFilm(0)} aria-label="Play Chami and Sahan wedding film"><span className="film-topline"><span>VIDEO 7 CINEMATOGRAPHY</span><span>A LOVE STORY, IN MOTION</span></span><span className="film-play"><Play size={27} fill="currentColor" strokeWidth={1} /></span><span className="film-bottomline"><span className="film-name">Chami & Sahan<span>THE WEDDING FILM · ILLUSTRATIVE COVER</span></span><span className="film-watch">PRESS PLAY. FEEL EVERYTHING. <ArrowUpRight size={18} /></span></span></button></ScrollExpand>
          <div className="film-selection">{films.map((film, index) => <button key={film.id} className="film-selection-item" onClick={() => openFilm(index)}><span className="film-number">0{index + 1}</span><div><h3>{film.title}</h3><span>{film.category}</span></div><span className="small-play"><Play size={14} /></span></button>)}<a className="film-channel" href="https://www.youtube.com/@Video7Cinematography/videos" target="_blank" rel="noopener noreferrer">More moments<br /><em>on our channel</em><ArrowUpRight size={25} /></a></div>
        </div>
      </section>

      <div className="memory-ribbon"><CurvedLoop marqueeText="The little moments. The lasting memories. ✳" speed={0.55} curveAmount={0} direction="left" interactive={true} className="memory-ribbon-text" /></div>

      <section className="about-section section-shell" id="about">
        <Reveal className="about-visual"><div className="about-photo"><img src="/images/about-studio.jpg" alt="A bride with her bouquet, captured in soft natural light" loading="lazy" /></div><div className="about-detail"><img src="/images/wedding-detail.jpg" alt="Beautiful wedding flowers and thoughtful details" loading="lazy" /></div><span className="about-photo-note handwritten">The moments you’ll come back to.</span><div className="studio-stamp"><span>VIDEO 7 STUDIO</span><span className="stamp-star">✳</span><span>MADE WITH FEELING</span></div></Reveal>
        <Reveal className="about-copy" delay={0.1}><span className="eyebrow">03 / THE PEOPLE BEHIND THE LENS</span><h2>A little heart.<br />A different <em>perspective.</em></h2><p>We’re a photography and film studio on Main Street in Battaramulla. Weddings are a big part of what we do, and we’re here for your other celebrations too.</p><p>Tell us about the day you’re planning and the photographs you’d like to come home with. We’ll talk through the photography and film options with you.</p><Accordion.Root className="service-accordion" defaultValue={[0]}>{services.map((service, index) => <Accordion.Item className="service" value={index} key={service.name}><Accordion.Header><Accordion.Trigger><span className="service-number">0{index + 1}</span>{service.name}<Plus size={18} className="service-toggle" /></Accordion.Trigger></Accordion.Header><Accordion.Panel className="service-panel"><p>{service.description}</p></Accordion.Panel></Accordion.Item>)}</Accordion.Root><button className="text-link" onClick={openInquiry}>Meet your storytellers <ArrowUpRight size={16} /></button></Reveal>
      </section>

      <GoogleReviews />

      <section className="contact-section" id="contact"><div className="contact-photo"><img src="/images/wedding-detail.jpg" alt="A wedding bouquet with delicate flowers" loading="lazy" /></div><Reveal className="contact-content"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>You bring the love.<br />We’ll keep the <em>memories.</em></h2><p>A wedding, a celebration, or a beautiful new beginning.<br />Tell us what you have in mind.</p><button className="button button-dark" onClick={openInquiry}>Let’s tell your story <ArrowUpRight size={18} /></button><div className="contact-signature" aria-hidden="true"><StrokeText text="with love." strokeColor="#718065" fillColor="#718065" strokeWidth={1} drawDuration={1.5} fillDelay={0.1} stagger={0.04} ease="power2.out" trigger="scroll" fillMode="fade" fontSize={100} fontWeight={400} letterSpacing={-2} style={{ fontFamily: "'Caveat', cursive" }} /></div></Reveal><span className="contact-star">✳</span></section>
    </main>

    <footer className="site-footer"><div className="footer-top section-shell"><div className="footer-brand"><a href="#home" aria-label="Video 7 Studio home"><img src={logo} alt="Video 7 Studio" /></a><p>Wedding photography & films.<br />Battaramulla, Colombo.</p><div className="social-links"><a href="https://www.instagram.com/video7studio/" target="_blank" rel="noopener noreferrer" aria-label="Video 7 Studio on Instagram"><Instagram size={19} /></a><a href="https://www.youtube.com/@Video7Cinematography" target="_blank" rel="noopener noreferrer" aria-label="Video 7 Studio on YouTube"><Youtube size={21} /></a><a className="tiktok-link" href="https://www.tiktok.com/@video7studio" target="_blank" rel="noopener noreferrer" aria-label="Video 7 Studio on TikTok">tk</a><a href="https://www.facebook.com/Video7Studio/" target="_blank" rel="noopener noreferrer" aria-label="Video 7 Studio on Facebook">f</a></div></div><div className="footer-explore"><span className="eyebrow">TAKE A LOOK AROUND</span><a href="#stories">Our stories</a><a href="#films">Wedding films</a><a href="#about">The studio</a><a href="#reviews">Kind words</a></div><div className="footer-contact"><span className="eyebrow">A CONVERSATION AWAY</span><a href="tel:+94777799777">+94 77 779 9777 <ArrowUpRight size={14} /></a><a href="mailto:video7info@gmail.com">video7info@gmail.com <ArrowUpRight size={14} /></a><button onClick={openInquiry}>Let’s plan your day <ArrowUpRight size={14} /></button></div><div className="footer-visit"><span className="eyebrow">COME SAY HELLO</span><a href="https://www.google.com/maps/search/?api=1&query=Video+7+Studio+112%2F1+Main+Street+Battaramulla+Sri+Lanka" target="_blank" rel="noopener noreferrer">112/1, Main Street,<br />Battaramulla, Colombo,<br />Sri Lanka <ArrowUpRight size={14} /></a><span className="footer-available"><i /> Open every day</span></div></div><div className="footer-bottom section-shell"><span>© {new Date().getFullYear()} Video 7 Studio. All rights reserved.</span><span className="placeholder-note">Portfolio photos are illustrative placeholders.</span><a href="#home">BACK TO THE TOP <ArrowUpRight size={14} /></a></div></footer>

    {activeStory !== null && <Modal label={`${stories[activeStory].title} photography preview`} onClose={() => setActiveStory(null)} className="gallery-modal"><div className="lightbox-image"><img src={stories[activeStory].image} alt={stories[activeStory].alt} /></div><div className="lightbox-caption"><div><span className="eyebrow">ILLUSTRATIVE PORTFOLIO PREVIEW</span><h3>{stories[activeStory].title}</h3></div><div className="lightbox-controls"><button className="icon-button" aria-label="Previous photograph" onClick={() => setActiveStory((activeStory + stories.length - 1) % stories.length)}><ArrowLeft size={20} /></button><span>0{activeStory + 1} / 0{stories.length}</span><button className="icon-button" aria-label="Next photograph" onClick={() => setActiveStory((activeStory + 1) % stories.length)}><ArrowRight size={20} /></button></div></div></Modal>}
    {activeFilm !== null && <Modal label={`${films[activeFilm].title} wedding film`} onClose={() => setActiveFilm(null)} className="film-modal"><div className="video-container">{!filmLoaded && <span className="video-loading">Loading your film…</span>}<iframe src={`https://www.youtube-nocookie.com/embed/${films[activeFilm].id}?autoplay=1&rel=0`} title={`${films[activeFilm].title} — Video 7 Studio`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setFilmLoaded(true)} /></div><div className="video-caption"><div><span className="eyebrow">VIDEO 7 CINEMATOGRAPHY</span><h3>{films[activeFilm].title}</h3></div><a className="text-link" href={films[activeFilm].source} target="_blank" rel="noopener noreferrer">Watch on YouTube <ArrowUpRight size={16} /></a></div></Modal>}
    {inquiryOpen && <Inquiry onClose={() => setInquiryOpen(false)} />}
    </div>
  </>
}

export default App

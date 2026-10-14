import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger, CustomEase)

const entranceEase = CustomEase.create('editorial-entrance', '0.23,1,0.32,1')
const imageEase = CustomEase.create('editorial-image', '0.77,0,0.175,1')
const navigationKeys = new Set(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

type Entrance = { element: HTMLElement; tween: gsap.core.Tween }

/** Editorial entrances, reversible hero motion, and pointer-only smooth scrolling. */
export function useEditorialScroll(scrollLocked: boolean): void {
  const lenisRef = useRef<Lenis | null>(null)
  const lockedRef = useRef(scrollLocked)
  const onFirstUnlockRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    lockedRef.current = scrollLocked
    if (scrollLocked) lenisRef.current?.stop()
    else {
      onFirstUnlockRef.current?.()
      lenisRef.current?.start()
    }
  }, [scrollLocked])

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktopPointer = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)')
    const mobileViewport = window.matchMedia('(max-width: 640px)')
    const revealed = new WeakSet<HTMLElement>()
    const temporaryFocusTargets = new Set<HTMLElement>()
    let entrances: Entrance[] = []
    let context: gsap.Context | null = null
    let photoContext: gsap.Context | null = null
    let photoTweens: gsap.core.Tween[] = []
    let heroContext: gsap.Context | null = null
    let heroTimeline: gsap.core.Timeline | null = null
    let motionReady = !lockedRef.current
    let pointerType = 'mouse'
    let keyboardNavigation = false
    let refreshFrame = 0
    let anchorFrame = 0
    let disposed = false

    const tick = () => {
      // A wall-clock timestamp keeps Lenis independent of global GSAP lag settings.
      lenisRef.current?.raf(performance.now())
    }

    const finishEntrance = ({ element, tween }: Entrance) => {
      revealed.add(element)
      tween.progress(1)
      tween.scrollTrigger?.kill()
    }

    const snapScrubToScroll = (trigger: ScrollTrigger) => {
      trigger.getTween()?.progress(1)
      trigger.animation?.progress(trigger.progress)
    }

    const setupHeroMotion = () => {
      heroContext?.revert()
      heroContext = null
      heroTimeline = null
      if (!motionReady || preference.matches || disposed) return

      const frame = root.querySelector<HTMLElement>('.hero-scroll-frame')
      const hero = frame?.querySelector<HTMLElement>('.hero')
      if (!frame || !hero) return

      heroContext = gsap.context(() => {
        const isMobile = mobileViewport.matches
        heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: frame,
            start: 'top top',
            end: isMobile ? 'center top' : 'bottom bottom',
            scrub: isMobile ? 0.1 : 0.15,
            invalidateOnRefresh: true,
            onUpdate: (trigger) => {
              if (keyboardNavigation) snapScrubToScroll(trigger)
            },
          },
        }).fromTo(hero,
          {
            transform: 'scale(1)',
            borderRadius: '0px',
            transformOrigin: isMobile ? 'center top' : 'center center',
          },
          {
            transform: () => `scale(${isMobile ? 0.98 : 0.94})`,
            borderRadius: () => `${isMobile ? 16 : 32}px`,
            duration: 1,
            ease: 'none',
          },
        )
      }, root)
    }

    const setupPhotoMotion = () => {
      photoContext?.revert()
      photoContext = null
      photoTweens = []
      if (!motionReady || preference.matches || !desktopPointer.matches || disposed) return

      photoContext = gsap.context(() => {
        root.querySelectorAll<HTMLElement>('.hero-image, .about-photo img, .featured-film > img').forEach((image) => {
          const hero = image.classList.contains('hero-image')
          const frame = hero
            ? image.closest<HTMLElement>('.hero-scroll-frame') ?? image.closest<HTMLElement>('.hero')
            : image.closest<HTMLElement>('.about-photo, .featured-film')
          if (!frame) return
          // Scale supplies more overscan than the translation consumes at either end.
          const tween = gsap.fromTo(image,
            { transform: hero ? 'translateY(0%) scale(1.04)' : 'translateY(-1.5%) scale(1.06)' },
            {
              transform: hero ? 'translateY(3%) scale(1.08)' : 'translateY(1.5%) scale(1.04)',
              ease: 'none',
              scrollTrigger: {
                trigger: frame,
                start: hero ? 'top top' : 'top bottom',
                end: hero ? 'bottom bottom' : 'bottom top',
                scrub: hero ? 0.15 : 0.8,
                onUpdate: (trigger) => {
                  if (keyboardNavigation) snapScrubToScroll(trigger)
                },
              },
            },
          )
          photoTweens.push(tween)
        })
      }, root)
    }

    const refresh = () => {
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => {
        if (disposed) return
        lenisRef.current?.resize()
        ScrollTrigger.refresh()
      })
    }

    const teardownMotion = () => {
      gsap.ticker.remove(tick)
      const lenis = lenisRef.current
      lenisRef.current = null
      lenis?.off('scroll', ScrollTrigger.update)
      lenis?.destroy()
      // Revert restores the original inline styles, including partially played entrances.
      photoContext?.revert()
      photoContext = null
      photoTweens = []
      heroContext?.revert()
      heroContext = null
      heroTimeline = null
      context?.revert()
      context = null
      entrances = []
    }

    const setupMotion = () => {
      teardownMotion()
      if (!motionReady || preference.matches || disposed) return

      const lenis = new Lenis({
        autoRaf: false,
        anchors: false,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.08,
        prevent: (node) => Boolean(node.closest('dialog, [data-lenis-prevent]')),
      })
      lenisRef.current = lenis
      lenis.on('scroll', ScrollTrigger.update)
      if (lockedRef.current) lenis.stop()
      gsap.ticker.add(tick)

      context = gsap.context(() => {
        const addEntrance = (element: HTMLElement, image: boolean) => {
          if (revealed.has(element)) return
          // History restoration should never conceal content already passed.
          if (element.getBoundingClientRect().bottom <= 0) {
            revealed.add(element)
            return
          }
          const requestedDelay = Number(element.dataset.revealDelay) || 0
          const delay = requestedDelay > 0 ? Math.min(0.08, Math.max(0.03, requestedDelay)) : 0
          const tween = gsap.fromTo(element,
            image ? { clipPath: 'inset(0 0 8% 0)' } : { opacity: 0, transform: 'translateY(16px)' },
            {
              ...(image ? { clipPath: 'inset(0 0 0% 0)' } : { opacity: 1, transform: 'translateY(0px)' }),
              duration: 0.9,
              delay,
              ease: image ? imageEase : entranceEase,
              clearProps: image ? 'clipPath' : 'opacity,transform',
              scrollTrigger: {
                trigger: element,
                start: 'top 92%',
                once: true,
                onEnter: (trigger) => {
                  if (keyboardNavigation) trigger.animation?.progress(1)
                },
              },
              onStart: () => {
                if (keyboardNavigation) tween.progress(1)
              },
              onComplete: () => { revealed.add(element) },
            },
          )
          entrances.push({ element, tween })
        }
        root.querySelectorAll<HTMLElement>('.scroll-reveal').forEach((element) => addEntrance(element, false))
        root.querySelectorAll<HTMLElement>('.about-photo, .featured-film').forEach((element) => addEntrance(element, true))
      }, root)
      setupHeroMotion()
      setupPhotoMotion()
      refresh()
    }

    const onPointer = (event: PointerEvent) => {
      pointerType = event.pointerType
      keyboardNavigation = false
    }

    const onWheel = () => { keyboardNavigation = false }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!navigationKeys.has(event.key)) return
      keyboardNavigation = true
      // Cancel wheel inertia before the browser handles keyboard scrolling or focus.
      const lenis = lenisRef.current
      lenis?.scrollTo(lenis.actualScroll, { immediate: true, force: true })
      entrances.filter(({ tween }) => tween.isActive() || tween.scrollTrigger?.isActive).forEach(finishEntrance)
      if (heroTimeline?.scrollTrigger) snapScrubToScroll(heroTimeline.scrollTrigger)
      photoTweens.forEach((tween) => {
        if (tween.scrollTrigger) snapScrubToScroll(tween.scrollTrigger)
      })
    }

    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const target = event.target
      entrances.filter(({ element }) => element.contains(target)).forEach(finishEntrance)
    }

    const clearTemporaryFocus = (event: FocusEvent) => {
      const target = event.currentTarget as HTMLElement
      target.removeAttribute('tabindex')
      temporaryFocusTargets.delete(target)
    }

    const focusTarget = (target: HTMLElement) => {
      if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
        target.setAttribute('tabindex', '-1')
        temporaryFocusTargets.add(target)
        target.addEventListener('blur', clearTemporaryFocus, { once: true })
      }
      target.focus({ preventScroll: true })
    }

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (!(event.target instanceof Element)) return
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return
      let target: HTMLElement | null
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      } catch {
        return
      }
      if (!target) return
      event.preventDefault()
      const destination = target
      const smooth = event.detail > 0 && pointerType !== 'touch' && !preference.matches
      if (!smooth) keyboardNavigation = event.detail === 0

      cancelAnimationFrame(anchorFrame)
      // React's menu-close update must finish before its anchor starts scrolling.
      anchorFrame = requestAnimationFrame(() => {
        if (disposed || lockedRef.current) return
        if (window.location.hash !== url.hash) window.history.pushState(null, '', url.hash)
        const lenis = lenisRef.current
        if (smooth && lenis) {
          // Lenis reads CSS scroll-padding and the target's scroll-margin itself.
          lenis.scrollTo(destination, {
            duration: 0.9,
            easing: entranceEase,
            onComplete: () => focusTarget(destination),
          })
        } else {
          lenis?.scrollTo(lenis.actualScroll, { immediate: true, force: true })
          destination.scrollIntoView({ behavior: 'instant', block: 'start' })
          focusTarget(destination)
          ScrollTrigger.update()
        }
      })
    }

    const onPreferenceChange = () => {
      if (preference.matches) {
        // Content already visible remains visible if the preference is switched back.
        entrances.forEach(({ element }) => {
          if (element.getBoundingClientRect().top < window.innerHeight) revealed.add(element)
        })
      }
      setupMotion()
      refresh()
    }

    const onDesktopPointerChange = () => {
      setupPhotoMotion()
      refresh()
    }

    const onMobileViewportChange = () => {
      setupHeroMotion()
      refresh()
    }

    onFirstUnlockRef.current = () => {
      if (motionReady || disposed) return
      motionReady = true
      setupMotion()
    }

    setupMotion()
    const observer = new ResizeObserver(refresh)
    observer.observe(root)
    preference.addEventListener('change', onPreferenceChange)
    desktopPointer.addEventListener('change', onDesktopPointerChange)
    mobileViewport.addEventListener('change', onMobileViewportChange)
    document.addEventListener('pointerdown', onPointer, { passive: true })
    document.addEventListener('wheel', onWheel, { passive: true })
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('click', onAnchorClick)
    document.fonts.ready.then(() => { if (!disposed) refresh() })

    return () => {
      disposed = true
      onFirstUnlockRef.current = null
      cancelAnimationFrame(refreshFrame)
      cancelAnimationFrame(anchorFrame)
      observer.disconnect()
      preference.removeEventListener('change', onPreferenceChange)
      desktopPointer.removeEventListener('change', onDesktopPointerChange)
      mobileViewport.removeEventListener('change', onMobileViewportChange)
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('wheel', onWheel)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('click', onAnchorClick)
      temporaryFocusTargets.forEach((target) => {
        target.removeEventListener('blur', clearTemporaryFocus)
        target.removeAttribute('tabindex')
      })
      teardownMotion()
    }
  }, [])
}

// Adapted from the React Bits TS-CSS ScrollReveal registry component.
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollReveal.css'

gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  children: ReactNode
  scrollContainerRef?: RefObject<HTMLElement | null>
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
  rotationEnd?: string
  wordAnimationEnd?: string
}

const navigationKeys = new Set(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

export default function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = false,
  baseOpacity = 0.65,
  baseRotation = 0,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom 75%',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const splitText = useMemo(() => {
    if (typeof children !== 'string') return children
    return children.split(/(\s+)/).map((word, index) => /^\s*$/.test(word)
      ? word
      : <span className="reveal-word" key={index}>{word}</span>)
  }, [children])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof children !== 'string') return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let context: gsap.Context | null = null
    let keyboardSettled = document.documentElement.dataset.inputMethod === 'keyboard'

    const setup = () => {
      context?.revert()
      context = null
      if (preference.matches || keyboardSettled) return
      context = gsap.context(() => {
        const scroller = scrollContainerRef?.current ?? window
        if (baseRotation !== 0) {
          gsap.fromTo(container,
            { transformOrigin: '0% 50%', transform: `rotate(${baseRotation}deg)` },
            {
              transform: 'rotate(0deg)',
              ease: 'none',
              scrollTrigger: { trigger: container, scroller, start: 'top bottom', end: rotationEnd, scrub: 0.5 },
            },
          )
        }

        const words = container.querySelectorAll('.reveal-word')
        const scrollTrigger = {
          trigger: container,
          scroller,
          start: 'top bottom-=20%',
          end: wordAnimationEnd,
          scrub: 0.5,
        }
        gsap.fromTo(words,
          { opacity: Math.max(0.5, Math.min(1, baseOpacity)) },
          { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger },
        )
        if (enableBlur) {
          gsap.fromTo(words,
            { filter: `blur(${blurStrength}px)` },
            { filter: 'blur(0px)', ease: 'none', stagger: 0.05, scrollTrigger: { ...scrollTrigger } },
          )
        }
      }, container)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!navigationKeys.has(event.key)) return
      keyboardSettled = true
      context?.revert()
      context = null
    }

    setup()
    preference.addEventListener('change', setup)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      preference.removeEventListener('change', setup)
      document.removeEventListener('keydown', onKeyDown, true)
      context?.revert()
    }
  }, [children, scrollContainerRef, enableBlur, baseOpacity, baseRotation, blurStrength, rotationEnd, wordAnimationEnd])

  return <div ref={containerRef} className={`scroll-reveal-copy ${containerClassName}`}>
    <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
  </div>
}

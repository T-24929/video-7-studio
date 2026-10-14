// Adapted from the React Bits TS-CSS ScrollFloat registry component.
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollFloat.css'

gsap.registerPlugin(ScrollTrigger)

interface ScrollFloatProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  scrollContainerRef?: RefObject<HTMLElement | null>
  containerClassName?: string
  textClassName?: string
  animationDuration?: number
  ease?: string
  scrollStart?: string
  scrollEnd?: string
  stagger?: number
}

const navigationKeys = new Set(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

export default function ScrollFloat({
  children,
  as: Heading = 'h2',
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'none',
  scrollStart = 'top 90%',
  scrollEnd = 'top 60%',
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLHeadingElement>(null)
  const isText = typeof children === 'string'
  const label = isText ? children.replace(/\s+/g, ' ').trim() : undefined
  const splitText = useMemo(() => {
    if (typeof children !== 'string') return children
    return children.split(/(\r\n|\n|\r|[^\S\r\n]+)/).map((word, index) => {
      if (/^[\r\n]+$/.test(word)) return <br key={index} />
      if (/^\s*$/.test(word)) return word
      return <span className="float-word" key={index}>{Array.from(word).map((character, characterIndex) => <span className="float-char" key={characterIndex}>{character}</span>)}</span>
    })
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
        gsap.fromTo(container.querySelectorAll('.float-char'),
          { opacity: 0.5, transform: 'translateY(12px) scale(1)' },
          {
            opacity: 1,
            transform: 'translateY(0px) scale(1)',
            duration: animationDuration,
            ease,
            stagger,
            scrollTrigger: {
              trigger: container,
              scroller: scrollContainerRef?.current ?? window,
              start: scrollStart,
              end: scrollEnd,
              scrub: 0.5,
            },
          },
        )
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
  }, [children, scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger])

  return <Heading ref={containerRef} className={`scroll-float ${containerClassName}`} aria-label={label}>
    <span className={`scroll-float-text ${textClassName}`} aria-hidden={isText || undefined}>{splitText}</span>
  </Heading>
}

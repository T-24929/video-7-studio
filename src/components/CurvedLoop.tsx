import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import './CurvedLoop.css'

interface CurvedLoopProps {
  marqueeText?: string
  /** SVG pixels per frame at 60 Hz, matching the React Bits speed convention. */
  speed?: number
  /** Applied to both the measured and visible SVG text. */
  className?: string
  curveAmount?: number
  direction?: 'left' | 'right'
  interactive?: boolean
}

function subscribeReducedMotion(callback: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', callback)
  return () => preference.removeEventListener('change', callback)
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function wrapOffset(offset: number, spacing: number) {
  return spacing > 0 ? ((offset % spacing) + spacing) % spacing - spacing : 0
}

// Adapted from the fetched React Bits TS-CSS CurvedLoop component.
// SVG textPath is retained so glyphs follow the curve; frames update its offset
// directly rather than rerendering React. Offscreen and hidden tabs do no work.
export default function CurvedLoop({
  marqueeText = '',
  speed = 0.35,
  className,
  curveAmount = 90,
  direction = 'left',
  interactive = false,
}: CurvedLoopProps) {
  const text = useMemo(() => `${marqueeText.replace(/[\s\u00a0]+$/u, '')}\u00a0`, [marqueeText])
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true)
  const paused = false
  const [geometry, setGeometry] = useState({ width: 1440, height: 160, spacing: 0, glyphTop: -60, glyphHeight: 80 })
  const jacketRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<SVGTextElement>(null)
  const textPathRef = useRef<SVGTextPathElement>(null)
  const offsetRef = useRef(0)
  const directionRef = useRef(direction)
  const dragRef = useRef<{ pointerId: number; lastX: number; delta: number } | null>(null)
  const synchronizeAnimationRef = useRef<() => void>(() => {})
  const uid = useId()
  const pathId = `curve-${uid.replace(/:/g, '')}`
  const visibleTextId = `curved-loop-${uid.replace(/:/g, '')}`
  const ready = geometry.spacing > 0 && marqueeText.trim().length > 0

  useEffect(() => {
    const jacket = jacketRef.current
    const measuredText = measureRef.current
    if (!jacket || !measuredText) return
    let disposed = false
    let measurementFrame = 0

    const measure = () => {
      if (disposed) return
      const bounds = jacket.getBoundingClientRect()
      const glyphs = measuredText.getBBox()
      const spacing = measuredText.getComputedTextLength()
      if (bounds.width <= 0 || bounds.height <= 0 || spacing <= 0) return
      const next = { width: bounds.width, height: bounds.height, spacing, glyphTop: glyphs.y, glyphHeight: glyphs.height }
      setGeometry(previous => Object.keys(next).every(key => Math.abs(next[key as keyof typeof next] - previous[key as keyof typeof previous]) < 0.1) ? previous : next)
    }
    const scheduleMeasurement = () => {
      if (disposed) return
      cancelAnimationFrame(measurementFrame)
      measurementFrame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(scheduleMeasurement)
    observer.observe(jacket)
    observer.observe(measuredText)
    scheduleMeasurement()
    void document.fonts.ready.then(scheduleMeasurement)
    document.fonts.addEventListener('loadingdone', scheduleMeasurement)

    return () => {
      disposed = true
      observer.disconnect()
      cancelAnimationFrame(measurementFrame)
      document.fonts.removeEventListener('loadingdone', scheduleMeasurement)
    }
  }, [text, className])

  useEffect(() => {
    if (!ready) return
    offsetRef.current = wrapOffset(offsetRef.current, geometry.spacing)
    textPathRef.current?.setAttribute('startOffset', String(offsetRef.current))
  }, [geometry.spacing, ready])

  useEffect(() => {
    const jacket = jacketRef.current
    if (!jacket || !ready) return
    let frame = 0
    let lastTime: number | null = null
    let inView = false
    let disposed = false
    const pixelsPerSecond = Number.isFinite(speed) ? Math.abs(speed) * 60 : 0
    directionRef.current = direction

    const canRun = () => !disposed && inView && !document.hidden && !paused && !reducedMotion && !dragRef.current && pixelsPerSecond > 0
    const step = (time: number) => {
      frame = 0
      if (!canRun()) { lastTime = null; return }
      if (lastTime !== null) {
        const seconds = Math.min((time - lastTime) / 1000, 0.1)
        const sign = directionRef.current === 'right' ? 1 : -1
        offsetRef.current = wrapOffset(offsetRef.current + sign * pixelsPerSecond * seconds, geometry.spacing)
        textPathRef.current?.setAttribute('startOffset', offsetRef.current.toFixed(3))
      }
      lastTime = time
      frame = requestAnimationFrame(step)
    }
    const synchronize = () => {
      if (!canRun()) {
        cancelAnimationFrame(frame)
        frame = 0
        lastTime = null
      } else if (!frame) {
        lastTime = null
        frame = requestAnimationFrame(step)
      }
    }
    synchronizeAnimationRef.current = synchronize
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      synchronize()
    }, { threshold: 0 })
    observer.observe(jacket)
    document.addEventListener('visibilitychange', synchronize)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', synchronize)
      synchronizeAnimationRef.current = () => {}
    }
  }, [geometry.spacing, ready, speed, paused, reducedMotion, direction])

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!interactive || reducedMotion || !ready || event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, lastX: event.clientX, delta: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.dataset.dragging = 'true'
    synchronizeAnimationRef.current()
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!interactive || reducedMotion || !drag || drag.pointerId !== event.pointerId) return
    drag.delta = event.clientX - drag.lastX
    drag.lastX = event.clientX
    offsetRef.current = wrapOffset(offsetRef.current + drag.delta, geometry.spacing)
    textPathRef.current?.setAttribute('startOffset', String(offsetRef.current))
  }

  function endDrag(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.delta !== 0) directionRef.current = drag.delta > 0 ? 'right' : 'left'
    dragRef.current = null
    delete event.currentTarget.dataset.dragging
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    synchronizeAnimationRef.current()
  }

  // Fit the whole glyph envelope inside a compact divider. Large curves flatten
  // on small screens rather than clipping ascenders or creating a tall section.
  const requestedCurve = Number.isFinite(curveAmount) ? curveAmount : 0
  const maxBend = Math.max(0, geometry.height - geometry.glyphHeight - 28)
  const bend = Math.sign(requestedCurve) * Math.min(Math.abs(requestedCurve) / 2, maxBend)
  const baseline = (geometry.height - geometry.glyphHeight - Math.abs(bend)) / 2 - geometry.glyphTop - Math.min(0, bend)
  const pathD = `M-160,${baseline} Q${geometry.width / 2},${baseline + bend * 2} ${geometry.width + 160},${baseline}`
  const repeats = ready ? Math.ceil((geometry.width + 320 + Math.abs(bend) * 2) / geometry.spacing) + 3 : 1
  const totalText = Array(repeats).fill(text).join('')

  return (
    <div ref={jacketRef} className="curved-loop-jacket" data-interactive={interactive && !reducedMotion ? 'true' : undefined}>
      <span className="curved-loop-accessible-text">{marqueeText.trim()}</span>
      <svg
        id={visibleTextId}
        className="curved-loop-svg"
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        aria-hidden="true"
        focusable="false"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <text ref={measureRef} className={className} xmlSpace="preserve" style={{ visibility: 'hidden', pointerEvents: 'none' }}>{text}</text>
        <defs><path id={pathId} d={pathD} /></defs>
        {ready && <text className={className} xmlSpace="preserve"><textPath ref={textPathRef} href={`#${pathId}`} startOffset="0" xmlSpace="preserve">{totalText}</textPath></text>}
      </svg>
      
    </div>
  )
}

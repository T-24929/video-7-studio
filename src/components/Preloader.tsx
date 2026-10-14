import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.svg'
import './preloader.css'

const maximumDuration = 3000
const milestoneCount = 3

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [completedMilestones, setCompletedMilestones] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const finishRef = useRef<() => void>(() => {})

  useEffect(() => {
    let active = true
    let finished = false
    let exiting = false
    let settledMilestones = 0
    const timers = new Set<number>()
    const releaseImages: (() => void)[] = []
    const startedAt = performance.now()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const exitDuration = reduced ? 150 : 700
    const minimumDuration = reduced ? 0 : 1400

    function schedule(callback: () => void, delay: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        if (active) callback()
      }, delay)
      timers.add(timer)
    }

    function finish() {
      if (!active || finished) return
      finished = true
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
      releaseImages.forEach((release) => release())
      onComplete()
    }

    function beginExit() {
      if (!active || finished || exiting) return
      exiting = true
      setLeaving(true)
      schedule(finish, exitDuration)
    }

    function waitForImage(source: string) {
      return new Promise<void>((resolve) => {
        const image = new Image()
        let settled = false
        function settle() {
          if (settled) return
          settled = true
          image.onload = null
          image.onerror = null
          resolve()
        }
        releaseImages.push(() => {
          image.onload = null
          image.onerror = null
        })
        image.decoding = 'async'
        image.onload = settle
        image.onerror = settle
        image.src = source
        if (image.complete) queueMicrotask(settle)
      })
    }

    finishRef.current = finish

    const milestones = [
      waitForImage(logo),
      waitForImage('/images/hero-wedding.jpg'),
      document.fonts.ready.then(() => undefined, () => undefined),
    ]

    milestones.forEach((milestone) => {
      void milestone.then(() => {
        if (!active || finished) return
        settledMilestones += 1
        setCompletedMilestones(settledMilestones)
      })
    })

    void Promise.all(milestones).then(() => {
      if (!active || finished) return
      schedule(beginExit, Math.max(0, minimumDuration - (performance.now() - startedAt)))
    })

    // The three-second ceiling includes the exit, even if an asset never settles.
    schedule(beginExit, maximumDuration - exitDuration)
    schedule(finish, maximumDuration)

    return () => {
      active = false
      timers.forEach((timer) => window.clearTimeout(timer))
      releaseImages.forEach((release) => release())
    }
  }, [onComplete])

  return (
    <div className={`preloader${leaving ? ' preloader-leaving' : ''}`}>
      <div className="preloader-center">
        <div className="preloader-brand" aria-hidden="true">
          <img src={logo} alt="" width="723" height="252" fetchPriority="high" />
          <p>PHOTOGRAPHY &amp; FILMS</p>
        </div>
        <div className="preloader-status" role="status" aria-label="Loading Video 7 Studio" aria-live="polite" aria-atomic="true">
          <span className="preloader-screen-reader">{completedMilestones} of {milestoneCount} loading checks complete.</span>
          <span className="preloader-track" aria-hidden="true">
            <span className="preloader-progress" style={{ transform: `scaleX(${completedMilestones / milestoneCount})` }} />
          </span>
        </div>
      </div>
      <button className="preloader-skip" type="button" onClick={() => finishRef.current()}>Skip intro</button>
    </div>
  )
}

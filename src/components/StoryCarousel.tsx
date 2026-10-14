import { useCallback, useState, useSyncExternalStore } from 'react'
import FlexCarousel, { type FlexCarouselProps } from './FlexCarousel'

const subscribeToMotion = (notify: () => void) => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', notify)
  return () => preference.removeEventListener('change', notify)
}
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Lazy-load this wrapper; unsupported graphics and reduced motion use native photographs. */
export default function StoryCarousel({ items = [], onSelect, onError, className = '', style, ...props }: FlexCarouselProps) {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => false)
  const [unavailable, setUnavailable] = useState(false)
  const handleError = useCallback((error: Error) => {
    setUnavailable(true)
    onError?.(error)
  }, [onError])
  const fallback = reducedMotion || unavailable

  return <div className={`story-carousel ${fallback ? 'story-carousel--fallback' : ''} ${className}`} style={style}>
    {fallback ? <div className="story-carousel__native" role="region" aria-label="Wedding photography gallery">
      <ul>{items.map((item, index) => <li key={`${item.src}-${index}`}>
        <button type="button" onClick={() => onSelect?.(index, item)} aria-label={`View photograph: ${item.title || item.alt || index + 1}`}>
          <img src={item.src} alt={item.alt || item.title || 'Wedding photograph'} loading="lazy" />
          {(item.title || item.subtitle) && <span className="story-carousel__native-caption">
            {item.title && <strong>{item.title}</strong>}
            {item.subtitle && <span>{item.subtitle}</span>}
          </span>}
        </button>
      </li>)}</ul>
    </div> : <FlexCarousel
      cardHeight={0.50}
      gap={32}
      radius={12}
      {...props}
      items={items}
      onSelect={onSelect}
      onError={handleError}
      intro="none"
      bend={0.08}
      dispersion={0}
      liquid={0}
      squeeze={0}
      followCursor={false}
      captureWheel={false}
      autoplay={false}
      focusOnClick={false}
      controls
    />}
  </div>
}

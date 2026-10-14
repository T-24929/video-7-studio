import { useEffect, useState } from 'react'
import { ArrowUpRight, Heart, Quote, Star } from 'lucide-react'
import { fetchGoogleReviews, studioGoogleMapsUrl } from '../lib/reviews'
import type { GoogleReviewsResponse } from '../lib/reviews'
import './google-reviews.css'
import SectionCurve from './SectionCurve'

const endpoint = import.meta.env.VITE_GOOGLE_REVIEWS_ENDPOINT?.trim()

type ReviewState =
  | { status: 'disconnected' | 'loading' | 'error' }
  | { status: 'loaded'; data: GoogleReviewsResponse }

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className="review-star" key={index} aria-hidden="true">
          <Star size={13} strokeWidth={1.3} />
          <span className="review-star-fill" style={{ width: `${Math.min(1, Math.max(0, rating - index)) * 100}%` }}><Star size={13} strokeWidth={1.3} fill="currentColor" /></span>
        </span>
      ))}
    </span>
  )
}

export default function GoogleReviews() {
  const [state, setState] = useState<ReviewState>({ status: endpoint ? 'loading' : 'disconnected' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!endpoint) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    let active = true

    fetchGoogleReviews(endpoint, controller.signal)
      .then((data) => {
        if (active) setState({ status: 'loaded', data })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt])

  const data = state.status === 'loaded' ? state.data : null
  const mapsUrl = data?.googleMapsUrl ?? studioGoogleMapsUrl

  return (
    <section id="reviews" className="google-reviews-section" aria-labelledby="reviews-heading">
      <SectionCurve edge="top" />
      <div className="google-reviews-heading">
        <span className="reviews-eyebrow">A LITTLE LOVE, IN RETURN</span>
        <h2 id="reviews-heading">From the people<br /><em>we photograph.</em></h2>
        <p>Have we photographed your day? We’d love to hear what you thought.</p>
      </div>

      {data && data.reviews.length > 0 ? (
        <div className="google-reviews-content">
          <div className="google-reviews-summary">
            <span className="google-maps-attribution" translate="no">Google Maps</span>
            {data.rating !== null && <><strong>{data.rating.toFixed(1)}</strong><ReviewStars rating={data.rating} /></>}
            {data.reviewCount !== null && <span>{data.reviewCount.toLocaleString()} reviews</span>}
          </div>
          <div className="google-reviews-grid">
            {data.reviews.map((review) => (
              <article className="google-review-card" key={review.id}>
                <Quote size={26} strokeWidth={1} className="review-quote-icon" aria-hidden="true" />
                <ReviewStars rating={review.rating} />
                {review.text && <blockquote>{review.text}</blockquote>}
                <div className="google-review-author">
                  {review.authorPhotoUrl && <img src={review.authorPhotoUrl} alt="" width="38" height="38" loading="lazy" referrerPolicy="no-referrer" />}
                  <div>
                    {review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noopener noreferrer">{review.authorName}</a> : <strong>{review.authorName}</strong>}
                    {review.relativePublishTime && <span>{review.relativePublishTime}</span>}
                  </div>
                </div>
                {review.reviewUrl && <a className="review-original-link" href={review.reviewUrl} target="_blank" rel="noopener noreferrer">View on Google Maps <ArrowUpRight size={12} aria-hidden="true" /></a>}
              </article>
            ))}
          </div>
          <p className="review-order-note">Reviews from Google Maps, ordered by relevance. No rating filter applied.</p>
          {data.attributions.map((attribution, index) => <p className="review-order-note" key={index}>{attribution.url ? <a href={attribution.url} target="_blank" rel="noopener noreferrer">{attribution.name}</a> : attribution.name}</p>)}
        </div>
      ) : (
        <div className="google-reviews-invitation" aria-live="polite">
          <div className="reviews-heart"><Heart size={25} strokeWidth={1} aria-hidden="true" /></div>
          
          <p className="reviews-invitation-copy">For now, follow the link below to find the studio<br />and read reviews on Google.</p>
          <span className="reviews-status">
            {state.status === 'loading' ? 'Loading Google reviews…' : state.status === 'error' ? 'Reviews are temporarily unavailable.' : data ? 'Find more stories on Google.' : 'Google reviews coming soon'}
          </span>
          {state.status === 'error' && <button className="reviews-retry" onClick={() => { setState({ status: 'loading' }); setAttempt((value) => value + 1) }}>Try again</button>}
        </div>
      )}

      <a className="reviews-google-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
        Read our reviews on Google <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </section>
  )
}

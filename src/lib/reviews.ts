export interface GoogleReview {
  id: string
  authorName: string
  authorUrl?: string
  authorPhotoUrl?: string
  rating: number
  text: string
  relativePublishTime?: string
  publishTime?: string
  reviewUrl: string
}

export interface GoogleReviewsResponse {
  source: 'google'
  placeName: string
  rating: number | null
  reviewCount: number | null
  googleMapsUrl: string
  reviews: GoogleReview[]
  attributions: { name: string; url?: string }[]
}

export const studioGoogleMapsUrl =
  'https://www.google.com/maps/search/?api=1&query=Video7+Studio+112%2F1+Main+Street+Battaramulla+Sri+Lanka'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function rating(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5
    ? value
    : null
}

/** Validate the public backend contract. Never turn missing data into sample reviews. */
export function parseGoogleReviews(value: unknown): GoogleReviewsResponse {
  if (!isRecord(value) || value.source !== 'google' || !Array.isArray(value.reviews)) {
    throw new Error('Invalid Google reviews response')
  }

  const placeName = text(value.placeName)
  const googleMapsUrl = httpsUrl(value.googleMapsUrl)
  if (!placeName || !googleMapsUrl) throw new Error('Missing Google place attribution')

  const reviews = value.reviews.map((review: unknown, index): GoogleReview => {
    if (!isRecord(review)) throw new Error('Invalid Google review')
    const authorName = text(review.authorName)
    const reviewRating = rating(review.rating)
    const reviewUrl = httpsUrl(review.reviewUrl)
    if (!authorName || reviewRating === null || !reviewUrl) throw new Error('Missing review attribution')
    return {
      id: text(review.id) ?? `review-${index}`,
      authorName,
      authorUrl: httpsUrl(review.authorUrl),
      authorPhotoUrl: httpsUrl(review.authorPhotoUrl),
      rating: reviewRating,
      text: typeof review.text === 'string' ? review.text : '',
      relativePublishTime: text(review.relativePublishTime),
      publishTime: text(review.publishTime),
      reviewUrl,
    }
  })

  const attributions = Array.isArray(value.attributions)
    ? value.attributions.flatMap((item: unknown) => {
        if (!isRecord(item)) return []
        const name = text(item.name)
        return name ? [{ name, url: httpsUrl(item.url) }] : []
      })
    : []

  return {
    source: 'google',
    placeName,
    rating: rating(value.rating),
    reviewCount:
      typeof value.reviewCount === 'number' && Number.isInteger(value.reviewCount) && value.reviewCount >= 0
        ? value.reviewCount
        : null,
    googleMapsUrl,
    reviews,
    attributions,
  }
}

export async function fetchGoogleReviews(endpoint: string, signal: AbortSignal): Promise<GoogleReviewsResponse> {
  const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Google reviews are temporarily unavailable')
  return parseGoogleReviews(await response.json())
}

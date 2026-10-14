# Video7 integrations

## Google reviews: prepared frontend, no backend yet

The page does not invent reviews, a Google star rating, review counts, or a Google place ID. The supplied 82% / 260 reviews is a Facebook figure and is not presented as a Google rating. The initial state says “Google reviews coming soon” and links to a Google Maps search using the studio's name and supplied address. Confirm the business listing before switching to its exact Google Maps URL.

To connect the next phase, set `VITE_GOOGLE_REVIEWS_ENDPOINT=/api/reviews` in the hosting environment, then rebuild. This is a public JSON endpoint URL, **not a Google API key**. Keep the Google Places web-service credential and verified studio place ID on the server. Do not add a secret to a `VITE_` variable; Vite exposes those variables in the browser bundle.

The endpoint should call [Google Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details) for the verified Video7 Studio listing, requesting only required fields, for example `displayName,rating,userRatingCount,reviews,googleMapsUri,attributions`. Billing and a Places API project must be configured. Return the contract below (these are schema descriptions, not sample testimonials):

```ts
interface GoogleReviewsResponse {
  source: 'google'
  placeName: string
  rating: number | null
  reviewCount: number | null
  googleMapsUrl: string
  reviews: Array<{
    id: string
    authorName: string
    authorUrl?: string
    authorPhotoUrl?: string
    rating: number
    text: string
    relativePublishTime?: string
    publishTime?: string
    reviewUrl: string
  }>
  attributions: Array<{ name: string; url?: string }>
}
```

Map each Google review's `authorAttribution.displayName`, `.uri`, and `.photoUri` to the author fields; `text.text` to `text`; `relativePublishTimeDescription` to `relativePublishTime`; and `googleMapsUri` to `reviewUrl`. Keep returned relevance order and do not filter by rating. Map top-level `userRatingCount` to `reviewCount` and any third-party `attributions` to `name` / `url`. Preserve complete review text and author attribution. Do not promise a complete or latest-first review feed: Places returns a limited selection.

The frontend validates the payload, accepts only HTTPS attribution links, renders user text through React, times out after 12 seconds, and provides loading, unavailable, empty, and retry states. It stores no reviews locally. Configure same-origin delivery or narrowly scoped CORS for the public endpoint. Set backend rate limits and handle provider errors without exposing credentials.

Before launching the connection, review Google's current [Places policies and attribution requirements](https://developers.google.com/maps/documentation/places/web-service/policies), including permitted storage, public terms/privacy pages, author attribution, Google Maps attribution, and review ordering disclosure. The compact source byline uses Google Maps text attribution. The design keeps an author image, name, profile URL, date description, and original review link when supplied.

## YouTube films

`src/data/films.ts` contains genuine Video7 Studio uploads. YouTube oEmbed returned the author `Video7 Studio` and exact author URL `https://www.youtube.com/@Video7Cinematography` for both on 14 October 2026:

- [Chami & Sahan Wedding Trailer](https://www.youtube.com/watch?v=jRa2TubVWxE) — ID `jRa2TubVWxE`.
- [Dilki & Randika Pre Wedding shoot](https://www.youtube.com/watch?v=zIYkXyZzsI8) — ID `zIYkXyZzsI8`.

Ownership was also cross-checked against the channel linked from the [existing studio website](https://sites.google.com/view/video7studio/home). The shortened display titles are editorial labels for these actual films. Thumbnails are the corresponding YouTube thumbnails.

The film player can use a click-to-load `https://www.youtube-nocookie.com/embed/VIDEO_ID` iframe. Keep a descriptive iframe title, player controls, fullscreen support, and a link to watch on YouTube if playback is restricted by the uploader or browser. Embedding existing public uploads does not require a YouTube Data API key. Future automated channel updates can be added separately.

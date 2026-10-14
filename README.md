# Video 7 Studio

An editorial wedding photography and cinematography portfolio built with React, TypeScript, and Vite. Warm ivory and olive styling, locally bundled photography, subtle motion, and responsive layouts.

## Run locally

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the static site in `dist/`. `npm run preview` previews that build.

## Included

- The supplied Video 7 Studio logo and business contact details.
- React Bits BlurText, TiltedCard, StrokeText, CurvedLoop, ScrollFloat, ScrollReveal, FlexCarousel, and ScrollExpand, fetched from the live registry and adapted to the portfolio. The optional carousel loads on demand, the curved divider includes a pause control, and text effects preserve readable content and respect reduced motion. See [component notes](docs/REACT_BITS.md).
- Filterable photo stories and accessible Base UI dialogs, mobile popovers, and accordion panels.
- Two verified films from the studio's own YouTube channel, loaded in privacy-enhanced embeds only after a visitor clicks play.
- Lenis smooth wheel/anchor scrolling synchronized with GSAP ScrollTrigger. Touch stays native; keyboard navigation stays instant.
- Slower 900ms editorial entrances, staggered gallery reveals, and subtle desktop photo motion tied to scroll, with live reduced-motion support.
- A reversible hero scale-down with corners that round as you scroll, keeping the photograph fully opaque. Mobile motion is gentler, with a portrait crop that keeps the headline clear of the couple's faces.
- A logo-led, skippable preloader driven by hero/logo/font readiness, with a 1.4-second introduction and 700ms exit. It runs on each full load and is capped at 3 seconds.
- Thin scrollbars, 44px mobile controls, expandable services, and contact links.
- An inquiry form that prepares a message for WhatsApp or email. It does not send, store, or claim to submit an inquiry itself.
- A Google reviews component with disconnected, loading, error/retry, empty, and live states. No fabricated testimonials or ratings.

## Next phase

Google reviews are intentionally disconnected until the backend is available. Set the public `VITE_GOOGLE_REVIEWS_ENDPOINT` environment variable once the endpoint exists. Keep the Google API key on the server. See [integration details](docs/INTEGRATIONS.md) for the payload, provider requirements, and verified film links.

Replace the illustrative photo assets in `public/images/` with studio work. [Image credits](docs/IMAGE_CREDITS.md) document the stock sources. Story copy and images are currently editorial placeholders.

Gotham is the preferred sans-serif and is used when locally available. Licensed Gotham webfont files were not supplied, so the site bundles Montserrat as a reliable fallback. Cormorant Garamond supplies editorial headings, and Caveat adds restrained handwritten accents. Add licensed Gotham WOFF2 files and update the font-face declarations in `src/index.css` for consistent Gotham across devices. The logo keeps its original vector artwork, with a sans-serif fallback for its live text.

## Project map

- `src/App.tsx`: page sections, gallery, film modal, and inquiry handoff.
- `src/index.css`: responsive theme and motion preferences.
- `src/data/films.ts`: verified studio films.
- `src/hooks/useEditorialScroll.ts`: Lenis/GSAP lifecycle, anchors, and preference handling.
- `src/components/Preloader.tsx`: bounded loading introduction.
- `src/components/GoogleReviews.tsx`: reviews UI.
- `src/lib/reviews.ts`: public response validation and fetch adapter.

This phase uses no backend, database, analytics, or secret keys.
# video-7-studio

# React Bits components

Source was fetched from the public React Bits registry using the installed skill's `rb-add.mjs` CLI. The additional components use the TypeScript + CSS variants, matching this project's TypeScript setup. GSAP was already installed; OGL was added for the optional FlexCarousel view, which is loaded only when selected.

| Component | Source | Placement |
| --- | --- | --- |
| StrokeText | [Registry source](https://reactbits.dev/r/StrokeText-TS-CSS.json) | Handwritten contact signature |
| CurvedLoop | [Registry source](https://reactbits.dev/r/CurvedLoop-TS-CSS.json) | Divider between films and the studio |
| ScrollFloat | [Registry source](https://reactbits.dev/r/ScrollFloat-TS-CSS.json) | Selected-stories heading |
| ScrollReveal | [Registry source](https://reactbits.dev/r/ScrollReveal-TS-CSS.json) | Introductory paragraph |
| FlexCarousel | [Registry source](https://reactbits.dev/r/FlexCarousel-TS-CSS.json) | Optional carousel view in selected stories |
| ScrollExpand | [Registry source](https://reactbits.dev/r/ScrollExpand-TS-CSS.json) | Featured wedding film cover |

The supplied ScrollReveal attachments were identical; the page uses one component implementation. The example copy and purple colors were replaced with studio copy and the portfolio's olive palette.

Local adaptations include instance-scoped animation cleanup, keyboard completion, live reduced-motion handling, accessible text, responsive SVG sizing, and gentler movement. The curved loop exposes a pause control and does not schedule React updates on every frame. Its repeated decorative text is announced once. Global ScrollTrigger instances are never removed by an individual component.

BlurText and TiltedCard remain in the hero and portfolio gallery. The hero's scroll animation still keeps full opacity while scaling down and rounding its corners.

FlexCarousel uses a small bend with no liquid distortion, autoplay, or vertical wheel capture. Previous, next, and open controls complement dragging. Reduced motion and unavailable WebGL show native clickable photographs. ScrollExpand follows normal page scrolling without pinning or adding a nested scroll container; controls remain visible and keyboard focus expands the frame immediately.

The reusable SectionCurve is a local decorative SVG, not a React Bits component. Three layers soften the film, review, contact, and footer boundaries. Faint translucent olive ellipses sit behind the curved text; these shapes stay still.

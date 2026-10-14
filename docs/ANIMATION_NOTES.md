# Motion decisions

The portfolio uses motion to introduce photographs and explain changes in the interface. Text being read and individual lightbox photographs stay still.

| Location | Original gap | Purpose | Frequency | Implemented treatment |
| --- | --- | --- | --- | --- |
| Dialogs | Abrupt appearance and dismissal | Preventing a jarring change | Occasional | Base UI keeps focus and dismissal accessible; opacity and scale .96 to 1, 250ms cubic-bezier(.23,1,.32,1), symmetrical exit. |
| Mobile menu | Disconnected from trigger | Spatial consistency | Occasional | Base UI popover, opacity and scale .95 to 1, 200ms, same curve, transform origin supplied by the trigger. |
| Inquiry ready state | Form disappears instantly | State indication | Once per inquiry | 200ms opacity transition; focus moves immediately to the confirmation heading. No claim that an inquiry has been sent. |
| Primary buttons | No press feedback | Feedback | Several interactions per visit | Scale .97 over 160ms. Pointer hover is gated to fine, hover-capable input. |
| Editorial sections | First-time introduction | Explanation | Once per section | GSAP ScrollTrigger opacity + 16px movement, 900ms, with 40–80ms group offsets; photo mask 8% to 0 with cubic-bezier(.77,0,.175,1). No scroll pinning. |
| Large photographs | Continuity while browsing | Spatial consistency | While scrolling on desktop | Hero and studio photograph follow scroll with 0.8-second scrub smoothing. Translation stays within 3%; scale supplies safe overscan. Desktop fine pointers only. |
| Hero exit and return | Transition to the portfolio | Spatial consistency | While scrolling on desktop and mobile | Reversible scale from 1 to .94 desktop / .98 mobile, with corners rounding from 0 to 32px / 16px. Hero is pinned sticky during a 140vh scroll runway, scaling smoothly into an editorial floating card without velocity jumps. Scrub is synchronized at 0.15s with Lenis. Scrolling back smoothly restores full-bleed size. |
| Branded preloader | Asset readiness and studio introduction | State indication / delight | Each full page load | Original logo reveals over 1000ms, followed by caption and actual logo/hero/font milestones. Minimum introduction 1400ms plus a 700ms exit; skippable and capped at 3 seconds. Reduced motion uses a 150ms fade without a minimum. |
| Hero typography | Handoff from the logo introduction | Preventing a jarring change | Each full page load | Starts after the preloader exits: React Bits word entrance and CSS line entrances over 900ms, using opacity and 12px movement. Keyboard and reduced-motion visitors see the final state. |
| Portfolio heading | Introduction to selected stories | Explanation | First approach to the section | React Bits ScrollFloat, adapted to 12px character movement with intact word wrapping and line breaks. No stretching or bouncing. |
| Introductory paragraph | Guide attention to the studio introduction | Explanation | First approach to the section | React Bits ScrollReveal raises word opacity from .95 to 1, preserving contrast for small text. Blur and rotation are disabled. |
| Curved divider | Connect films and the studio section | Delight | While the divider is visible | React Bits CurvedLoop at a slow speed, with Pause/Resume. It stops offscreen, in hidden tabs, and for reduced motion; animation uses refs rather than per-frame React updates. |
| Contact signature | A handwritten sign-off | Delight | Once on entering view | React Bits StrokeText draws “with love.” over 1.5 seconds, followed by the fill. The accent is decorative and uses the site's existing Caveat font. |
| Film frame | Introduce the featured film | Spatial consistency | While approaching the film | React Bits ScrollExpand follows top90% to top35%: 4% insets and 24px rounding settle to the full frame, with scale 1.04 to 1. No opacity change, pinning, or additional scroll track. |
| Optional photo carousel | Browse the selection in another layout | Feedback | On request | Lazy-loaded React Bits FlexCarousel with .08 bend, no liquid effect or autoplay. Vertical page scroll stays native; controls are 44px minimum. Reduced motion and WebGL failure use native photo buttons. |
| Section edges | Connect changes in background tone | Visual continuity | Static | Broad SVG curves with two translucent layers at film, review, contact, and footer boundaries. Subtle olive washes behind the marquee; no additional moving decoration. |

Keyboard navigation is immediate and snaps photo motion to the current scroll position. Reduced motion disables scroll smoothing and moving reveals, restoring the hero to its full size with no rounded clipping, while menus and dialogs retain a short opacity-only transition. Hover motion does not activate on coarse touch input. Lenis shares GSAP's ticker with 0.08 interpolation and 900ms pointer anchor transitions. Scroll entrances start only after the preloader unlocks the page; the hook removes listeners, observers, and animations on cleanup.

Deliberately rejected:

- Extra zoom or sliding between lightbox photographs: visitors are inspecting photographs, so movement competes with the work.
- Animated Google ratings or staggered review text: this is evidence to read, not decoration.
- Moving labels, focus rings, or validation messages in the inquiry form: keyboard and form interactions need immediate feedback.
- Continuous scroll-cue bouncing and large parallax travel: they distract from the photographs and make touch scrolling less predictable.

The longer timing belongs to the studio introduction and photography. Buttons, menus, and dialogs keep their responsive 160–250ms timing. The selected opportunities have been implemented; future changes should preserve this restraint.

Hero layout reserves separate rows for navigation, the headline, and bottom controls. Desktop copy stays within the right column. On mobile, the photograph occupies the upper portion and fades into a dark background behind the text, leaving the couple's faces clear. The hero can grow with its content rather than clipping enlarged text.

References: [Lenis integration](https://github.com/darkroomengineering/lenis), [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), and the installed animate, find-animation-opportunities, mobile-app-ui-design, pick-ui-library, humanizer, and React Bits skills.

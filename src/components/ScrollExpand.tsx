'use client';

import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './ScrollExpand.css';

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const navigationKeys = new Set(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End']);
const smoothstep = (value: number) => {
  const progress = clamp(value, 0, 1);
  return progress * progress * (3 - 2 * progress);
};

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  /** Legacy local-container distance controls; neither adds document height. */
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  /** False uses the nearest existing scroll container, without creating one. */
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

const ScrollExpand = ({
  src = '', mediaType = 'image', poster = '', alt = '', title = '', scrollHint = '',
  startWidth = 92, startHeight = 92, startRadius = 24, endRadius = 0, mediaZoom = 1.04,
  scrollDistance = 1.2, holdDistance = 0.35, smoothing = 0.1, overlayScrim = 0.45,
  useWindowScroll = true, enabled = true, children, className = '', style, ...rest
}: ScrollExpandProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const scrim = scrimRef.current;
    if (!root || !frame || !media) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let container: HTMLElement | null = null;
    if (!useWindowScroll) {
      let ancestor = root.parentElement;
      while (ancestor && ancestor !== document.body) {
        if (/(auto|scroll)/.test(getComputedStyle(ancestor).overflowY)) {
          container = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }
    }
    const scroller = container ?? window;
    const previousClip = frame.style.clipPath;
    const previousTransform = media.style.transform;
    const previousScrim = scrim?.style.opacity ?? '';
    let raf = 0;
    let current = 1;
    let target = 1;
    let lastTime = 0;
    let disposed = false;
    let keyboardNavigation = document.documentElement.dataset.inputMethod === 'keyboard';
    let focusWithin = root.contains(document.activeElement);

    const applyProgress = (progress: number) => {
      const eased = smoothstep(progress);
      const insetX = (100 - clamp(startWidth, 0, 100)) * (1 - eased) / 2;
      const insetY = (100 - clamp(startHeight, 0, 100)) * (1 - eased) / 2;
      const radius = Math.max(0, startRadius + (endRadius - startRadius) * eased);
      frame.style.clipPath = 'inset(' + insetY + '% ' + insetX + '% round ' + radius + 'px)';
      media.style.transform = 'scale(' + (mediaZoom + (1 - mediaZoom) * eased) + ')';
      // Contrast and controls stay present while the image opens around them.
      if (scrim) scrim.style.opacity = String(clamp(overlayScrim, 0, 1));
    };

    const readProgress = () => {
      if (!enabled || preference.matches || keyboardNavigation || focusWithin) return 1;
      const viewportHeight = container?.clientHeight ?? window.innerHeight;
      const viewportTop = container ? container.getBoundingClientRect().top + container.clientTop : 0;
      const top = root.getBoundingClientRect().top - viewportTop;
      const distance = useWindowScroll ? 0.55 : 0.55 * Math.max(0.01, scrollDistance + holdDistance);
      return clamp((viewportHeight * 0.9 - top) / Math.max(1, viewportHeight * distance), 0, 1);
    };

    const cancelFrame = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const snap = () => {
      cancelFrame();
      current = target = readProgress();
      applyProgress(current);
    };
    const tick = (time: number) => {
      if (disposed) return;
      const elapsed = clamp(time - lastTime, 0, 64) / 1000;
      lastTime = time;
      const amount = smoothing <= 0 ? 1 : 1 - Math.exp(-elapsed / smoothing);
      current += (target - current) * amount;
      const settled = Math.abs(target - current) < 0.0004;
      if (settled) current = target;
      applyProgress(current);
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = readProgress();
      if (preference.matches || keyboardNavigation || focusWithin || !enabled || smoothing <= 0) {
        snap();
      } else if (!raf) {
        lastTime = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onPreferenceChange = () => {
      snap();
      if (media instanceof HTMLVideoElement) {
        if (preference.matches) media.pause();
        else void media.play().catch(() => {});
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!navigationKeys.has(event.key)) return;
      keyboardNavigation = true;
      snap();
    };
    const onPointer = () => { keyboardNavigation = false; };
    const onFocus = () => { focusWithin = true; snap(); };
    const onBlur = () => {
      queueMicrotask(() => {
        if (disposed) return;
        focusWithin = root.contains(document.activeElement);
        onScroll();
      });
    };

    onPreferenceChange();
    const observer = new ResizeObserver(snap);
    observer.observe(root);
    if (container) observer.observe(container);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', snap);
    preference.addEventListener('change', onPreferenceChange);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointer, { passive: true });
    document.addEventListener('wheel', onPointer, { passive: true });
    root.addEventListener('focusin', onFocus);
    root.addEventListener('focusout', onBlur);
    void document.fonts.ready.then(() => { if (!disposed) snap(); });

    return () => {
      disposed = true;
      cancelFrame();
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', snap);
      preference.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('wheel', onPointer);
      root.removeEventListener('focusin', onFocus);
      root.removeEventListener('focusout', onBlur);
      frame.style.clipPath = previousClip;
      media.style.transform = previousTransform;
      if (scrim) scrim.style.opacity = previousScrim;
    };
  }, [startWidth, startHeight, startRadius, endRadius, mediaZoom, scrollDistance, holdDistance, smoothing, overlayScrim, useWindowScroll, enabled, mediaType, src]);

  return (
    <div ref={rootRef} className={('se-root ' + className).trim()} style={style} {...rest}>
      <div className="se-track">
        <div className="se-stage">
          <div ref={frameRef} className="se-frame">
            {mediaType === 'video' ? (
              <video ref={(node) => { mediaRef.current = node; }} className="se-media" src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" />
            ) : (
              <img ref={(node) => { mediaRef.current = node; }} className="se-media" src={src} alt={alt} draggable={false} loading="lazy" decoding="async" />
            )}
            <div ref={scrimRef} className="se-scrim" aria-hidden="true" />
          </div>
          {children && <div className="se-overlay">{children}</div>}
          {title && <div className="se-title">{title}</div>}
          {scrollHint && <div className="se-hint">{scrollHint}</div>}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;

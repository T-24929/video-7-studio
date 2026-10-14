'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

import './StrokeText.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('stroke-text-out', '0.23,1,0.32,1');
  CustomEase.create('stroke-text-in-out', '0.77,0,0.175,1');
}

export type StrokeTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop';
export type StrokeTextFillMode = 'wipe' | 'fade' | 'none';

export interface StrokeTextProps {
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTextTrigger;
  fillMode?: StrokeTextFillMode;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  reverse?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface StrokeTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_TEXT = 'Draw Attention';
const navigationKeys = new Set(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End']);

const StrokeText = ({
  text = DEFAULT_TEXT,
  strokeColor = '#A78BFA',
  fillColor = '#F8FAFC',
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = 'stroke-text-out',
  trigger = 'mount',
  fillMode = 'wipe',
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = 0,
  reverse = false,
  className = '',
  style = {}
}: StrokeTextProps) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const wipeRectRef = useRef<SVGRectElement | null>(null);
  const revealedTextRef = useRef<string | null>(null);

  const [measurement, setMeasurement] = useState<{ key: string; box: StrokeTextBox } | null>(null);

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);
  const measurementKey = JSON.stringify([text, fontSize, fontWeight, letterSpacing, strokeWidth, style.fontFamily, className]);
  const box = measurement?.key === measurementKey ? measurement.box : null;

  const dash = Math.max(fontSize * 7, 200);

  const fontStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`
    }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return undefined;

    let cancelled = false;
    let fontsReady = false;

    const measure = () => {
      if (cancelled || !fontsReady || !strokeTextRef.current) return;
      let bbox: DOMRect | undefined;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: Math.max(1, bbox.width) + pad * 2,
        height: Math.max(1, bbox.height) + pad * 2
      };

      setMeasurement(prev =>
        prev?.key === measurementKey &&
        Math.abs(prev.box.x - next.x) < 0.5 &&
        Math.abs(prev.box.width - next.width) < 0.5 &&
        Math.abs(prev.box.y - next.y) < 0.5 &&
        Math.abs(prev.box.height - next.height) < 0.5
          ? prev
          : { key: measurementKey, box: next }
      );
    };

    const fontFamily = getComputedStyle(node).fontFamily;
    // Request the inherited script face before measuring the actual SVG glyphs.
    void document.fonts.load(`${fontWeight} ${fontSize}px ${fontFamily}`, String(text))
      .catch(() => [])
      .then(() => document.fonts.ready)
      .then(() => {
        if (cancelled) return;
        fontsReady = true;
        measure();
      });
    document.fonts.addEventListener('loadingdone', measure);

    return () => {
      cancelled = true;
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [measurementKey, fontSize, fontWeight, strokeWidth, text]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const strokes = Array.from(root.querySelectorAll<SVGTSpanElement>('[data-stroke-char]'));
    const fills = Array.from(root.querySelectorAll<SVGTSpanElement>('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig: number | gsap.StaggerVars = reverse ? { each: stagger, from: 'end' as const } : stagger;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const context = gsap.context(() => {}, root);
    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;
    let removeHover: (() => void) | null = null;

    const stop = () => {
      removeHover?.();
      removeHover = null;
      scrollTrigger?.kill();
      scrollTrigger = null;
      timeline?.kill();
      timeline = null;
    };

    const setStart = () => {
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    const finish = () => {
      stop();
      revealedTextRef.current = measurementKey;
      setEnd();
    };

    const build = () => {
      setStart();
      const tl = gsap.timeline({
        paused: true,
        repeat: trigger === 'loop' ? -1 : 0,
        repeatDelay: trigger === 'loop' ? 0.9 : 0,
        defaults: { overwrite: 'auto' }
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);

      if (useWipe && wipe) {
        tl.to(
          wipe,
          { attr: { width: box.width }, duration: fillDuration, ease: 'stroke-text-in-out' },
          drawDuration + fillDelay
        );
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'stroke-text-out', stagger: staggerConfig },
          drawDuration + fillDelay
        );
      }

      return tl;
    };

    const configure = () => {
      stop();
      const keyboard = document.documentElement.dataset.inputMethod === 'keyboard';
      if (preference.matches || keyboard || (trigger === 'hover' && !finePointer.matches)) {
        finish();
        return;
      }

      if (trigger === 'hover') {
        setEnd();
        const play = (event: PointerEvent) => {
          if (event.pointerType === 'touch' || preference.matches || !finePointer.matches) return;
          context.add(() => {
            timeline?.kill();
            timeline = build();
            timeline.play(0);
          });
        };
        root.addEventListener('pointerenter', play);
        removeHover = () => root.removeEventListener('pointerenter', play);
        return;
      }

      if (revealedTextRef.current === measurementKey || (trigger === 'scroll' && root.getBoundingClientRect().bottom <= 0)) {
        setEnd();
        return;
      }

      timeline = build();
      const play = () => {
        if (preference.matches || document.documentElement.dataset.inputMethod === 'keyboard') {
          context.add(finish);
          return;
        }
        revealedTextRef.current = measurementKey;
        timeline?.play(0);
      };
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({ trigger: root, start: 'top 82%', once: true, onEnter: play });
      } else play();
    };

    const onPreferenceChange = () => { context.add(configure); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (navigationKeys.has(event.key)) context.add(finish);
    };
    context.add(configure);
    preference.addEventListener('change', onPreferenceChange);
    finePointer.addEventListener('change', onPreferenceChange);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      preference.removeEventListener('change', onPreferenceChange);
      finePointer.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('keydown', onKeyDown, true);
      stop();
      context.revert();
    };
  }, [box, dash, drawDuration, fillDelay, stagger, ease, trigger, fillMode, reverse, measurementKey]);

  const fallbackWidth = Math.max(fontSize, characters.length * fontSize * 0.5);
  const svgWidth = box?.width ?? fallbackWidth;
  const svgHeight = box?.height ?? fontSize * 1.3;
  const viewBox = box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} ${fallbackWidth} ${svgHeight}`;

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${trigger === 'hover' ? 'stroke-text--hover' : ''} ${className}`.trim()}
      style={style}
      data-ready={Boolean(box)}
      data-fill-mode={fillMode}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg className="stroke-text__svg" width={svgWidth} height={svgHeight} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {fillMode === 'wipe' && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect ref={wipeRectRef} x={box.x} y={box.y} width="0" height={box.height} />
            </clipPath>
          </defs>
        )}

        <text
          ref={strokeTextRef}
          className="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((char, index) => (
            <tspan data-stroke-char strokeDasharray={dash} strokeDashoffset={dash} key={`s-${index}`}>
              {char}
            </tspan>
          ))}
        </text>

        <text
          className="stroke-text__fill"
          x="0"
          y="0"
          fill={fillColor}
          stroke="none"
          style={fontStyle}
          clipPath={fillMode === 'wipe' && box ? `url(#${wipeId})` : undefined}
        >
          {characters.map((char, index) => (
            <tspan data-fill-char opacity={0} key={`f-${index}`}>
              {char}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
};

export default StrokeText;

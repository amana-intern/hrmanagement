'use client';

import { useEffect, useRef } from 'react';

const LINE_HEIGHT = 40;
const EASE = 0.18;
const SETTLE_THRESHOLD = 0.5;

function isScrollable(el: Element) {
  const style = getComputedStyle(el);
  return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
}

/** Walks up from `start` to `boundary`, returning the nearest scrollable element (or `boundary` itself). */
function findScrollTarget(start: Element, boundary: Element): Element {
  let node: Element = start;
  while (node !== boundary) {
    if (isScrollable(node)) return node;
    if (!node.parentElement) return boundary;
    node = node.parentElement;
  }
  return boundary;
}

function normalizeDeltaY(e: WheelEvent, el: HTMLElement) {
  if (e.deltaMode === 1) return e.deltaY * LINE_HEIGHT;
  if (e.deltaMode === 2) return e.deltaY * el.clientHeight;
  return e.deltaY;
}

/**
 * Native `scroll-behavior: smooth` has a Chromium quirk: once a wheel-driven smooth
 * scroll's target clamps against the max scroll position, the browser cancels the
 * eased animation and snaps the remaining distance in one frame instead of finishing
 * the deceleration — visible as a "blink" right as a scroll reaches either edge.
 *
 * This drives the scroll manually instead: wheel deltas accumulate into a clamped
 * target, and a `requestAnimationFrame` loop eases `scrollTop` toward it every frame,
 * so the deceleration continues smoothly all the way to the boundary.
 *
 * Wheel events over a *nested* scrollable element (a modal, an inner list) are left
 * alone so this container doesn't hijack their scrolling.
 */
export function useSmoothWheelScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // `current` tracks the fractional scroll position ourselves rather than reading
    // `el.scrollTop` back each frame — the DOM rounds that to an integer, so once the
    // remaining distance drops below ~1px the rounded-off step reads back unchanged
    // and the easing stalls short of `target` instead of continuing to converge.
    let target = el.scrollTop;
    let current = el.scrollTop;
    let raf = 0;

    const step = () => {
      const diff = target - current;
      if (Math.abs(diff) < SETTLE_THRESHOLD) {
        current = target;
        el.scrollTop = target;
        raf = 0;
        return;
      }
      current += diff * EASE;
      el.scrollTop = current;
      raf = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (findScrollTarget(e.target as Element, el) !== el) return;

      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;

      e.preventDefault();
      target = Math.min(max, Math.max(0, target + normalizeDeltaY(e, el)));
      if (!raf) raf = requestAnimationFrame(step);
    };

    const onScroll = () => {
      if (!raf) {
        target = el.scrollTop;
        current = el.scrollTop;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

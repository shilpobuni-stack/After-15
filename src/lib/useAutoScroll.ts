import { useEffect, useRef } from 'react';

export function useAutoScroll<T extends HTMLElement>(count: number, delay = 3500) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let paused = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    const pause = () => {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };
    const resume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, 4000);
    };
    const tick = () => {
      if (paused || document.hidden) return;
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[1] as HTMLElement | undefined;
      if (!first || !second) return;
      const step = second.offsetLeft - first.offsetLeft;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollTo({ left: Math.min(max, el.scrollLeft + step), behavior: 'smooth' });
    };
    const timer = setInterval(tick, delay);
    el.addEventListener('pointerdown', pause);
    el.addEventListener('pointerup', resume);
    el.addEventListener('pointercancel', resume);
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    return () => {
      clearInterval(timer);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('pointerup', resume);
      el.removeEventListener('pointercancel', resume);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [count, delay]);
  return ref;
      }

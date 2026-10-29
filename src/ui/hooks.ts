import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Perilaku dialog: fokus masuk ke panel, Escape menutup, Tab berputar di
 * dalam panel, dan fokus dikembalikan saat dialog ditutup.
 */
export function useDialog<T extends HTMLElement>(onClose: (() => void) | null): RefObject<T | null> {
  const panel = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeRef.current) closeRef.current();
      if (e.key === 'Tab' && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return panel;
}

export interface Viewport {
  vw: number;
  vh: number;
  /** Lebar ≥ 1100px: Kabar Dusun jadi panel kiri, Mutation Tree panel kanan. */
  wide: boolean;
  /** Tinggi < 720px: elemen HUD diperkecil. */
  compact: boolean;
}

const read = (): Viewport => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return { vw, vh, wide: vw >= 1100, compact: vh < 720 };
};

export function useViewport(): Viewport {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}

/** true bila pengguna meminta gerakan dikurangi (pengaturan atau sistem). */
export function useReducedMotion(pref: 'system' | 'reduced' | 'full'): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [system, setSystem] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = () => setSystem(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return pref === 'reduced' || (pref === 'system' && system);
}

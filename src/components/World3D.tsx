import { useEffect, useRef, useState } from 'react';
import type { BuildingTapDetail, Kuannoah3DProps, SpecimenKind } from '../three/kuannoah3d';

/* Modul 3D (dan three.js) dimuat lazy sekali saja, terpisah dari bundle utama. */
let worldModule: Promise<unknown> | null = null;
const loadWorld = () => (worldModule ??= import('../three/kuannoah3d.js'));

let webgl: boolean | null = null;
function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    webgl = false;
  }
  return webgl;
}

/** true setelah custom element terdaftar; null bila WebGL tidak tersedia. */
function useWorldModule(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(() => (hasWebGL() ? false : null));
  useEffect(() => {
    if (ready !== false) return;
    let alive = true;
    loadWorld()
      .then(() => alive && setReady(true))
      .catch(() => alive && setReady(null));
    return () => {
      alive = false;
    };
  }, [ready]);
  return ready;
}

/* Elemen menyetel position:relative sendiri bila kosong, jadi posisinya diberikan inline. */
const FILL = { position: 'absolute', inset: 0 } as const;

type WorldProps = Omit<Kuannoah3DProps, 'ref' | 'key' | 'className' | 'style'> & {
  onBuildingTap?: (detail: BuildingTapDetail) => void;
};

/**
 * Dunia 3D Dusun Kuannoah di belakang semua layar. Hanya membaca nilai dari
 * state game; tidak pernah mengubahnya.
 */
export function World3D({ onBuildingTap, ...props }: WorldProps) {
  const ready = useWorldModule();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const tapRef = useRef(onBuildingTap);
  useEffect(() => {
    tapRef.current = onBuildingTap;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onReady = () => setShown(true);
    const onTap = (e: Event) => tapRef.current?.((e as CustomEvent<BuildingTapDetail>).detail);
    el.addEventListener('ready', onReady);
    el.addEventListener('buildingtap', onTap);
    return () => {
      el.removeEventListener('ready', onReady);
      el.removeEventListener('buildingtap', onTap);
    };
  }, [ready]);

  const loading = ready === false || (ready === true && !shown);
  return (
    <div className="world" aria-hidden="true">
      {ready && <kuannoah-3d ref={ref} style={FILL} {...props} />}
      {loading && (
        <div className="world-loading">
          <div className="spinner" />
          <span>MENYIAPKAN DUSUN KUANNOAH</span>
        </div>
      )}
    </div>
  );
}

/** Model spesimen 3D berputar; kotak polos bila WebGL tidak tersedia. */
export function Specimen({ kind, locked }: { kind: SpecimenKind; locked: boolean }) {
  const ready = useWorldModule();
  if (!ready) return <span className="specimen specimen-fallback" aria-hidden="true" />;
  // Spesimen membaca kind/locked hanya saat dibuat, jadi key memaksa elemen baru saat berubah.
  return <specimen-3d key={`${kind}-${locked}`} style={FILL} kind={kind} locked={locked} aria-hidden="true" />;
}

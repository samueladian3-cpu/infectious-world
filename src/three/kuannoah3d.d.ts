/* Deklarasi tipe untuk custom element di kuannoah3d.js (file JS hampir apa adanya dari prototipe v3). */
import type { CSSProperties, Key, Ref } from 'react';

export type World3DMode = 'title' | 'select' | 'guide' | 'game' | 'result' | 'dex';
export type World3DFocus = '' | 'pasar' | 'puskesmas' | 'sekolah' | 'balai' | 'posyandu' | 'warung';
export type SpecimenKind = 'rhinovirus' | 'ecoli' | 'dengue';

export interface BuildingTapDetail {
  index: number;
  kind: string;
  /** Nama fasilitas (huruf kapital) atau null untuk rumah warga. */
  name: string | null;
  state: 'healthy' | 'infected' | 'protected' | 'both';
  x: number;
  y: number;
}

interface BaseProps {
  key?: Key;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export interface Kuannoah3DProps extends BaseProps {
  ref?: Ref<HTMLElement>;
  infection?: number;
  awareness?: number;
  mode?: World3DMode;
  focus?: World3DFocus;
  shield?: string;
  misinfo?: boolean;
  paused?: boolean;
  lens?: boolean;
  reduced?: boolean;
  quality?: 'tinggi' | 'hemat';
  outcome?: '' | 'victory' | 'defeat';
}

export interface Specimen3DProps extends BaseProps {
  kind?: SpecimenKind;
  locked?: boolean;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'kuannoah-3d': Kuannoah3DProps;
      'specimen-3d': Specimen3DProps;
    }
  }
}

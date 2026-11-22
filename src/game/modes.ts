import { CONFIG } from './config.js';
import type { PlayMode } from './types.js';

export interface ModeInfo {
  id: PlayMode;
  label: string;
  short: string;
  description: string;
}

/** Selisih laju kesadaran dibanding Normal. */
const pct = (v: number) => `${Math.round(Math.abs(1 - v / CONFIG.modes.normal.aw) * 100)}%`;

/** Label tingkat kesulitan untuk UI. Angka diambil dari CONFIG agar selalu sesuai mekanik. */
export const MODES: ModeInfo[] = [
  {
    id: 'santai',
    label: 'Santai',
    short: 'Untuk belajar',
    description: `Kesadaran warga naik ${pct(CONFIG.modes.santai.aw)} lebih lambat daripada Normal dan kamu mulai dengan ${CONFIG.modes.santai.startIp} PI.`,
  },
  {
    id: 'normal',
    label: 'Normal',
    short: 'Seimbang',
    description: 'Aturan standar. Kumpulkan gelembung dan jawab kuis untuk menang.',
  },
  {
    id: 'tantangan',
    label: 'Tantangan',
    short: 'Untuk ahli',
    description: `Kesadaran warga naik ${pct(CONFIG.modes.tantangan.aw)} lebih cepat daripada Normal. Butuh strategi yang matang.`,
  },
];

export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<PlayMode, ModeInfo>;

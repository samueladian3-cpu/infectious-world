/**
 * Data khusus tampilan v3 (ikon, teks singkat, kode kartu, langkah panduan).
 * Sengaja dipisah dari src/game agar aturan dan tipe engine tidak berubah.
 */
import type { MutationBranch, ShieldEventId, TickerMessage, HistoryKind } from '../game/types';
import type { World3DFocus } from '../three/kuannoah3d';

/** Path SVG ikon event Behavior Shield (viewBox 48). */
export const EV_ICON: Record<ShieldEventId, string[]> = {
  E1: ['M10 31c0-6 4-10 8-12l6 8', 'M38 31c0-6-4-10-8-12l-6 8', 'M12 31c2 6 7 10 12 10s10-4 12-10', 'M24 5c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z'],
  E2: ['M8 19c0-2 2-3 4-3h24c2 0 4 1 4 3v6c0 7-8 11-16 11S8 32 8 25z', 'M14 23h20M14 28h20', 'M8 20H4M40 20h4', 'M17 9h14'],
  E3: ['M19 30V10a4 4 0 0 1 8 0v20a7 7 0 1 1-8 0z', 'M23 18v14', 'M33 22l6-5 6 5M35 21v7h8v-7'],
  E4: ['M8 7h32v22H8z', 'M24 12v12M18 18h12', 'M16 29l-4 13M32 29l4 13'],
};

/** Teks efek singkat per event untuk banner HUD. */
export const SHIELD_SHORT: Record<ShieldEventId, string> = {
  E1: 'Infeksi −25%',
  E2: 'Infeksi −20%',
  E3: 'Awareness +5, lalu +0,10/dtk',
  E4: 'Awareness +3, lalu +0,08/dtk',
};

/** Fasilitas sumber gelombang 3D per event (informasi; dunia 3D memakai tabel yang sama). */
export const SHIELD_SOURCE: Record<ShieldEventId, World3DFocus> = { E1: 'posyandu', E2: 'puskesmas', E3: 'puskesmas', E4: 'balai' };

export const CARD_CODE = { rhinovirus: 'RV-01', ecoli: 'EC-02', dengue: 'DV-03' } as const;

/** Path ikon garis (viewBox 24). */
export const IC = {
  virus: 'M12 4l6.9 4v8L12 20l-6.9-4V8zM12 4v8M12 12l6.9 4M12 12l-6.9 4',
  people: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a2.6 2.6 0 1 0 0-5.2M3 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15.5 15c3 0 5.5 2 5.5 5',
  trans: 'M3 12h12M11 6l6 6-6 6M20 5v14',
  symptom: 'M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0zM12 9v7',
  persist: 'M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  q: 'M8.5 8.5a3.5 3.5 0 1 1 5 3.2c-.9.4-1.5 1.2-1.5 2.2v.6M12 18.5v.5',
  warn: 'M12 3 22 20H2zM12 9v5M12 17v.5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  hands: 'M7 13V7a1.5 1.5 0 0 1 3 0v5M10 11V5a1.5 1.5 0 0 1 3 0v6M13 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2 7-6 7-3 0-5-2-6-5l-1-3a1.5 1.5 0 0 1 2.7-1.2L7 13',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5zM5 20.5V4.5M9 7.5h6',
  megaphone: 'M3 10v4h3l9 5V5L6 10zM18.5 9.5c1.2 1.4 1.2 3.6 0 5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  gear: 'M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.4M12 17.2v.3',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  home: 'M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  dna: 'M6.5 3c0 5 11 5 11 9s-11 4-11 9M17.5 3c0 5-11 5-11 9s11 4 11 9M8.5 6.5h7M8.5 17.5h7M9.5 12h5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  restart: 'M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 3.5v5h5',
  chevronUp: 'M6 15l6-6 6 6',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M10 17h4v3h-4z',
  send: 'M4 12 20 4l-4 16-4-6-8-2zM12 14l8-10',
  hex: 'M24 8l13.9 8v16L24 40l-13.9-8V16zM24 8v16M24 24l13.9 8M24 24l-13.9 8',
} as const;

export type IcName = keyof typeof IC;

/** Penanda kecil berisi (viewBox 16). */
export const DOT = {
  circle: 'M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z',
  tri: 'M8 1.5 15 14.5H1z',
  shield: 'M8 1l6 2.2v4.3c0 3.6-2.6 6-6 7.4-3.4-1.4-6-3.8-6-7.4V3.2z',
  diamond: 'M8 1l7 7-7 7-7-7z',
  hex: 'M8 1l6 3.5v7L8 15l-6-3.5v-7z',
};

export const TONE_DOT: Record<TickerMessage['tone'], [color: string, path: string]> = {
  info: ['#5A4C3F', DOT.circle],
  good: ['#3E7D4F', DOT.diamond],
  warn: ['#C68A1E', DOT.shield],
  bad: ['#B83A2A', DOT.tri],
};

export const KIND_DOT: Record<HistoryKind, [color: string, path: string]> = {
  shield: ['#C68A1E', DOT.shield],
  purchase: ['#5A4C3F', DOT.hex],
  misinformation: ['#B83A2A', DOT.tri],
  factcheck: ['#3E7D4F', DOT.diamond],
  milestone: ['#B83A2A', DOT.tri],
  outcome: ['#2A1E16', DOT.circle],
};

/** Bentuk penanda peta (viewBox 160×200). */
export const PIN_ROUND = 'M80 16A60 60 0 0 1 126 115L80 178L34 115A60 60 0 0 1 80 16Z';
export const PIN_SHIELD = 'M80 18C104 30 128 30 140 28C142 92 120 130 80 152C40 130 18 92 20 28C32 30 56 30 80 18Z';

export const BRANCH_META: Record<MutationBranch, { color: string; icon: string; risky: boolean }> = {
  transmission: { color: '#B83A2A', icon: IC.trans, risky: false },
  symptom: { color: '#2A5DA8', icon: IC.symptom, risky: true },
  persistence: { color: '#6B4A2E', icon: IC.persist, risky: false },
};

export interface GuideStep {
  title: string;
  focus: World3DFocus;
  inf: number;
  aw: number;
  body: string[];
}

export const GUIDE: GuideStep[] = [
  {
    title: 'Peranmu',
    focus: 'pasar',
    inf: 34,
    aw: 22,
    body: [
      'Kamu memerankan patogen fiktif (Rhinovirus) di komunitas virtual Dusun Kuannoah.',
      'Sudut pandang terbalik ini menunjukkan mengapa pencegahan dan kesadaran komunitas penting. Ini bukan ajakan menyebarkan penyakit di dunia nyata.',
    ],
  },
  {
    title: 'Infection Points (IP)',
    focus: 'warung',
    inf: 20,
    aw: 12,
    body: [
      'Kamu mendapat 1 IP setiap 2 detik simulasi secara otomatis.',
      'IP dipakai untuk membeli mutasi dan aksi khusus. Saldo tidak bisa minus; pembelian yang tidak valid ditolak.',
    ],
  },
  {
    title: 'Mutation Tree',
    focus: 'sekolah',
    inf: 46,
    aw: 30,
    body: [
      'Tiga cabang: Transmisi, Visibilitas Gejala, dan Persistensi Lingkungan. Node tingkat 2 butuh node tingkat 1.',
      'Hati-hati: gejala yang lebih terlihat mempercepat infeksi sedikit, tetapi membuat komunitas sadar jauh lebih cepat.',
    ],
  },
  {
    title: 'Awareness & Behavior Shield',
    focus: 'balai',
    inf: 40,
    aw: 62,
    body: [
      'Setiap 15 detik, warga menjalankan satu perilaku pelindung yang memperlambat infeksi atau menaikkan awareness.',
      'Di dunia nyata, kebiasaan seperti ini membantu mengurangi penyebaran virus pernapasan.',
    ],
  },
  {
    title: 'Misinformation Surge',
    focus: 'puskesmas',
    inf: 52,
    aw: 48,
    body: [
      'Aksi fiktif sekali pakai: kebingungan informasi menurunkan awareness, lalu tenaga kesehatan meluruskannya.',
      'Pesannya: misinformasi berbahaya karena menunda tindakan yang tepat, dan informasi kredibel adalah penangkalnya.',
    ],
  },
];


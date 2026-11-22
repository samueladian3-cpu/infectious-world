/**
 * Data khusus tampilan v3 (ikon, teks singkat, kode kartu, langkah panduan).
 * Sengaja dipisah dari src/game agar aturan dan tipe engine tidak berubah.
 */
import type { EvIconName, HistoryKind, MutationBranch, PathogenId, RegionMod, ShieldEventDef, TickerMessage } from '../game/types';
import type { World3DFocus } from '../three/kuannoah3d';

/** Path SVG ikon aksi warga (viewBox 48). */
export const EV_ICON: Record<EvIconName, string[]> = {
  hands: ['M10 31c0-6 4-10 8-12l6 8', 'M38 31c0-6-4-10-8-12l-6 8', 'M12 31c2 6 7 10 12 10s10-4 12-10', 'M24 5c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z'],
  mask: ['M8 19c0-2 2-3 4-3h24c2 0 4 1 4 3v6c0 7-8 11-16 11S8 32 8 25z', 'M14 23h20M14 28h20', 'M8 20H4M40 20h4', 'M17 9h14'],
  symptom: ['M19 30V10a4 4 0 0 1 8 0v20a7 7 0 1 1-8 0z', 'M23 18v14', 'M33 22l6-5 6 5M35 21v7h8v-7'],
  edu: ['M8 7h32v22H8z', 'M24 12v12M18 18h12', 'M16 29l-4 13M32 29l4 13'],
  water: ['M24 6c6 8 12 14 12 21a12 12 0 0 1-24 0c0-7 6-13 12-21z', 'M18 29a6 6 0 0 0 6 6'],
  ors: ['M14 6h20l-2 6H16z', 'M16 12h16v28a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z', 'M20 24h8M24 20v8'],
  vaccine: ['M30 6l12 12', 'M36 12l-20 20-6-6 20-20', 'M16 32l-8 8', 'M22 18l4 4M18 22l4 4'],
  larva: ['M8 14h32l-3 26H11z', 'M8 14c4-4 28-4 32 0', 'M20 24q2 3 0 6q-2 3 0 6M28 26q2 3 0 6'],
  net: ['M6 40V18l18-12 18 12v22', 'M6 18h36M12 18v22M18 18v22M24 18v22M30 18v22M36 18v22', 'M6 26h36M6 33h36'],
  search: ['M21 8a13 13 0 1 0 0 26 13 13 0 0 0 0-26z', 'M30 30l12 12', 'M16 20q2 3 0 6M22 18q2 3 0 6'],
  window: ['M8 8h32v32H8z', 'M24 8v32M8 24h32', 'M30 14l6-4M30 18l8-2'],
  pill: ['M10 30l20-20a7 7 0 0 1 10 10L20 40a7 7 0 0 1-10-10z', 'M20 20l10 10'],
  test: ['M18 6h12M20 6v26a4 4 0 0 0 8 0V6', 'M20 22h8', 'M34 30l4 4 7-9'],
  shield: ['M24 5l16 6v12c0 10-7 16-16 19-9-3-16-9-16-19V11z', 'M17 24l5 5 9-10'],
};

/** Teks efek singkat aksi warga untuk banner HUD, dihitung dari data. */
export function shieldShort(def: ShieldEventDef): string {
  if (def.infectionReduction) return `Infeksi −${Math.round(def.infectionReduction * 100)}% selama ${def.durationSeconds} dtk`;
  return `Kesadaran +${def.immediateAwareness}, lalu +${String(def.awarenessBonusPerSecond).replace('.', ',')}/dtk`;
}

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
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  volume: 'M4 9.5h4L13 5v14l-5-4.5H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9.5h4L13 5v14l-5-4.5H4zM17 9l5 6M22 9l-5 6',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  medal: 'M8 3h8l-2 6h-4zM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 12.5l1.2 2.3 2.5.4-1.8 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.8 2.5-.4z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  hush: 'M3 12s3.6-7 9-7c2 0 3.7.7 5.1 1.6M21 12s-1.3 2.5-3.8 4.5M9.9 15.4A3 3 0 0 0 14.6 11M3 3l18 18',
  flame: 'M12 21c-3.9 0-7-2.8-7-6.5 0-3.3 2.4-5.4 3.5-8.5.9 1.6 1.9 2.5 3 3 .2-2.6 1.3-5 3.5-6.5.2 3.2 4 5.6 4 10.5 0 4.6-3.1 8-7 8z',
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
  decision: ['#7A55B0', DOT.diamond],
  region: ['#2A8C8C', DOT.hex],
  mission: ['#3E7D4F', DOT.shield],
  flash: ['#7A55B0', DOT.circle],
  ability: ['#B83A2A', DOT.hex],
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
      'Kamu berperan sebagai kuman fiktif di dusun virtual Kuannoah. Pilih satu dari lima penyakit: ISPA, Diare, DBD, TBC, atau HIV.',
      'Sudut pandang terbalik ini memperlihatkan kenapa pencegahan bekerja. Ini bukan ajakan menyebarkan penyakit di dunia nyata.',
    ],
  },
  {
    title: 'Balapan Dua Bar',
    focus: 'warung',
    inf: 20,
    aw: 12,
    body: [
      'Bar merah (Sebaran Infeksi) harus sampai 100% lebih dulu daripada bar biru (Kesadaran Warga).',
      'Kamu dapat 1 Poin Infeksi (PI) setiap 2 detik. Klik gelembung virus yang muncul di peta untuk PI tambahan; gelembung emas bernilai paling besar.',
    ],
  },
  {
    title: 'Pohon Mutasi',
    focus: 'sekolah',
    inf: 46,
    aw: 30,
    body: [
      'Ada tiga cabang: Penularan, Gejala Terlihat, dan Daya Tahan. Mutasi tingkat 2 butuh mutasi tingkat 1.',
      'Hati-hati: gejala yang mudah terlihat membuat warga jauh lebih cepat sadar. Setiap mutasi juga menunjukkan pelajaran dunia nyatanya.',
    ],
  },
  {
    title: 'Aksi Warga & Wilayah',
    focus: 'balai',
    inf: 40,
    aw: 62,
    body: [
      'Setiap 15 detik warga melakukan pencegahan, misalnya cuci tangan atau PSN 3M Plus, yang memperlambatmu atau menaikkan kesadaran.',
      'Pilih wilayah fokus: Pasar, Sekolah, Permukiman, atau Sekitar Puskesmas. Tiap penyakit punya wilayah yang paling cocok, dan wilayah dekat puskesmas paling menantang.',
    ],
  },
  {
    title: 'Momen Penentu',
    focus: 'puskesmas',
    inf: 52,
    aw: 48,
    body: [
      'Sesekali permainan berhenti untuk dilema (pilih strategi dengan untung-ruginya) atau kuis Mitos atau Fakta.',
      'Jawaban kuis yang benar memberi +8 PI, dan makin besar bila benar beruntun. Kartu Fakta Cepat juga muncul tanpa menghentikan waktu: jawab dalam 10 detik.',
    ],
  },
  {
    title: 'Kemampuan & Penasihat',
    focus: 'warung',
    inf: 66,
    aw: 58,
    body: [
      'Dua kemampuan aktif bisa dipakai dengan PI: satu mempercepat infeksi sebentar, satu lagi menghentikan kenaikan kesadaran warga sebentar. Keduanya perlu jeda sebelum dipakai lagi.',
      'Kotak Penasihat menyarankan langkah berikutnya. Pilih tingkat Santai bila ingin belajar dulu, atau Tantangan bila sudah mahir.',
    ],
  },
  {
    title: 'Misi & Hadiah',
    focus: 'posyandu',
    inf: 60,
    aw: 40,
    body: [
      'Tiap penyakit punya 3 misi. Setiap misi yang selesai memberi bintang, dan misi yang selesai di tengah permainan memberi bonus PI.',
      'Kumpulkan XP untuk naik level dan mendapat gelar, buka pencapaian, dan selesaikan satu penyakit untuk membuka penyakit berikutnya.',
    ],
  },
];

/** Pengubah wilayah sebagai teks persen singkat, mis. "Infeksi +25%". */
export function regionChips(m: RegionMod): { label: string; good: boolean }[] {
  const pct = (v: number) => `${v > 1 ? '+' : '−'}${Math.round(Math.abs(v - 1) * 100)}%`;
  const out: { label: string; good: boolean }[] = [];
  if (m.inf !== 1) out.push({ label: `Infeksi ${pct(m.inf)}`, good: m.inf > 1 });
  if (m.aw !== 1) out.push({ label: `Kesadaran ${pct(m.aw)}`, good: m.aw < 1 });
  if (m.shield !== 1) out.push({ label: `Aksi warga ${pct(m.shield)}`, good: m.shield < 1 });
  return out;
}

/** Warna utama per patogen (dipakai juga untuk aksen kartu). */
export const PATHOGEN_COLOR: Record<PathogenId, string> = {
  rhinovirus: '#B83A2A',
  influenza: '#E07B39',
  pneumococcus: '#7A55B0',
  tb: '#C68A1E',
  hiv: '#2A8C8C',
  dengue: '#D9536F',
  ecoli: '#3E7D4F',
  rotavirus: '#E7B23A',
  plasmodium: '#8E3B8A',
  entamoeba: '#3F8FB0',
};

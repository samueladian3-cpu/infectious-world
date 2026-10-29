import type { ShieldEventDef, ShieldEventId } from './types.js';

/** Nilai modifier adalah parameter permainan, bukan estimasi efektivitas klinis. */
export const SHIELD_EVENTS: ShieldEventDef[] = [
  {
    id: 'E1',
    title: 'Cuci Tangan & Etika Batuk',
    description:
      'Warga mencuci tangan dengan sabun dan menutup batuk/bersin dengan tisu atau siku. Kebiasaan ini membantu mengurangi penyebaran virus pernapasan.',
    effectLabel: 'Laju infeksi −25% selama 8 detik',
    durationSeconds: 8,
    infectionReduction: 0.25,
    immediateAwareness: 0,
    awarenessBonusPerSecond: 0,
  },
  {
    id: 'E2',
    title: 'Masker & Udara Lebih Bersih',
    description:
      'Warga yang sakit memakai masker dan ruangan umum dibuka jendelanya agar sirkulasi udara lebih baik.',
    effectLabel: 'Laju infeksi −20% selama 8 detik',
    durationSeconds: 8,
    infectionReduction: 0.2,
    immediateAwareness: 0,
    awarenessBonusPerSecond: 0,
  },
  {
    id: 'E3',
    title: 'Pengenalan Gejala Dini',
    description:
      'Warga mengenali gejala pilek seperti hidung berair, bersin, dan sakit tenggorokan, lalu beristirahat di rumah saat sakit.',
    effectLabel: 'Awareness +5 poin, lalu +0,10 poin/detik selama 8 detik',
    durationSeconds: 8,
    infectionReduction: 0,
    immediateAwareness: 5,
    awarenessBonusPerSecond: 0.1,
  },
  {
    id: 'E4',
    title: 'Edukasi Kesehatan Komunitas',
    description:
      'Kader kesehatan dan puskesmas membagikan informasi pencegahan dari sumber yang kredibel di balai dusun.',
    effectLabel: 'Awareness +3 poin, lalu +0,08 poin/detik selama 8 detik',
    durationSeconds: 8,
    infectionReduction: 0,
    immediateAwareness: 3,
    awarenessBonusPerSecond: 0.08,
  },
];

export const SHIELD_BY_ID: Record<ShieldEventId, ShieldEventDef> = Object.fromEntries(
  SHIELD_EVENTS.map((e) => [e.id, e]),
) as Record<ShieldEventId, ShieldEventDef>;

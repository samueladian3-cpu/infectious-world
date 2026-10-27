import type { GameState } from '../game/types';
import { SOURCES, type Source } from './sources';

export interface Takeaway {
  title: string;
  body: string;
  source: Source;
}

/** Menghasilkan 2–3 pelajaran kesehatan sesuai hasil dan keputusan sesi. */
export function buildDebrief(state: GameState): Takeaway[] {
  const items: Takeaway[] = [];

  if (state.outcome === 'defeat') {
    items.push({
      title: 'Kebiasaan kecil melindungi banyak orang',
      body: 'Komunitas menang karena warga mencuci tangan dengan sabun, menutup batuk dan bersin dengan tisu atau siku, serta membersihkan permukaan yang sering disentuh.',
      source: SOURCES.cdcHygiene,
    });
  } else {
    items.push({
      title: 'Pencegahan tetap penting',
      body: 'Di dunia nyata, kemenangan simulasi ini tidak berarti wabah pasti terjadi. Namun kebersihan tangan dan etika batuk tetap merupakan langkah sederhana untuk mengurangi penyebaran virus pernapasan.',
      source: SOURCES.cdcHygiene,
    });
  }

  if (state.misinformationUsed) {
    items.push({
      title: 'Misinformasi mengganggu, fakta meluruskan',
      body: 'Informasi keliru, misalnya bahwa antibiotik menyembuhkan pilek, dapat menunda tindakan yang tepat. Antibiotik tidak bekerja melawan virus. Selalu periksa informasi kesehatan ke sumber yang kredibel.',
      source: SOURCES.cdcColdTreatment,
    });
  } else if (state.stats.symptomVisibilityLevel > 1) {
    items.push({
      title: 'Mengenali gejala membantu bertindak cepat',
      body: 'Gejala yang mudah dikenali (hidung berair, bersin, sakit tenggorokan) membantu orang lebih cepat beristirahat di rumah saat sakit, sehingga risiko menulari orang lain berkurang.',
      source: SOURCES.cdcRhino,
    });
  } else {
    items.push({
      title: 'Kenali gejala dan tanda bahaya',
      body: 'Kebanyakan pilek sembuh sendiri dengan istirahat dan cukup cairan. Cari pertolongan medis bila ada sesak napas, dehidrasi, demam lebih dari 4 hari, atau gejala yang membaik lalu memburuk.',
      source: SOURCES.cdcColdTreatment,
    });
  }

  items.push({
    title: 'Game bukan prediksi',
    body: 'Rhinovirus adalah penyebab utama common cold. Semua angka dan efek di game ini adalah mekanik fiktif, bukan perkiraan risiko atau efektivitas intervensi sungguhan.',
    source: SOURCES.cdcRhino,
  });

  return items.slice(0, 3);
}

import type { GameState, ScenarioId } from '../game/types';
import { SOURCES, type Source } from './sources';

export interface Takeaway {
  title: string;
  body: string;
  source: Source;
}

type Lesson = Takeaway;

/** Pelajaran per penyakit: saat warga menang, saat patogen menang, tentang hoaks, dan satu pelajaran tambahan. */
const LESSONS: Record<ScenarioId, { defeat: Lesson; victory: Lesson; hoax: Lesson; extra: Lesson }> = {
  ispa: {
    defeat: {
      title: 'Kebiasaan kecil melindungi banyak orang',
      body: 'Warga menang karena mencuci tangan dengan sabun, menutup batuk dan bersin dengan tisu atau siku, dan beristirahat di rumah saat sakit.',
      source: SOURCES.cdcHygiene,
    },
    victory: {
      title: 'Pencegahan tetap penting',
      body: 'Kemenangan simulasi tidak berarti wabah pasti terjadi. Kebersihan tangan dan etika batuk tetap cara sederhana mengurangi penularan virus pernapasan.',
      source: SOURCES.cdcHygiene,
    },
    hoax: {
      title: 'Antibiotik bukan obat pilek',
      body: 'Hoaks seperti "minum antibiotik saja" menunda perawatan yang tepat. Pilek disebabkan virus; antibiotik tidak bekerja melawan virus.',
      source: SOURCES.cdcColdTreatment,
    },
    extra: {
      title: 'Kenali tanda bahaya',
      body: 'Kebanyakan pilek sembuh sendiri dengan istirahat dan cukup cairan. Periksakan bila ada sesak napas, dehidrasi, demam lebih dari 4 hari, atau gejala yang membaik lalu memburuk.',
      source: SOURCES.cdcColdTreatment,
    },
  },
  diare: {
    defeat: {
      title: 'Air aman dan sabun memutus diare',
      body: 'Air minum yang aman, jamban sehat, dan cuci tangan pakai sabun menurunkan risiko diare. Oralit dan zinc menolong anak yang sudah diare.',
      source: SOURCES.whoDiarrhoea,
    },
    victory: {
      title: 'Diare berbahaya bagi balita',
      body: 'Diare adalah penyebab kematian ketiga terbanyak pada anak di bawah 5 tahun, padahal bisa dicegah dan diobati. Waspadai tanda dehidrasi.',
      source: SOURCES.whoDiarrhoea,
    },
    hoax: {
      title: 'Jangan puasakan anak yang diare',
      body: 'Makanan bergizi dan ASI tetap diberikan selama diare. Beri oralit setiap kali anak buang air dan zinc selama 10 hari.',
      source: SOURCES.kemkesDiare,
    },
    extra: {
      title: 'Oralit dan zinc menolong anak diare',
      body: 'Beri oralit setiap kali anak buang air untuk mencegah dehidrasi, dan zinc setiap hari selama 10 hari. Segera ke fasilitas kesehatan bila ada darah pada tinja atau muntah terus.',
      source: SOURCES.kemkesDiare,
    },
  },
  dbd: {
    defeat: {
      title: 'Putus rantai lewat jentik',
      body: 'PSN 3M Plus setiap minggu (menguras, menutup, mendaur ulang, plus larvasida dan kelambu) adalah cara paling efektif mencegah DBD.',
      source: SOURCES.kemkesPsn,
    },
    victory: {
      title: 'Kenali tanda bahaya dengue',
      body: 'Tanda dengue berat sering muncul setelah demam turun: nyeri perut hebat, muntah terus, gusi atau hidung berdarah. Segera ke fasilitas kesehatan.',
      source: SOURCES.whoDengue,
    },
    hoax: {
      title: 'Fogging saja tidak cukup',
      body: 'Asap fogging hanya membunuh nyamuk dewasa. Jentik di wadah air tetap tumbuh bila tidak dikuras dan ditutup.',
      source: SOURCES.kemkesPsn,
    },
    extra: {
      title: 'Nyamuk Aedes menggigit siang hari',
      body: 'Nyamuk penular dengue aktif pada siang hari. Pakai baju yang menutupi tubuh, losion anti nyamuk, dan kelambu, juga saat siang.',
      source: SOURCES.whoDengue,
    },
  },
  tb: {
    defeat: {
      title: 'Temukan, obati sampai sembuh',
      body: 'Batuk lebih dari 2 minggu perlu diperiksakan. TBC bisa disembuhkan bila obat diminum setiap hari sampai tuntas.',
      source: SOURCES.kemkesToss,
    },
    victory: {
      title: 'TBC sering tidak disadari',
      body: 'Gejala TBC bisa ringan selama berbulan-bulan sehingga mudah menular tanpa disadari. Skrining dan ventilasi rumah membantu memutus penularan.',
      source: SOURCES.whoTb,
    },
    hoax: {
      title: 'TBC bukan penyakit keturunan',
      body: 'TBC disebabkan bakteri Mycobacterium tuberculosis yang menyebar lewat udara, dan bisa dicegah serta disembuhkan.',
      source: SOURCES.whoTb,
    },
    extra: {
      title: 'Obat TB diminum sampai tuntas',
      body: 'Obat TB diminum setiap hari selama sekitar 4–6 bulan. Berhenti lebih awal bisa membuat bakteri kebal obat.',
      source: SOURCES.whoTb,
    },
  },
  hiv: {
    defeat: {
      title: 'Tes, obati, dan hapus stigma',
      body: 'Tes HIV, ARV yang diminum rutin, dan perilaku aman menghentikan penularan. ODHIV yang virusnya tak terdeteksi tidak menularkan HIV lewat hubungan seksual.',
      source: SOURCES.whoHiv,
    },
    victory: {
      title: 'HIV menyebar diam-diam tanpa tes',
      body: 'Banyak orang tidak bergejala di awal infeksi. Status HIV hanya bisa diketahui lewat tes, bukan dari penampilan.',
      source: SOURCES.kemkesHiv,
    },
    hoax: {
      title: 'HIV tidak menular lewat kontak sehari-hari',
      body: 'HIV tidak menular lewat pelukan, makan bersama, WC bersama, atau gigitan nyamuk. Menjauhi ODHIV hanya menambah stigma.',
      source: SOURCES.kemkesHiv,
    },
    extra: {
      title: 'Lindungi bayi dari HIV',
      body: 'HIV dapat menular dari ibu ke bayi saat hamil, melahirkan, atau menyusui. Tes HIV saat hamil dan pengobatan ARV melindungi bayi.',
      source: SOURCES.whoHiv,
    },
  },
};

/** Menghasilkan 3 pelajaran kesehatan sesuai penyakit, hasil, dan keputusan sesi. */
export function buildDebrief(state: GameState): Takeaway[] {
  const l = LESSONS[state.scenario];
  const items: Takeaway[] = [state.outcome === 'defeat' ? l.defeat : l.victory];
  items.push(state.misinformationUsed ? l.hoax : l.extra);
  items.push({
    title: 'Game bukan prediksi',
    body: 'Semua angka dan efek di game ini adalah mekanik fiktif, bukan perkiraan risiko atau efektivitas intervensi sungguhan.',
    source: l.defeat.source,
  });
  return items;
}

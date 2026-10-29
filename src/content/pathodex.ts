import { SOURCES, type Source } from './sources';

export interface PathogenEntry {
  id: 'rhinovirus' | 'ecoli' | 'dengue';
  commonName: string;
  scientificName: string;
  organismType: string;
  playable: boolean;
  shortDescription: string;
  significance: string;
  transmission: string;
  symptoms: string[];
  riskContext: string;
  prevention: string[];
  misconceptions: { myth: string; fact: string }[];
  sources: Source[];
  /** Perkiraan ukuran untuk model ilustratif, beserta sumbernya. */
  size: string;
  sizeSource: Source;
}

export const PATHOGENS: PathogenEntry[] = [
  {
    id: 'rhinovirus',
    commonName: 'Rhinovirus',
    scientificName: 'Rhinovirus (genus Enterovirus)',
    organismType: 'Virus',
    playable: true,
    shortDescription: 'Virus penyebab utama common cold (pilek biasa). Satu-satunya skenario yang dapat dimainkan.',
    significance:
      'Rhinovirus adalah penyebab utama common cold dan sering memicu serangan asma. Ada banyak tipe rhinovirus dan virus ini beredar sepanjang tahun.',
    transmission:
      'Rhinovirus adalah virus pernapasan. Kebersihan tangan dan menutup batuk/bersin membantu mengurangi risiko penyebaran virus pernapasan ke orang lain.',
    symptoms: [
      'Hidung berair atau tersumbat',
      'Batuk dan bersin',
      'Sakit tenggorokan',
      'Sakit kepala, nyeri badan ringan, kadang demam',
    ],
    riskContext:
      'Banyak infeksi tanpa gejala atau ringan, dan gejala biasanya membaik dalam 7 hari (bisa sampai 2 minggu). Lebih jarang, infeksi dapat memicu serangan asma, infeksi telinga atau sinus, bronkiolitis, bronkitis, atau pneumonia. Tidak ada vaksin rhinovirus dan tidak ada antivirus khusus; perawatannya suportif (istirahat dan cukup cairan).',
    prevention: [
      'Cuci tangan dengan sabun; jika tidak ada, gunakan hand sanitizer beralkohol minimal 60%',
      'Tutup batuk/bersin dengan tisu lalu buang; jika tidak ada tisu, gunakan siku, bukan tangan',
      'Bersihkan permukaan yang sering disentuh secara rutin',
      'Tetap di rumah dan beristirahat saat sakit',
    ],
    misconceptions: [
      {
        myth: 'Antibiotik menyembuhkan pilek.',
        fact: 'Antibiotik tidak bekerja melawan virus dan tidak membuat penderita pilek merasa lebih baik.',
      },
      {
        myth: 'Pilek pasti menyebabkan batuk darah.',
        fact: 'Batuk darah bukan gejala khas pilek. Gejala yang berat atau mengkhawatirkan perlu diperiksakan ke tenaga kesehatan.',
      },
    ],
    sources: [SOURCES.cdcRhino, SOURCES.cdcHygiene, SOURCES.cdcColdTreatment],
    size: '± 30 nm',
    sizeSource: SOURCES.sizeRhino,
  },
  {
    id: 'ecoli',
    commonName: 'E. coli',
    scientificName: 'Escherichia coli',
    organismType: 'Bakteri',
    playable: false,
    shortDescription: 'Bakteri yang sebagian besar tidak berbahaya; beberapa jenis dapat menyebabkan diare. (Pratinjau, belum dapat dimainkan.)',
    significance:
      'Sebagian besar E. coli adalah bagian dari usus yang sehat. Beberapa jenis dapat menyebabkan diare, infeksi saluran kemih, pneumonia, atau sepsis. Infeksi E. coli penghasil toksin Shiga (STEC) dapat menyebabkan sindrom hemolitik uremik (HUS) yang berbahaya bagi ginjal.',
    transmission:
      'Orang dapat terinfeksi setelah menelan E. coli, misalnya melalui makanan atau air yang terkontaminasi, atau melalui kontak dengan hewan, lingkungan, atau orang lain.',
    symptoms: ['Diare yang bisa berair atau berdarah', 'Kram perut yang bisa berat', 'Kadang muntah atau demam ringan'],
    riskContext:
      'Anak di bawah 5 tahun, lansia 65 tahun ke atas, orang dengan sistem imun lemah, dan pelancong internasional berisiko lebih tinggi. Diare atau muntah lebih dari 2 hari, darah pada tinja atau urin, atau tanda dehidrasi perlu diperiksakan ke tenaga kesehatan.',
    prevention: [
      'Cuci tangan',
      'Terapkan keamanan pangan: bersihkan, pisahkan, masak, dan dinginkan',
      'Gunakan air minum yang aman',
      'Pilih susu dan jus yang dipasteurisasi',
      'Jangan berenang saat diare',
    ],
    misconceptions: [
      { myth: 'Semua E. coli berbahaya.', fact: 'Sebagian besar E. coli tidak berbahaya dan merupakan bagian dari usus yang sehat.' },
    ],
    sources: [SOURCES.cdcEcoli, SOURCES.cdcEcoliSymptoms, SOURCES.cdcEcoliPrevention],
    size: '± 2 µm',
    sizeSource: SOURCES.sizeEcoli,
  },
  {
    id: 'dengue',
    commonName: 'Virus Dengue',
    scientificName: 'Dengue virus (DENV-1 sampai DENV-4)',
    organismType: 'Virus',
    playable: false,
    shortDescription: 'Virus yang menyebar terutama melalui gigitan nyamuk Aedes. (Pratinjau, belum dapat dimainkan.)',
    significance:
      'Dengue disebabkan oleh salah satu dari empat virus dengue yang berkerabat dekat. Seseorang dapat terinfeksi lebih dari sekali seumur hidup.',
    transmission: 'Terutama melalui gigitan nyamuk Aedes yang terinfeksi.',
    symptoms: [
      'Demam (tanda paling umum)',
      'Sakit kepala atau nyeri di belakang mata',
      'Nyeri otot, sendi, atau tulang',
      'Mual atau muntah, ruam',
    ],
    riskContext:
      'Gejala biasanya berlangsung 2–7 hari. Tanda bahaya dengue berat biasanya muncul 24–48 jam setelah demam turun: nyeri perut, muntah 3 kali atau lebih dalam 24 jam, perdarahan hidung atau gusi, muntah darah atau darah pada tinja, sangat lelah atau gelisah. Dengue berat adalah kondisi darurat medis.',
    prevention: [
      'Hindari gigitan nyamuk: gunakan losion anti nyamuk',
      'Kenakan baju lengan panjang dan celana panjang yang longgar',
      'Kurangi nyamuk di dalam dan sekitar rumah',
      'Gunakan kelambu bila ruangan tidak berkasa',
    ],
    misconceptions: [
      {
        myth: 'Dengue menular lewat bersin seperti pilek.',
        fact: 'Dengue menyebar terutama melalui gigitan nyamuk Aedes yang terinfeksi, sehingga pencegahan utamanya adalah menghindari gigitan nyamuk.',
      },
    ],
    sources: [SOURCES.cdcDengue, SOURCES.cdcDengueSymptoms, SOURCES.cdcDenguePrevention],
    size: '± 50 nm',
    sizeSource: SOURCES.sizeDengue,
  },
];

export interface FactCheck {
  id: string;
  claim: string;
  verdict: 'Benar' | 'Salah' | 'Perlu Konteks';
  explanation: string;
  sources: Source[];
}

export const FACT_CHECKS: FactCheck[] = [
  {
    id: 'fc-antibiotik',
    claim: 'Antibiotik dapat menyembuhkan pilek.',
    verdict: 'Salah',
    explanation:
      'Pilek disebabkan virus seperti rhinovirus. Antibiotik tidak bekerja melawan virus. Antibiotik hanya diperlukan bila infeksi virus berlanjut menjadi infeksi bakteri, misalnya pneumonia, dan penggunaan yang tidak perlu dapat menimbulkan efek samping.',
    sources: [SOURCES.cdcColdTreatment],
  },
  {
    id: 'fc-cuci-tangan',
    claim: 'Mencuci tangan dengan sabun membantu mencegah penyakit pernapasan.',
    verdict: 'Benar',
    explanation:
      'Mencuci tangan dengan sabun menghilangkan kuman sehingga tidak berpindah ke hidung, mata, atau mulut. Bila tidak ada sabun dan air, hand sanitizer dengan alkohol minimal 60% dapat digunakan.',
    sources: [SOURCES.cdcHygiene],
  },
  {
    id: 'fc-etika-batuk',
    claim: 'Menutup bersin dengan telapak tangan adalah cara terbaik.',
    verdict: 'Salah',
    explanation:
      'Tutup hidung dan mulut dengan tisu lalu buang tisunya. Bila tidak ada tisu, gunakan siku, bukan tangan, agar kuman tidak menempel di tangan.',
    sources: [SOURCES.cdcHygiene],
  },
  {
    id: 'fc-resistensi',
    claim: 'Rhinovirus bisa bermutasi menjadi "kebal antibiotik".',
    verdict: 'Salah',
    explanation:
      'Antibiotik memang tidak bekerja melawan virus, jadi "resistensi antibiotik" bukan konsep yang tepat untuk rhinovirus. Resistensi antimikroba adalah isu tersendiri yang terkait penggunaan antibiotik pada infeksi bakteri.',
    sources: [SOURCES.cdcColdTreatment],
  },
  {
    id: 'fc-batuk-darah',
    claim: 'Infeksi rhinovirus selalu menyebabkan batuk darah.',
    verdict: 'Salah',
    explanation:
      'Gejala umum rhinovirus adalah hidung berair, hidung tersumbat, batuk, bersin, sakit tenggorokan, sakit kepala, nyeri badan ringan, dan demam. Batuk darah tidak termasuk gejala umum; gejala berat atau mengkhawatirkan harus diperiksakan ke tenaga kesehatan.',
    sources: [SOURCES.cdcRhino, SOURCES.cdcColdTreatment],
  },
  {
    id: 'fc-kapan-dokter',
    claim: 'Pilek tidak pernah perlu diperiksakan ke dokter.',
    verdict: 'Perlu Konteks',
    explanation:
      'Kebanyakan pilek sembuh sendiri. Namun segera cari pertolongan medis bila ada sesak atau napas cepat, dehidrasi, demam lebih dari 4 hari, gejala lebih dari 10 hari tanpa membaik, gejala yang membaik lalu memburuk, atau penyakit kronis yang memburuk.',
    sources: [SOURCES.cdcColdTreatment],
  },
  {
    id: 'fc-game',
    claim: 'Angka di Infectious World memprediksi wabah sungguhan.',
    verdict: 'Salah',
    explanation:
      'Semua angka di game ini (IP, Infection Progress, Awareness, efek event) adalah mekanik permainan fiktif, bukan model epidemiologi atau ukuran efektivitas intervensi di dunia nyata.',
    sources: [],
  },
];

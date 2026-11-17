import { SCENARIOS } from '../game/scenarios';
import type { PathogenId, ScenarioId } from '../game/types';
import { SOURCES, type Source } from './sources';

export type PathogenCategory = 'Virus' | 'Bakteri' | 'Parasit';

export interface PathogenEntry {
  id: PathogenId;
  commonName: string;
  scientificName: string;
  category: PathogenCategory;
  /** Penyakit yang ditimbulkan. */
  disease: string;
  /** Skenario yang memakai patogen ini sebagai lawan utama (bisa dimainkan). */
  scenario: ScenarioId | null;
  shortDescription: string;
  cause: string;
  transmission: string;
  /** Klarifikasi jalur yang BUKAN cara penularan (penting untuk HIV, dengue, malaria). */
  notTransmitted?: string;
  symptoms: string[];
  riskFactors: string[];
  prevention: string[];
  treatment: string;
  misconceptions: { myth: string; fact: string }[];
  sources: Source[];
  /** Perkiraan ukuran untuk model ilustratif, beserta sumbernya (bila ada). */
  size?: string;
  sizeSource?: Source;
}

export const CATEGORY_NOTE: Record<PathogenCategory, string> = {
  Virus: 'Sangat kecil dan hanya bisa berkembang biak di dalam sel makhluk hidup. Antibiotik tidak mempan.',
  Bakteri: 'Makhluk bersel satu. Sebagian besar tidak berbahaya; jenis tertentu menyebabkan penyakit dan bisa diobati antibiotik.',
  Parasit: 'Makhluk yang hidup menumpang pada inangnya. Termasuk protozoa seperti Plasmodium dan Entamoeba.',
};

export const PATHOGENS: PathogenEntry[] = [
  {
    id: 'rhinovirus',
    commonName: 'Rhinovirus',
    scientificName: 'Rhinovirus (genus Enterovirus)',
    category: 'Virus',
    disease: 'Pilek biasa (common cold), bagian dari ISPA',
    scenario: 'ispa',
    shortDescription: 'Virus penyebab utama pilek biasa. Lawan di skenario ISPA.',
    cause: 'Rhinovirus, virus pernapasan yang punya banyak tipe dan beredar sepanjang tahun. Ia juga sering memicu serangan asma.',
    transmission: 'Menyebar lewat percikan saat batuk dan bersin, serta lewat tangan yang menyentuh hidung atau mata setelah memegang benda yang tercemar.',
    symptoms: ['Hidung berair atau tersumbat', 'Batuk dan bersin', 'Sakit tenggorokan', 'Sakit kepala, nyeri badan ringan, kadang demam'],
    riskFactors: ['Anak-anak dan orang dengan asma lebih mudah mengalami gejala berat', 'Ruangan ramai dan kebersihan tangan yang kurang'],
    prevention: [
      'Cuci tangan dengan sabun; bila tidak ada, pakai hand sanitizer beralkohol minimal 60%',
      'Tutup batuk dan bersin dengan tisu lalu buang; bila tidak ada tisu, pakai siku',
      'Bersihkan permukaan yang sering disentuh',
      'Istirahat di rumah saat sakit',
    ],
    treatment:
      'Tidak ada vaksin atau antivirus khusus. Perawatannya istirahat dan cukup cairan; gejala biasanya membaik dalam sekitar 7 hari (bisa sampai 2 minggu). Periksakan bila sesak napas, demam lebih dari 4 hari, atau gejala membaik lalu memburuk.',
    misconceptions: [
      { myth: 'Antibiotik menyembuhkan pilek.', fact: 'Antibiotik tidak bekerja melawan virus dan tidak membuat penderita pilek merasa lebih baik.' },
      { myth: 'Pilek pasti menyebabkan batuk darah.', fact: 'Batuk darah bukan gejala khas pilek. Gejala berat atau mengkhawatirkan perlu diperiksakan ke tenaga kesehatan.' },
    ],
    sources: [SOURCES.cdcRhino, SOURCES.cdcHygiene, SOURCES.cdcColdTreatment],
    size: '± 30 nm',
    sizeSource: SOURCES.sizeRhino,
  },
  {
    id: 'influenza',
    commonName: 'Virus Influenza',
    scientificName: 'Influenza virus (tipe A dan B)',
    category: 'Virus',
    disease: 'Flu musiman, bagian dari ISPA',
    scenario: null,
    shortDescription: 'Penyebab flu musiman. Biasanya lebih berat daripada pilek dan bisa dicegah dengan vaksin.',
    cause: 'Virus influenza. Berbeda dengan rhinovirus penyebab pilek biasa.',
    transmission: 'Menyebar dengan mudah lewat percikan saat batuk atau bersin, juga lewat tangan yang tercemar.',
    symptoms: ['Demam yang muncul tiba-tiba', 'Batuk dan sakit tenggorokan', 'Nyeri badan', 'Lemas dan lelah'],
    riskFactors: ['Ibu hamil', 'Anak di bawah 5 tahun', 'Lansia', 'Orang dengan penyakit kronis atau imun lemah'],
    prevention: ['Vaksinasi influenza setiap tahun', 'Tutup mulut dan hidung saat batuk atau bersin', 'Cuci tangan sesering mungkin', 'Tetap di rumah saat sakit'],
    treatment: 'Kebanyakan orang pulih sendiri dalam seminggu, walau batuk bisa bertahan 2 minggu atau lebih. Kelompok berisiko perlu segera ke tenaga kesehatan.',
    misconceptions: [
      { myth: 'Flu sama saja dengan pilek biasa.', fact: 'Flu disebabkan virus influenza dan sering lebih berat. Pilek biasa umumnya disebabkan rhinovirus.' },
      { myth: 'Vaksin flu cukup sekali seumur hidup.', fact: 'WHO menganjurkan vaksin flu setiap tahun karena perlindungannya menurun seiring waktu.' },
    ],
    sources: [SOURCES.whoInfluenza],
  },
  {
    id: 'pneumococcus',
    commonName: 'Pneumokokus',
    scientificName: 'Streptococcus pneumoniae',
    category: 'Bakteri',
    disease: 'Pneumonia (radang paru), bagian dari ISPA',
    scenario: null,
    shortDescription: 'Bakteri penyebab utama pneumonia pada anak. Ada vaksinnya (PCV).',
    cause: 'Pneumonia bisa disebabkan virus, bakteri, atau jamur. Streptococcus pneumoniae adalah penyebab bakteri yang paling sering pada anak.',
    transmission: 'Bisa menyebar lewat percikan dari batuk atau bersin.',
    symptoms: ['Batuk dan sulit bernapas', 'Napas cepat', 'Tarikan dinding dada bagian bawah ke dalam saat bernapas', 'Demam'],
    riskFactors: ['Balita, terutama yang kurang gizi atau tidak mendapat ASI eksklusif', 'Polusi udara di dalam rumah, misalnya asap dapur dan rokok', 'Rumah yang padat'],
    prevention: ['Imunisasi pneumokokus (PCV), Hib, campak, dan pertusis', 'ASI eksklusif 6 bulan', 'Kurangi asap di dalam rumah', 'Jaga kebersihan, terutama di rumah yang padat'],
    treatment: 'Pneumonia bakteri diobati dengan antibiotik sesuai resep tenaga kesehatan. Kasus berat perlu dirawat di rumah sakit.',
    misconceptions: [{ myth: 'Batuk dengan napas cepat pada balita cukup didiamkan.', fact: 'Napas cepat atau tarikan dinding dada pada anak yang batuk adalah tanda pneumonia dan perlu segera diperiksakan.' }],
    sources: [SOURCES.whoPneumonia],
  },
  {
    id: 'tb',
    commonName: 'Bakteri TB',
    scientificName: 'Mycobacterium tuberculosis',
    category: 'Bakteri',
    disease: 'Tuberkulosis (TBC)',
    scenario: 'tb',
    shortDescription: 'Bakteri penyebab TBC yang menyebar lewat udara. Bisa dicegah dan disembuhkan.',
    cause: 'Bakteri Mycobacterium tuberculosis, paling sering menyerang paru-paru tetapi bisa juga ginjal, otak, tulang belakang, dan kulit.',
    transmission: 'Menyebar lewat udara ketika orang dengan TB paru batuk, bersin, atau meludah.',
    notTransmitted: 'TBC tidak disebabkan guna-guna atau keturunan. Sekitar seperempat penduduk dunia diperkirakan pernah terinfeksi, tetapi hanya 5–10% yang akhirnya sakit TB.',
    symptoms: ['Batuk lebih dari 2 minggu, kadang berdarah', 'Nyeri dada dan sesak', 'Demam dan keringat malam tanpa aktivitas', 'Berat badan turun, lemas'],
    riskFactors: ['HIV atau sistem imun lemah', 'Kurang gizi', 'Diabetes', 'Merokok dan minum alkohol', 'Tinggal serumah dengan pasien TB'],
    prevention: [
      'Imunisasi BCG untuk bayi',
      'Terapi pencegahan TB (TPT) bagi kontak serumah dan kelompok berisiko',
      'Buka jendela agar udara dan sinar matahari masuk',
      'Etika batuk dan masker bagi yang batuk',
      'Temukan dan obati sampai sembuh (TOSS TBC)',
    ],
    treatment: 'Diobati dengan antibiotik yang diminum setiap hari selama sekitar 4–6 bulan. Berhenti lebih awal dapat membuat bakteri kebal obat. Layanan TBC tersedia di puskesmas, klinik, dan rumah sakit.',
    misconceptions: [
      { myth: 'TBC adalah penyakit keturunan atau kutukan.', fact: 'TBC disebabkan bakteri yang menyebar lewat udara dan bisa disembuhkan.' },
      { myth: 'Obat TBC boleh berhenti kalau batuk sudah hilang.', fact: 'Obat harus diminum sampai tuntas agar sembuh dan tidak kebal obat.' },
      { myth: 'Pasien TBC harus dijauhi selamanya.', fact: 'Pasien TBC butuh dukungan untuk berobat sampai tuntas. Stigma justru membuat orang menunda periksa.' },
    ],
    sources: [SOURCES.whoTb, SOURCES.kemkesToss],
  },
  {
    id: 'hiv',
    commonName: 'HIV',
    scientificName: 'Human Immunodeficiency Virus',
    category: 'Virus',
    disease: 'Infeksi HIV; tahap lanjut tanpa pengobatan disebut AIDS',
    scenario: 'hiv',
    shortDescription: 'Virus yang menyerang sistem imun. Tidak menular lewat udara, sentuhan, atau nyamuk.',
    cause: 'HIV adalah virus yang menyerang sel-sel sistem kekebalan tubuh. Tanpa pengobatan, imun melemah dan penyakit lain seperti TB mudah muncul.',
    transmission:
      'Menular lewat cairan tubuh tertentu dari orang dengan HIV: darah, cairan seksual, dan ASI. Jalurnya: hubungan seksual tanpa kondom, berbagi jarum suntik, transfusi darah yang tidak diskrining, dan dari ibu ke bayi saat hamil, melahirkan, atau menyusui.',
    notTransmitted:
      'HIV TIDAK menular lewat udara, batuk, bersin, pelukan, ciuman, jabat tangan, makan sepiring, berbagi alat makan, WC bersama, atau gigitan nyamuk. Berbeda dengan TB atau flu, HIV bukan penyakit yang menyebar lewat udara atau kontak sehari-hari.',
    symptoms: ['Sering tanpa gejala di minggu-minggu awal', 'Sebagian mengalami gejala mirip flu', 'Tanpa pengobatan: berat badan turun, demam, diare, batuk lama', 'Infeksi lain (oportunistik) seperti TB'],
    riskFactors: ['Hubungan seksual tanpa kondom atau berganti pasangan', 'Berbagi jarum suntik atau alat tato/tindik yang tidak steril', 'Ibu hamil dengan HIV yang belum berobat (risiko bagi bayi)', 'Infeksi menular seksual lain yang tidak diobati'],
    prevention: [
      'Tes HIV untuk mengetahui status, termasuk saat pemeriksaan kehamilan',
      'Kondom dan setia pada pasangan',
      'Jarum suntik steril dan sekali pakai',
      'PrEP (obat pencegahan) bagi orang berisiko tinggi',
      'ARV bagi ibu hamil dengan HIV untuk melindungi bayi',
    ],
    treatment:
      'Belum ada obat yang menyembuhkan HIV. Obat antiretroviral (ARV) yang diminum setiap hari menghentikan virus berkembang biak, sehingga ODHIV dapat hidup panjang dan sehat. Bila virus tak terdeteksi berkat ARV, HIV tidak menular lewat hubungan seksual.',
    misconceptions: [
      { myth: 'HIV menular lewat pelukan, jabat tangan, atau makan bersama.', fact: 'HIV tidak menular lewat kontak sehari-hari. Menjauhi ODHIV tidak melindungi siapa pun dan hanya menambah stigma.' },
      { myth: 'HIV menular lewat gigitan nyamuk.', fact: 'Nyamuk tidak menularkan HIV.' },
      { myth: 'Orang dengan HIV pasti terlihat sakit.', fact: 'Status HIV tidak bisa dilihat dari penampilan. Satu-satunya cara mengetahuinya adalah tes HIV.' },
      { myth: 'HIV sudah bisa disembuhkan total.', fact: 'Belum ada obat penyembuh, tetapi ARV membuat HIV menjadi kondisi kronis yang bisa dikendalikan.' },
    ],
    sources: [SOURCES.whoHiv, SOURCES.kemkesHiv],
  },
  {
    id: 'dengue',
    commonName: 'Virus Dengue',
    scientificName: 'Dengue virus (DENV-1 sampai DENV-4)',
    category: 'Virus',
    disease: 'Demam dengue dan Demam Berdarah Dengue (DBD)',
    scenario: 'dbd',
    shortDescription: 'Virus yang menumpang nyamuk Aedes. Tidak menular langsung antarmanusia.',
    cause: 'Virus dengue (empat jenis yang berkerabat). Seseorang bisa terinfeksi lebih dari sekali.',
    transmission: 'Lewat gigitan nyamuk Aedes betina yang terinfeksi, terutama Aedes aegypti. Nyamuk ini aktif menggigit pada siang hari dan berkembang biak di air bersih yang tergenang.',
    notTransmitted: 'Dengue tidak menular langsung dari orang ke orang, misalnya lewat batuk, bersin, atau sentuhan.',
    symptoms: ['Demam tinggi', 'Sakit kepala hebat, nyeri di belakang mata', 'Nyeri otot dan sendi', 'Mual, muntah, ruam'],
    riskFactors: ['Banyak wadah air terbuka di sekitar rumah', 'Musim hujan dan pancaroba', 'Pernah terinfeksi dengue sebelumnya (risiko dengue berat lebih tinggi)'],
    prevention: [
      'PSN 3M Plus: menguras, menutup, dan mendaur ulang wadah air',
      'Plus: larvasida, ikan pemakan jentik, kelambu, losion anti nyamuk',
      'Pakai baju yang menutupi tubuh, juga saat siang',
      'Gerakan 1 Rumah 1 Jumantik',
    ],
    treatment:
      'Tidak ada obat khusus dengue. Nyeri dapat diredakan dengan parasetamol; hindari ibuprofen dan aspirin karena meningkatkan risiko perdarahan. Tanda bahaya sering muncul setelah demam turun: nyeri perut hebat, muntah terus, gusi atau hidung berdarah, kulit pucat dan dingin. Segera ke fasilitas kesehatan.',
    misconceptions: [
      { myth: 'Fogging saja cukup untuk mencegah DBD.', fact: 'Fogging hanya membunuh nyamuk dewasa. PSN 3M Plus tetap cara paling efektif karena memutus jentik.' },
      { myth: 'Kalau demam turun, penderita DBD sudah aman.', fact: 'Masa setelah demam turun justru perlu diwaspadai karena tanda dengue berat bisa muncul.' },
      { myth: 'Dengue menular lewat bersin seperti pilek.', fact: 'Dengue menyebar lewat gigitan nyamuk Aedes yang terinfeksi.' },
    ],
    sources: [SOURCES.whoDengue, SOURCES.kemkesPsn, SOURCES.cdcDengue],
    size: '± 50 nm',
    sizeSource: SOURCES.sizeDengue,
  },
  {
    id: 'ecoli',
    commonName: 'E. coli',
    scientificName: 'Escherichia coli',
    category: 'Bakteri',
    disease: 'Diare (jenis tertentu), juga infeksi saluran kemih',
    scenario: 'diare',
    shortDescription: 'Sebagian besar tidak berbahaya; jenis tertentu penyebab utama diare. Lawan di skenario Diare.',
    cause: 'Sebagian besar E. coli adalah bagian usus yang sehat. Beberapa jenis menyebabkan diare. Bersama rotavirus, E. coli adalah penyebab diare anak yang paling umum.',
    transmission: 'Lewat makanan atau air minum yang tercemar, dan dari orang ke orang karena kebersihan tangan yang kurang.',
    symptoms: ['Diare cair, kadang berdarah', 'Kram perut', 'Kadang muntah atau demam ringan'],
    riskFactors: ['Balita (paling berisiko dehidrasi)', 'Air minum dan jamban yang tidak layak', 'Tidak cuci tangan pakai sabun', 'Kurang gizi'],
    prevention: ['Air minum yang aman (dimasak atau diolah)', 'Jamban sehat, tidak buang air di kali', 'Cuci tangan pakai sabun', 'Masak makanan sampai matang dan simpan dengan benar', 'ASI eksklusif 6 bulan'],
    treatment:
      'Oralit untuk mengganti cairan, zinc 10 hari untuk anak, dan tetap beri makan serta ASI. Antibiotik hanya bila diresepkan. Bawa ke fasilitas kesehatan bila ada darah pada tinja, demam, muntah terus, atau anak tidak mau minum.',
    misconceptions: [
      { myth: 'Semua E. coli berbahaya.', fact: 'Sebagian besar E. coli tidak berbahaya dan hidup di usus yang sehat.' },
      { myth: 'Anak diare harus dipuasakan.', fact: 'Makanan bergizi dan ASI tetap diberikan selama diare.' },
    ],
    sources: [SOURCES.whoDiarrhoea, SOURCES.kemkesDiare, SOURCES.cdcEcoli],
    size: '± 2 µm',
    sizeSource: SOURCES.sizeEcoli,
  },
  {
    id: 'rotavirus',
    commonName: 'Rotavirus',
    scientificName: 'Rotavirus (famili Reoviridae)',
    category: 'Virus',
    disease: 'Diare berat pada bayi dan anak',
    scenario: null,
    shortDescription: 'Virus penyebab diare berat pada bayi dan balita. Vaksin adalah perlindungan terbaik.',
    cause: 'Rotavirus. Paling sering menyerang bayi dan anak kecil; orang dewasa juga bisa tertular dengan gejala lebih ringan.',
    transmission: 'Virus keluar bersama tinja dan menyebar di keluarga, tempat penitipan anak, dan rumah sakit, bahkan sebelum gejala muncul.',
    symptoms: ['Muntah', 'Diare cair beberapa hari', 'Demam', 'Risiko dehidrasi'],
    riskFactors: ['Bayi dan balita yang belum diimunisasi'],
    prevention: ['Imunisasi rotavirus untuk bayi', 'Cuci tangan dan kebersihan lingkungan (penting, tetapi tidak cukup tanpa vaksin)'],
    treatment: 'Cegah dehidrasi dengan oralit dan tetap beri ASI. Segera ke fasilitas kesehatan bila anak lemas atau tidak mau minum.',
    misconceptions: [{ myth: 'Cuci tangan saja sudah cukup mencegah rotavirus.', fact: 'Kebersihan penting, tetapi tidak cukup. Vaksin adalah cara terbaik melindungi anak.' }],
    sources: [SOURCES.cdcRotavirus, SOURCES.whoDiarrhoea],
  },
  {
    id: 'plasmodium',
    commonName: 'Plasmodium',
    scientificName: 'Plasmodium falciparum, P. vivax, dan lainnya',
    category: 'Parasit',
    disease: 'Malaria',
    scenario: null,
    shortDescription: 'Parasit penyebab malaria yang dibawa nyamuk Anopheles. Bisa dicegah dan disembuhkan.',
    cause: 'Parasit Plasmodium. Ada 5 spesies yang menyerang manusia; P. falciparum dan P. vivax paling berbahaya.',
    transmission: 'Lewat gigitan nyamuk Anopheles betina yang terinfeksi.',
    notTransmitted: 'Malaria tidak menular langsung dari orang ke orang lewat kontak biasa.',
    symptoms: ['Demam, menggigil, sakit kepala', 'Pada kasus berat: sangat lelah, bingung, kejang, sulit bernapas'],
    riskFactors: ['Tinggal atau bepergian ke daerah malaria', 'Tidur tanpa kelambu', 'Balita dan ibu hamil lebih berisiko sakit berat'],
    prevention: ['Tidur memakai kelambu berinsektisida', 'Penyemprotan dinding rumah (IRS)', 'Hindari gigitan nyamuk', 'Obat pencegahan sesuai anjuran petugas'],
    treatment: 'Malaria selalu perlu diobati dengan obat antimalaria. Malaria bisa dicegah dan disembuhkan.',
    misconceptions: [{ myth: 'Malaria sama dengan DBD karena sama-sama dari nyamuk.', fact: 'Malaria disebabkan parasit lewat nyamuk Anopheles; DBD disebabkan virus lewat nyamuk Aedes. Pengobatannya berbeda.' }],
    sources: [SOURCES.whoMalaria],
  },
  {
    id: 'entamoeba',
    commonName: 'Entamoeba',
    scientificName: 'Entamoeba histolytica',
    category: 'Parasit',
    disease: 'Amebiasis (disentri amuba)',
    scenario: null,
    shortDescription: 'Parasit bersel satu yang menyebar lewat air dan makanan tercemar tinja.',
    cause: 'Parasit Entamoeba histolytica.',
    transmission: 'Menelan makanan atau air yang tercemar, atau dari permukaan dan jari yang terkena tinja orang yang terinfeksi.',
    symptoms: ['Sebagian besar tanpa gejala (hanya 10–20% yang sakit)', 'Diare, nyeri dan kram perut', 'Kadang diare berdarah'],
    riskFactors: ['Sanitasi yang buruk', 'Minum air atau es dari air mentah'],
    prevention: ['Cuci tangan pakai sabun setelah dari jamban dan sebelum makan', 'Hindari air, es, dan buah tak dikupas yang belum tentu aman', 'Jamban sehat'],
    treatment: 'Diobati dengan obat antiparasit sesuai resep tenaga kesehatan.',
    misconceptions: [{ myth: 'Semua diare disebabkan bakteri.', fact: 'Diare bisa disebabkan bakteri, virus, atau parasit seperti Entamoeba.' }],
    sources: [SOURCES.cdcAmebiasis],
  },
];

export const PATHOGEN_BY_ID = Object.fromEntries(PATHOGENS.map((p) => [p.id, p])) as Record<PathogenId, PathogenEntry>;

/* ---------- Mitos & Fakta ---------- */

export type Verdict = 'Fakta' | 'Mitos' | 'Perlu Konteks';

export interface FactCheck {
  id: string;
  claim: string;
  verdict: Verdict;
  explanation: string;
  /** Skenario tempat klaim ini muncul sebagai kuis. */
  scenario: ScenarioId | null;
  dexId: PathogenId | null;
}

const EXTRA_FACTS: FactCheck[] = [
  {
    id: 'fc-kapan-dokter',
    claim: 'Pilek tidak pernah perlu diperiksakan ke dokter.',
    verdict: 'Perlu Konteks',
    explanation:
      'Kebanyakan pilek sembuh sendiri. Namun cari pertolongan medis bila ada sesak atau napas cepat, dehidrasi, demam lebih dari 4 hari, gejala lebih dari 10 hari, atau gejala yang membaik lalu memburuk.',
    scenario: null,
    dexId: 'rhinovirus',
  },
  {
    id: 'fc-resistensi',
    claim: 'Rhinovirus bisa bermutasi menjadi "kebal antibiotik".',
    verdict: 'Mitos',
    explanation: 'Antibiotik memang tidak bekerja melawan virus, jadi "kebal antibiotik" bukan konsep yang tepat untuk rhinovirus. Resistensi antimikroba adalah isu pada infeksi bakteri.',
    scenario: null,
    dexId: 'rhinovirus',
  },
  {
    id: 'fc-game',
    claim: 'Angka di Infectious World memprediksi wabah sungguhan.',
    verdict: 'Mitos',
    explanation: 'Semua angka di game ini (PI, sebaran infeksi, kesadaran warga, efek aksi) adalah mekanik permainan fiktif, bukan model epidemiologi.',
    scenario: null,
    dexId: null,
  },
];

/** Semua kuis dari skenario ikut menjadi entri Mitos & Fakta, sehingga isi kuis dan Patho-Dex selalu sama. */
export const FACT_CHECKS: FactCheck[] = [
  ...SCENARIOS.flatMap((sc) =>
    sc.decisions.flatMap((d) =>
      d.kind === 'quiz' ? [{ id: d.id, claim: d.claim, verdict: (d.isTrue ? 'Fakta' : 'Mitos') as Verdict, explanation: d.explanation, scenario: sc.id, dexId: d.dexId }] : [],
    ),
  ),
  ...EXTRA_FACTS,
];

/* ---------- Kamus Istilah ---------- */

export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: 'Patogen', meaning: 'Kuman penyebab penyakit: virus, bakteri, parasit, atau jamur.' },
  { term: 'Virus', meaning: 'Patogen sangat kecil yang hanya bisa berkembang biak di dalam sel. Tidak mempan antibiotik.' },
  { term: 'Bakteri', meaning: 'Makhluk bersel satu. Banyak yang bermanfaat; jenis tertentu menyebabkan penyakit.' },
  { term: 'Parasit / Protozoa', meaning: 'Makhluk yang hidup menumpang pada inang, misalnya Plasmodium penyebab malaria.' },
  { term: 'Vektor', meaning: 'Hewan pembawa kuman, misalnya nyamuk Aedes (dengue) dan Anopheles (malaria).' },
  { term: 'Penularan (transmisi)', meaning: 'Cara kuman berpindah dari satu orang ke orang lain.' },
  { term: 'Infeksi laten', meaning: 'Kuman ada di tubuh tetapi diam, tanpa gejala, dan belum menular. Contoh: TB laten.' },
  { term: 'Imunisasi / vaksin', meaning: 'Melatih kekebalan tubuh agar siap melawan kuman tertentu.' },
  { term: 'Antibiotik', meaning: 'Obat untuk infeksi bakteri. Tidak bekerja pada virus.' },
  { term: 'ARV (antiretroviral)', meaning: 'Obat yang mengendalikan HIV agar tidak berkembang biak.' },
  { term: 'Resistensi obat', meaning: 'Kuman menjadi kebal obat, sering karena obat tidak diminum sampai tuntas.' },
  { term: 'Dehidrasi', meaning: 'Tubuh kekurangan cairan, misalnya karena diare atau muntah.' },
  { term: 'Oralit', meaning: 'Larutan gula dan garam untuk mengganti cairan tubuh saat diare.' },
  { term: 'PSN 3M Plus', meaning: 'Pemberantasan sarang nyamuk: menguras, menutup, mendaur ulang, plus pencegahan lain.' },
  { term: 'Jumantik', meaning: 'Juru pemantau jentik yang memeriksa wadah air dari rumah ke rumah.' },
  { term: 'TOSS TBC', meaning: 'Temukan, Obati Sampai Sembuh: gerakan penanggulangan TBC dari Kemenkes.' },
  { term: 'ODHIV / ODHA', meaning: 'Orang dengan HIV / orang dengan HIV-AIDS.' },
  { term: 'Stigma', meaning: 'Cap buruk pada orang yang sakit. Stigma membuat orang takut periksa dan berobat.' },
  { term: 'Hoaks', meaning: 'Informasi keliru yang sengaja atau tidak sengaja disebarkan.' },
];

/* ---------- Istilah di dalam game ---------- */

export const GAME_TERMS: { term: string; meaning: string }[] = [
  { term: 'Sebaran Infeksi', meaning: 'Bar merah. Jika mencapai 100%, kamu (patogen fiktif) menang.' },
  { term: 'Kesadaran Warga', meaning: 'Bar biru. Jika mencapai 100% lebih dulu, warga menang dan kamu kalah.' },
  { term: 'Poin Infeksi (PI)', meaning: 'Mata uang permainan. Bertambah 1 setiap 2 detik dan dari kuis atau misi.' },
  { term: 'Pohon Mutasi', meaning: 'Peningkatan kemampuan patogen. Cabang Gejala Terlihat berisiko membuat warga cepat sadar.' },
  { term: 'Aksi Warga', meaning: 'Setiap 15 detik warga melakukan pencegahan yang memperlambat infeksi atau menaikkan kesadaran.' },
  { term: 'Wilayah Fokus', meaning: 'Tempat sebaran dipusatkan. Tiap wilayah punya kelebihan dan tantangan berbeda.' },
  { term: 'Momen Penentu', meaning: 'Dilema atau kuis Mitos/Fakta yang muncul berkala. Simulasi berhenti sampai kamu memilih.' },
  { term: 'Sebar Hoaks', meaning: 'Aksi sekali pakai: kesadaran turun sebentar, lalu Cek Fakta meluruskannya.' },
];

// Infectious World — port JS dari src/game/* dan src/content/* (repo samueladian3-cpu/infectious-world).
// Aturan, formula, biaya, durasi, dan kondisi menang/kalah TIDAK diubah. Hanya teks pesan yang dipersingkat.

export const CONFIG = {
  ipIntervalSeconds: 2,
  infection: { base: 0.14, perTransmission: 0.12, perSymptomAboveOne: 0.05, perPersistenceAboveOne: 0.04 },
  awareness: { base: 0.08, perSymptom: 0.14 },
  shield: { intervalSeconds: 15, a2ReductionScale: 0.8, c2AwarenessBonusScale: 0.75 },
  misinformation: { cost: 50, awarenessReduction: 8, factCheckDelaySeconds: 8, factCheckAwarenessIncrease: 10 },
  milestones: [25, 50, 75],
  tickerLimit: 6,
  tickMs: { normal: 1000, fast: 500 },
};

export const SHIELD_EVENTS = [
  { id: 'E1', title: 'Cuci Tangan & Etika Batuk', short: 'Infeksi −25%',
    description: 'Warga mencuci tangan dengan sabun dan menutup batuk/bersin dengan tisu atau siku. Kebiasaan ini membantu mengurangi penyebaran virus pernapasan.',
    effectLabel: 'Laju infeksi −25% selama 8 detik', durationSeconds: 8, infectionReduction: 0.25, immediateAwareness: 0, awarenessBonusPerSecond: 0, source: 'posyandu' },
  { id: 'E2', title: 'Masker & Udara Lebih Bersih', short: 'Infeksi −20%',
    description: 'Warga yang sakit memakai masker dan ruangan umum dibuka jendelanya agar sirkulasi udara lebih baik.',
    effectLabel: 'Laju infeksi −20% selama 8 detik', durationSeconds: 8, infectionReduction: 0.2, immediateAwareness: 0, awarenessBonusPerSecond: 0, source: 'puskesmas' },
  { id: 'E3', title: 'Pengenalan Gejala Dini', short: 'Awareness +5, lalu +0,10/dtk',
    description: 'Warga mengenali gejala pilek seperti hidung berair, bersin, dan sakit tenggorokan, lalu beristirahat di rumah saat sakit.',
    effectLabel: 'Awareness +5 poin, lalu +0,10 poin/detik selama 8 detik', durationSeconds: 8, infectionReduction: 0, immediateAwareness: 5, awarenessBonusPerSecond: 0.1, source: 'puskesmas' },
  { id: 'E4', title: 'Edukasi Kesehatan Komunitas', short: 'Awareness +3, lalu +0,08/dtk',
    description: 'Kader kesehatan dan puskesmas membagikan informasi pencegahan dari sumber yang kredibel di balai dusun.',
    effectLabel: 'Awareness +3 poin, lalu +0,08 poin/detik selama 8 detik', durationSeconds: 8, infectionReduction: 0, immediateAwareness: 3, awarenessBonusPerSecond: 0.08, source: 'balai' },
];
export const SHIELD_BY_ID = Object.fromEntries(SHIELD_EVENTS.map((e) => [e.id, e]));

export const BRANCH_LABEL = { transmission: 'Transmisi', symptom: 'Visibilitas Gejala', persistence: 'Persistensi Lingkungan' };

export const MUTATIONS = [
  { id: 'A1', name: 'Enhanced Transmission Profile', branch: 'transmission', cost: 25, prerequisite: null,
    description: 'Profil transmisi fiktif yang mempercepat Infection Progress di dalam simulasi.',
    effects: ['Transmission Level +1', 'Infection Progress +0,12 poin/detik'], stat: 'transmissionLevel', statDelta: 1 },
  { id: 'A2', name: 'Expanded Transmission Profile', branch: 'transmission', cost: 60, prerequisite: 'A1',
    description: 'Perluasan profil transmisi fiktif. Event Behavior Shield tetap berpengaruh, tetapi penaltinya sedikit berkurang.',
    effects: ['Transmission Level +1', 'Infection Progress +0,12 poin/detik', 'Penalti event Behavior Shield terhadap infeksi berkurang 20% (tidak hilang)'], stat: 'transmissionLevel', statDelta: 1 },
  { id: 'B1', name: 'Increased Symptom Visibility', branch: 'symptom', cost: 20, prerequisite: null,
    description: 'Gejala dalam simulasi menjadi lebih mudah terlihat. Infeksi sedikit lebih cepat, tetapi komunitas juga lebih cepat sadar. Ini trade-off permainan, bukan klaim tentang keganasan virus nyata.',
    effects: ['Symptom Visibility Level +1', 'Infection Progress +0,05 poin/detik', 'Community Awareness +0,14 poin/detik (lebih besar!)'], stat: 'symptomVisibilityLevel', statDelta: 1 },
  { id: 'B2', name: 'High Clinical Visibility', branch: 'symptom', cost: 45, prerequisite: 'B1',
    description: 'Gejala sangat mudah dikenali di dalam simulasi. Komunitas yang mengenali gejala lebih cepat bertindak, sehingga awareness naik lebih kuat.',
    effects: ['Symptom Visibility Level +1', 'Infection Progress +0,05 poin/detik', 'Community Awareness +0,14 poin/detik (lebih besar!)'], stat: 'symptomVisibilityLevel', statDelta: 1 },
  { id: 'C1', name: 'Persistence Profile', branch: 'persistence', cost: 30, prerequisite: null,
    description: 'Statistik fiktif ketahanan di lingkungan. Tidak berarti semua patogen berperilaku sama di lingkungan nyata.',
    effects: ['Environmental Persistence Level +1', 'Infection Progress +0,04 poin/detik'], stat: 'environmentalPersistenceLevel', statDelta: 1 },
  { id: 'C2', name: 'Enhanced Persistence Profile', branch: 'persistence', cost: 65, prerequisite: 'C1',
    description: 'Peningkatan statistik persistensi fiktif. Sebagian penalti sementara dari event komunitas sedikit berkurang.',
    effects: ['Environmental Persistence Level +1', 'Infection Progress +0,04 poin/detik', 'Bonus laju awareness sementara dari event berkurang 25%'], stat: 'environmentalPersistenceLevel', statDelta: 1 },
];
export const MUTATION_BY_ID = Object.fromEntries(MUTATIONS.map((m) => [m.id, m]));

export const SOURCES = {
  cdcRhino: { title: 'About Rhinoviruses', publisher: 'CDC', url: 'https://www.cdc.gov/rhinoviruses/about/' },
  cdcHygiene: { title: 'Hygiene and Respiratory Viruses Prevention', publisher: 'CDC', url: 'https://www.cdc.gov/respiratory-viruses/prevention/hygiene.html' },
  cdcColdTreatment: { title: 'Manage Common Cold', publisher: 'CDC', url: 'https://www.cdc.gov/common-cold/treatment/' },
  cdcEcoli: { title: 'About Escherichia coli Infection', publisher: 'CDC', url: 'https://www.cdc.gov/ecoli/about/index.html' },
  cdcEcoliSymptoms: { title: 'Symptoms of E. coli Infection', publisher: 'CDC', url: 'https://www.cdc.gov/ecoli/signs-symptoms/index.html' },
  cdcEcoliPrevention: { title: 'How to Prevent E. coli infection', publisher: 'CDC', url: 'https://www.cdc.gov/ecoli/prevention/index.html' },
  cdcDengue: { title: 'About Dengue', publisher: 'CDC', url: 'https://www.cdc.gov/dengue/about/index.html' },
  cdcDengueSymptoms: { title: 'Symptoms of Dengue and Testing', publisher: 'CDC', url: 'https://www.cdc.gov/dengue/signs-symptoms/index.html' },
  cdcDenguePrevention: { title: 'Preventing Dengue', publisher: 'CDC', url: 'https://www.cdc.gov/dengue/prevention/index.html' },
};

export const PATHOGENS = [
  { id: 'rhinovirus', commonName: 'Rhinovirus', scientificName: 'Rhinovirus (genus Enterovirus)', organismType: 'Virus', playable: true, size: '± 30 nm',
    shortDescription: 'Virus penyebab utama common cold (pilek biasa). Satu-satunya skenario yang dapat dimainkan.',
    significance: 'Rhinovirus adalah penyebab utama common cold dan sering memicu serangan asma. Ada banyak tipe rhinovirus dan virus ini beredar sepanjang tahun.',
    transmission: 'Rhinovirus adalah virus pernapasan. Kebersihan tangan dan menutup batuk/bersin membantu mengurangi risiko penyebaran virus pernapasan ke orang lain.',
    symptoms: ['Hidung berair atau tersumbat', 'Batuk dan bersin', 'Sakit tenggorokan', 'Sakit kepala, nyeri badan ringan, kadang demam'],
    riskContext: 'Banyak infeksi tanpa gejala atau ringan, dan gejala biasanya membaik dalam 7 hari (bisa sampai 2 minggu). Lebih jarang, infeksi dapat memicu serangan asma, infeksi telinga atau sinus, bronkiolitis, bronkitis, atau pneumonia. Tidak ada vaksin rhinovirus dan tidak ada antivirus khusus; perawatannya suportif (istirahat dan cukup cairan).',
    prevention: ['Cuci tangan dengan sabun; jika tidak ada, gunakan hand sanitizer beralkohol minimal 60%', 'Tutup batuk/bersin dengan tisu lalu buang; jika tidak ada tisu, gunakan siku, bukan tangan', 'Bersihkan permukaan yang sering disentuh secara rutin', 'Tetap di rumah dan beristirahat saat sakit'],
    misconceptions: [
      { myth: 'Antibiotik menyembuhkan pilek.', fact: 'Antibiotik tidak bekerja melawan virus dan tidak membuat penderita pilek merasa lebih baik.' },
      { myth: 'Pilek pasti menyebabkan batuk darah.', fact: 'Batuk darah bukan gejala khas pilek. Gejala yang berat atau mengkhawatirkan perlu diperiksakan ke tenaga kesehatan.' },
    ],
    sources: [SOURCES.cdcRhino, SOURCES.cdcHygiene, SOURCES.cdcColdTreatment] },
  { id: 'ecoli', commonName: 'E. coli', scientificName: 'Escherichia coli', organismType: 'Bakteri', playable: false, size: '± 2 µm',
    shortDescription: 'Bakteri yang sebagian besar tidak berbahaya; beberapa jenis dapat menyebabkan diare. (Pratinjau, belum dapat dimainkan.)',
    significance: 'Sebagian besar E. coli adalah bagian dari usus yang sehat. Beberapa jenis dapat menyebabkan diare, infeksi saluran kemih, pneumonia, atau sepsis. Infeksi E. coli penghasil toksin Shiga (STEC) dapat menyebabkan sindrom hemolitik uremik (HUS) yang berbahaya bagi ginjal.',
    transmission: 'Orang dapat terinfeksi setelah menelan E. coli, misalnya melalui makanan atau air yang terkontaminasi, atau melalui kontak dengan hewan, lingkungan, atau orang lain.',
    symptoms: ['Diare yang bisa berair atau berdarah', 'Kram perut yang bisa berat', 'Kadang muntah atau demam ringan'],
    riskContext: 'Anak di bawah 5 tahun, lansia 65 tahun ke atas, orang dengan sistem imun lemah, dan pelancong internasional berisiko lebih tinggi. Diare atau muntah lebih dari 2 hari, darah pada tinja atau urin, atau tanda dehidrasi perlu diperiksakan ke tenaga kesehatan.',
    prevention: ['Cuci tangan', 'Terapkan keamanan pangan: bersihkan, pisahkan, masak, dan dinginkan', 'Gunakan air minum yang aman', 'Pilih susu dan jus yang dipasteurisasi', 'Jangan berenang saat diare'],
    misconceptions: [{ myth: 'Semua E. coli berbahaya.', fact: 'Sebagian besar E. coli tidak berbahaya dan merupakan bagian dari usus yang sehat.' }],
    sources: [SOURCES.cdcEcoli, SOURCES.cdcEcoliSymptoms, SOURCES.cdcEcoliPrevention] },
  { id: 'dengue', commonName: 'Virus Dengue', scientificName: 'Dengue virus (DENV-1 sampai DENV-4)', organismType: 'Virus', playable: false, size: '± 50 nm',
    shortDescription: 'Virus yang menyebar terutama melalui gigitan nyamuk Aedes. (Pratinjau, belum dapat dimainkan.)',
    significance: 'Dengue disebabkan oleh salah satu dari empat virus dengue yang berkerabat dekat. Seseorang dapat terinfeksi lebih dari sekali seumur hidup.',
    transmission: 'Terutama melalui gigitan nyamuk Aedes yang terinfeksi.',
    symptoms: ['Demam (tanda paling umum)', 'Sakit kepala atau nyeri di belakang mata', 'Nyeri otot, sendi, atau tulang', 'Mual atau muntah, ruam'],
    riskContext: 'Gejala biasanya berlangsung 2–7 hari. Tanda bahaya dengue berat biasanya muncul 24–48 jam setelah demam turun: nyeri perut, muntah 3 kali atau lebih dalam 24 jam, perdarahan hidung atau gusi, muntah darah atau darah pada tinja, sangat lelah atau gelisah. Dengue berat adalah kondisi darurat medis.',
    prevention: ['Hindari gigitan nyamuk: gunakan losion anti nyamuk', 'Kenakan baju lengan panjang dan celana panjang yang longgar', 'Kurangi nyamuk di dalam dan sekitar rumah', 'Gunakan kelambu bila ruangan tidak berkasa'],
    misconceptions: [{ myth: 'Dengue menular lewat bersin seperti pilek.', fact: 'Dengue menyebar terutama melalui gigitan nyamuk Aedes yang terinfeksi, sehingga pencegahan utamanya adalah menghindari gigitan nyamuk.' }],
    sources: [SOURCES.cdcDengue, SOURCES.cdcDengueSymptoms, SOURCES.cdcDenguePrevention] },
];

export const FACT_CHECKS = [
  { id: 'fc-antibiotik', claim: 'Antibiotik dapat menyembuhkan pilek.', verdict: 'Salah',
    explanation: 'Pilek disebabkan virus seperti rhinovirus. Antibiotik tidak bekerja melawan virus. Antibiotik hanya diperlukan bila infeksi virus berlanjut menjadi infeksi bakteri, misalnya pneumonia, dan penggunaan yang tidak perlu dapat menimbulkan efek samping.', sources: [SOURCES.cdcColdTreatment] },
  { id: 'fc-cuci-tangan', claim: 'Mencuci tangan dengan sabun membantu mencegah penyakit pernapasan.', verdict: 'Benar',
    explanation: 'Mencuci tangan dengan sabun menghilangkan kuman sehingga tidak berpindah ke hidung, mata, atau mulut. Bila tidak ada sabun dan air, hand sanitizer dengan alkohol minimal 60% dapat digunakan.', sources: [SOURCES.cdcHygiene] },
  { id: 'fc-etika-batuk', claim: 'Menutup bersin dengan telapak tangan adalah cara terbaik.', verdict: 'Salah',
    explanation: 'Tutup hidung dan mulut dengan tisu lalu buang tisunya. Bila tidak ada tisu, gunakan siku, bukan tangan, agar kuman tidak menempel di tangan.', sources: [SOURCES.cdcHygiene] },
  { id: 'fc-resistensi', claim: 'Rhinovirus bisa bermutasi menjadi "kebal antibiotik".', verdict: 'Salah',
    explanation: 'Antibiotik memang tidak bekerja melawan virus, jadi "resistensi antibiotik" bukan konsep yang tepat untuk rhinovirus. Resistensi antimikroba adalah isu tersendiri yang terkait penggunaan antibiotik pada infeksi bakteri.', sources: [SOURCES.cdcColdTreatment] },
  { id: 'fc-batuk-darah', claim: 'Infeksi rhinovirus selalu menyebabkan batuk darah.', verdict: 'Salah',
    explanation: 'Gejala umum rhinovirus adalah hidung berair, hidung tersumbat, batuk, bersin, sakit tenggorokan, sakit kepala, nyeri badan ringan, dan demam. Batuk darah tidak termasuk gejala umum; gejala berat atau mengkhawatirkan harus diperiksakan ke tenaga kesehatan.', sources: [SOURCES.cdcRhino, SOURCES.cdcColdTreatment] },
  { id: 'fc-kapan-dokter', claim: 'Pilek tidak pernah perlu diperiksakan ke dokter.', verdict: 'Perlu Konteks',
    explanation: 'Kebanyakan pilek sembuh sendiri. Namun segera cari pertolongan medis bila ada sesak atau napas cepat, dehidrasi, demam lebih dari 4 hari, gejala lebih dari 10 hari tanpa membaik, gejala yang membaik lalu memburuk, atau penyakit kronis yang memburuk.', sources: [SOURCES.cdcColdTreatment] },
  { id: 'fc-game', claim: 'Angka di Infectious World memprediksi wabah sungguhan.', verdict: 'Salah',
    explanation: 'Semua angka di game ini (IP, Infection Progress, Awareness, efek event) adalah mekanik permainan fiktif, bukan model epidemiologi atau ukuran efektivitas intervensi di dunia nyata.', sources: [] },
];

/* ---------- peta (CommunityMap.tsx) ---------- */
export const MAP_CELLS = 48;
export const FACILITIES = { 3: 'Puskesmas', 10: 'Sekolah', 21: 'Pasar', 27: 'Balai Dusun', 36: 'Posyandu', 44: 'Warung' };
export const infectionThreshold = (i) => (((i * 37) % MAP_CELLS) + 0.5) * (100 / MAP_CELLS);
export const awarenessThreshold = (i) => (((i * 29 + 11) % MAP_CELLS) + 0.5) * (100 / MAP_CELLS);
export function cellState(i, inf, aw) {
  const a = inf >= infectionThreshold(i), b = aw >= awarenessThreshold(i);
  return a && b ? 'both' : a ? 'infected' : b ? 'protected' : 'healthy';
}
export function mapCounts(inf, aw) {
  const c = { healthy: 0, infected: 0, protected: 0, both: 0 };
  for (let i = 0; i < MAP_CELLS; i++) c[cellState(i, inf, aw)]++;
  return c;
}

/* ---------- engine.ts ---------- */
export const clampPercent = (v) => Math.min(100, Math.max(0, v));
const round = (v) => Math.round(v * 1e6) / 1e6;
export function nextRandom(seed) {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
export const isTerminal = (s) => s.gameStatus === 'victory' || s.gameStatus === 'defeat';
export const isSessionActive = (s) => s.gameStatus === 'running' || s.gameStatus === 'paused';

export function createInitialState(seed = 1) {
  return { currentPathogen: 'rhinovirus', gameStatus: 'idle', elapsedSeconds: 0, infectionPoints: 0, infectionRate: 0, awarenessLevel: 0,
    stats: { transmissionLevel: 1, symptomVisibilityLevel: 1, environmentalPersistenceLevel: 1 }, unlockedNodes: [], activeShield: null, lastShieldId: null,
    misinformationUsed: false, factCheckDueAt: null, newsTicker: [], eventHistory: [], outcome: null, rngSeed: seed >>> 0, nextMessageId: 1, announcedMilestones: [] };
}
export function startSession(seed) {
  const s = createInitialState(seed);
  return pushTicker({ ...s, gameStatus: 'running' }, 'Rhinovirus fiktif dilepas di Dusun Kuannoah (simulasi).', 'info');
}
export function baseInfectionGain(st) {
  const c = CONFIG.infection;
  return c.base + c.perTransmission * st.transmissionLevel + c.perSymptomAboveOne * (st.symptomVisibilityLevel - 1) + c.perPersistenceAboveOne * (st.environmentalPersistenceLevel - 1);
}
export const baseAwarenessGain = (st) => CONFIG.awareness.base + CONFIG.awareness.perSymptom * st.symptomVisibilityLevel;
export function effectiveInfectionReduction(s) {
  if (!s.activeShield) return 0;
  return SHIELD_BY_ID[s.activeShield.id].infectionReduction * (s.unlockedNodes.includes('A2') ? CONFIG.shield.a2ReductionScale : 1);
}
export function effectiveAwarenessBonus(s) {
  if (!s.activeShield) return 0;
  return SHIELD_BY_ID[s.activeShield.id].awarenessBonusPerSecond * (s.unlockedNodes.includes('C2') ? CONFIG.shield.c2AwarenessBonusScale : 1);
}
export const currentInfectionGain = (s) => baseInfectionGain(s.stats) * (1 - effectiveInfectionReduction(s));
export const currentAwarenessGain = (s) => baseAwarenessGain(s.stats) + effectiveAwarenessBonus(s);

function pushTicker(s, text, tone) {
  const msg = { id: s.nextMessageId, at: s.elapsedSeconds, text, tone };
  return { ...s, nextMessageId: s.nextMessageId + 1, newsTicker: [msg, ...s.newsTicker].slice(0, CONFIG.tickerLimit) };
}
const pushHistory = (s, e) => ({ ...s, eventHistory: [...s.eventHistory, { ...e, at: s.elapsedSeconds }] });
const record = (s, e, tone) => pushTicker(pushHistory(s, e), e.message, tone);

export function pickShieldEvent(lastId, seed) {
  const pool = SHIELD_EVENTS.filter((e) => e.id !== lastId);
  const c = pool.length > 0 ? pool : SHIELD_EVENTS;
  const [r, next] = nextRandom(seed);
  return [c[Math.min(c.length - 1, Math.floor(r * c.length))].id, next];
}

export function tick(prev) {
  if (prev.gameStatus !== 'running') return prev;
  let s = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
  const t = s.elapsedSeconds;
  const infGain = currentInfectionGain(s), awGain = currentAwarenessGain(s);
  s.infectionRate = round(clampPercent(s.infectionRate + infGain));
  s.awarenessLevel = round(clampPercent(s.awarenessLevel + awGain));
  if (t % CONFIG.ipIntervalSeconds === 0) s.infectionPoints += 1;
  if (s.factCheckDueAt !== null && t >= s.factCheckDueAt) {
    s.awarenessLevel = round(clampPercent(s.awarenessLevel + CONFIG.misinformation.factCheckAwarenessIncrease));
    s.factCheckDueAt = null;
    s = record(s, { kind: 'factcheck', message: `Fact-Check: tenaga kesehatan meluruskan info keliru. Awareness +${CONFIG.misinformation.factCheckAwarenessIncrease}.` }, 'good');
  }
  if (s.activeShield && t >= s.activeShield.expiresAt) {
    const def = SHIELD_BY_ID[s.activeShield.id];
    s = pushTicker({ ...s, activeShield: null }, `Shield selesai: ${def.title}.`, 'info');
  }
  if (t % CONFIG.shield.intervalSeconds === 0) {
    const [id, seed] = pickShieldEvent(s.lastShieldId, s.rngSeed);
    const def = SHIELD_BY_ID[id];
    s = { ...s, rngSeed: seed, lastShieldId: id, activeShield: { id, startedAt: t, expiresAt: t + def.durationSeconds },
      awarenessLevel: round(clampPercent(s.awarenessLevel + def.immediateAwareness)) };
    s = record(s, { kind: 'shield', shieldId: id, message: `Behavior Shield: ${def.title} · ${def.short}.` }, 'warn');
  }
  for (const m of CONFIG.milestones) {
    if (s.infectionRate >= m && !s.announcedMilestones.includes(m)) {
      s = record({ ...s, announcedMilestones: [...s.announcedMilestones, m] }, { kind: 'milestone', message: `Infection Progress simulasi ${m}%.` }, 'bad');
    }
  }
  return resolveOutcome(s);
}
function resolveOutcome(s) {
  if (s.awarenessLevel >= 100) return record({ ...s, gameStatus: 'defeat', outcome: 'defeat', activeShield: null, factCheckDueAt: null }, { kind: 'outcome', message: 'Community Awareness 100%. Komunitas terlindungi.' }, 'good');
  if (s.infectionRate >= 100) return record({ ...s, gameStatus: 'victory', outcome: 'victory', activeShield: null, factCheckDueAt: null }, { kind: 'outcome', message: 'Infection Progress simulasi 100%.' }, 'bad');
  return s;
}

export function canPurchase(s, id) {
  const n = MUTATION_BY_ID[id];
  if (!n) return { ok: false, reason: 'Mutasi tidak dikenal.' };
  if (!isSessionActive(s)) return { ok: false, reason: 'Simulasi tidak aktif.' };
  if (s.unlockedNodes.includes(id)) return { ok: false, reason: 'Mutasi sudah dibeli.' };
  if (n.prerequisite && !s.unlockedNodes.includes(n.prerequisite)) return { ok: false, reason: `Butuh ${n.prerequisite} terlebih dahulu.` };
  if (s.infectionPoints < n.cost) return { ok: false, reason: `IP kurang (butuh ${n.cost}, punya ${s.infectionPoints}).` };
  return { ok: true };
}
export function purchaseMutation(s, id) {
  const check = canPurchase(s, id);
  if (!check.ok) return { ok: false, state: s, reason: check.reason };
  const n = MUTATION_BY_ID[id];
  const message = `Mutasi ${n.id} dibeli (−${n.cost} IP).`;
  let next = { ...s, infectionPoints: s.infectionPoints - n.cost, unlockedNodes: [...s.unlockedNodes, id], stats: { ...s.stats, [n.stat]: s.stats[n.stat] + n.statDelta } };
  next = record(next, { kind: 'purchase', message }, 'info');
  return { ok: true, state: next, message };
}
export function canUseMisinformation(s) {
  if (!isSessionActive(s)) return { ok: false, reason: 'Permainan sudah berakhir.' };
  if (s.misinformationUsed) return { ok: false, reason: 'Sudah digunakan di sesi ini.' };
  if (s.infectionPoints < CONFIG.misinformation.cost) return { ok: false, reason: `IP kurang (butuh ${CONFIG.misinformation.cost}).` };
  return { ok: true };
}
export function activateMisinformation(s) {
  const check = canUseMisinformation(s);
  if (!check.ok) return { ok: false, state: s, reason: check.reason };
  const m = CONFIG.misinformation;
  const message = `Misinformation Surge (fiktif): awareness −${m.awarenessReduction}. Fact-check dalam ${m.factCheckDelaySeconds} dtk.`;
  let next = { ...s, infectionPoints: s.infectionPoints - m.cost, awarenessLevel: round(clampPercent(s.awarenessLevel - m.awarenessReduction)), misinformationUsed: true, factCheckDueAt: s.elapsedSeconds + m.factCheckDelaySeconds };
  next = record(next, { kind: 'misinformation', message }, 'bad');
  return { ok: true, state: next, message };
}
export function setPaused(s, paused) {
  if (!isSessionActive(s)) return s;
  return { ...s, gameStatus: paused ? 'paused' : 'running' };
}

/* ---------- debrief.ts ---------- */
export function buildDebrief(s) {
  const items = [];
  if (s.outcome === 'defeat') items.push({ title: 'Kebiasaan kecil melindungi banyak orang', body: 'Komunitas menang karena warga mencuci tangan dengan sabun, menutup batuk dan bersin dengan tisu atau siku, serta membersihkan permukaan yang sering disentuh.', source: SOURCES.cdcHygiene });
  else items.push({ title: 'Pencegahan tetap penting', body: 'Di dunia nyata, kemenangan simulasi ini tidak berarti wabah pasti terjadi. Namun kebersihan tangan dan etika batuk tetap merupakan langkah sederhana untuk mengurangi penyebaran virus pernapasan.', source: SOURCES.cdcHygiene });
  if (s.misinformationUsed) items.push({ title: 'Misinformasi mengganggu, fakta meluruskan', body: 'Informasi keliru, misalnya bahwa antibiotik menyembuhkan pilek, dapat menunda tindakan yang tepat. Antibiotik tidak bekerja melawan virus. Selalu periksa informasi kesehatan ke sumber yang kredibel.', source: SOURCES.cdcColdTreatment });
  else if (s.stats.symptomVisibilityLevel > 1) items.push({ title: 'Mengenali gejala membantu bertindak cepat', body: 'Gejala yang mudah dikenali (hidung berair, bersin, sakit tenggorokan) membantu orang lebih cepat beristirahat di rumah saat sakit, sehingga risiko menulari orang lain berkurang.', source: SOURCES.cdcRhino });
  else items.push({ title: 'Kenali gejala dan tanda bahaya', body: 'Kebanyakan pilek sembuh sendiri dengan istirahat dan cukup cairan. Cari pertolongan medis bila ada sesak napas, dehidrasi, demam lebih dari 4 hari, atau gejala yang membaik lalu memburuk.', source: SOURCES.cdcColdTreatment });
  items.push({ title: 'Game bukan prediksi', body: 'Rhinovirus adalah penyebab utama common cold. Semua angka dan efek di game ini adalah mekanik fiktif, bukan perkiraan risiko atau efektivitas intervensi sungguhan.', source: SOURCES.cdcRhino });
  return items.slice(0, 3);
}

/* ---------- storage.ts ---------- */
const PREF_KEY = 'iw.preferences.v1', REC_KEY = 'iw.records.v1';
export const DEFAULT_PREFS = { motion: 'system', speed: 'normal' };
export const DEFAULT_RECORDS = { sessionsStarted: 0, sessionsCompleted: 0, victories: 0, defeats: 0, totalDurationSeconds: 0, fastestVictorySeconds: null, longestDefenseSeconds: null, mutationsPurchased: 0, shieldEventsSeen: 0, dexEntriesOpened: 0, tutorialCompleted: false };
function read(key, fb) { try { const r = localStorage.getItem(key); if (!r) return { ...fb }; const p = JSON.parse(r); return p && typeof p === 'object' ? { ...fb, ...p } : { ...fb }; } catch { return { ...fb }; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* abaikan */ } }
export const loadPrefs = () => read(PREF_KEY, DEFAULT_PREFS);
export const savePrefs = (p) => write(PREF_KEY, p);
export const loadRecords = () => read(REC_KEY, DEFAULT_RECORDS);
export const saveRecords = (r) => write(REC_KEY, r);
export function clearRecords() { try { localStorage.removeItem(REC_KEY); } catch { /* abaikan */ } }

/* ---------- format.ts ---------- */
export const formatTime = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
export const fmtRate = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}/dtk`;
export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;

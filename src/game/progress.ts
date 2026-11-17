/** Progres pemain lintas sesi: XP, level, bintang per skenario, dan pencapaian. Fungsi murni. */
import { SCENARIOS, SCENARIO_BY_ID } from './scenarios/index.js';
import type { GameState, ScenarioId } from './types.js';

export interface Progress {
  xp: number;
  /** Bintang terbaik (0–3) per skenario. */
  stars: Partial<Record<ScenarioId, number>>;
  played: Partial<Record<ScenarioId, number>>;
  wins: Partial<Record<ScenarioId, number>>;
  quizCorrect: number;
  dexOpened: number;
  tutorialDone: boolean;
  achievements: string[];
}

export const EMPTY_PROGRESS: Progress = { xp: 0, stars: {}, played: {}, wins: {}, quizCorrect: 0, dexOpened: 0, tutorialDone: false, achievements: [] };

export interface LevelDef {
  xp: number;
  title: string;
  reward: string;
}

export const LEVELS: LevelDef[] = [
  { xp: 0, title: 'Pengamat Pemula', reward: 'Akses skenario ISPA' },
  { xp: 60, title: 'Kader Muda', reward: 'Gelar "Kader Muda" dan lencana hijau' },
  { xp: 150, title: 'Kader Posyandu', reward: 'Gelar "Kader Posyandu" dan lencana biru' },
  { xp: 270, title: 'Detektif Wabah', reward: 'Gelar "Detektif Wabah" dan lencana ungu' },
  { xp: 420, title: 'Petugas Surveilans', reward: 'Gelar "Petugas Surveilans" dan lencana jingga' },
  { xp: 600, title: 'Epidemiolog Muda', reward: 'Gelar "Epidemiolog Muda" dan lencana merah' },
  { xp: 820, title: 'Ahli Promosi Kesehatan', reward: 'Gelar "Ahli Promosi Kesehatan" dan lencana perak' },
  { xp: 1080, title: 'Duta Pencegahan', reward: 'Gelar "Duta Pencegahan" dan lencana emas' },
  { xp: 1400, title: 'Legenda Kuannoah', reward: 'Gelar tertinggi "Legenda Kuannoah"' },
];

export const LEVEL_COLORS = ['#8a7a68', '#3e7d4f', '#2a5da8', '#6b4aa0', '#d4782a', '#b83a2a', '#8f9aa6', '#c68a1e', '#2a1e16'];

export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    title: LEVELS[i].title,
    color: LEVEL_COLORS[i],
    /** XP di dalam level ini dan XP yang dibutuhkan untuk naik (null di level maksimum). */
    into: xp - LEVELS[i].xp,
    need: next ? next.xp - LEVELS[i].xp : null,
  };
}

export const XP = { finish: 20, win: 30, lose: 15, mission: 15, quiz: 5 } as const;

export function sessionXp(s: GameState): { label: string; xp: number }[] {
  const items: { label: string; xp: number }[] = [
    { label: 'Sesi selesai', xp: XP.finish },
    s.outcome === 'victory' ? { label: 'Menang', xp: XP.win } : { label: 'Belajar dari kekalahan', xp: XP.lose },
  ];
  if (s.missionsDone.length) items.push({ label: `${s.missionsDone.length} misi`, xp: s.missionsDone.length * XP.mission });
  if (s.quizCorrect) items.push({ label: `${s.quizCorrect} kuis benar`, xp: s.quizCorrect * XP.quiz });
  return items;
}

export function isScenarioUnlocked(p: Progress, id: ScenarioId, unlockAll: boolean): boolean {
  const idx = SCENARIOS.findIndex((s) => s.id === id);
  if (idx <= 0 || unlockAll) return true;
  return (p.played[SCENARIOS[idx - 1].id] ?? 0) > 0;
}

/* ---------- pencapaian ---------- */

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'shield' | 'book' | 'check' | 'hex' | 'people' | 'megaphone' | 'help';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-run', title: 'Langkah Pertama', description: 'Selesaikan satu sesi permainan.', icon: 'check' },
  { id: 'first-win', title: 'Simulasi Berhasil', description: 'Menangkan satu sesi.', icon: 'trophy' },
  { id: 'protector', title: 'Pelindung Dusun', description: 'Lihat warga menang: kesadaran mencapai 100%.', icon: 'shield' },
  { id: 'quiz-10', title: 'Pemburu Fakta', description: 'Jawab benar 10 kuis Mitos atau Fakta.', icon: 'help' },
  { id: 'quiz-perfect', title: 'Tanpa Salah', description: 'Jawab benar semua kuis dalam satu sesi (minimal 3).', icon: 'check' },
  { id: 'roamer', title: 'Keliling Dusun', description: 'Menyebar di keempat wilayah dalam satu sesi.', icon: 'people' },
  { id: 'honest', title: 'Main Bersih', description: 'Menang tanpa Sebar Hoaks.', icon: 'megaphone' },
  { id: 'three-stars', title: 'Bintang Tiga', description: 'Selesaikan ketiga misi dalam satu skenario.', icon: 'trophy' },
  { id: 'all-played', title: 'Penjelajah Penyakit', description: 'Mainkan kelima skenario penyakit.', icon: 'hex' },
  { id: 'all-wins', title: 'Juara Lima Penyakit', description: 'Menang di kelima skenario.', icon: 'trophy' },
  { id: 'dex-10', title: 'Kutu Buku Patho-Dex', description: 'Buka 10 entri Patho-Dex.', icon: 'book' },
  { id: 'tutorial', title: 'Siap Bertugas', description: 'Selesaikan panduan Cara Bermain.', icon: 'help' },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<string, AchievementDef>;

function unlocked(p: Progress, s?: GameState): string[] {
  const ids: string[] = [];
  const all = SCENARIOS.map((x) => x.id);
  if (s) {
    ids.push('first-run');
    if (s.outcome === 'victory') ids.push('first-win');
    if (s.outcome === 'defeat') ids.push('protector');
    if (s.quizAnswered >= 3 && s.quizCorrect === s.quizAnswered) ids.push('quiz-perfect');
    if (s.regionsVisited.length >= 4) ids.push('roamer');
    if (s.outcome === 'victory' && !s.misinformationUsed) ids.push('honest');
  }
  if (p.quizCorrect >= 10) ids.push('quiz-10');
  if (Object.values(p.stars).some((n) => (n ?? 0) >= 3)) ids.push('three-stars');
  if (all.every((id) => (p.played[id] ?? 0) > 0)) ids.push('all-played');
  if (all.every((id) => (p.wins[id] ?? 0) > 0)) ids.push('all-wins');
  if (p.dexOpened >= 10) ids.push('dex-10');
  if (p.tutorialDone) ids.push('tutorial');
  return ids.filter((id) => !p.achievements.includes(id));
}

/** Menambahkan pencapaian baru (tanpa sesi), mis. setelah membuka Patho-Dex. */
export function withAchievements(p: Progress): { progress: Progress; added: string[] } {
  const added = unlocked(p);
  return { progress: added.length ? { ...p, achievements: [...p.achievements, ...added] } : p, added };
}

export interface SessionSummary {
  progress: Progress;
  xp: { label: string; xp: number }[];
  totalXp: number;
  stars: number;
  levelBefore: number;
  levelAfter: number;
  newAchievements: string[];
  /** Skenario yang baru terbuka karena sesi ini. */
  unlockedScenario: ScenarioId | null;
}

export function applySession(p: Progress, s: GameState, unlockAll = false): SessionSummary {
  const xp = sessionXp(s);
  const totalXp = xp.reduce((sum, x) => sum + x.xp, 0);
  const stars = s.missionsDone.length;
  const id = s.scenario;
  const idx = SCENARIOS.findIndex((x) => x.id === id);
  const nextId = SCENARIOS[idx + 1]?.id ?? null;
  const wasLocked = nextId !== null && !isScenarioUnlocked(p, nextId, unlockAll);

  let next: Progress = {
    ...p,
    xp: p.xp + totalXp,
    stars: { ...p.stars, [id]: Math.max(p.stars[id] ?? 0, stars) },
    played: { ...p.played, [id]: (p.played[id] ?? 0) + 1 },
    wins: { ...p.wins, [id]: (p.wins[id] ?? 0) + (s.outcome === 'victory' ? 1 : 0) },
    quizCorrect: p.quizCorrect + s.quizCorrect,
  };
  const added = unlocked(next, s);
  next = { ...next, achievements: [...next.achievements, ...added] };
  return {
    progress: next,
    xp,
    totalXp,
    stars,
    levelBefore: levelOf(p.xp).level,
    levelAfter: levelOf(next.xp).level,
    newAchievements: added,
    unlockedScenario: wasLocked && nextId && isScenarioUnlocked(next, nextId, unlockAll) ? nextId : null,
  };
}

export const scenarioName = (id: ScenarioId) => SCENARIO_BY_ID[id].name;

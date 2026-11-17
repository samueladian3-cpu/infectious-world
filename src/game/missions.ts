import type { GameState, MissionDef, MutationBranch } from './types.js';

const BRANCH_WORD: Record<MutationBranch, string> = { transmission: 'Penularan', symptom: 'Gejala Terlihat', persistence: 'Daya Tahan' };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function missionLabel(m: MissionDef): string {
  switch (m.kind) {
    case 'win':
      return 'Capai Sebaran Infeksi 100%';
    case 'winUnder':
      return `Menang dalam waktu ${mmss(m.seconds)}`;
    case 'winNoHoax':
      return 'Menang tanpa Sebar Hoaks';
    case 'winNoBranch':
      return `Menang tanpa membeli cabang ${BRANCH_WORD[m.branch]}`;
    case 'quiz':
      return `Jawab benar ${m.count} kuis Mitos atau Fakta`;
    case 'regions':
      return `Menyebar di ${m.count} wilayah berbeda`;
    case 'survive':
      return `Bertahan minimal ${mmss(m.seconds)}`;
  }
}

/** Misi "langsung" bisa selesai di tengah sesi dan memberi hadiah PI. */
export const isLiveMission = (m: MissionDef) => m.kind === 'quiz' || m.kind === 'regions' || m.kind === 'survive';

export function missionMet(s: GameState, m: MissionDef): boolean {
  const win = s.outcome === 'victory';
  switch (m.kind) {
    case 'win':
      return win;
    case 'winUnder':
      return win && s.elapsedSeconds <= m.seconds;
    case 'winNoHoax':
      return win && !s.misinformationUsed;
    case 'winNoBranch':
      return win && !s.unlockedNodes.some((id) => id[0] === { transmission: 'A', symptom: 'B', persistence: 'C' }[m.branch]);
    case 'quiz':
      return s.quizCorrect >= m.count;
    case 'regions':
      return s.regionsVisited.length >= m.count;
    case 'survive':
      return s.elapsedSeconds >= m.seconds;
  }
}

/** Kemajuan misi untuk HUD: [nilai, target] atau null bila hanya dinilai di akhir. */
export function missionProgress(s: GameState, m: MissionDef): [number, number] | null {
  if (m.kind === 'quiz') return [Math.min(s.quizCorrect, m.count), m.count];
  if (m.kind === 'regions') return [Math.min(s.regionsVisited.length, m.count), m.count];
  if (m.kind === 'survive') return [Math.min(s.elapsedSeconds, m.seconds), m.seconds];
  return null;
}

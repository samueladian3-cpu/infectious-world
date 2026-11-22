import { CONFIG } from './config.js';
import { canPurchase, canSwitchRegion, canUseAbility, canUseMisinformation, isTerminal, scenarioOf } from './engine.js';
import { MUTATION_BY_ID } from './mutations.js';
import { REGION_BY_ID, REGION_IDS } from './regions.js';
import type { GameState, MutationId, RegionId } from './types.js';

export interface Advice {
  /** Kunci stabil agar UI tidak berkedip bila saran sama. */
  key: string;
  text: string;
  tone: 'go' | 'warn' | 'tip';
}

/** Urutan mutasi yang disarankan: penularan dan daya tahan, cabang gejala dihindari. */
const PLAN: MutationId[] = ['A1', 'C1', 'A2', 'C2'];

/** Wilayah dengan selisih pengali infeksi dan kesadaran terbaik untuk penyakit ini. */
export function bestRegion(s: GameState): RegionId {
  const mods = scenarioOf(s).regions;
  const score = (id: RegionId) => mods[id].inf - mods[id].aw * 1.2;
  return REGION_IDS.reduce((a, b) => (score(b) > score(a) ? b : a));
}

/**
 * Penasihat strategi: satu saran paling penting untuk detik ini.
 * Murni membaca state, tidak mengubah apa pun.
 */
export function advise(s: GameState): Advice | null {
  if (isTerminal(s) || s.pendingDecision) return null;
  const sc = scenarioOf(s);
  const aw = s.awarenessLevel;

  if (s.flash) return { key: 'flash', text: 'Jawab Fakta Cepat sebelum waktunya habis. Jawaban benar memberi PI dan menambah beruntun.', tone: 'go' };

  if (aw >= 70 && canUseAbility(s, 'silent').ok) {
    return { key: 'silent', text: `Kesadaran warga ${Math.floor(aw)}%! Pakai ${sc.abilities.silent.name} supaya kesadaran berhenti naik ${CONFIG.ability.silent.seconds} detik.`, tone: 'warn' };
  }
  if (aw >= 80 && canUseMisinformation(s).ok) {
    return { key: 'hoax', text: `Saatnya Sebar Hoaks: kesadaran warga turun ${CONFIG.misinformation.awarenessReduction} poin. Ingat, Cek Fakta akan menaikkannya lagi.`, tone: 'warn' };
  }

  const next = PLAN.find((id) => !s.unlockedNodes.includes(id));
  if (next && canPurchase(s, next).ok) {
    const why = next.startsWith('A') ? 'penularan naik tanpa membuat warga cepat sadar' : 'infeksi bertambah dan aksi warga jadi kurang ampuh';
    return { key: `buy-${next}`, text: `Beli ${sc.mutations[next].name} (${next}) di Pohon Mutasi sekarang: ${why}.`, tone: 'go' };
  }

  const best = bestRegion(s);
  if (best !== s.region && s.elapsedSeconds >= 10 && canSwitchRegion(s, best).ok) {
    const cur = sc.regions[s.region];
    const tgt = sc.regions[best];
    if (tgt.inf - tgt.aw * 1.2 - (cur.inf - cur.aw * 1.2) >= 0.15) {
      return { key: `region-${best}`, text: `Pindah ke ${REGION_BY_ID[best].name}: ${tgt.note}`, tone: 'tip' };
    }
  }

  if (s.infectionRate >= 20 && canUseAbility(s, 'surge').ok && (!next || s.infectionPoints >= MUTATION_BY_ID[next].cost + CONFIG.ability.surge.cost)) {
    return { key: 'surge', text: `PI cukup. Pakai ${sc.abilities.surge.name} supaya infeksi melonjak ${CONFIG.ability.surge.seconds} detik.`, tone: 'go' };
  }

  if (s.bubbles.length && s.bubblesCollected < 6) return { key: 'bubble', text: 'Klik gelembung virus yang muncul di peta untuk mendapat PI tambahan.', tone: 'tip' };

  if (next) {
    const node = MUTATION_BY_ID[next];
    const need = node.cost - s.infectionPoints;
    if (need > 0) {
      return { key: `save-${next}`, text: `Kumpulkan ${need} PI lagi untuk ${sc.mutations[next].name} (${next}). Klik gelembung dan jawab kuis supaya lebih cepat.`, tone: 'tip' };
    }
  }
  if (s.stats.symptomVisibilityLevel === 1 && s.unlockedNodes.length >= 2) {
    return { key: 'avoid-b', text: `Hati-hati dengan cabang ${sc.branchLabels.symptom}: gejala yang terlihat membuat warga cepat sadar.`, tone: 'tip' };
  }
  return { key: 'keep', text: `Terus kumpulkan PI dan simpan ${sc.abilities.silent.name} untuk saat kesadaran warga tinggi.`, tone: 'tip' };
}

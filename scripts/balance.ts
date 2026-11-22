/**
 * Simulasi penyeimbangan: win rate dan durasi per skenario, tingkat kesulitan, dan tipe pemain.
 * Jalankan: npm run balance
 */
import { CONFIG } from '../src/game/config';
import {
  activateAbility,
  activateMisinformation,
  answerFlash,
  collectBubble,
  decide,
  decisionDef,
  isTerminal,
  nextRandom,
  purchaseMutation,
  quizDef,
  startSession,
  switchRegion,
  tick,
} from '../src/game/engine';
import { bestRegion } from '../src/game/advisor';
import { REGION_IDS } from '../src/game/regions';
import { SCENARIOS } from '../src/game/scenarios';
import type { DecisionEffect, GameState, MutationId, PlayMode, RegionId } from '../src/game/types';

interface Policy {
  name: string;
  order: MutationId[];
  quizAccuracy: number;
  /** Peluang sebuah gelembung diambil sebelum hilang. */
  bubbleRate: number;
  /** Peluang menjawab Fakta Cepat sebelum habis. */
  flashRate: number;
  abilities: boolean;
  hoaxAt: number;
  region: (s: GameState, r: () => number) => RegionId;
  pick: (effects: DecisionEffect[], r: () => number) => number;
  roam: boolean;
}

const value = (e: DecisionEffect) =>
  (e.infection ?? 0) + (e.boost?.inf ?? 0) * (e.boost?.seconds ?? 0) * 0.35 - (e.awareness ?? 0) - (e.boost?.aw ?? 0) * (e.boost?.seconds ?? 0) * 0.3 + (e.ip ?? 0) * 0.12;

const POLICIES: Policy[] = [
  { name: 'pasif', order: [], quizAccuracy: 0.5, bubbleRate: 0, flashRate: 0, abilities: false, hoaxAt: 999, region: () => 'pasar', pick: (e) => e.length - 1, roam: false },
  {
    name: 'pemula',
    order: ['A1', 'B1', 'C1', 'A2'],
    quizAccuracy: 0.6,
    bubbleRate: 0.35,
    flashRate: 0.5,
    abilities: false,
    hoaxAt: 90,
    region: (_s, r) => REGION_IDS[Math.floor(r() * 4)],
    pick: (e, r) => Math.floor(r() * e.length),
    roam: false,
  },
  {
    name: 'wajar',
    order: ['A1', 'C1', 'A2', 'C2'],
    quizAccuracy: 0.7,
    bubbleRate: 0.6,
    flashRate: 0.75,
    abilities: true,
    hoaxAt: 85,
    region: (_s, r) => REGION_IDS[Math.floor(r() * 4)],
    pick: (e, r) => Math.floor(r() * e.length),
    roam: true,
  },
  {
    name: 'ahli',
    order: ['A1', 'A2', 'C1', 'C2'],
    quizAccuracy: 0.9,
    bubbleRate: 0.9,
    flashRate: 0.95,
    abilities: true,
    hoaxAt: 88,
    region: (s) => bestRegion(s),
    pick: (e) => e.map(value).reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0),
    roam: false,
  },
];

function run(scenario: GameState['scenario'], mode: PlayMode, p: Policy, seed: number) {
  let rs = seed * 7919 + 13;
  const r = () => {
    const [v, n] = nextRandom(rs);
    rs = n;
    return v;
  };
  const probe = startSession(seed, scenario, 'pasar', mode);
  let s = startSession(seed, scenario, p.region(probe, r), mode);
  const order = [...p.order];
  const flashPlan = new Map<string, boolean>();
  const bubblePlan = new Map<number, number>();
  while (!isTerminal(s) && s.elapsedSeconds < 1500) {
    if (s.pendingDecision) {
      const def = decisionDef(s, s.pendingDecision.id)!;
      let choice: number;
      if (def.kind === 'quiz') choice = (r() < p.quizAccuracy) === def.isTrue ? 0 : 1;
      else choice = p.pick(def.options.map((o) => o.effect), r);
      let res = decide(s, choice);
      for (let i = 0; !res.ok; i++) res = decide(s, i);
      s = res.state;
      continue;
    }
    s = tick(s);
    if (isTerminal(s)) break;
    for (const b of s.bubbles) {
      // Tiap gelembung diputuskan sekali: diambil 1–4 detik setelah muncul, atau dibiarkan.
      if (!bubblePlan.has(b.id)) bubblePlan.set(b.id, r() < p.bubbleRate ? s.elapsedSeconds + 1 + Math.floor(r() * 4) : Infinity);
      if (s.elapsedSeconds >= bubblePlan.get(b.id)!) s = collectBubble(s, b.id).state;
    }
    if (s.flash) {
      const key = `${s.flash.id}@${s.flash.startedAt}`;
      if (!flashPlan.has(key)) flashPlan.set(key, r() < p.flashRate);
      if (flashPlan.get(key) && s.elapsedSeconds - s.flash.startedAt >= 3) {
        const q = quizDef(s, s.flash.id)!;
        s = answerFlash(s, (r() < p.quizAccuracy) === q.isTrue ? 0 : 1).state;
      }
    }
    if (order.length) {
      const res = purchaseMutation(s, order[0]);
      if (res.ok) {
        s = res.state;
        order.shift();
      }
    }
    if (p.abilities) {
      if (s.awarenessLevel >= 65) s = activateAbility(s, 'silent').state;
      if (s.infectionRate >= 25 && (!order.length || s.infectionPoints > 45)) s = activateAbility(s, 'surge').state;
    }
    if (p.roam && s.regionsVisited.length < 3 && s.infectionPoints > 40) {
      const next = REGION_IDS.find((id) => !s.regionsVisited.includes(id) && id !== 'puskesmas');
      if (next) s = switchRegion(s, next).state;
    }
    if (s.awarenessLevel >= p.hoaxAt) s = activateMisinformation(s).state;
  }
  return s;
}

const N = Number(process.env.N ?? 200);
const modes: PlayMode[] = process.env.MODE ? [process.env.MODE as PlayMode] : ['santai', 'normal', 'tantangan'];
console.log(`win rate dari ${N} seed · Momen Penentu tiap ${CONFIG.decision.intervalSeconds} dtk · Fakta Cepat tiap ${CONFIG.flash.intervalSeconds} dtk`);
for (const mode of modes) {
  console.log(`\n== ${mode.toUpperCase()}`);
  for (const sc of SCENARIOS) {
    const row = POLICIES.map((p) => {
      let wins = 0;
      let dur = 0;
      let missions = 0;
      for (let seed = 1; seed <= N; seed++) {
        const s = run(sc.id, mode, p, seed);
        if (s.outcome === 'victory') wins++;
        dur += s.elapsedSeconds;
        missions += s.missionsDone.length;
      }
      return `${p.name} ${String(Math.round((wins / N) * 100)).padStart(3)}% ${Math.round(dur / N)}s m${(missions / N).toFixed(1)}`;
    });
    console.log(`${sc.name.padEnd(6)} (${sc.difficulty.padEnd(5)}) | ${row.join(' | ')}`);
  }
}

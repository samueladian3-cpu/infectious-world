/**
 * Simulasi penyeimbangan: win rate dan durasi per skenario untuk tiga tipe pemain.
 * Jalankan: npm run balance
 */
import { CONFIG } from '../src/game/config';
import { activateMisinformation, decide, decisionDef, isTerminal, nextRandom, purchaseMutation, startSession, switchRegion, tick } from '../src/game/engine';
import { REGION_IDS } from '../src/game/regions';
import { SCENARIOS } from '../src/game/scenarios';
import type { DecisionEffect, GameState, MutationId, RegionId } from '../src/game/types';

interface Policy {
  name: string;
  order: MutationId[];
  quizAccuracy: number;
  hoaxAt: number;
  region: (s: GameState, r: () => number) => RegionId;
  pick: (effects: DecisionEffect[], r: () => number) => number;
  roam: boolean;
}

const value = (e: DecisionEffect) =>
  (e.infection ?? 0) + (e.boost?.inf ?? 0) * (e.boost?.seconds ?? 0) * 0.35 - (e.awareness ?? 0) - (e.boost?.aw ?? 0) * (e.boost?.seconds ?? 0) * 0.3 + (e.ip ?? 0) * 0.12;

const bestRegion = (s: GameState): RegionId => {
  const mods = SCENARIOS.find((x) => x.id === s.scenario)!.regions;
  return REGION_IDS.reduce((a, b) => (mods[b].inf - mods[b].aw > mods[a].inf - mods[a].aw ? b : a));
};

const POLICIES: Policy[] = [
  { name: 'pasif', order: [], quizAccuracy: 0.5, hoaxAt: 999, region: () => 'pasar', pick: (e) => e.length - 1, roam: false },
  {
    name: 'wajar',
    order: ['A1', 'C1', 'A2', 'C2'],
    quizAccuracy: 0.7,
    hoaxAt: 85,
    region: (_s, r) => REGION_IDS[Math.floor(r() * 4)],
    pick: (e, r) => Math.floor(r() * e.length),
    roam: true,
  },
  {
    name: 'ahli',
    order: ['A1', 'A2', 'C1', 'C2'],
    quizAccuracy: 0.9,
    hoaxAt: 88,
    region: bestRegion,
    pick: (e) => e.map(value).reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0),
    roam: false,
  },
];

function run(scenario: GameState['scenario'], p: Policy, seed: number) {
  let rs = seed * 7919 + 13;
  const r = () => {
    const [v, n] = nextRandom(rs);
    rs = n;
    return v;
  };
  const probe = startSession(seed, scenario, 'pasar');
  let s = startSession(seed, scenario, p.region(probe, r));
  const order = [...p.order];
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
    if (order.length) {
      const res = purchaseMutation(s, order[0]);
      if (res.ok) {
        s = res.state;
        order.shift();
      }
    }
    if (p.roam && s.regionsVisited.length < 3 && s.infectionPoints > 40) {
      const next = REGION_IDS.find((id) => !s.regionsVisited.includes(id) && id !== 'puskesmas');
      if (next) s = switchRegion(s, next).state;
    }
    if (s.awarenessLevel >= p.hoaxAt) s = activateMisinformation(s).state;
  }
  return s;
}

const N = 200;
console.log(`win rate dari ${N} seed · decision tiap ${CONFIG.decision.intervalSeconds} dtk`);
for (const sc of SCENARIOS) {
  const row = POLICIES.map((p) => {
    let wins = 0;
    let dur = 0;
    let missions = 0;
    for (let seed = 1; seed <= N; seed++) {
      const s = run(sc.id, p, seed);
      if (s.outcome === 'victory') wins++;
      dur += s.elapsedSeconds;
      missions += s.missionsDone.length;
    }
    return `${p.name} ${String(Math.round((wins / N) * 100)).padStart(3)}% ${Math.round(dur / N)}s m${(missions / N).toFixed(1)}`;
  });
  console.log(`${sc.name.padEnd(6)} (${sc.difficulty.padEnd(5)}) | ${row.join(' | ')}`);
}

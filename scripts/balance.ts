import { startSession, tick, purchaseMutation, activateMisinformation, isTerminal } from '../src/game/engine';
import type { MutationId } from '../src/game/types';
function run(order: MutationId[], misAt: number, seed: number) {
  let s = startSession(seed); const bought: string[] = [];
  while (!isTerminal(s) && s.elapsedSeconds < 2000) {
    s = tick(s);
    if (order.length) { const r = purchaseMutation(s, order[0]); if (r.ok) { s = r.state; bought.push(order.shift()! + '@' + s.elapsedSeconds); } }
    if (s.awarenessLevel >= misAt) { const r = activateMisinformation(s); if (r.ok) { s = r.state; bought.push('MIS@'+s.elapsedSeconds);} }
  }
  return `${s.outcome} t=${s.elapsedSeconds} inf=${s.infectionRate.toFixed(1)} aw=${s.awarenessLevel.toFixed(1)} [${bought.join(',')}]`;
}
const strategies: [string, MutationId[], number][] = [
  ['A', ['A1','A2'], 999], ['A+mis90', ['A1','A2'], 90], ['A1,C1,mis', ['A1','C1'], 85], ['A1,A2,C1,mis', ['A1','A2','C1'], 92]];
const res: Record<string, number> = {};
for (const [n, o, m] of strategies) for (let seed = 1; seed <= 200; seed++) { const r = run([...o], m, seed); if (r.startsWith('victory')) res[n]=(res[n]??0)+1; if (seed<3) console.log(n, r); }
console.log('wins/200', res);

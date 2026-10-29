import { baseAwarenessGain, baseInfectionGain, canPurchase } from '../game/engine';
import { BRANCH_LABEL, MUTATIONS, MUTATION_BY_ID } from '../game/mutations';
import type { GameState, MutationBranch, MutationId } from '../game/types';
import { useDialog } from '../ui/hooks';
import { BRANCH_META } from '../ui/meta';
import { fmtRate, formatTime } from '../screens/format';
import { Ico, Weave } from './ui';

const BRANCHES: MutationBranch[] = ['transmission', 'symptom', 'persistence'];

/** Nama singkat untuk kartu node. */
const shortName = (name: string) => name.replace(' Profile', '').replace('Increased ', '').replace('High ', '');

interface Props {
  state: GameState;
  wide: boolean;
  selected: MutationId;
  onSelect: (id: MutationId) => void;
  onBuy: (id: MutationId) => void;
  onClose: () => void;
}

/** Mutation Tree. Simulasi tetap berjalan selama panel ini terbuka. */
export function MutationTree({ state, wide, selected, onSelect, onBuy, onClose }: Props) {
  const panel = useDialog<HTMLElement>(onClose);
  const owned = new Set(state.unlockedNodes);
  const ip = state.infectionPoints;

  const sm = MUTATION_BY_ID[selected];
  const after = { ...state.stats, [sm.stat]: state.stats[sm.stat] + sm.statDelta };
  const isOwnedSel = owned.has(sm.id);
  const iF = baseInfectionGain(state.stats);
  const iT = isOwnedSel ? iF : baseInfectionGain(after);
  const aF = baseAwarenessGain(state.stats);
  const aT = isOwnedSel ? aF : baseAwarenessGain(after);
  const risky = !isOwnedSel && aT - aF > iT - iF;
  const check = canPurchase(state, sm.id);

  return (
    <>
      <div className={`tree-scrim${wide ? ' tree-scrim-clear' : ''}`} onClick={wide ? undefined : onClose} />
      <section className={`tree ${wide ? 'tree-wide' : 'tree-sheet'}`} role="dialog" aria-label="Mutation Tree" ref={panel} tabIndex={-1}>
        <Weave className="weave-top" />
        <div className="tree-head">
          <div className="row">
            <h2 className="display-26">MUTATION TREE</h2>
            <span className="live">
              <span className="live-dot" />
              {formatTime(state.elapsedSeconds)} · tetap berjalan
            </span>
            <span className="grow" />
            <span className="ip-chip">
              {ip}
              <small>IP</small>
            </span>
            <button type="button" className="btn btn-hi btn-icon btn-close" onClick={onClose} aria-label="Tutup Mutation Tree">
              <Ico name="close" size={20} stroke={2.6} />
            </button>
          </div>
          <div className="tree-mini">
            <MiniBar value={state.infectionRate} color="var(--infect)" />
            <MiniBar value={state.awarenessLevel} color="var(--aware)" />
          </div>
        </div>

        <div className="tree-scroll">
          <div className="tree-cols">
            {BRANCHES.map((b) => {
              const meta = BRANCH_META[b];
              return (
                <div key={b} className="tree-col">
                  <div className="tree-col-head" style={{ color: meta.color }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={meta.icon} />
                    </svg>
                    <span>{BRANCH_LABEL[b]}</span>
                    {meta.risky && (
                      <span className="risky">
                        <Ico name="warn" size={11} stroke={3} />
                        BERISIKO
                      </span>
                    )}
                  </div>
                  {MUTATIONS.filter((m) => m.branch === b).map((m) => {
                    const isOwned = owned.has(m.id);
                    const prereqOk = !m.prerequisite || owned.has(m.prerequisite);
                    const can = !isOwned && prereqOk && ip >= m.cost;
                    const poor = !isOwned && prereqOk && !can;
                    const locked = !isOwned && !prereqOk;
                    const status = isOwned ? 'owned' : can ? 'can' : poor ? 'poor' : 'locked';
                    const aria = `${m.id} ${m.name}, ${
                      isOwned ? 'sudah dibeli' : locked ? `terkunci, butuh ${m.prerequisite}` : poor ? `IP kurang, ${ip} dari ${m.cost}` : `bisa dibeli, ${m.cost} IP`
                    }`;
                    return (
                      <div key={m.id} className="tree-slot">
                        {m.prerequisite && <span className={`tree-link${m.prerequisite && owned.has(m.prerequisite) ? '' : ' tree-link-off'}`} />}
                        <button
                          type="button"
                          className={`node node-${status}${selected === m.id ? ' node-sel' : ''}`}
                          style={isOwned ? { background: meta.color } : undefined}
                          onClick={() => onSelect(m.id)}
                          aria-pressed={selected === m.id}
                          aria-label={aria}
                        >
                          <span className="node-top">
                            <span className="node-id">{m.id}</span>
                            <span className="grow" />
                            {locked && <Ico name="lock" size={18} stroke={2.6} />}
                            {can && <span className="node-buy">BELI</span>}
                          </span>
                          <span className="node-name">{shortName(m.name)}</span>
                          <span className="node-cost">
                            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                              <circle cx="8" cy="8" r="6.5" fill="#F2B33D" stroke="#2A1E16" strokeWidth="1.6" />
                            </svg>
                            {isOwned ? 'dibeli' : locked ? `Butuh ${m.prerequisite}` : poor ? `${ip}/${m.cost} IP` : `${m.cost} IP`}
                          </span>
                          {poor && (
                            <span className="node-prog">
                              <span style={{ width: `${Math.min(100, (ip / m.cost) * 100)}%` }} />
                            </span>
                          )}
                          {isOwned && <span className="node-stamp">DIBELI</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="node-detail" aria-live="polite">
            <div className="row-wrap">
              <span className="eyebrow">{sm.id} · {BRANCH_LABEL[sm.branch]}</span>
              <span className="chip chip-ip">{sm.cost} IP</span>
              <span className="chip">Prasyarat: {sm.prerequisite ?? '—'}</span>
            </div>
            <span className="display-22">{sm.name}</span>
            <span className="detail-desc">{sm.description}</span>
            <ul className="detail-effects">
              {sm.effects.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <div className="rate-preview">
              <div className="rate rate-inf">
                <span>LAJU INFEKSI</span>
                <strong>{fmtRate(iF)} → <em>{fmtRate(iT)}</em></strong>
              </div>
              <div className={`rate rate-aw${!isOwnedSel && aT > aF ? ' rate-up' : ''}`}>
                <span>LAJU AWARENESS</span>
                <strong>{fmtRate(aF)} → <em>{fmtRate(aT)}</em></strong>
              </div>
            </div>
            {risky && (
              <div className="tradeoff">
                <Ico name="warn" size={18} stroke={2.6} />
                <span>
                  Trade-off: awareness warga naik {fmtRate(aT - aF).replace('/dtk', '')}/dtk, lebih besar dari tambahan infeksi {fmtRate(iT - iF).replace('/dtk', '')}/dtk.
                </span>
              </div>
            )}
            <button
              type="button"
              className={`btn btn-red btn-buy${check.ok ? '' : ' btn-buy-reason'}`}
              onClick={() => onBuy(sm.id)}
              aria-disabled={!check.ok}
            >
              {check.ok ? `BELI ${sm.id} · ${sm.cost} IP` : check.reason}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mini">
      <span className="mini-pct" style={{ color }}>{Math.floor(value)}%</span>
      <span className="mini-track">
        <span style={{ width: `${value}%`, background: color }} />
      </span>
    </div>
  );
}

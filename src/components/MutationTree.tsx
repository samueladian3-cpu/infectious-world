import { useState } from 'react';
import { canPurchase } from '../game/engine';
import { BRANCH_LABEL, MUTATIONS, MUTATION_BY_ID } from '../game/mutations';
import type { GameState, MutationBranch, MutationId } from '../game/types';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { useToast } from './Toast';

const BRANCHES: MutationBranch[] = ['transmission', 'symptom', 'persistence'];

type NodeStatus = 'purchased' | 'available' | 'unaffordable' | 'locked';

function nodeStatus(state: GameState, id: MutationId): NodeStatus {
  const node = MUTATION_BY_ID[id];
  if (state.unlockedNodes.includes(id)) return 'purchased';
  if (node.prerequisite && !state.unlockedNodes.includes(node.prerequisite)) return 'locked';
  if (state.infectionPoints < node.cost) return 'unaffordable';
  return 'available';
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  purchased: 'Dibeli',
  available: 'Bisa dibeli',
  unaffordable: 'IP kurang',
  locked: 'Terkunci',
};

interface Props {
  state: GameState;
  onPurchase: (id: MutationId) => void;
  onClose: () => void;
}

export function MutationTree({ state, onPurchase, onClose }: Props) {
  const [selected, setSelected] = useState<MutationId>('A1');
  const toast = useToast();
  const node = MUTATION_BY_ID[selected];
  const check = canPurchase(state, selected);
  const status = nodeStatus(state, selected);

  const buy = () => {
    if (!check.ok) {
      toast(check.reason, 'warn');
      return;
    }
    onPurchase(selected);
    toast(`${node.id} "${node.name}" berhasil dibeli. −${node.cost} IP`, 'good');
  };

  return (
    <Modal title="Mutation Tree" onClose={onClose} variant="wide" closeLabel="Tutup Mutation Tree">
      <div className="tree-wrap">
        <div className="tree-top">
          <span className="chip">
            <Icon name="coin" size={16} /> {state.infectionPoints} IP
          </span>
          <span className="muted small">
            {state.gameStatus === 'running' ? 'Simulasi tetap berjalan saat tree terbuka.' : 'Simulasi dijeda.'}
          </span>
        </div>
        <div className="tree" role="group" aria-label="Node mutasi">
          {BRANCHES.map((branch) => (
            <div key={branch} className={`branch branch-${branch}`}>
              <h4>{BRANCH_LABEL[branch]}</h4>
              {MUTATIONS.filter((m) => m.branch === branch).map((m, idx) => {
                const st = nodeStatus(state, m.id);
                return (
                  <div key={m.id} className="node-slot">
                    {idx > 0 && <span className={`connector${st === 'locked' ? '' : ' connector-on'}`} aria-hidden="true" />}
                    <button
                      type="button"
                      className={`node node-${st}${selected === m.id ? ' node-selected' : ''}`}
                      onClick={() => setSelected(m.id)}
                      aria-pressed={selected === m.id}
                      aria-label={`${m.id} ${m.name}, ${m.cost} IP, ${STATUS_LABEL[st]}`}
                    >
                      <span className="node-id">{m.id}</span>
                      <span className="node-icon">
                        <Icon name={st === 'purchased' ? 'check' : st === 'locked' ? 'lock' : 'dna'} size={18} />
                      </span>
                      <span className="node-cost">{m.cost} IP</span>
                      <span className="node-status">{STATUS_LABEL[st]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <aside className="node-detail glass" aria-live="polite">
          <div className="detail-head">
            <span className={`badge badge-${node.branch}`}>{BRANCH_LABEL[node.branch]}</span>
            <span className={`badge status-${status}`}>{STATUS_LABEL[status]}</span>
          </div>
          <h3>
            {node.id} · {node.name}
          </h3>
          <dl className="detail-list">
            <div><dt>Biaya</dt><dd>{node.cost} IP</dd></div>
            <div><dt>Prasyarat</dt><dd>{node.prerequisite ? `${node.prerequisite} (${MUTATION_BY_ID[node.prerequisite].name})` : 'Tidak ada'}</dd></div>
          </dl>
          <p>{node.description}</p>
          <h4 className="small-head">Efek yang diharapkan</h4>
          <ul className="effects">
            {node.effects.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={buy}
            aria-disabled={!check.ok}
            data-disabled={!check.ok || undefined}
          >
            {status === 'purchased' ? 'Sudah dibeli' : check.ok ? `Beli (${node.cost} IP)` : `Tidak bisa dibeli: ${check.reason}`}
          </button>
          <p className="muted small">Mutasi ini adalah mekanik fiktif, bukan proses biologis nyata.</p>
        </aside>
      </div>
    </Modal>
  );
}

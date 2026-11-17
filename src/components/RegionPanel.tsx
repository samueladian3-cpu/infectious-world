import { CONFIG } from '../game/config';
import { canSwitchRegion, scenarioOf } from '../game/engine';
import { REGIONS } from '../game/regions';
import type { GameState, RegionId } from '../game/types';
import { useDialog } from '../ui/hooks';
import { regionChips } from '../ui/meta';
import { Ico } from './ui';

interface Props {
  state: GameState;
  onSwitch: (id: RegionId) => void;
  onClose: () => void;
}

/** Pindah wilayah fokus. Simulasi tetap berjalan selama panel terbuka. */
export function RegionPanel({ state, onSwitch, onClose }: Props) {
  const panel = useDialog<HTMLElement>(onClose);
  const sc = scenarioOf(state);
  const wait = state.regionReadyAt - state.elapsedSeconds;
  return (
    <>
      <div className="tree-scrim" onClick={onClose} />
      <section className="region-sheet" role="dialog" aria-label="Wilayah fokus" ref={panel} tabIndex={-1}>
        <div className="row">
          <h2 className="display-22 grow">Wilayah Fokus</h2>
          <span className="chip chip-ip">{CONFIG.region.switchCost} PI per pindah</span>
          <button type="button" className="btn btn-hi btn-icon btn-close" onClick={onClose} aria-label="Tutup panel wilayah">
            <Ico name="close" size={20} stroke={2.6} />
          </button>
        </div>
        <p className="muted small strong">
          {wait > 0 ? `Bisa pindah lagi dalam ${wait} dtk.` : `Setelah pindah, tunggu ${CONFIG.region.cooldownSeconds} dtk sebelum pindah lagi.`} Simulasi tetap berjalan.
        </p>
        <div className="region-grid">
          {REGIONS.map((r) => {
            const here = state.region === r.id;
            const check = canSwitchRegion(state, r.id);
            return (
              <button
                key={r.id}
                type="button"
                className={`region-card${here ? ' is-selected' : ''}`}
                aria-disabled={!check.ok}
                aria-pressed={here}
                data-sfx="none"
                onClick={() => onSwitch(r.id)}
              >
                <span className="region-name">
                  <Ico name="pin" size={18} stroke={2.4} />
                  {r.name}
                  {here && <span className="chip chip-xs chip-red">DI SINI</span>}
                </span>
                <span className="region-note">{sc.regions[r.id].note}</span>
                <span className="row-wrap region-chips">
                  {regionChips(sc.regions[r.id]).map((c) => (
                    <span key={c.label} className={`chip chip-xs ${c.good ? 'chip-good' : 'chip-bad'}`}>
                      {c.label}
                    </span>
                  ))}
                </span>
                {!here && !check.ok && <span className="region-why">{check.reason}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

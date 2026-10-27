import { memo } from 'react';

export const MAP_COLS = 8;
export const MAP_ROWS = 6;
const CELLS = MAP_COLS * MAP_ROWS;

const FACILITIES: Record<number, { label: string; short: string }> = {
  3: { label: 'Puskesmas', short: '✚' },
  10: { label: 'Sekolah', short: 'SD' },
  21: { label: 'Pasar', short: 'PS' },
  27: { label: 'Balai Dusun', short: 'BD' },
  36: { label: 'Posyandu', short: 'PY' },
  44: { label: 'Warung', short: 'WR' },
};

/**
 * Ambang deterministik per sel. 37 dan 29 koprima dengan 48 sehingga setiap
 * sel mendapat ambang unik; tampilan sepenuhnya diturunkan dari state game.
 */
export const infectionThreshold = (i: number) => (((i * 37) % CELLS) + 0.5) * (100 / CELLS);
export const awarenessThreshold = (i: number) => (((i * 29 + 11) % CELLS) + 0.5) * (100 / CELLS);

export type CellState = 'healthy' | 'infected' | 'protected' | 'both';

export function cellState(i: number, infection: number, awareness: number): CellState {
  const inf = infection >= infectionThreshold(i);
  const pro = awareness >= awarenessThreshold(i);
  if (inf && pro) return 'both';
  if (inf) return 'infected';
  if (pro) return 'protected';
  return 'healthy';
}

const STATE_LABEL: Record<CellState, string> = {
  healthy: 'belum terdampak',
  infected: 'terinfeksi (simulasi)',
  protected: 'terlindungi',
  both: 'terinfeksi & mulai terlindungi',
};

const GLYPH: Record<CellState, string> = { healthy: '', infected: '●', protected: '◆', both: '◐' };

interface Props {
  infection: number;
  awareness: number;
  shieldActive: boolean;
}

export const CommunityMap = memo(function CommunityMap({ infection, awareness, shieldActive }: Props) {
  const counts = { healthy: 0, infected: 0, protected: 0, both: 0 };
  const cells = Array.from({ length: CELLS }, (_, i) => {
    const st = cellState(i, infection, awareness);
    counts[st] += 1;
    return st;
  });

  return (
    <section className={`map glass${shieldActive ? ' map-shielded' : ''}`} aria-labelledby="map-title">
      <div className="panel-head">
        <h3 id="map-title">Peta Dusun Kuannoah</h3>
        <span className="tag">Ilustratif</span>
      </div>
      <div
        className="map-grid"
        role="img"
        aria-label={`Peta ilustratif ${CELLS} bangunan: ${counts.infected + counts.both} terinfeksi simulasi, ${counts.protected + counts.both} terlindungi, ${counts.healthy} belum terdampak.`}
        style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)` }}
      >
        {cells.map((st, i) => {
          const fac = FACILITIES[i];
          return (
            <div
              key={i}
              className={`map-cell st-${st}${fac ? ' facility' : ''}`}
              title={`${fac ? fac.label : `Rumah ${i + 1}`}: ${STATE_LABEL[st]}`}
            >
              <span className="map-roof" />
              {fac && <span className="map-fac">{fac.short}</span>}
              <span className="map-glyph">{GLYPH[st]}</span>
            </div>
          );
        })}
      </div>
      <ul className="map-legend">
        <li><span className="lg lg-infected">●</span> Terinfeksi {counts.infected}</li>
        <li><span className="lg lg-protected">◆</span> Terlindungi {counts.protected}</li>
        <li><span className="lg lg-both">◐</span> Keduanya {counts.both}</li>
        <li><span className="lg lg-healthy">○</span> Belum {counts.healthy}</li>
      </ul>
    </section>
  );
});

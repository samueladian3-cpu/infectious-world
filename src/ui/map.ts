/**
 * Status 48 bangunan Dusun Kuannoah. Ambang di sini harus identik dengan
 * INF_T/AW_T di src/three/kuannoah3d.js agar legenda cocok dengan dunia 3D.
 */
export const MAP_CELLS = 48;

export const FACILITIES: Record<number, string> = {
  3: 'Puskesmas',
  10: 'Sekolah',
  21: 'Pasar',
  27: 'Balai Dusun',
  36: 'Posyandu',
  44: 'Warung',
};

/** 37 dan 29 koprima dengan 48 sehingga setiap bangunan mendapat ambang unik. */
export const infectionThreshold = (i: number) => (((i * 37) % MAP_CELLS) + 0.5) * (100 / MAP_CELLS);
export const awarenessThreshold = (i: number) => (((i * 29 + 11) % MAP_CELLS) + 0.5) * (100 / MAP_CELLS);

export type CellState = 'healthy' | 'infected' | 'protected' | 'both';

export function cellState(i: number, infection: number, awareness: number): CellState {
  const inf = infection >= infectionThreshold(i);
  const pro = awareness >= awarenessThreshold(i);
  if (inf && pro) return 'both';
  if (inf) return 'infected';
  if (pro) return 'protected';
  return 'healthy';
}

export function mapCounts(infection: number, awareness: number): Record<CellState, number> {
  const counts = { healthy: 0, infected: 0, protected: 0, both: 0 };
  for (let i = 0; i < MAP_CELLS; i++) counts[cellState(i, infection, awareness)] += 1;
  return counts;
}

export const CELL_LABEL: Record<CellState, string> = {
  healthy: 'belum terdampak',
  infected: 'terinfeksi (simulasi)',
  protected: 'terlindungi',
  both: 'terinfeksi & mulai terlindungi',
};

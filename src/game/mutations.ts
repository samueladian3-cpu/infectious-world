import type { MutationId, MutationNode } from './types.js';

/** Struktur Pohon Mutasi (biaya, prasyarat, statistik). Nama per penyakit ada di skenario. */
export const MUTATIONS: MutationNode[] = [
  { id: 'A1', branch: 'transmission', cost: 25, prerequisite: null, stat: 'transmissionLevel', statDelta: 1 },
  { id: 'A2', branch: 'transmission', cost: 55, prerequisite: 'A1', stat: 'transmissionLevel', statDelta: 1 },
  { id: 'B1', branch: 'symptom', cost: 20, prerequisite: null, stat: 'symptomVisibilityLevel', statDelta: 1 },
  { id: 'B2', branch: 'symptom', cost: 40, prerequisite: 'B1', stat: 'symptomVisibilityLevel', statDelta: 1 },
  { id: 'C1', branch: 'persistence', cost: 30, prerequisite: null, stat: 'environmentalPersistenceLevel', statDelta: 1 },
  { id: 'C2', branch: 'persistence', cost: 55, prerequisite: 'C1', stat: 'environmentalPersistenceLevel', statDelta: 1 },
];

export const MUTATION_BY_ID: Record<MutationId, MutationNode> = Object.fromEntries(
  MUTATIONS.map((m) => [m.id, m]),
) as Record<MutationId, MutationNode>;

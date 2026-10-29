import type { MutationBranch, MutationId, MutationNode } from './types.js';

export const BRANCH_LABEL: Record<MutationBranch, string> = {
  transmission: 'Transmisi',
  symptom: 'Visibilitas Gejala',
  persistence: 'Persistensi Lingkungan',
};

export const MUTATIONS: MutationNode[] = [
  {
    id: 'A1',
    name: 'Enhanced Transmission Profile',
    branch: 'transmission',
    cost: 25,
    prerequisite: null,
    description: 'Profil transmisi fiktif yang mempercepat Infection Progress di dalam simulasi.',
    effects: ['Transmission Level +1', 'Infection Progress +0,12 poin/detik'],
    stat: 'transmissionLevel',
    statDelta: 1,
  },
  {
    id: 'A2',
    name: 'Expanded Transmission Profile',
    branch: 'transmission',
    cost: 60,
    prerequisite: 'A1',
    description:
      'Perluasan profil transmisi fiktif. Event Behavior Shield tetap berpengaruh, tetapi penaltinya sedikit berkurang.',
    effects: [
      'Transmission Level +1',
      'Infection Progress +0,12 poin/detik',
      'Penalti event Behavior Shield terhadap infeksi berkurang 20% (tidak hilang)',
    ],
    stat: 'transmissionLevel',
    statDelta: 1,
  },
  {
    id: 'B1',
    name: 'Increased Symptom Visibility',
    branch: 'symptom',
    cost: 20,
    prerequisite: null,
    description:
      'Gejala dalam simulasi menjadi lebih mudah terlihat. Infeksi sedikit lebih cepat, tetapi komunitas juga lebih cepat sadar. Ini trade-off permainan, bukan klaim tentang keganasan virus nyata.',
    effects: [
      'Symptom Visibility Level +1',
      'Infection Progress +0,05 poin/detik',
      'Community Awareness +0,14 poin/detik (lebih besar!)',
    ],
    stat: 'symptomVisibilityLevel',
    statDelta: 1,
  },
  {
    id: 'B2',
    name: 'High Clinical Visibility',
    branch: 'symptom',
    cost: 45,
    prerequisite: 'B1',
    description:
      'Gejala sangat mudah dikenali di dalam simulasi. Komunitas yang mengenali gejala lebih cepat bertindak, sehingga awareness naik lebih kuat.',
    effects: [
      'Symptom Visibility Level +1',
      'Infection Progress +0,05 poin/detik',
      'Community Awareness +0,14 poin/detik (lebih besar!)',
    ],
    stat: 'symptomVisibilityLevel',
    statDelta: 1,
  },
  {
    id: 'C1',
    name: 'Persistence Profile',
    branch: 'persistence',
    cost: 30,
    prerequisite: null,
    description:
      'Statistik fiktif ketahanan di lingkungan. Tidak berarti semua patogen berperilaku sama di lingkungan nyata.',
    effects: ['Environmental Persistence Level +1', 'Infection Progress +0,04 poin/detik'],
    stat: 'environmentalPersistenceLevel',
    statDelta: 1,
  },
  {
    id: 'C2',
    name: 'Enhanced Persistence Profile',
    branch: 'persistence',
    cost: 65,
    prerequisite: 'C1',
    description:
      'Peningkatan statistik persistensi fiktif. Sebagian penalti sementara dari event komunitas sedikit berkurang.',
    effects: [
      'Environmental Persistence Level +1',
      'Infection Progress +0,04 poin/detik',
      'Bonus laju awareness sementara dari event berkurang 25%',
    ],
    stat: 'environmentalPersistenceLevel',
    statDelta: 1,
  },
];

export const MUTATION_BY_ID: Record<MutationId, MutationNode> = Object.fromEntries(
  MUTATIONS.map((m) => [m.id, m]),
) as Record<MutationId, MutationNode>;

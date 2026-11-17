import type {
  DecisionDef,
  MissionDef,
  MutationBranch,
  MutationId,
  MutationText,
  PathogenId,
  RegionId,
  RegionMod,
  ScenarioId,
  ScenarioRates,
  ShieldEventDef,
  ShieldEventId,
} from '../types.js';

export type Difficulty = 'Mudah' | 'Sedang' | 'Sulit';

export interface ScenarioDef {
  id: ScenarioId;
  /** Nama singkat penyakit, mis. "DBD". */
  name: string;
  /** Nama lengkap penyakit. */
  disease: string;
  pathogen: PathogenId;
  pathogenName: string;
  difficulty: Difficulty;
  /** Satu–dua kalimat untuk kartu pemilihan. */
  blurb: string;
  /** Pesan kabar dusun saat sesi dimulai. */
  intro: string;
  rates: ScenarioRates;
  branchLabels: Record<MutationBranch, string>;
  mutations: Record<MutationId, MutationText>;
  shields: Record<ShieldEventId, ShieldEventDef>;
  /** Hoaks yang disebar lewat aksi Sebar Hoaks, beserta pelurusannya. */
  hoax: { claim: string; factCheck: string };
  regions: Record<RegionId, RegionMod>;
  decisions: DecisionDef[];
  missions: MissionDef[];
}

import type { ScenarioId } from '../types.js';
import { DBD } from './dbd.js';
import { DIARE } from './diare.js';
import { HIV } from './hiv.js';
import { ISPA } from './ispa.js';
import { TB } from './tb.js';
import type { ScenarioDef } from './types.js';

export type { Difficulty, ScenarioDef } from './types.js';

/** Urutan juga menentukan urutan buka skenario (selesaikan satu sesi untuk membuka berikutnya). */
export const SCENARIOS: ScenarioDef[] = [ISPA, DIARE, DBD, TB, HIV];
export const SCENARIO_IDS = SCENARIOS.map((s) => s.id);

export const SCENARIO_BY_ID: Record<ScenarioId, ScenarioDef> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<ScenarioId, ScenarioDef>;

export const isScenarioId = (v: unknown): v is ScenarioId => typeof v === 'string' && v in SCENARIO_BY_ID;

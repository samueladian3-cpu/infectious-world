import { isPlayMode } from '../src/game/engine.js';
import { isScenarioId } from '../src/game/scenarios/index.js';
import { json, readBoard, type Board } from './_lib/leaderboard.js';

/** GET /api/leaderboard?board=victory|defeat&scenario=ispa|diare|dbd|tb|hiv&mode=santai|normal|tantangan → 20 skor teratas. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const board: Board = params.get('board') === 'defeat' ? 'defeat' : 'victory';
  const raw = params.get('scenario');
  const scenario = isScenarioId(raw) ? raw : 'ispa';
  const rawMode = params.get('mode');
  const mode = isPlayMode(rawMode) ? rawMode : 'normal';
  try {
    const entries = await readBoard(scenario, mode, board, 20);
    return json({ board, scenario, mode, entries });
  } catch (err) {
    console.error('leaderboard GET', err);
    return json({ error: 'Papan peringkat sedang tidak tersedia.' }, 503);
  }
}

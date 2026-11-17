import { isScenarioId } from '../src/game/scenarios/index.js';
import { json, readBoard, type Board } from './_lib/leaderboard.js';

/** GET /api/leaderboard?board=victory|defeat&scenario=ispa|diare|dbd|tb|hiv → 20 skor teratas. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const board: Board = params.get('board') === 'defeat' ? 'defeat' : 'victory';
  const raw = params.get('scenario');
  const scenario = isScenarioId(raw) ? raw : 'ispa';
  try {
    const entries = await readBoard(scenario, board, 20);
    return json({ board, scenario, entries });
  } catch (err) {
    console.error('leaderboard GET', err);
    return json({ error: 'Papan peringkat sedang tidak tersedia.' }, 503);
  }
}

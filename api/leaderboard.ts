import { json, readBoard, type Board } from './_lib/leaderboard.js';

/** GET /api/leaderboard?board=victory|defeat → 20 skor teratas. */
export async function GET(request: Request) {
  const board: Board = new URL(request.url).searchParams.get('board') === 'defeat' ? 'defeat' : 'victory';
  try {
    const entries = await readBoard(board, 20);
    return json({ board, entries });
  } catch (err) {
    console.error('leaderboard GET', err);
    return json({ error: 'Papan peringkat sedang tidak tersedia.' }, 503);
  }
}

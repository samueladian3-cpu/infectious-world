import { parseReplayLog, replaySession } from '../src/game/replay.js';
import { addEntry, claimRun, cleanName, json, type Board } from './_lib/leaderboard.js';

/**
 * POST /api/scores { name, seed, actions }
 * Server tidak memercayai angka dari klien: sesi diputar ulang dari seed dan
 * daftar aksi dengan engine yang sama, lalu hasil replay itulah yang disimpan.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4000) return json({ error: 'Data terlalu besar.' }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Format data tidak valid.' }, 400);
  }

  const name = cleanName((body as { name?: unknown } | null)?.name);
  if (!name.ok) return json({ error: name.reason }, 400);

  const log = parseReplayLog(body);
  if (!log) return json({ error: 'Data sesi tidak valid.' }, 400);

  const result = replaySession(log.seed, log.actions);
  if (!result.ok) return json({ error: `Sesi tidak bisa diverifikasi. ${result.reason}` }, 422);
  const s = result.state;
  const board: Board = s.outcome === 'victory' ? 'victory' : 'defeat';

  try {
    const runKey = `${log.seed}-${log.actions.map((a) => (a.type === 'purchase' ? `${a.id}@${a.t}` : `M@${a.t}`)).join('.') || 'none'}`;
    if (!(await claimRun(runKey))) return json({ error: 'Sesi ini sudah pernah dikirim.' }, 409);

    const entry = {
      name: name.name,
      seconds: s.elapsedSeconds,
      mutations: s.unlockedNodes,
      misinformation: s.misinformationUsed,
      infection: Math.round(s.infectionRate * 10) / 10,
      awareness: Math.round(s.awarenessLevel * 10) / 10,
      date: new Date().toISOString(),
    };
    const rank = await addEntry(board, entry);
    return json({ board, rank, entry }, 201);
  } catch (err) {
    console.error('scores POST', err);
    return json({ error: 'Skor gagal disimpan. Coba lagi nanti.' }, 503);
  }
}

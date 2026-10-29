/**
 * Penyimpanan papan peringkat di Vercel Blob (store privat).
 *
 * Setiap skor adalah satu blob. Data entri dikodekan di pathname sehingga satu
 * panggilan list() cukup untuk membaca papan tanpa mengunduh isi blob.
 * Pathname diawali kunci urut ber-padding nol, dan list() mengembalikan blob
 * berurutan leksikografis, sehingga urutan pathname = urutan peringkat.
 */
import { list, put } from '@vercel/blob';

export type Board = 'victory' | 'defeat';

export interface LeaderboardEntry {
  name: string;
  seconds: number;
  mutations: string[];
  misinformation: boolean;
  infection: number;
  awareness: number;
  date: string;
}

const ROOT = 'lb';
const KEY_MAX = 999_999;

/** Menang: lebih cepat lebih baik. Kalah: bertahan lebih lama lebih baik. */
const sortKey = (board: Board, seconds: number) =>
  String(board === 'victory' ? seconds : KEY_MAX - seconds).padStart(6, '0');

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const fromB64url = (s: string) => Buffer.from(s, 'base64url').toString('utf8');

function encodePath(board: Board, e: LeaderboardEntry) {
  const compact = { n: e.name, s: e.seconds, m: e.mutations, x: e.misinformation ? 1 : 0, i: e.infection, a: e.awareness, d: e.date };
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${ROOT}/${board}/${sortKey(board, e.seconds)}-${unique}/${b64url(JSON.stringify(compact))}.json`;
}

function decodePath(pathname: string): LeaderboardEntry | null {
  const last = pathname.split('/').pop() ?? '';
  try {
    const c = JSON.parse(fromB64url(last.replace(/\.json$/, '')));
    return { name: c.n, seconds: c.s, mutations: c.m, misinformation: c.x === 1, infection: c.i, awareness: c.a, date: c.d };
  } catch {
    return null;
  }
}

export async function readBoard(board: Board, limit: number): Promise<LeaderboardEntry[]> {
  const { blobs } = await list({ prefix: `${ROOT}/${board}/`, limit });
  return blobs
    .map((b) => b.pathname)
    .sort()
    .map(decodePath)
    .filter((e): e is LeaderboardEntry => e !== null);
}

/** Menandai satu sesi (seed + aksi) sudah dikirim. false jika sudah pernah. */
export async function claimRun(runKey: string): Promise<boolean> {
  try {
    await put(`${ROOT}/seen/${runKey}.txt`, '1', { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'text/plain' });
    return true;
  } catch (err) {
    if (err instanceof Error && /already exists/i.test(err.message)) return false;
    throw err;
  }
}

/** Menyimpan entri dan mengembalikan peringkatnya (1 = teratas). */
export async function addEntry(board: Board, entry: LeaderboardEntry): Promise<number> {
  const pathname = encodePath(board, entry);
  await put(pathname, JSON.stringify(entry), { access: 'private', addRandomSuffix: false, contentType: 'application/json' });
  const myKey = pathname.slice(`${ROOT}/${board}/`.length).split('/')[0];
  let rank = 1;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${ROOT}/${board}/`, limit: 1000, cursor });
    for (const b of page.blobs) {
      const key = b.pathname.slice(`${ROOT}/${board}/`.length).split('/')[0];
      if (key < myKey) rank += 1;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return rank;
}

const BLOCKED = ['anjing', 'babi', 'bangsat', 'kontol', 'memek', 'ngentot', 'tolol', 'goblok', 'bajingan', 'jancok', 'asu', 'fuck', 'shit', 'bitch', 'nigger', 'nazi'];

/** Merapikan dan memvalidasi nama pemain. Mengembalikan pesan galat bila tidak valid. */
export function cleanName(raw: unknown): { ok: true; name: string } | { ok: false; reason: string } {
  if (typeof raw !== 'string') return { ok: false, reason: 'Nama wajib diisi.' };
  const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 16) return { ok: false, reason: 'Nama harus 2–16 karakter.' };
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) return { ok: false, reason: 'Nama hanya boleh berisi huruf, angka, spasi, titik, garis bawah, atau tanda hubung.' };
  const flat = name.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some((w) => flat.includes(w))) return { ok: false, reason: 'Pilih nama lain yang lebih sopan.' };
  return { ok: true, name };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

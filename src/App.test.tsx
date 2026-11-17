import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { FACT_CHECKS, PATHOGENS } from './content/pathodex';
import { CONFIG } from './game/config';

// Dunia 3D dan spesimen butuh WebGL; di jsdom diganti elemen kosong.
vi.mock('./components/World3D', () => ({
  World3D: () => <div data-testid="world3d" />,
  Specimen: () => <span data-testid="specimen" />,
}));

const click = (el: Element) => fireEvent.click(el);
const btn = (name: RegExp | string) => screen.getByRole('button', { name });
const advance = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => vi.advanceTimersByTime(1000));
};
const ipValue = () => Number(screen.getByLabelText(/Poin Infeksi, /).getAttribute('aria-label')?.match(/^(\d+)/)?.[1]);
const card = () => document.querySelector<HTMLElement>('.decision-card');

/** Menjawab Momen Penentu bila sedang terbuka (opsi pertama yang tersedia), lalu lanjutkan. */
function answerIfAsked() {
  const c = card();
  if (!c) return false;
  const opt = c.querySelector<HTMLButtonElement>('.decision-opt:not([aria-disabled="true"]), .quiz-btn');
  if (opt) click(opt);
  click(within(card()!).getByRole('button', { name: 'LANJUTKAN' }));
  return true;
}

/** Maju per detik sambil menjawab setiap Momen Penentu. */
function play(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    answerIfAsked();
    act(() => vi.advanceTimersByTime(1000));
  }
  answerIfAsked();
}

function deploy() {
  click(btn(/MULAI MAIN/));
  click(btn(/LEPASKAN ISPA/));
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('navigasi', () => {
  it('MULAI MAIN membuka pemilihan penyakit dan wilayah', () => {
    render(<App />);
    click(btn(/MULAI MAIN/));
    expect(screen.getByRole('heading', { name: /Pilih Penyakit/ })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Wilayah awal' })).toBeInTheDocument();
  });

  it('beranda menampilkan identitas institusi', () => {
    render(<App />);
    expect(screen.getByText('Poltekkes Kemenkes Kupang')).toBeInTheDocument();
    expect(screen.getByAltText('Logo Poltekkes Kemenkes Kupang')).toBeInTheDocument();
  });

  it('menyelesaikan tutorial membuka pemilihan penyakit', () => {
    render(<App />);
    click(btn(/CARA BERMAIN/));
    const dialog = screen.getByRole('dialog', { name: 'Cara Bermain' });
    for (let i = 0; i < 5; i++) click(within(dialog).getByRole('button', { name: 'Berikutnya' }));
    click(within(dialog).getByRole('button', { name: /Mengerti, Ayo Main/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pilih Penyakit/ })).toBeInTheDocument();
  });

  it('penyakit berikutnya terkunci sampai yang sebelumnya dimainkan', () => {
    render(<App />);
    click(btn(/MULAI MAIN/));
    click(btn(/^Diare.*terkunci/));
    expect(screen.getByText(/Selesaikan satu sesi ISPA untuk membuka Diare/)).toBeInTheDocument();
    expect(btn(/LEPASKAN ISPA/)).toBeInTheDocument();
  });

  it('mode kelas membuka semua penyakit', () => {
    render(<App />);
    click(btn('Pengaturan'));
    click(screen.getByRole('checkbox', { name: /Buka semua penyakit/ }));
    click(btn('Tutup pengaturan'));
    click(btn(/MULAI MAIN/));
    click(btn(/^HIV/));
    expect(btn(/LEPASKAN HIV/)).toBeInTheDocument();
  });
});

describe('gameplay', () => {
  it('deploy memulai dari 0 dan PI naik 1 per 2 detik, tanpa timer ganda', () => {
    render(<App />);
    deploy();
    expect(ipValue()).toBe(0);
    expect(screen.getByLabelText('Waktu berjalan 00:00')).toBeInTheDocument();
    advance(10);
    expect(ipValue()).toBe(5);
    click(btn(/POHON MUTASI/));
    click(btn('Tutup Pohon Mutasi'));
    advance(4);
    expect(ipValue()).toBe(7);
  });

  it('Momen Penentu menghentikan simulasi sampai pemain memilih', () => {
    render(<App />);
    deploy();
    advance(CONFIG.decision.firstAt);
    expect(card()).not.toBeNull();
    const ip = ipValue();
    advance(10);
    expect(ipValue()).toBe(ip);
    expect(screen.getByLabelText(`Waktu berjalan 00:${CONFIG.decision.firstAt}`)).toBeInTheDocument();
    click(card()!.querySelector('.decision-opt:not([aria-disabled="true"])')!);
    expect(within(card()!).getByText(/Fakta kesehatan/)).toBeInTheDocument();
    advance(5);
    expect(screen.getByLabelText(`Waktu berjalan 00:${CONFIG.decision.firstAt}`)).toBeInTheDocument();
    click(btn('LANJUTKAN'));
    advance(2);
    expect(screen.getByLabelText(`Waktu berjalan 00:${CONFIG.decision.firstAt + 2}`)).toBeInTheDocument();
  });

  it('Jeda menghentikan simulasi dan Lanjutkan meneruskannya', () => {
    render(<App />);
    deploy();
    advance(4);
    click(btn(/Jeda/));
    advance(10);
    expect(ipValue()).toBe(2);
    click(btn(/Lanjutkan/));
    advance(2);
    expect(ipValue()).toBe(3);
  });

  it('aksi yang tidak tersedia memberi umpan balik dan tidak mengubah state', () => {
    render(<App />);
    deploy();
    click(btn(/SEBAR HOAKS/));
    expect(screen.getByText(/Sebar Hoaks belum bisa: PI kurang/)).toBeInTheDocument();
    click(btn(/POHON MUTASI/));
    const dialog = screen.getByRole('dialog', { name: 'Pohon Mutasi' });
    click(within(dialog).getByRole('button', { name: /^A1 / }));
    click(within(dialog).getByRole('button', { name: /PI kurang \(butuh 25, punya 0\)/ }));
    expect(ipValue()).toBe(0);
  });

  it('pembelian mutasi lewat UI memotong PI dan menaikkan level', { timeout: 30000 }, () => {
    render(<App />);
    deploy();
    advance(20); // 10 PI, sebelum Momen Penentu pertama
    click(btn(/POHON MUTASI/));
    let dialog = screen.getByRole('dialog', { name: 'Pohon Mutasi' });
    click(within(dialog).getByRole('button', { name: /^B1 Hidung Berair/ }));
    expect(within(dialog).getByText(/Di dunia nyata:/)).toBeInTheDocument();
    click(btn('Tutup Pohon Mutasi'));
    play(20);
    while (ipValue() < 20) play(1);
    const before = ipValue();
    click(btn(/POHON MUTASI/));
    dialog = screen.getByRole('dialog', { name: 'Pohon Mutasi' });
    click(within(dialog).getByRole('button', { name: /^B1 / }));
    click(within(dialog).getByRole('button', { name: /BELI B1 · 20 PI/ }));
    expect(within(dialog).getByRole('button', { name: /^B1 .*sudah dibeli/ })).toBeInTheDocument();
    click(btn('Tutup Pohon Mutasi'));
    expect(ipValue()).toBe(before - 20);
    expect(screen.getByLabelText('Gejala Terlihat level 2 dari 3')).toBeInTheDocument();
  });

  it('pindah wilayah lewat panel wilayah', () => {
    render(<App />);
    deploy();
    advance(16); // 8 PI
    click(btn(/Sekolah & Lapangan/));
    const panel = screen.getByRole('dialog', { name: 'Wilayah fokus' });
    click(within(panel).getByRole('button', { name: /Pasar & Warung/ }));
    expect(ipValue()).toBe(8 - CONFIG.region.switchCost);
    expect(btn(/^Pasar & Warung/)).toBeInTheDocument();
  });

  it('game berakhir, layar hasil memberi XP dan misi, MAIN LAGI mereset sesi', { timeout: 60000 }, () => {
    render(<App />);
    deploy();
    play(400); // tanpa membeli apa pun, warga yang menang
    expect(screen.getByRole('heading', { name: 'WARGA TERLINDUNGI' })).toBeInTheDocument();
    expect(screen.getByText('Laporan Simulasi')).toBeInTheDocument();
    expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
    expect(screen.getByText(/Penyakit baru terbuka: Diare/)).toBeInTheDocument();

    click(within(document.querySelector('.met-panel')!).getAllByRole('button')[0]);
    expect(screen.getByRole('heading', { name: 'Rhinovirus' })).toBeInTheDocument();
    click(btn(/Daftar/));
    click(btn(/Hasil/));
    expect(screen.getByRole('heading', { name: 'WARGA TERLINDUNGI' })).toBeInTheDocument();

    click(btn(/MAIN LAGI/));
    expect(ipValue()).toBe(0);
    expect(screen.getByLabelText('Waktu berjalan 00:00')).toBeInTheDocument();
  });

  it('kembali ke menu menghentikan timer', () => {
    render(<App />);
    deploy();
    advance(3);
    click(btn(/^Menu$/));
    click(btn('Keluar ke menu'));
    expect(btn(/MULAI MAIN/)).toBeInTheDocument();
    advance(500);
    expect(screen.queryByText('WARGA TERLINDUNGI')).not.toBeInTheDocument();
  });
});

describe('progres & suara', () => {
  it('layar Misi & Prestasi menampilkan level, hadiah, dan pencapaian', () => {
    render(<App />);
    click(btn(/MISI & PRESTASI/));
    expect(screen.getAllByText('Pengamat Pemula').length).toBeGreaterThan(0);
    expect(screen.getByText(/Pencapaian 0\//)).toBeInTheDocument();
    expect(screen.getByText('Legenda Kuannoah')).toBeInTheDocument();
  });

  it('tombol suara di beranda membisukan musik dan efek suara', () => {
    render(<App />);
    click(btn('Matikan suara'));
    expect(btn('Nyalakan suara')).toBeInTheDocument();
    click(btn('Pengaturan'));
    expect(screen.getAllByText('bisu')).toHaveLength(2);
  });
});

describe('papan peringkat', () => {
  it('mengirim seed, skenario, wilayah, dan aksi (bukan skor) lalu menampilkan peringkat', { timeout: 60000 }, async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ board: 'defeat', rank: 3, entry: {} }), { status: 201, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    deploy();
    play(400);

    fireEvent.change(screen.getByLabelText('Nama pemain'), { target: { value: 'Ama Kuannoah' } });
    await act(async () => {
      click(btn(/KIRIM SKOR/));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/scores');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ name: 'Ama Kuannoah', seed: expect.any(Number), scenario: 'ispa', region: 'sekolah' });
    expect(body.actions[0]).toEqual({ t: CONFIG.decision.firstAt, type: 'decide', choice: expect.any(Number) });
    expect(body).not.toHaveProperty('seconds');
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('menampilkan pesan bila server tidak bisa dihubungi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    render(<App />);
    await act(async () => {
      click(btn(/PERINGKAT$/));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Tidak bisa terhubung/);
  });
});

describe('Patho-Dex', () => {
  it('menampilkan kategori, konten edukasi, dan tautan sumber tepercaya', () => {
    render(<App />);
    click(btn(/PATHO-DEX/));
    click(screen.getByRole('radio', { name: 'Parasit' }));
    expect(btn(/^Plasmodium/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Rhinovirus/ })).not.toBeInTheDocument();
    click(screen.getByRole('radio', { name: 'Virus' }));
    click(btn(/^HIV/));
    expect(screen.getByRole('heading', { name: 'Pencegahan' })).toBeInTheDocument();
    expect(screen.getByText(/HIV TIDAK menular lewat udara/)).toBeInTheDocument();
    screen.getAllByRole('link').forEach((a) => expect(a).toHaveAttribute('href', expect.stringMatching(/^https:\/\/(www\.)?(who\.int|kemkes\.go\.id)\//)));
    click(btn(/Daftar/));
    click(screen.getByRole('tab', { name: /Mitos & Fakta/ }));
    fireEvent.change(screen.getByPlaceholderText(/Cari/), { target: { value: 'antibiotik' } });
    click(btn(/Antibiotik dapat menyembuhkan pilek/));
    expect(screen.getByText('Mitos')).toBeInTheDocument();
  });

  it('kamus istilah menjelaskan istilah teknis dan istilah game', () => {
    render(<App />);
    click(btn(/PATHO-DEX/));
    click(screen.getByRole('tab', { name: /Istilah/ }));
    expect(screen.getByText('Vektor')).toBeInTheDocument();
    expect(screen.getByText('Momen Penentu')).toBeInTheDocument();
  });

  it('setiap entri punya sumber https dari WHO, Kemenkes, CDC, atau NIH', () => {
    const ok = /^https:\/\/(www\.)?(who\.int|kemkes\.go\.id|keslan\.kemkes\.go\.id|cdc\.gov|pmc\.ncbi\.nlm\.nih\.gov)\//;
    for (const p of PATHOGENS) {
      expect(p.sources.length, p.id).toBeGreaterThan(0);
      p.sources.forEach((s) => expect(s.url).toMatch(ok));
      if (p.sizeSource) expect(p.sizeSource.url).toMatch(ok);
    }
    for (const f of FACT_CHECKS) if (f.id !== 'fc-game') expect(f.dexId, f.id).not.toBeNull();
  });

  it('kategori mencakup virus, bakteri, dan parasit', () => {
    const cats = new Set(PATHOGENS.map((p) => p.category));
    expect([...cats].sort()).toEqual(['Bakteri', 'Parasit', 'Virus']);
  });
});

describe('akurasi konten', () => {
  it('rhinovirus adalah virus dan antibiotik bukan pencegahannya', () => {
    const rhino = PATHOGENS.find((p) => p.id === 'rhinovirus')!;
    expect(rhino.category).toBe('Virus');
    expect(rhino.prevention.join(' ')).not.toMatch(/antibiotik/i);
    expect(FACT_CHECKS.find((f) => f.id === 'ispa-q-antibiotik')?.verdict).toBe('Mitos');
  });

  it('HIV dijelaskan sebagai virus yang tidak menular lewat kontak biasa', () => {
    const hiv = PATHOGENS.find((p) => p.id === 'hiv')!;
    expect(hiv.category).toBe('Virus');
    expect(hiv.notTransmitted).toMatch(/udara/);
    expect(hiv.notTransmitted).toMatch(/nyamuk/);
    expect(hiv.transmission).not.toMatch(/udara|batuk|bersin/);
  });
});

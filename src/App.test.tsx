import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { FACT_CHECKS, PATHOGENS } from './content/pathodex';

// Dunia 3D dan spesimen butuh WebGL; di jsdom diganti elemen kosong.
vi.mock('./components/World3D', () => ({
  World3D: () => <div data-testid="world3d" />,
  Specimen: () => <span data-testid="specimen" />,
}));

const click = (el: HTMLElement) => fireEvent.click(el);
const btn = (name: RegExp | string) => screen.getByRole('button', { name });
const advance = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => vi.advanceTimersByTime(1000));
};
const ipValue = () => Number(screen.getByLabelText(/Infection Points, /).getAttribute('aria-label')?.match(/^(\d+)/)?.[1]);

function deploy() {
  click(btn(/MULAI INFEKSI/));
  click(btn(/^Rhinovirus/));
  click(btn(/LEPASKAN PATOGEN/));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('navigasi', () => {
  it('AC-001: MULAI INFEKSI membuka pemilihan patogen', () => {
    render(<App />);
    click(btn(/MULAI INFEKSI/));
    expect(screen.getByRole('heading', { name: /Pilih Patogen/ })).toBeInTheDocument();
  });

  it('AC-002: menyelesaikan tutorial membuka pemilihan patogen', () => {
    render(<App />);
    click(btn(/HOW TO PLAY/));
    const dialog = screen.getByRole('dialog', { name: 'How to Play' });
    for (let i = 0; i < 4; i++) click(within(dialog).getByRole('button', { name: 'Berikutnya' }));
    click(within(dialog).getByRole('button', { name: /Mengerti, Ayo Main/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pilih Patogen/ })).toBeInTheDocument();
  });

  it('tutorial bisa ditutup tanpa memulai game', () => {
    render(<App />);
    click(btn(/HOW TO PLAY/));
    click(btn('Tutup tutorial'));
    expect(btn(/MULAI INFEKSI/)).toBeInTheDocument();
  });

  it('AC-003: patogen terkunci tidak dapat dideploy', () => {
    render(<App />);
    click(btn(/MULAI INFEKSI/));
    click(btn(/^E\. coli/));
    click(btn(/^Virus Dengue/));
    click(btn(/LEPASKAN PATOGEN/));
    expect(screen.getByRole('heading', { name: /Pilih Patogen/ })).toBeInTheDocument();
    expect(screen.queryByText('INFECTION PROGRESS · KAMU')).not.toBeInTheDocument();
    expect(screen.getAllByText(/belum dapat dimainkan|Pilih Rhinovirus/).length).toBeGreaterThan(0);
  });
});

describe('gameplay', () => {
  it('AC-004/AC-005: deploy memulai dari 0 dan IP naik 1 per 2 detik, tanpa timer ganda', () => {
    render(<App />);
    deploy();
    expect(ipValue()).toBe(0);
    expect(screen.getByLabelText('Waktu berjalan 00:00')).toBeInTheDocument();
    advance(10);
    expect(ipValue()).toBe(5);
    expect(screen.getByLabelText('Waktu berjalan 00:10')).toBeInTheDocument();
    // Membuka & menutup Mutation Tree tidak menggandakan timer atau mereset.
    click(btn(/MUTATION TREE/));
    click(btn('Tutup Mutation Tree'));
    advance(4);
    expect(ipValue()).toBe(7);
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

  it('AC-016: aksi yang tidak tersedia memberi umpan balik dan tidak mengubah state', () => {
    render(<App />);
    deploy();
    click(btn(/MISINFORMATION SURGE/));
    expect(screen.getByText(/Misinformation Surge tidak tersedia: IP kurang/)).toBeInTheDocument();
    click(btn(/MUTATION TREE/));
    const dialog = screen.getByRole('dialog', { name: 'Mutation Tree' });
    click(within(dialog).getByRole('button', { name: /^A1 / }));
    click(within(dialog).getByRole('button', { name: /IP kurang \(butuh 25, punya 0\)/ }));
    expect(within(screen.getAllByRole('status')[0]).getByText(/IP kurang \(butuh 25, punya 0\)/)).toBeInTheDocument();
  });

  it('pembelian mutasi lewat UI memotong IP dan menaikkan level', () => {
    render(<App />);
    deploy();
    advance(40); // 20 IP
    click(btn(/MUTATION TREE/));
    const dialog = screen.getByRole('dialog', { name: 'Mutation Tree' });
    click(within(dialog).getByRole('button', { name: /^B1 / }));
    click(within(dialog).getByRole('button', { name: /BELI B1 · 20 IP/ }));
    expect(within(dialog).getByRole('button', { name: /^B1 .*sudah dibeli/ })).toBeInTheDocument();
    click(btn('Tutup Mutation Tree'));
    expect(ipValue()).toBe(0);
    expect(screen.getByLabelText('Gejala level 2 dari 3')).toBeInTheDocument();
  });

  it('AC-012/AC-013: game berakhir, layar hasil muncul, MAIN LAGI mereset sesi', () => {
    render(<App />);
    deploy();
    advance(400); // tanpa aksi, awareness mencapai 100%
    expect(screen.getByRole('heading', { name: 'KOMUNITAS TERLINDUNGI' })).toBeInTheDocument();
    expect(screen.getByText('Laporan Simulasi')).toBeInTheDocument();
    const finalTime = screen.getByText('Waktu').nextElementSibling?.textContent;
    advance(30);
    expect(screen.getByText('Waktu').nextElementSibling?.textContent).toBe(finalTime);

    // Patho-Dex dari hasil tidak membuang hasil.
    click(btn(/Patho-Dex/));
    click(btn(/Hasil/));
    expect(screen.getByRole('heading', { name: 'KOMUNITAS TERLINDUNGI' })).toBeInTheDocument();

    click(btn(/MAIN LAGI/));
    expect(ipValue()).toBe(0);
    expect(screen.getByLabelText('Waktu berjalan 00:00')).toBeInTheDocument();
    advance(2);
    expect(ipValue()).toBe(1);
  });

  it('kembali ke menu menghentikan timer', () => {
    render(<App />);
    deploy();
    advance(3);
    click(btn(/^Menu$/));
    click(btn('Keluar ke menu'));
    expect(btn(/MULAI INFEKSI/)).toBeInTheDocument();
    advance(500);
    expect(screen.queryByText('KOMUNITAS TERLINDUNGI')).not.toBeInTheDocument();
    expect(btn(/MULAI INFEKSI/)).toBeInTheDocument();
  });
});

describe('papan peringkat', () => {
  it('mengirim seed dan aksi (bukan skor) lalu menampilkan peringkat', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ board: 'defeat', rank: 3, entry: {} }), { status: 201, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    deploy();
    advance(40);
    click(btn(/MUTATION TREE/));
    const dialog = screen.getByRole('dialog', { name: 'Mutation Tree' });
    click(within(dialog).getByRole('button', { name: /^B1 / }));
    click(within(dialog).getByRole('button', { name: /BELI B1 · 20 IP/ }));
    click(btn('Tutup Mutation Tree'));
    advance(400);

    fireEvent.change(screen.getByLabelText('Nama pemain'), { target: { value: 'Ama Kuannoah' } });
    await act(async () => {
      click(btn(/KIRIM SKOR/));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/scores');
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ name: 'Ama Kuannoah', seed: expect.any(Number), actions: [{ t: 40, type: 'purchase', id: 'B1' }] });
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('menampilkan pesan bila server tidak bisa dihubungi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    render(<App />);
    await act(async () => {
      click(btn(/PAPAN PERINGKAT/));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Tidak bisa terhubung/);
  });
});

describe('Patho-Dex (AC-014)', () => {
  it('menampilkan konten edukasi dan tautan sumber', () => {
    render(<App />);
    click(btn(/PATHO-DEX/));
    click(btn(/^Rhinovirus/));
    expect(screen.getByRole('heading', { name: 'Pencegahan' })).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    // Klaim medis bersumber CDC; ukuran model bersumber artikel ilmiah di NIH PMC.
    links.forEach((a) => expect(a).toHaveAttribute('href', expect.stringMatching(/^https:\/\/(www\.cdc\.gov|pmc\.ncbi\.nlm\.nih\.gov)\//)));
    click(btn(/Daftar/));
    click(screen.getByRole('tab', { name: /Fact-Checks/ }));
    fireEvent.change(screen.getByPlaceholderText(/Cari/), { target: { value: 'antibiotik' } });
    click(btn(/Antibiotik dapat menyembuhkan pilek/));
    expect(screen.getByText('Salah')).toBeInTheDocument();
  });

  it('setiap entri medis punya sumber https', () => {
    for (const p of PATHOGENS) {
      expect(p.sources.length).toBeGreaterThan(0);
      p.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
      expect(p.sizeSource.url).toMatch(/^https:\/\//);
    }
    FACT_CHECKS.filter((f) => f.id !== 'fc-game').forEach((f) => expect(f.sources.length).toBeGreaterThan(0));
  });
});

describe('akurasi konten (AC-017)', () => {
  it('tidak menyebut antibiotik sebagai pengobatan rhinovirus atau resistensi sebagai mutasi', () => {
    const rhino = PATHOGENS.find((p) => p.id === 'rhinovirus')!;
    expect(rhino.organismType).toBe('Virus');
    expect(rhino.prevention.join(' ')).not.toMatch(/antibiotik/i);
    expect(FACT_CHECKS.find((f) => f.id === 'fc-antibiotik')?.verdict).toBe('Salah');
  });
});

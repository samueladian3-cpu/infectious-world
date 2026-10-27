import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { FACT_CHECKS, PATHOGENS } from './content/pathodex';

const click = (el: HTMLElement) => fireEvent.click(el);
const btn = (name: RegExp | string) => screen.getByRole('button', { name });
const advance = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => vi.advanceTimersByTime(1000));
};
const ipValue = () => Number(screen.getByLabelText(/Infection Points$/).textContent?.match(/(\d+)\s*IP/)?.[1]);

function deploy() {
  click(btn(/START INFECTION/));
  click(btn(/^Rhinovirus/));
  click(btn(/DEPLOY PATHOGEN/));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('navigasi', () => {
  it('AC-001: START INFECTION membuka pemilihan patogen', () => {
    render(<App />);
    click(btn(/START INFECTION/));
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
    expect(btn(/START INFECTION/)).toBeInTheDocument();
  });

  it('AC-003: patogen terkunci tidak dapat dideploy', () => {
    render(<App />);
    click(btn(/START INFECTION/));
    click(btn(/^E\. coli/));
    click(btn(/^Virus Dengue/));
    click(btn(/DEPLOY PATHOGEN/));
    expect(screen.getByRole('heading', { name: /Pilih Patogen/ })).toBeInTheDocument();
    expect(screen.queryByText('Infection Progress')).not.toBeInTheDocument();
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
    click(btn(/Mutation Tree/));
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
    click(btn(/Misinformation Surge/));
    expect(screen.getByText(/Misinformation Surge tidak tersedia: IP kurang/)).toBeInTheDocument();
    click(btn(/Mutation Tree/));
    const dialog = screen.getByRole('dialog', { name: 'Mutation Tree' });
    click(within(dialog).getByRole('button', { name: /Tidak bisa dibeli/ }));
    expect(within(screen.getAllByRole("status")[0]).getByText(/IP kurang \(butuh 25, punya 0\)/)).toBeInTheDocument();
  });

  it('pembelian mutasi lewat UI memotong IP dan menaikkan level', () => {
    render(<App />);
    deploy();
    advance(40); // 20 IP
    click(btn(/Mutation Tree/));
    const dialog = screen.getByRole('dialog', { name: 'Mutation Tree' });
    click(within(dialog).getByRole('button', { name: /^B1 / }));
    click(within(dialog).getByRole('button', { name: /Beli \(20 IP\)/ }));
    expect(within(dialog).getByRole('button', { name: 'Sudah dibeli' })).toBeInTheDocument();
    click(btn('Tutup Mutation Tree'));
    expect(ipValue()).toBe(0);
    expect(screen.getByTitle('Symptom Visibility Level')).toHaveTextContent('Lv 2');
  });

  it('AC-012/AC-013: game berakhir, layar hasil muncul, PLAY AGAIN mereset sesi', () => {
    render(<App />);
    deploy();
    advance(400); // tanpa aksi, awareness mencapai 100%
    expect(screen.getByRole('heading', { name: 'KOMUNITAS TERLINDUNGI' })).toBeInTheDocument();
    expect(screen.getByText('Statistik Akhir')).toBeInTheDocument();
    const finalTime = screen.getByText('Waktu').nextElementSibling?.textContent;
    advance(30);
    expect(screen.getByText('Waktu').nextElementSibling?.textContent).toBe(finalTime);

    // Patho-Dex dari hasil tidak membuang hasil.
    click(btn(/Patho-Dex/));
    click(btn(/Hasil/));
    expect(screen.getByRole('heading', { name: 'KOMUNITAS TERLINDUNGI' })).toBeInTheDocument();

    click(btn(/PLAY AGAIN/));
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
    expect(btn(/START INFECTION/)).toBeInTheDocument();
    advance(500);
    expect(screen.queryByText('KOMUNITAS TERLINDUNGI')).not.toBeInTheDocument();
    expect(btn(/START INFECTION/)).toBeInTheDocument();
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
    links.forEach((a) => expect(a).toHaveAttribute('href', expect.stringMatching(/^https:\/\/www\.cdc\.gov\//)));
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

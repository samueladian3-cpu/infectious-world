# Infectious World

Game strategi edukasi kesehatan berbasis web (React + TypeScript + Vite), dibangun dari PRD v1.0.

## Menjalankan

```bash
npm install
npm run dev           # server pengembangan
npm test              # 38 tes otomatis (engine + alur UI)
npm run typecheck     # pemeriksaan tipe
npm run build         # build produksi ke dist/
npm run build:single  # satu file HTML mandiri ke dist-single/index.html
npm run balance       # simulasi penyeimbangan (win rate per strategi)
```

`dist-single/index.html` bisa dibuka langsung di browser tanpa server.

## Struktur

| Folder | Isi |
|---|---|
| `src/game/` | Engine murni (`engine.ts`), konfigurasi balancing (`config.ts`), data mutasi & event, hook timer (`useGameEngine.ts`), localStorage (`storage.ts`) |
| `src/content/` | Patho-Dex, Fact-Check, debrief, dan daftar sumber |
| `src/components/` | Komponen UI yang dipakai ulang (Modal, Toast, Meter, Peta, Mutation Tree) |
| `src/screens/` | Layar: menu, tutorial, pemilihan, HUD, hasil, Patho-Dex, pengaturan |

Logika game dipisah dari tampilan. `tick()` adalah fungsi murni yang memajukan simulasi tepat 1 detik; pemilihan event acak memakai PRNG ber-seed yang disimpan di state sehingga hasilnya deterministik. Hanya ada satu `setInterval`, dibuat saat status `running` dan dibersihkan saat jeda, selesai, keluar ke menu, atau berganti kecepatan.

## Urutan pemrosesan per detik simulasi

1. Infection Progress dan Awareness bertambah sesuai formula PRD plus modifier shield yang aktif.
2. +1 IP setiap 2 detik.
3. Fact-Check Response (+10 awareness) jika jatuh tempo, 8 detik setelah Misinformation Surge.
4. Shield yang kedaluwarsa dihapus (shield aktif tepat 8 detik).
5. Setiap 15 detik dipilih event baru (tidak sama dengan event sebelumnya), efek langsungnya diterapkan.
6. Kondisi akhir dicek dari nilai terbaru: awareness ≥ 100% berarti kalah (diutamakan), infeksi ≥ 100% berarti menang.

## Keputusan desain dan interpretasi PRD

- **Formula PRD tidak diubah.** Hasil `npm run balance` (200 seed): pemain yang diam selalu kalah sekitar 4 menit; strategi A1 lalu A2 menang sekitar 61%; strategi yang mengandalkan cabang Visibilitas Gejala hampir selalu kalah (sesuai trade-off yang diminta). Pembelian pertama terjangkau di detik 40–60.
- **Efek tambahan A2:** penalti infeksi dari event E1/E2 dikalikan 0,8 (mis. −25% menjadi −20%).
- **Efek tambahan C2:** bonus laju awareness sementara dari event E3/E4 dikalikan 0,75 (efek langsungnya tidak berubah).
- **Pembelian saat jeda diizinkan** karena sesi masih aktif; pembelian ditolak setelah menang atau kalah.
- **Simulasi tetap berjalan saat Mutation Tree terbuka** (ada tombol Jeda jika pemain butuh waktu).
- **Kecepatan 2×** hanya mempercepat waktu nyata; semua aturan tetap dihitung per detik simulasi.
- **Pengaturan:** animasi (ikuti sistem / kurangi / penuh) dan kecepatan. Suara tidak dibuat karena di luar MVP, sehingga tidak ada tombol suara yang tidak berfungsi.
- **Statistik lokal (bagian 14.1)** disimpan di localStorage dan ditampilkan di Pengaturan.

## Sumber konten

Semua tautan diperiksa pada Oktober 2026 dan isinya dicocokkan dengan klaim di game:

- CDC, About Rhinoviruses: https://www.cdc.gov/rhinoviruses/about/
- CDC, Hygiene and Respiratory Viruses Prevention: https://www.cdc.gov/respiratory-viruses/prevention/hygiene.html
- CDC, Manage Common Cold: https://www.cdc.gov/common-cold/treatment/
- CDC, About Escherichia coli Infection / Symptoms / Prevention: https://www.cdc.gov/ecoli/about/index.html
- CDC, About Dengue / Symptoms / Preventing Dengue: https://www.cdc.gov/dengue/about/index.html

## Pemetaan acceptance criteria

| AC | Diverifikasi oleh |
|---|---|
| 001–003 | `App.test.tsx` (navigasi, tutorial, patogen terkunci) |
| 004–013 | `engine.test.ts` + `App.test.tsx` (nilai awal, IP, formula, shield, mutasi, misinformasi, kondisi akhir, reset, timer tunggal) |
| 014, 017 | `App.test.tsx` (Patho-Dex, sumber https, konten antibiotik) |
| 015 | Screenshot manual 1366×860 dan 390×844, tanpa scroll horizontal |
| 016 | Toast umpan balik untuk aksi tidak valid, diuji di `App.test.tsx` |
| 018 | `npm run typecheck`, `npm run build` lulus |
| 019 | 38 tes otomatis lulus |

## Keterbatasan

- Hanya Rhinovirus yang bisa dimainkan; E. coli dan Dengue adalah pratinjau edukasi.
- Konten kesehatan disusun dari sumber CDC tetapi belum ditinjau oleh tenaga kesehatan (rilis kriteria 16.6 butuh peninjau manusia).
- Font memakai Google Fonts; tanpa internet, tampilan memakai font sistem.
- Statistik hanya tersimpan di perangkat dan browser yang sama.
- Game tidak mengukur efektivitas edukasi; itu butuh evaluasi terpisah (bagian 14.2).

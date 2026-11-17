# Infectious World

Game strategi edukasi kesehatan berbasis web (React + TypeScript + Vite + three.js) dari Poltekkes Kemenkes Kupang, dibangun dari PRD v1.0 dengan desain v3: dunia 3D Dusun Kuannoah dan UI bergaya papan permainan. Revisi v4 menambah lima penyakit yang bisa dimainkan, wilayah, Momen Penentu, misi, level, pencapaian, suara, dan ilustrasi patogen.

**Mainkan:** https://infectious-world.vercel.app

## Menjalankan

```bash
npm install
npm run dev           # server pengembangan
npm test              # tes otomatis (engine, replay, alur UI)
npm run lint          # oxlint
npm run typecheck     # pemeriksaan tipe
npm run build         # build produksi ke dist/
npm run build:single  # satu file HTML mandiri ke dist-single/index.html
npm run balance       # simulasi penyeimbangan (win rate per skenario dan tipe pemain)
```

## Logo institusi

Simpan logo resmi Poltekkes Kemenkes Kupang sebagai `public/logo-poltekkes-kupang.png` (PNG transparan, sisi panjang sekitar 256 px). Logo tampil di kiri atas beranda bersama tulisan "Dikembangkan oleh Poltekkes Kemenkes Kupang". Selama berkas belum ada, beranda menampilkan lencana teks sehingga identitas institusi tetap terlihat. Build satu file (`build:single`) tidak menyertakan berkas di `public/`, jadi letakkan logo di samping `index.html` hasil build bila diperlukan.

`dist-single/index.html` bisa dibuka langsung di browser tanpa server.

## Struktur

| Folder | Isi |
|---|---|
| `src/game/` | Engine murni (`engine.ts`), konfigurasi balancing (`config.ts`), lima skenario penyakit (`scenarios/`), wilayah (`regions.ts`), misi (`missions.ts`), XP/level/pencapaian (`progress.ts`), hook timer (`useGameEngine.ts`), localStorage (`storage.ts`), replay sesi untuk verifikasi skor (`replay.ts`) |
| `src/content/` | Patho-Dex (10 patogen: virus, bakteri, parasit), Mitos & Fakta, kamus istilah, debrief per penyakit, daftar sumber |
| `src/audio/` | Efek suara dan musik adaptif yang disintesis dengan Web Audio API (tanpa berkas audio) |
| `src/components/` | Komponen UI yang dipakai ulang (World3D + Specimen, ilustrasi SVG patogen, Pohon Mutasi, kartu Momen Penentu, panel wilayah, Toast, ikon) |
| `src/screens/` | Layar: beranda, Cara Bermain, pemilihan penyakit & wilayah, HUD, hasil, Patho-Dex, Misi & Prestasi, papan peringkat, pengaturan |
| `src/three/` | Dunia 3D `<kuannoah-3d>` dan model `<specimen-3d>` (custom element three.js, dimuat lazy) |
| `src/ui/` | Data khusus tampilan (ikon, langkah panduan), status bangunan peta, hook viewport/dialog, klien API papan peringkat |
| `api/` | Fungsi Vercel: `GET /api/leaderboard`, `POST /api/scores` (penyimpanan Vercel Blob) |
| `design_handoff_infectious_world_v3/` | Paket handoff desain v3 (referensi, tidak ikut build) |

Logika game dipisah dari tampilan. `tick()` adalah fungsi murni yang memajukan simulasi tepat 1 detik; pemilihan event acak memakai PRNG ber-seed yang disimpan di state sehingga hasilnya deterministik. Hanya ada satu `setInterval`, dibuat saat status `running` dan dibersihkan saat jeda, selesai, keluar ke menu, atau berganti kecepatan.

## Papan peringkat

Setelah sesi selesai, pemain bisa mengirim nama ke papan **Tercepat Menang** atau **Bertahan Terlama** milik penyakit yang dimainkan. Klien hanya mengirim seed, skenario, wilayah awal, dan daftar aksi (mutasi, pindah wilayah, jawaban Momen Penentu, dan Sebar Hoaks beserta detik simulasinya). Server memutar ulang sesi dengan engine yang sama (`src/game/replay.ts`), jadi waktu dan hasil di papan selalu hasil replay, bukan angka kiriman klien. Sesi yang sama hanya bisa dikirim sekali. Data disimpan di Vercel Blob (store privat) di bawah `lb2/<skenario>/<papan>/`; setiap skor satu blob dengan data dikodekan di pathname sehingga satu `list()` cukup untuk membaca papan. Skor versi lama (`lb/`) dibuat dengan aturan berbeda dan tidak ditampilkan lagi.

Deploy: `npx vercel deploy --prod` (framework Vite, build `npm run build`, output `dist`). Fungsi `api/` butuh variabel `BLOB_READ_WRITE_TOKEN` yang otomatis tersedia karena Blob store terhubung ke proyek.

## Mekanik permainan

- **Lima penyakit:** ISPA (Mudah), Diare (Mudah), DBD (Sedang), TBC (Sedang), HIV (Sulit). Masing-masing punya laju sendiri, aksi warga yang sesuai (cuci tangan, PSN 3M Plus, TOSS TBC, tes HIV & ARV, dan lain-lain), nama mutasi beserta pelajaran dunia nyatanya, hoaks dan cek faktanya, 4–5 dilema, 5 kuis Mitos atau Fakta, dan 3 misi. Penyakit berikutnya terbuka setelah satu sesi penyakit sebelumnya selesai; **Mode Kelas** di Pengaturan membuka semuanya.
- **Wilayah:** Pasar & Warung, Sekolah & Lapangan, Permukiman Tepi Kali, Sekitar Puskesmas. Tiap penyakit memberi pengali infeksi, kesadaran, dan kekuatan aksi warga yang berbeda. Pindah wilayah memerlukan 6 PI dengan jeda 20 detik.
- **Momen Penentu:** detik 22, lalu setiap 38 detik, bergantian dilema dan kuis. Simulasi berhenti sampai pemain memilih, lalu fakta kesehatan ditampilkan. Kuis benar memberi +8 PI.
- **Misi, XP, level, pencapaian:** misi yang selesai di tengah sesi memberi +5 PI dan semua misi memberi bintang. XP dari setiap sesi (kalah pun dapat) menaikkan level bergelar (Pengamat Pemula sampai Legenda Kuannoah). Ada 12 pencapaian.
- **Suara:** efek untuk tombol, pembelian, aksi warga, Momen Penentu, kuis, misi, krisis, menang, dan kalah. Musik berganti suasana per layar, makin cepat saat bar mendekati 100%, dan berganti ke nada minor saat kesadaran warga ≥ 80% (krisis). Volume dan bisu musik/efek diatur terpisah.

Hasil `npm run balance` (200 seed per sel, pemain wajar = wilayah acak, pilihan dilema acak, 70% kuis benar):

| Penyakit | Pasif | Wajar | Ahli |
|---|---|---|---|
| ISPA | 0% | 69% | 99% |
| Diare | 0% | 67% | 100% |
| DBD | 0% | 51% | 100% |
| TBC | 0% | 57% | 100% |
| HIV | 0% | 37% | 99% |

Sesi berlangsung sekitar 3,5–4,5 menit waktu simulasi.

## Urutan pemrosesan per detik simulasi

Simulasi tidak maju selama ada Momen Penentu yang belum dijawab.

1. Sebaran Infeksi dan Kesadaran Warga bertambah: laju dasar penyakit × pengali wilayah, dikurangi aksi warga aktif, dikali efek dilema yang masih berlaku.
2. +1 PI setiap 2 detik.
3. Cek Fakta (+10 kesadaran) jika jatuh tempo, 8 detik setelah Sebar Hoaks.
4. Aksi warga dan efek dilema yang kedaluwarsa dihapus.
5. Setiap 15 detik dipilih aksi warga baru (tidak sama dengan sebelumnya), efek langsungnya diterapkan.
6. Milestone infeksi diumumkan.
7. Misi dicek, lalu kondisi akhir dari nilai terbaru: kesadaran ≥ 100% berarti kalah (diutamakan), infeksi ≥ 100% berarti menang.
8. Bila jatuh tempo, Momen Penentu berikutnya dipilih dengan PRNG ber-seed.

## Sumber konten

Semua tautan diperiksa (CDC Oktober 2026; WHO dan Kemenkes November 2026) dan isinya dicocokkan dengan klaim di game. Daftar lengkap ada di `src/content/sources.ts`.

- WHO fact sheets: Tuberculosis, HIV and AIDS, Dengue and severe dengue, Diarrhoeal disease, Influenza (seasonal), Pneumonia in children, Malaria
- Kemenkes RI: Apa itu TOSS TBC dan Kenali Gejala TBC; Kendalikan DBD dengan PSN 3M Plus; Jangan Jauhi ODHA, HIV/AIDS tidak Mudah Menular; Diare, Tanda Gejala dan Cara Mengatasinya
- CDC: Rhinoviruses, Hygiene and Respiratory Viruses Prevention, Manage Common Cold, E. coli, Dengue, Amebiasis, Rotavirus

HIV dijelaskan sebagai infeksi virus yang menular lewat darah, cairan seksual, ASI, dan dari ibu ke bayi, dengan klarifikasi eksplisit bahwa HIV tidak menular lewat udara, sentuhan, makan bersama, atau nyamuk. Tes otomatis memeriksa bahwa tidak ada kuis HIV yang menyebut penularan lewat kontak biasa sebagai fakta.

## Pemetaan acceptance criteria

| AC | Diverifikasi oleh |
|---|---|
| 001–003 | `App.test.tsx` (navigasi, tutorial, patogen terkunci) |
| 004–013 | `engine.test.ts` + `App.test.tsx` (nilai awal, IP, formula, shield, mutasi, misinformasi, kondisi akhir, reset, timer tunggal) |
| 014, 017 | `App.test.tsx` (Patho-Dex, sumber https, konten antibiotik) |
| 015 | Screenshot manual 1366×860 dan 390×844, tanpa scroll horizontal |
| 016 | Toast umpan balik untuk aksi tidak valid, diuji di `App.test.tsx` |
| 018 | `npm run typecheck`, `npm run lint`, `npm run build` lulus |
| 019 | Semua tes otomatis lulus |

## Keterbatasan

- Konten kesehatan disusun dari sumber WHO, Kemenkes, dan CDC tetapi belum ditinjau oleh tenaga kesehatan (rilis kriteria 16.6 butuh peninjau manusia).
- Logo resmi institusi belum disertakan di repo; lihat bagian Logo institusi.
- Dunia 3D butuh WebGL; tanpa WebGL, latar memakai warna polos dan game tetap bisa dimainkan.
- Font (Lilita One, Nunito Sans) dibundel lewat Fontsource, tidak bergantung pada Google Fonts.
- Statistik lokal hanya tersimpan di perangkat dan browser yang sama; hanya skor yang dikirim ke papan peringkat yang tersimpan di server.
- Game tidak mengukur efektivitas edukasi; itu butuh evaluasi terpisah (bagian 14.2).

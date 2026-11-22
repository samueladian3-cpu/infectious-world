# Infectious World

Game strategi edukasi kesehatan berbasis web (React + TypeScript + Vite + three.js) dari Poltekkes Kemenkes Kupang, dibangun dari PRD v1.0 dengan desain v3: dunia 3D Dusun Kuannoah dan UI bergaya papan permainan. Revisi v4 menambah lima penyakit yang bisa dimainkan, wilayah, Momen Penentu, misi, level, pencapaian, suara, dan ilustrasi patogen. Revisi v5 menambah gelembung PI, Fakta Cepat, kuis yang lebih sering dengan bonus beruntun, kemampuan aktif, tingkat kesulitan, Penasihat Strategi, serta logo game dan logo resmi institusi.

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

## Logo

Logo game (`src/assets/logo-infectious-world.webp`) dan logo resmi Poltekkes Kemenkes Kupang (`src/assets/logo-poltekkes-kupang.webp`) dibundel lewat Vite, jadi ikut terbawa di build biasa maupun build satu file. Latar putih logo Poltekkes sudah dihapus menjadi transparan, dan logo ditaruh di atas kartu putih agar teksnya yang berwarna pucat tetap terbaca di atas latar krem. Untuk mengganti logo, timpa berkas `.webp` tersebut dengan ukuran yang mirip.

`dist-single/index.html` bisa dibuka langsung di browser tanpa server.

## Struktur

| Folder | Isi |
|---|---|
| `src/game/` | Engine murni (`engine.ts`), konfigurasi balancing (`config.ts`), lima skenario penyakit (`scenarios/`), wilayah (`regions.ts`), misi (`missions.ts`), tingkat kesulitan (`modes.ts`), Penasihat Strategi (`advisor.ts`), XP/level/pencapaian (`progress.ts`), hook timer (`useGameEngine.ts`), localStorage (`storage.ts`), replay sesi untuk verifikasi skor (`replay.ts`) |
| `src/content/` | Patho-Dex (10 patogen: virus, bakteri, parasit), Mitos & Fakta, kamus istilah, debrief per penyakit, daftar sumber |
| `src/audio/` | Efek suara dan musik adaptif yang disintesis dengan Web Audio API (tanpa berkas audio) |
| `src/components/` | Komponen UI yang dipakai ulang (World3D + Specimen, ilustrasi SVG patogen, gelembung PI/Fakta Cepat/kemampuan/penasihat (`PlayExtras.tsx`), Pohon Mutasi, kartu Momen Penentu, panel wilayah, Toast, ikon) |
| `src/screens/` | Layar: beranda, Cara Bermain, pemilihan penyakit & wilayah, HUD, hasil, Patho-Dex, Misi & Prestasi, papan peringkat, pengaturan |
| `src/three/` | Dunia 3D `<kuannoah-3d>` dan model `<specimen-3d>` (custom element three.js, dimuat lazy) |
| `src/ui/` | Data khusus tampilan (ikon, langkah panduan), status bangunan peta, hook viewport/dialog, klien API papan peringkat |
| `api/` | Fungsi Vercel: `GET /api/leaderboard`, `POST /api/scores` (penyimpanan Vercel Blob) |
| `design_handoff_infectious_world_v3/` | Paket handoff desain v3 (referensi, tidak ikut build) |

Logika game dipisah dari tampilan. `tick()` adalah fungsi murni yang memajukan simulasi tepat 1 detik; pemilihan event acak memakai PRNG ber-seed yang disimpan di state sehingga hasilnya deterministik. Hanya ada satu `setInterval`, dibuat saat status `running` dan dibersihkan saat jeda, selesai, keluar ke menu, atau berganti kecepatan.

## Papan peringkat

Setelah sesi selesai, pemain bisa mengirim nama ke papan **Tercepat Menang** atau **Bertahan Terlama** milik penyakit yang dimainkan. Papan dipisah per penyakit dan per tingkat kesulitan. Klien hanya mengirim seed, skenario, wilayah awal, tingkat kesulitan, dan daftar aksi (mutasi, pindah wilayah, jawaban Momen Penentu dan Fakta Cepat, gelembung yang diambil, kemampuan, dan Sebar Hoaks beserta detik simulasinya). Server memutar ulang sesi dengan engine yang sama (`src/game/replay.ts`), jadi waktu dan hasil di papan selalu hasil replay, bukan angka kiriman klien. Sesi yang sama hanya bisa dikirim sekali. Data disimpan di Vercel Blob (store privat) di bawah `lb3/<skenario>/<tingkat>/<papan>/`; setiap skor satu blob dengan data dikodekan di pathname sehingga satu `list()` cukup untuk membaca papan. Skor versi lama (`lb/`, `lb2/`) dibuat dengan aturan berbeda dan tidak ditampilkan lagi.

Deploy: `npx vercel deploy --prod` (framework Vite, build `npm run build`, output `dist`). Fungsi `api/` butuh variabel `BLOB_READ_WRITE_TOKEN` yang otomatis tersedia karena Blob store terhubung ke proyek.

## Mekanik permainan

- **Lima penyakit:** ISPA (Mudah), Diare (Mudah), DBD (Sedang), TBC (Sedang), HIV (Sulit). Masing-masing punya laju sendiri, aksi warga yang sesuai (cuci tangan, PSN 3M Plus, TOSS TBC, tes HIV & ARV, dan lain-lain), nama mutasi beserta pelajaran dunia nyatanya, hoaks dan cek faktanya, 4–5 dilema, 5 kuis Mitos atau Fakta, dan 3 misi. Penyakit berikutnya terbuka setelah satu sesi penyakit sebelumnya selesai; **Mode Kelas** di Pengaturan membuka semuanya.
- **Wilayah:** Pasar & Warung, Sekolah & Lapangan, Permukiman Tepi Kali, Sekitar Puskesmas. Tiap penyakit memberi pengali infeksi, kesadaran, dan kekuatan aksi warga yang berbeda. Pindah wilayah memerlukan 6 PI dengan jeda 20 detik.
- **Momen Penentu:** detik 15, lalu 22 detik setelah setiap jawaban, dengan pola kuis, dilema, kuis, kuis, dilema, dan seterusnya. Simulasi berhenti sampai pemain memilih, lalu fakta kesehatan ditampilkan. Kuis benar memberi +8 PI, ditambah +2 untuk setiap jawaban benar beruntun (maksimal +16).
- **Fakta Cepat:** kuis kecil mulai detik 30, lalu 26 detik setelah setiap kartu selesai. Kartu ini tidak menghentikan waktu dan harus dijawab dalam 10 detik. Hadiahnya +5 PI ditambah bonus beruntun, dan jawabannya ikut dihitung untuk misi kuis. Setiap penyakit punya 12 kuis.
- **Gelembung PI:** gelembung virus muncul di peta setiap 4–7 detik (maksimal 3 sekaligus) dan hilang setelah 7 detik. Nilainya 2–4 PI; gelembung emas yang jarang bernilai 8 PI. Gelembung hanya bisa diambil saat waktu berjalan.
- **Kemampuan aktif:** Lonjakan (10 PI, laju infeksi ×1,5 selama 10 detik, jeda 40 detik) dan Fase Senyap (12 PI, kesadaran warga tidak naik dengan sendirinya selama 8 detik, jeda 45 detik). Nama dan pelajaran dunia nyatanya berbeda per penyakit, misalnya "Fase Tanpa Gejala" pada HIV.
- **Tingkat kesulitan:** Santai (laju kesadaran ×0,85 dan mulai dengan 10 PI), Normal (×1,08), Tantangan (×1,42, laju infeksi ×0,95). Pilihan terakhir diingat.
- **Penasihat Strategi:** satu saran untuk detik itu, misalnya mutasi yang perlu dibeli, kapan memakai kemampuan atau hoaks, wilayah yang lebih cocok, dan pengingat Fakta Cepat. Bisa disembunyikan, lalu dinyalakan lagi di Pengaturan.
- **Misi, XP, level, pencapaian:** misi yang selesai di tengah sesi memberi +5 PI dan semua misi memberi bintang. XP dari setiap sesi (kalah pun dapat) menaikkan level bergelar (Pengamat Pemula sampai Legenda Kuannoah). Ada 12 pencapaian.
- **Suara:** efek untuk tombol, pembelian, aksi warga, Momen Penentu, kuis, misi, krisis, menang, dan kalah. Musik berganti suasana per layar, makin cepat saat bar mendekati 100%, dan berganti ke nada minor saat kesadaran warga ≥ 80% (krisis). Volume dan bisu musik/efek diatur terpisah.

Hasil `npm run balance` (100 seed per sel). Tipe pemain: pasif (tidak berbuat apa-apa), pemula (membeli cabang gejala, mengambil 35% gelembung, 60% kuis benar, tanpa kemampuan), wajar (wilayah acak, 60% gelembung, 70% kuis benar, memakai kemampuan), dan ahli.

| Penyakit | Santai: pemula / wajar | Normal: pasif / pemula / wajar / ahli | Tantangan: wajar / ahli |
|---|---|---|---|
| ISPA | 75% / 100% | 0% / 36% / 98% / 100% | 58% / 99% |
| Diare | 70% / 100% | 0% / 34% / 95% / 100% | 57% / 100% |
| DBD | 65% / 100% | 0% / 25% / 91% / 100% | 50% / 100% |
| TBC | 56% / 100% | 0% / 32% / 90% / 100% | 56% / 100% |
| HIV | 46% / 99% | 0% / 12% / 83% / 100% | 32% / 100% |

Sesi berlangsung sekitar 2,5–3,5 menit waktu simulasi. Pemain pasif selalu kalah, jadi kemenangan tetap butuh keputusan aktif.

## Urutan pemrosesan per detik simulasi

Simulasi tidak maju selama ada Momen Penentu yang belum dijawab. Fakta Cepat, gelembung, dan kemampuan tidak menghentikan waktu.

1. Sebaran Infeksi dan Kesadaran Warga bertambah: laju dasar penyakit × pengali wilayah × pengali tingkat kesulitan, dikurangi aksi warga aktif, dikali efek dilema dan Lonjakan yang masih berlaku. Selama Fase Senyap, kesadaran tidak bertambah.
2. +1 PI setiap 2 detik.
3. Cek Fakta (+10 kesadaran) jika jatuh tempo, 8 detik setelah Sebar Hoaks.
4. Aksi warga, efek dilema, kemampuan, gelembung, dan Fakta Cepat yang kedaluwarsa dihapus.
5. Setiap 15 detik dipilih aksi warga baru (tidak sama dengan sebelumnya), efek langsungnya diterapkan.
6. Milestone infeksi diumumkan.
7. Misi dicek, lalu kondisi akhir dari nilai terbaru: kesadaran ≥ 100% berarti kalah (diutamakan), infeksi ≥ 100% berarti menang.
8. Bila jatuh tempo, gelembung baru dan Fakta Cepat dimunculkan (posisi, nilai, dan soal dari PRNG ber-seed).
9. Bila jatuh tempo, Momen Penentu berikutnya dipilih dengan PRNG ber-seed.

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
- Dunia 3D butuh WebGL; tanpa WebGL, latar memakai warna polos dan game tetap bisa dimainkan.
- Font (Lilita One, Nunito Sans) dibundel lewat Fontsource, tidak bergantung pada Google Fonts.
- Statistik lokal hanya tersimpan di perangkat dan browser yang sama; hanya skor yang dikirim ke papan peringkat yang tersimpan di server.
- Game tidak mengukur efektivitas edukasi; itu butuh evaluasi terpisah (bagian 14.2).

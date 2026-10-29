# Handoff: Infectious World v3 (redesain total, dunia 3D)

Dokumen ini untuk **Claude Code** (atau developer) yang akan menerapkan desain v3 ke repo `samueladian3-cpu/infectious-world` (React 19 + TypeScript + Vite 8, tes Vitest) lalu men-deploy-nya ke **Vercel**.

---

## 1. Ringkasan

Infectious World adalah game strategi edukasi kesehatan berbahasa Indonesia. Pemain memerankan patogen fiktif (Rhinovirus) di komunitas ilustratif "Dusun Kuannoah". Pemain menang jika Infection Progress mencapai 100%, dan kalah jika Community Awareness mencapai 100% (kalah diutamakan).

Desain v3 mengganti seluruh tampilan v1 (gaya neon/sci-fi dengan Orbitron dan Space Grotesk) dengan:
- **Dunia 3D** desa Timor (ume kbubu, rumah tembok beratap seng, lopo, pohon lontar, pagar batu, ladang jagung) yang dirender langsung dengan three.js. Dunia ini menjadi latar semua layar dan menjadi peta permainan di HUD.
- **UI "chunky" bergaya papan permainan**: panel kertas krem, garis tinta cokelat tua 2,5px, bayangan keras, tombol yang "tertekan" saat diklik. Judul memakai Lilita One, teks memakai Nunito Sans.
- **Aksen motif tenun** berupa pita bergaris.

## 2. Tentang file desain

File di folder `prototype/` adalah **referensi desain dalam bentuk HTML**, yaitu prototipe yang menunjukkan tampilan dan perilaku yang diinginkan. File ini **bukan kode produksi untuk disalin langsung**.

Tugasnya adalah **membangun ulang desain ini di dalam codebase React yang sudah ada**, mengikuti pola repo tersebut (komponen di `src/screens` dan `src/components`, engine di `src/game`, konten di `src/content`).

- `prototype/Infectious World.dc.html` berisi seluruh UI dan logika layar dalam satu file. Formatnya "Design Component": template HTML dengan `{{ }}` plus class logika di bagian bawah. Semua style ditulis inline karena keterbatasan alat desain. **Jangan salin inline style mentah ke JSX.** Ubah menjadi CSS (token CSS variable + class) mengikuti gaya `src/index.css`.
- `prototype/iw-core.js` adalah port JavaScript dari `src/game/*` dan `src/content/*`. **Jangan dipakai menggantikan engine TypeScript.** Engine di repo tetap menjadi sumber kebenaran. Lihat bagian 9 untuk perbedaannya.
- `prototype/kuannoah3d.js` berisi dunia 3D dan model spesimen sebagai *custom element*. File ini **boleh dipakai hampir apa adanya** di codebase (lihat bagian 7).
- `prototype/support.js` hanya runtime alat desain. **Jangan dipakai di produksi.**

Cara melihat prototipe secara lokal: jalankan `npx serve prototype` dari folder handoff, lalu buka `Infectious World.dc.html`. Prototipe butuh internet karena memuat three.js dari unpkg dan font dari Google Fonts.

## 3. Fidelity

**High-fidelity.** Warna, tipografi, ukuran, radius, bayangan, animasi, copy, dan perilaku sudah final. Bangun ulang semirip mungkin dengan prototipe. Jika ragu soal nilai tertentu, buka file prototipe karena nilai di sana yang berlaku.

## 4. Aturan yang TIDAK boleh berubah

1. **Aturan, formula, biaya, durasi, interval, kondisi menang/kalah** di `src/game/config.ts`, `engine.ts`, `events.ts`, `mutations.ts` tidak boleh diubah.
2. **Konten kesehatan** di `src/content/*` tidak boleh diubah isinya (kecuali tambahan pada bagian 9 yang sudah disetujui).
3. Hanya ada **satu timer simulasi** (`useGameEngine`). Dunia 3D tidak boleh memengaruhi state game. Dunia 3D hanya *membaca* `infectionRate` dan `awarenessLevel`.
4. Semua tes perilaku di `engine.test.ts` harus tetap lulus. Tes UI di `App.test.tsx` boleh diubah **selector/teksnya saja** agar cocok dengan copy baru (lihat bagian 10). Assertion perilakunya harus tetap sama.

## 5. Design tokens

### Warna

| Token (usulan nama CSS var) | Hex | Dipakai untuk |
|---|---|---|
| `--ink` | `#2A1E16` | Semua garis, teks utama, bayangan keras |
| `--paper` | `#F6EEDF` | Panel, kartu, sheet |
| `--paper-hi` | `#FFF8EC` | Tombol sekunder, kartu di dalam panel, input |
| `--paper-lo` | `#EBDDC4` | Area inset (header Patho-Dex, demo di tutorial) |
| `--track` | `#E3D3B6` | Track bar, tombol nonaktif, node terkunci |
| `--rule` | `#CDBB9C` | Garis putus-putus pemisah |
| `--muted` | `#6E5E4E` | Teks sekunder |
| `--muted-2` | `#5A4C3F` | Ikon nada "info" |
| `--infect` | `#B83A2A` | Infection Progress, aksi utama (merah bata) |
| `--infect-hover` | `#C9452F` | Hover tombol merah |
| `--aware` | `#2A5DA8` | Community Awareness, warga (biru tarum) |
| `--aware-tint` | `#E2EAF6` | Sorotan laju awareness yang naik |
| `--ip` | `#F2B33D` | IP, Behavior Shield, badge (kunyit) |
| `--ip-deep` | `#C68A1E` | Ring hitung mundur, bayangan koin |
| `--ip-cream` | `#FFF3D6` | Isi lingkaran ikon kunyit |
| `--good` | `#3E7D4F` | "Benar", Fact-Check, toast sukses |
| `--good-soft` | `#9FD3A9` | Progress bar fact-check |
| `--persist` | `#6B4A2E` | Cabang Persistensi |
| `--context` | `#9A6A12` | Verdict "Perlu Konteks" |
| `--misinfo-bg` | `#3B342E` | Panel misinformasi aktif |
| `--misinfo-track` | `#5A5048` | Track di panel misinformasi |
| `--stage` | `#C7A970` | Latar saat 3D belum siap |
| `--page` | `#1D1611` | Latar `html/body` |
| `--win-accent` | `#E7A08E` | Kata kedua judul hasil menang |
| `--lose-accent` | `#9CC4F5` | Kata kedua judul hasil kalah |
| Latar viewer spesimen | `#221811` | Kotak model 3D patogen |

Link: `a { color: #2A5DA8; text-underline-offset: 3px }`, `a:hover { color: #B83A2A }`.
Fokus: `:focus-visible { outline: 3px solid #F2B33D; outline-offset: 3px }`.

### Tipografi

- **Display:** `Lilita One` 400 (Google Fonts). Dipakai untuk judul, angka besar, dan label tombol utama.
- **Teks:** `Nunito Sans` dengan sumbu opsz 6..12, bobot 400/600/800/900, plus italic 400.
- Sebaiknya pakai paket `@fontsource/lilita-one` dan `@fontsource-variable/nunito-sans` supaya tidak bergantung pada Google Fonts. Kalau tetap memakai Google Fonts, URL di prototipe: `https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,800;0,6..12,900;1,6..12,400&display=swap`.
- Semua angka yang berubah (timer, IP, persen, laju) memakai `font-variant-numeric: tabular-nums`.

| Peran | Font / ukuran / bobot / lain-lain |
|---|---|
| Judul beranda | Lilita, `clamp(46px, min(14.5vw, 12.5vh), 136px)`, line-height .84, `rotate(-3deg)` (origin kiri bawah), warna `#FFF8EC`, kata "WORLD" `#F2B33D`. Outline 4px dari 8 text-shadow `#2A1E16` ditambah drop `0 11px 0 rgba(42,30,22,.35)` |
| Judul hasil | Lilita, `clamp(46px, 11vw, 104px)`, lh .88, `rotate(-2.5deg)`, outline sama |
| Judul layar (Pilih) | Lilita `clamp(28px, 6vw, 44px)` dengan outline 3px |
| Judul panel/sheet | Lilita 26–30px, lh 1 |
| Judul kartu | Lilita 20–28px |
| Eyebrow / label | Nunito 10.5–12px, 900, letter-spacing .08–.14em, huruf kapital |
| Teks isi | Nunito 14.5–16.5px, lh 1.42–1.6, `text-wrap: pretty`, maks 65ch |
| Label tombol utama | Lilita 17–26px, letter-spacing .02–.03em |
| Label tombol sekunder | Nunito 14–15px, 900 |

### Bentuk dan kedalaman ("chunky")

- **Garis:** `2.5px solid #2A1E16` (2px untuk elemen kecil).
- **Radius:** 14px (tombol kecil), 16–18px (tombol besar/kartu), 20–22px (panel/modal), 24px (sheet atas), 999px (pil).
- **Bayangan keras** (tanpa blur): `0 4px 0 #2A1E16` (kecil), `0 5px 0` (kartu), `0 6px 0` (tombol utama).
- **Tombol saat ditekan (active):** `transform: translateY(3–5px)` dan bayangan menjadi `0 1px 0 #2A1E16`.
- **Nonaktif:** garis `dashed`, latar `#E3D3B6`, teks `#6E5E4E`/`#5A4C3F`, tanpa bayangan. Gunakan `aria-disabled` (bukan `disabled`) agar klik tetap memunculkan toast alasan.
- **Pita tenun** (tinggi 8–9px, garis bawah 2.5px ink):
  `repeating-linear-gradient(90deg,#B83A2A 0 16px,#2A1E16 16px 20px,#F2B33D 20px 28px,#2A1E16 28px 32px,#2A5DA8 32px 48px,#2A1E16 48px 52px,#F6EEDF 52px 58px,#2A1E16 58px 62px)`
- **Stempel:** teks Lilita dengan garis 2.5–3px warna sendiri, radius 6–10px, diputar −4° sampai −9° (DIPILIH, DIBELI, MITOS/FAKTA, verdict).

### Spasi

Kelipatan 2px; jarak yang umum dipakai 4, 6, 8, 10, 12, 14, 16, 18. Margin tepi HUD 10px; layar konten `clamp(12px, 3vw, 32px)`. Selalu pakai flex/grid dengan `gap`.

### Ukuran target sentuh

Minimal 44px. Tombol bar atas HUD 48px, tombol kontrol bawah 66px (56px pada layar pendek).

## 6. Layar

Breakpoint:
- **wide:** lebar viewport ≥ 1100px. Kabar Dusun tampil sebagai panel kiri, Mutation Tree menjadi panel kanan, dan Patho-Dex dibingkai.
- **compact:** tinggi viewport < 720px. Elemen HUD diperkecil dan Kabar menjadi tombol pil.
- Referensi utama desain adalah HP 390×844.

Semua layar menumpuk di atas `<kuannoah-3d>` yang mengisi layar penuh. Overlay HUD memakai `pointer-events: none`, dan hanya panel yang `pointer-events: auto`, agar canvas 3D tetap bisa digeser.

### 6.1 Loading
Latar `#C7A970`. Di tengah ada spinner lingkaran 46px (garis 5px ink, bagian atas `#F2B33D`, berputar .9s) dan label Lilita 20px "MENYIAPKAN DUSUN KUANNOAH".

### 6.2 Beranda (Menu Utama)
- **3D:** `mode="title"`, infection 30, awareness 34. Kamera mengorbit pelan.
- **Layout:** kolom flex `space-between`, bisa digulir, padding `max(18px, safe-area-top) clamp(16px,4.5vw,64px) clamp(16px,3.5vw,48px)`.
- **Atas (maks 640px):**
  - Baris berisi pil gelap `#2A1E16`/`#F6EEDF` 11px 900 "SIMULASI EDUKASI KESEHATAN BERBASIS STRATEGI" dengan titik kunyit 9px, dan tombol pengaturan 50×50 (ikon roda).
  - Judul "INFECTIOUS / WORLD" (lihat tipografi) dengan animasi `iwTitle` .8s.
  - Pita tenun lebar maks 360px.
  - Panel deskripsi (paper, garis, radius 16, bayangan 4px, padding 12/15, 16px 600, maks 440px): "Pahami bagaimana kebersihan, pengenalan gejala, dan informasi yang benar melindungi komunitas, dari sudut pandang patogen fiktif."
- **Bawah (maks 440px, animasi `iwUp` .6s delay .15s):**
  - **MULAI INFEKSI**: tinggi 66, merah, Lilita 26, ikon play.
  - Grid 2 kolom: **HOW TO PLAY** (ikon tanda tanya) dan **PATHO-DEX & FACT-CHECKS** (ikon buku). Tinggi minimal 56, paper, Lilita 17.
  - Disclaimer pada latar `rgba(42,30,22,.86)`, 12.5px: "Game ini fiktif. Angka di dalamnya adalah mekanik permainan, bukan prediksi wabah atau data epidemiologi nyata."

### 6.3 How to Play (dialog, 5 langkah)
- **Bentuk:** sheet bawah, `left/right 12px`, `margin-left:auto`, maks 470px, radius 22, pita tenun di atas, animasi `iwUp` .45s. Scrim `rgba(42,30,22,.18)`.
- **3D:** `mode="guide"` dan `focus` per langkah. Kamera terbang ke fasilitas, dengan nilai contoh infection/awareness:
  1. Peranmu: `pasar`, 34/22
  2. Infection Points (IP): `warung`, 20/12
  3. Mutation Tree: `sekolah`, 46/30
  4. Awareness & Behavior Shield: `balai`, 40/62
  5. Misinformation Surge: `puskesmas`, 52/48
- **Header:** eyebrow "HOW TO PLAY · LANGKAH n DARI 5" dan tombol tutup 44px (`aria-label="Tutup tutorial"`). Judul Lilita 30.
- **Widget demo per langkah** (kotak inset `#EBDDC4`):
  1. Dua bar mini KAMU (merah 70%) dan WARGA (biru 56%), plus teks aturan menang/kalah.
  2. Koin IP 64px dengan angka yang naik +1 tiap 2 detik.
  3. Tiga kolom A1/A2, B1/B2, C1/C2. Node tingkat 2 bergaris putus. Label "Gejala · berisiko" berwarna biru.
  4. Empat ikon event E1–E4 dalam lingkaran kunyit 52px.
  5. Alur "50 IP → Awareness −8 → 8 dtk → Fact-Check +10".
- **Teks per langkah:** salin dari konstanta `GUIDE` di prototipe.
- **Navigasi:** titik langkah (aktif selebar 20px merah, lainnya 10px), tombol "Sebelumnya" (opacity .4 di langkah 1), dan "Berikutnya". Di langkah 5 tombolnya menjadi "Mengerti, Ayo Main!", yang menandai `tutorialCompleted` lalu membuka layar Pilih.

### 6.4 Pilih Patogen & Komunitas
- **3D:** `mode="select"` (blur kuat, sedikit gelap), infection 0, awareness 0.
- **Header:** tombol "Menu" dan judul "Pilih Patogen & Komunitas".
- **Label bagian:** "1 · PATOGEN" dan "2 · KOMUNITAS" berupa pil gelap 12px 900.
- **Kartu patogen** (grid `repeat(auto-fit, minmax(min(100%,290px),1fr))`, gap 16) adalah tombol penuh:
  - Header 170px berlatar `#221811` dengan `<specimen-3d kind>`, chip kode (RV-01 / EC-02 / DV-03 · ukuran), pita miring −8° kunyit "SEGEL · PRATINJAU" untuk yang terkunci, dan stempel "DIPILIH" merah.
  - Isi: chip tipe, chip status (Tersedia hijau / Dipilih merah / Terkunci track), nama Lilita 28, nama ilmiah italic, deskripsi singkat.
  - Saat dipilih: garis 3.5px merah, bayangan 8px, naik −4px.
  - Klik kartu terkunci memunculkan toast "{nama} masih pratinjau dan belum dapat dimainkan."
- **Kartu komunitas:** chip "ILUSTRATIF", judul "Dusun Kuannoah: Skala Komunitas", dua paragraf, tiga statistik (48 bangunan di peta, 6 fasilitas umum, data Ilustratif), dan chip fasilitas.
- **Bar bawah sticky** (paper, garis atas):
  - Tombol "LEPASKAN PATOGEN" tinggi 62. Merah jika Rhinovirus sudah dipilih; jika belum, gaya nonaktif dan klik memunculkan toast "Pilih Rhinovirus terlebih dahulu."
  - Hint di bawahnya: "Rhinovirus siap dilepas di Dusun Kuannoah (simulasi)." atau "Pilih patogen yang tersedia untuk memulai."

### 6.5 HUD Permainan (layar terpenting)
- **3D:** `mode="game"`. Pemain bisa memutar dengan drag, zoom dengan pinch/scroll, dan reset dengan double-click.
- **Atas** (lebar `calc(100% - 20px)`, maks 780px, di tengah, top `max(10px, safe-area)`, gap 8):
  1. **Bar atas** (flex gap 8), urut dari kiri:
     - Jeda/Lanjutkan 48×48, `aria-label` "Jeda"/"Lanjutkan".
     - Timer 44h dengan ikon jam dan Lilita 21, `aria-label="Waktu berjalan mm:ss"`.
     - Chip "SIMULASI" (latar `rgba(42,30,22,.82)`).
     - Spacer.
     - **Badge IP** 48h kunyit: koin SVG 36px dengan ring hitung mundur ke +1 IP berikutnya dan angka Lilita 28. Setiap kenaikan menampilkan float "+1" (`iwFloat` 1s); pembelian menampilkan "−biaya".
     - Tombol Menu 48×48 (ikon rumah), membuka konfirmasi keluar.
  2. **Kartu balapan** (paper, radius 18, bayangan 5px, padding 10/12/9, gap 9; compact: 7/10/6, gap 5). Berisi dua jalur:
     - Kiri: angka persen Lilita 36 (compact 27), lebar 64px (compact 50), rata kanan, berwarna jalur. Berdenyut `iwPulse` jika ≥ 80.
     - Kanan atas: label 11px 900 ("INFECTION PROGRESS · KAMU" / "COMMUNITY AWARENESS · WARGA"), badge "HAMPIR!" (≥ 80, berkedip), dan laju per detik 13px 900 (contoh "+0,26/dtk").
     - Kanan bawah: track 22px (garis 2.5px, radius 10, latar track, 20% terakhir diarsir), isi berwarna dengan transisi .95s linear, bendera finis papan catur 20×26 di ujung, dan **pelari** lingkaran 30px berwarna jalur dengan ikon virus atau orang yang bergerak bersama nilai.
     - Baris bawah (garis putus atas): level Transmisi / Gejala / Persistensi berupa 3 pip 10px (terisi ink sampai level saat ini), dan "finis 100%".
  3. **Status Behavior Shield:**
     - **Aktif:** banner kunyit (radius 18, bayangan 5px, animasi `iwDrop`) berisi ikon event dalam lingkaran 58px (compact 40), eyebrow "BEHAVIOR SHIELD · E1 · WARGA BERTINDAK", judul Lilita 21 (compact 17), efek singkat plus catatan A2/C2 bila berlaku (contoh " · A2: −20%"), dan ring sisa detik 52px.
     - **Tidak aktif:** pil "Behavior Shield berikutnya N dtk" dengan ring kecil.
     - **Misinformasi aktif:** panel `#3B342E` berisi "Kebingungan informasi menyebar (fiktif). Fact-Check datang dalam N dtk." dan progress bar hijau muda.
- **Kabar Dusun:**
  - Sempit: baris 44h "KABAR · ikon · waktu · pesan terbaru (ellipsis) · chevron". Klik membuka daftar 6 pesan ke atas.
  - Compact: tombol pil "KABAR" di baris legenda.
  - Wide: panel kiri bawah 290px yang selalu terbuka.
  - Ikon dan warna per nada: info lingkaran `#5A4C3F`, good belah ketupat `#3E7D4F`, warn perisai `#C68A1E`, bad segitiga `#B83A2A`.
- **Bawah** (maks 780px; wide 600px):
  - Tip ketuk bangunan (pil gelap) berbunyi "{Puskesmas | Rumah n}: {belum terdampak | terinfeksi (simulasi) | terlindungi | terinfeksi & mulai terlindungi}" selama 2,6 detik.
  - **Legenda** pil 40h: empat bentuk penanda (pin bulat putih = belum, pin bulat merah = infeksi, perisai biru = lindung, pin bulat merah dengan sudut biru = keduanya) dengan jumlahnya. `aria-label` berisi ringkasan.
  - **Lensa Data** (toggle, `aria-pressed`): saat aktif berlatar ink dengan teks kunyit, dan dunia 3D masuk mode lensa.
  - **Kontrol** (grid `1.5fr 1fr`, gap 10, tinggi 66 / compact 56):
    - **MUTATION TREE** (merah, ikon DNA, Lilita 21) dengan sub-teks "Siap dibeli: A1, B1", "Berikutnya A1 · 25 IP (kurang 5)", atau "Semua mutasi dibeli". Badge kunyit berisi jumlah node yang bisa dibeli (berdenyut).
    - **MISINFORMATION SURGE** (Lilita 14.5). Status: tersedia (kunyit, bayangan), tidak cukup IP (nonaktif, "IP kurang · n/50"), aktif (gelap, "Aktif · fact-check N dtk"), sudah dipakai ("Sudah dipakai").
- **Coach mark** (hanya sesi pertama, yaitu `records.sessionsStarted === 0`; tutup otomatis 9 detik; masing-masing sekali; balon gelap dengan judul kunyit):
  - Saat IP pertama: "Ini Infection Points (IP)".
  - Saat shield pertama: "Warga mulai melindungi diri", dengan teks dinamis.
  - Saat IP ≥ 20 dan belum ada mutasi dibeli: "IP cukup untuk mutasi pertama".
- **Kartu Jeda** (modal tengah 360px): "DIJEDA" dengan outline, "Waktu berhenti di mm:ss. Infeksi n% · Awareness n%", lalu tombol LANJUTKAN, Pengaturan, dan "Keluar ke menu" (bergaris merah).
- **Konfirmasi keluar** (`alertdialog`): "Kembali ke menu?" dan "Sesi ini akan dihentikan dan progresnya tidak disimpan." dengan tombol "Lanjut bermain" dan "Keluar ke menu". Membuka dialog ini menjeda game; membatalkannya melanjutkan game hanya jika sebelumnya berjalan.
- **Toast:** maksimal 3, hilang setelah 3,2 detik, posisi bawah 210px (wide 190px). Nada: info (paper), good (hijau), warn (kunyit), bad (merah).

### 6.6 Mutation Tree (simulasi tetap berjalan)
- **Sempit:** sheet bawah setinggi 88% (radius atas 24, `iwUp`) dengan scrim `rgba(42,30,22,.35)` yang menutup sheet jika diklik.
- **Wide:** panel kanan 460px (top/right/bottom 12) tanpa scrim, sehingga peta tetap terlihat.
- **Header:** pita tenun, judul "MUTATION TREE", indikator berkedip "mm:ss · tetap berjalan", saldo IP, tombol tutup (`aria-label="Tutup Mutation Tree"`), dan dua bar mini infeksi/awareness.
- **Tiga kolom cabang:** ikon dan label berwarna (Transmisi merah, Visibilitas Gejala biru dengan badge "BERISIKO", Persistensi cokelat). Node tingkat 2 tersambung garis vertikal 18px (putus-putus jika prasyarat belum dibeli).
- **Node** (tombol, tinggi minimal 100): ID Lilita 26, nama singkat 11.5px, biaya. Status:
  - Dibeli: isi warna cabang, teks terang, stempel "DIBELI".
  - Bisa dibeli: garis solid, bayangan 4px, badge "BELI" berdenyut.
  - IP kurang: garis putus, progress kunyit 5px di bawah, teks "n/biaya IP".
  - Terkunci: latar track, ikon gembok, "Butuh A1".
  - Terpilih: cincin kunyit 3px.
- **Kartu detail:**
  - ID · cabang, chip biaya, chip prasyarat, nama, deskripsi, daftar efek.
  - **Pratinjau laju** "sekarang → sesudah" untuk infeksi (garis merah) dan awareness (garis biru, berlatar tint jika naik).
  - Peringatan trade-off (biru) jika kenaikan awareness lebih besar dari kenaikan infeksi.
  - Tombol "BELI B1 · 20 IP". Jika tidak bisa dibeli, tombol memakai gaya nonaktif dan menampilkan alasan dari `canPurchase()`.
- Setelah membeli: toast "B1 dibeli · Infeksi +a → +b · Awareness +c → +d".

### 6.7 Hasil
- **3D:** `mode="result"`, `outcome` victory (suasana senja, lebih redup) atau defeat (suasana pagi cerah). Layar hasil muncul 900ms setelah game selesai.
- **Header:**
  - Eyebrow "HASIL SIMULASI: INFECTION PROGRESS 100%" atau "… COMMUNITY AWARENESS 100%".
  - Judul dua baris: "SIMULASI / MENANG" (kata kedua `#E7A08E`) atau "KOMUNITAS / TERLINDUNGI" (`#9CC4F5`).
  - Panel subjudul (teks lihat prototipe).
- **Dua kolom** (`auto-fit minmax(min(100%,340px),1fr)`):
  - **Pelajaran Kesehatan:** 3 kartu dari `buildDebrief()`. Masing-masing punya ubin ikon 40px (warna `#3E7D4F`, `#2A5DA8`, `#6B4A2E`), judul Lilita 22, isi 15.5px, dan tautan sumber (chip penerbit + judul + ikon external).
  - **Laporan Simulasi:** stempel "SIMULASI · FIKTIF" diputar 8°, 6 statistik (Infection Progress, Community Awareness, Sisa IP, Waktu, Mutasi dibeli, Misinformation Surge), dan jumlah tiap event shield (grid 2×2).
  - **Riwayat Peristiwa:** 8 terakhir, dengan tombol "Lihat semua (n)" / "Ringkas".
- **Bar bawah sticky:** MAIN LAGI (merah, 1.4fr), Patho-Dex, Menu Utama, tinggi 60.

### 6.8 Patho-Dex & Fact-Checks
- **3D:** `mode="dex"`, dengan blur latar.
- **Panel:** maks 860px, layar penuh di HP. Di wide dibingkai (padding 20, garis, radius 22, bayangan 6px).
- **Header** (`#EBDDC4`): tombol kembali ("Menu", "Hasil", atau "Daftar" saat detail terbuka) dan judul.
- **Daftar:** tab "Patogen (n)" / "Fact-Checks (n)" (aktif = ink) dan kolom cari dengan placeholder "Cari: antibiotik, nyamuk, cuci tangan…".
  - Item patogen: thumbnail `<specimen-3d>` 76px, nama, chip tipe, chip "Pratinjau", nama ilmiah, deskripsi.
  - Item fact-check: stempel verdict 112px diputar −4° (Benar hijau ✓, Salah merah ✕, Perlu Konteks `#9A6A12` ?) dan klaim dalam tanda kutip.
- **Detail patogen:** viewer 3D 210px (label "Model ilustratif · ukuran"), lalu bagian Signifikansi kesehatan, Penularan, Gejala, Konteks risiko, Pencegahan, Miskonsepsi (stempel MITOS dengan teks dicoret dan stempel FAKTA), Sumber, dan catatan "bukan pengganti saran tenaga kesehatan".
- **Detail fact-check:** stempel verdict besar, klaim Lilita, penjelasan, dan Sumber. `fc-game` tidak punya sumber; tampilkan teks pengganti.
- Membuka entri menambah `dexEntriesOpened`.

### 6.9 Pengaturan (modal maks 520px)
- Pita tenun dan judul.
- **Animasi:** radio tersegmentasi "Ikuti sistem / Kurangi animasi / Animasi penuh".
- **Kecepatan:** "Normal (1 detik) / Cepat (2×)", dengan catatan bahwa aturan tetap per detik simulasi.
- **Statistik lokal:** 9 item di grid 2 kolom.
- **Hapus statistik:** dengan konfirmasi inline.
- Opsional: tambahkan "Grafis: Tinggi / Hemat" yang diteruskan ke properti `quality` dunia 3D.

## 7. Dunia 3D (`kuannoah3d.js`)

Saat ini three.js dimuat lewat `import('https://unpkg.com/three@0.184.0/build/three.module.js')`. Di codebase lakukan ini:
1. `npm i three` (dan `npm i -D @types/three` bila file dikonversi ke TS).
2. Pindahkan file ke `src/three/kuannoah3d.js`. Ganti `import(URL3)` menjadi `import('three')` agar Vite memecahnya menjadi chunk terpisah.
3. **Hapus kode debug:** blok `if (window.__K3DEBUG …)` di akhir `frameBody`. Pertahankan try/catch di `frameLoop`.
4. Tambahkan deklarasi tipe `src/three/kuannoah3d.d.ts` (atau `allowJs`), dan masukkan folder ke ignore oxlint bila perlu.
5. Buat wrapper React `src/components/World3D.tsx` yang:
   - meng-import file secara lazy,
   - merender `<kuannoah-3d>` sekali di `App` (di belakang semua layar, `position: fixed; inset: 0`),
   - meneruskan properti dari state.

   React 19 menyetel properti custom element secara langsung. `onBuildingTap` dipasang sebagai listener event `BuildingTap`, dengan `event.detail = { index, kind, name, state, x, y }`.
6. **Fallback:** jika WebGL tidak tersedia (termasuk jsdom di tes), tampilkan latar `#C7A970`. Di tes, `vi.mock` wrapper ini.

**API `<kuannoah-3d>`:**

| Properti | Nilai | Efek |
|---|---|---|
| `infection`, `awareness` | 0–100 | Status 48 bangunan, memakai ambang yang sama dengan `CommunityMap.tsx` |
| `mode` | `title` / `select` / `guide` / `game` / `result` / `dex` | Gaya kamera dan tingkat blur |
| `focus` | `pasar` / `puskesmas` / `sekolah` / `balai` / `posyandu` / `warung` | Target kamera di `guide` |
| `shield` | string unik per event, contoh `"E1@15"` | Gelombang cincin biru dari fasilitas sumber (E1 posyandu, E2/E3 puskesmas, E4 balai) |
| `misinfo` | boolean | Suasana kabut kelabu. Saat berubah ke false (fact-check), muncul kilat terang dan gelombang dari puskesmas |
| `paused` | boolean | Dunia pudar dan redup |
| `lens` | boolean | Mode Lensa Data: dunia di-desaturasi, bangunan diwarnai sesuai status, penanda membesar |
| `reduced` | boolean | Gerakan dikurangi (tanpa orbit, gelombang, atau pantulan) |
| `quality` | `tinggi` / `hemat` | Pixel ratio 1.75/1, bayangan 2048/1024, rumput 5200/2200, tilt-shift on/off |
| `outcome` | `victory` / `defeat` | Suasana di `result` |

Visual per status bangunan:
- **Terinfeksi:** penanda pin bulat merah dengan glyph virus, plus kabut partikel merah.
- **Terlindungi:** penanda perisai biru dengan tetes air, plus tong cuci tangan biru di depan rumah.
- **Keduanya:** pin terbagi merah/biru.
- Penanda muncul dengan animasi pantul.

`<specimen-3d kind="rhinovirus|ecoli|dengue" locked>` adalah model berputar dengan latar transparan, bisa di-drag. Jika `locked`, model ditampilkan abu-abu.

**Performa:** dispose otomatis saat elemen dilepas, render berhenti saat tab tersembunyi, dan spesimen berhenti di luar viewport. Uji di HP kelas menengah. Jika berat, turunkan default `quality` ke `hemat` di layar < 500px.

## 8. Interaksi & animasi

Keyframe (salin dari `<style>` di helmet prototipe):

| Nama | Gerakan | Durasi umum |
|---|---|---|
| `iwPop` | Skala .6 → 1.06 → 1 | .25–.35s |
| `iwDrop` | Turun dari −26px | .4–.45s, `cubic-bezier(.2,.9,.25,1.25)` |
| `iwUp` | Naik dari +46px | .25–.6s |
| `iwFade` | Muncul pudar | |
| `iwFloat` | Naik −44px dan menghilang | 1s |
| `iwStamp` | Skala 2.4 dan rotasi −20° → 1, −9° | .4–.45s |
| `iwPulse` | Skala 1.07 | 1.1–1.3s, berulang |
| `iwBlink` | Opacity .4 | Berulang |
| `iwTitle` | Judul naik | .8s |
| `iwSpin` | Spinner | |

- Bar dan pelari: transisi `width`/`left` .95s linear (cocok dengan tick 1 detik).
- **Reduced motion:** `html[data-motion="reduced"]` atau `html[data-motion="system"]` + `prefers-reduced-motion: reduce` membuat semua animasi dan transisi ~0. Teruskan juga `reduced` ke dunia 3D. Atribut `data-motion` sudah diset oleh `App.tsx`.

## 9. Perbedaan data/konten antara prototipe dan repo

1. **Teks pesan ticker/riwayat** di `iw-core.js` dipersingkat (pemilik proyek mengizinkan perubahan teks pesan). Bandingkan string di `iw-core.js` dengan `engine.ts`, dan ambil **hanya stringnya**. Jika `engine.test.ts` menguji teks pesan, sesuaikan tes itu dengan sadar, atau pertahankan teks asli.
2. **Field UI tambahan** (jangan ubah `types.ts` engine; letakkan di modul UI, misalnya `src/ui/meta.ts`):
   - `short` untuk event (E1 "Infeksi −25%", E2 "Infeksi −20%", E3 "Awareness +5, lalu +0,10/dtk", E4 "Awareness +3, lalu +0,08/dtk").
   - Sumber gelombang 3D per event.
   - Kode kartu RV-01/EC-02/DV-03.
   - Ikon event (path SVG di `EV_ICON`).
3. **`size` patogen** (± 30 nm, ± 2 µm, ± 50 nm) adalah **konten baru tanpa sumber di repo**. Tambahkan sumber CDC/WHO yang sesuai sebelum rilis, atau hapus chip ukuran.
4. `FACILITIES` dan rumus ambang peta di `iw-core.js` diambil dari `CommunityMap.tsx`. Pastikan keduanya tetap identik.

## 10. Tes

Copy baru mengganti beberapa label yang dipakai `App.test.tsx`. Ubah selector, bukan assertion perilaku:

| Lama | Baru |
|---|---|
| `START INFECTION` | `MULAI INFEKSI` |
| `DEPLOY PATHOGEN` | `LEPASKAN PATOGEN` |
| `PLAY AGAIN` | `MAIN LAGI` |
| `Statistik Akhir` | `Laporan Simulasi` |
| `Beli (20 IP)` | `BELI B1 · 20 IP` |
| `Sudah dibeli` / `Tidak bisa dibeli` | Status node lewat `aria-label` node, serta label tombol beli berisi alasan |
| Heading `KOMUNITAS TERLINDUNGI` | Judul dua baris. Pakai `aria-label` di h1 atau sesuaikan matcher |
| `ipValue()` (label berakhir "Infection Points") | Badge IP baru punya `aria-label="{n} Infection Points, +1 dalam N detik"` |
| `title="Symptom Visibility Level"` + "Lv 2" | Pip level dengan `aria-label="Gejala level 2 dari 3"` |

Tombol yang tidak tersedia memakai `aria-disabled` dan tetap bisa diklik untuk memunculkan toast; tes AC-016 bergantung pada ini. Mock `World3D` dan spesimen di tes.

Sebelum selesai, semua ini wajib lulus: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## 11. Deploy ke Vercel

- Repo sudah memakai Vite dengan `base: './'`, jadi bisa langsung dipakai di Vercel. Setelan: Framework **Vite**, Build `npm run build`, Output `dist`.
- Tambahkan `vercel.json` hanya jika perlu. Ini SPA satu halaman tanpa routing, jadi tidak perlu rewrite.
- Perbarui `index.html`:
  - font baru (hapus Orbitron/Space Grotesk),
  - `theme-color` `#1D1611`,
  - favicon baru sesuai palet (heksagon virus `#B83A2A` di atas `#F2B33D`, garis `#2A1E16`).
- Perbarui README repo: tautan "Mainkan" ke URL Vercel, dan bagian struktur (folder `src/three`).
- Script `deploy` (gh-pages) boleh tetap ada.

## 12. Aset

- Tidak ada gambar raster. Semua visual berasal dari three.js (geometri prosedural dan tekstur kanvas) dan ikon SVG inline (path ada di konstanta `IC`, `EV_ICON`, `DOT`, `PIN_*` dalam prototipe).
- Font: Lilita One dan Nunito Sans (SIL OFL).

## 13. File

- `prototype/Infectious World.dc.html`: semua layar. Template ada di atas, logika (`class Component`) di bawah. Prop pratinjau `layar` (beranda, panduan, pilih, game, game-shield, game-80, game-misinfo, mutasi, jeda, keluar, hasil-menang, hasil-kalah, pathodex, pengaturan) hanya untuk alat desain dan tidak dibawa ke produksi.
- `prototype/kuannoah3d.js`: dunia 3D dan spesimen.
- `prototype/iw-core.js`: port engine (referensi perbandingan saja).
- `prototype/support.js`: runtime alat desain (abaikan).

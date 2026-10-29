# Prompt untuk Claude Code

Tempel **satu fase per giliran**. Tunggu sampai selesai, cek hasilnya, lalu lanjut.

---

## Fase 0: Pahami dulu, jangan ubah kode

```
Saya pemula. Tolong baca design_handoff_infectious_world_v3/README.md sampai habis, lalu pelajari repo ini (src/game, src/content, src/screens, src/components, App.tsx, App.test.tsx). Buka juga file di design_handoff_infectious_world_v3/prototype/ sebagai referensi desain.

JANGAN ubah kode dulu. Jelaskan ke saya dengan bahasa sederhana:
1) apa yang akan kamu bangun,
2) rencana kerjamu per fase,
3) hal di README yang menurutmu tidak jelas atau berisiko.

Aturan wajib selama proyek ini: jangan mengubah aturan/formula game di src/game dan isi konten kesehatan di src/content (kecuali yang disebut di README bagian 9). Bekerjalah di branch baru bernama redesain-v3.
```

## Fase 1: Fondasi

```
Mulai Fase 1. Buat branch redesain-v3. Lalu:
- install three (dan @types/three jika perlu), serta font Lilita One dan Nunito Sans (pakai paket @fontsource bila bisa);
- buat token CSS sesuai README bagian 5 (warna, radius, bayangan, keyframes animasi bagian 8, aturan reduced motion);
- perbarui index.html (font, theme-color #1D1611, favicon baru sesuai palet), hapus gaya neon lama yang tidak dipakai lagi;
- tambahkan folder design_handoff_infectious_world_v3 ke ignore oxlint.
Jalankan npm run typecheck dan npm test, lalu laporkan hasilnya.
```

## Fase 2: Dunia 3D

```
Fase 2: pindahkan prototype/kuannoah3d.js ke src/three/ sesuai README bagian 7 (ganti import unpkg jadi import('three'), hapus blok debug __K3DEBUG, tambahkan deklarasi tipe). Buat komponen World3D yang dirender sekali di App di belakang semua layar, dengan fallback bila WebGL tidak tersedia, dan mock-nya untuk tes. Sambungkan infection/awareness dari state game. Jalankan npm run dev, beri tahu alamatnya supaya saya bisa melihat desa 3D-nya, lalu jalankan npm test.
```

## Fase 3: Beranda, How to Play, Pilih Patogen

```
Fase 3: bangun ulang layar Beranda, How to Play (5 langkah, kamera 3D terbang ke fasilitas), dan Pilih Patogen (kartu dengan model specimen-3d) persis seperti README bagian 6.2–6.4 dan prototipe. Pakai komponen React dan CSS, bukan inline style mentah. Perbarui selector App.test.tsx yang terdampak (README bagian 10) tanpa mengubah assertion perilaku. Jalankan tes, lalu beri tahu saya cara melihat hasilnya di mode HP 390px.
```

## Fase 4: HUD Permainan dan Mutation Tree

```
Fase 4 (layar terpenting): bangun ulang HUD Permainan, Mutation Tree, kartu Jeda, konfirmasi keluar, coach mark, toast, Kabar Dusun, legenda, dan Lensa Data sesuai README bagian 6.5–6.6. Perhatikan breakpoint wide (≥1100px lebar) dan compact (<720px tinggi). Pastikan hanya ada satu timer, simulasi tetap berjalan saat Mutation Tree terbuka, dan tombol yang tidak tersedia memakai aria-disabled supaya toast alasannya tetap muncul. Jalankan semua tes.
```

## Fase 5: Hasil, Patho-Dex, Pengaturan

```
Fase 5: bangun ulang layar Hasil, Patho-Dex & Fact-Checks, dan Pengaturan sesuai README bagian 6.7–6.9. Untuk chip ukuran patogen (README bagian 9 poin 3), tanyakan ke saya dulu: dipertahankan dengan sumber, atau dihapus. Jalankan semua tes.
```

## Fase 6: Pemeriksaan akhir

```
Fase 6: periksa semuanya.
1) npm test, npm run typecheck, npm run lint, npm run build harus lulus;
2) cek tampilan di 390x844, 360x640, 1366x768, dan 1920x1080: tidak ada scroll horizontal, tidak ada teks terpotong, target sentuh minimal 44px;
3) cek mode "Kurangi animasi";
4) cek performa dunia 3D (dispose saat unmount, tidak ada error di konsol);
5) perbarui README repo (struktur folder baru, cara menjalankan).
Laporkan apa saja yang kamu perbaiki.
```

## Fase 7: Simpan dan kirim ke GitHub

```
Fase 7: commit semua perubahan di branch redesain-v3 dengan pesan yang jelas, lalu push ke GitHub. Setelah itu jelaskan ke saya langkah impor repo ini di Vercel (Framework Vite, build npm run build, output dist), dan cara menggabungkan ke main setelah saya puas dengan preview-nya.
```

---

### Prompt bantuan yang sering berguna

- `Jelaskan dengan bahasa sederhana apa yang baru kamu lakukan dan kenapa.`
- `Bandingkan layar ini dengan prototipe di design_handoff_infectious_world_v3/prototype dan perbaiki yang berbeda.`
- `Build di Vercel gagal, ini log-nya: (tempel log)`
- `Batalkan perubahan terakhir, kembali ke commit sebelumnya.`

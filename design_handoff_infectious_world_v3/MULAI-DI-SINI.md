# Mulai di sini (panduan untuk pemula)

Panduan ini membawa Anda dari nol sampai game **Infectious World v3** online di Vercel, dengan **Claude Code** yang menulis kodenya. Tugas Anda: menyiapkan alat, menempelkan prompt, dan mengecek hasilnya.

Perkiraan waktu: 1–3 jam, tergantung kecepatan internet dan berapa kali Anda meminta perbaikan.

---

## Langkah 1: Siapkan alat (sekali saja)

1. **Node.js (versi LTS)**: unduh dari https://nodejs.org lalu instal.
2. **Git**: unduh dari https://git-scm.com lalu instal (di Windows, pilih setelan bawaan saja).
3. **Akun Vercel**: daftar di https://vercel.com dengan **"Continue with GitHub"** memakai akun GitHub yang memiliki repo `infectious-world`. Paket Hobby gratis.
4. **Claude Code**: ikuti petunjuk instalasi resmi dari Anthropic (cari "Claude Code install"). Saat panduan ini ditulis, salah satu caranya lewat terminal:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
   Claude Code butuh akun Claude berbayar atau akun Anthropic API. Saat pertama kali dijalankan, Anda akan diminta login.

**Cara membuka terminal:**
- Windows: tekan tombol Windows, ketik **PowerShell**, Enter.
- Mac: tekan Cmd+Spasi, ketik **Terminal**, Enter.

Cek instalasi dengan mengetik perintah berikut satu per satu. Masing-masing harus menampilkan nomor versi:
```
node -v
git --version
claude --version
```
Jika muncul "tidak dikenal" atau "not recognized", tutup lalu buka lagi terminal. Jika masih gagal, instal ulang alat tersebut.

## Langkah 2: Unduh repo game ke komputer

Ketik di terminal:
```
cd Documents
git clone https://github.com/samueladian3-cpu/infectious-world.git
cd infectious-world
npm install
npm run dev
```
Buka alamat yang muncul (biasanya http://localhost:5173). Anda akan melihat **versi lama** game. Tekan **Ctrl+C** di terminal untuk menghentikannya.

## Langkah 3: Taruh paket handoff ke dalam repo

Ekstrak zip `design_handoff_infectious_world_v3` ke **dalam** folder `Documents/infectious-world`. Hasilnya harus seperti ini:
```
infectious-world/
  design_handoff_infectious_world_v3/
    README.md            ← spesifikasi lengkap untuk Claude Code
    MULAI-DI-SINI.md     ← file ini
    PROMPT-CLAUDE-CODE.md
    prototype/
  src/
  package.json
  ...
```

## Langkah 4: Jalankan Claude Code

Di terminal, pastikan Anda berada di folder `infectious-world`, lalu ketik:
```
claude
```
Buka `PROMPT-CLAUDE-CODE.md`, lalu salin dan tempel prompt **satu fase per giliran**. Tunggu sampai Claude Code selesai, cek hasilnya, baru lanjut ke fase berikutnya.

**Tips selama bekerja:**
- Jika Claude Code meminta izin menjalankan perintah atau mengubah file, baca sekilas lalu setujui. Perintah seperti `npm install`, `npm test`, dan `npm run build` aman.
- Jika ada yang tidak Anda pahami, tanya saja: *"Jelaskan dengan bahasa sederhana apa yang baru kamu lakukan."*
- Untuk melihat hasil, minta: *"Jalankan npm run dev dan beri tahu alamatnya."* Lalu buka alamat itu di browser. Untuk melihat versi HP, tekan F12 di Chrome dan klik ikon HP.
- Jika ada yang salah, ceritakan apa yang Anda lihat atau tempel pesan error-nya. Contoh: *"Tombol MULAI INFEKSI tertutup judul di layar HP."*
- Semua pekerjaan dilakukan di **branch terpisah** (`redesain-v3`), jadi versi lama di `main` tetap aman.

## Langkah 5: Deploy ke Vercel

1. Setelah semua fase selesai dan tes lulus, minta Claude Code menjalankan **Fase 7** (commit dan push).
2. Buka https://vercel.com, klik **Add New… → Project**, lalu pilih repo **infectious-world** dan klik **Import**.
3. Vercel biasanya mendeteksi **Vite** secara otomatis. Pastikan setelannya:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Klik **Deploy**. Setelah 1–2 menit Anda mendapat alamat seperti `https://infectious-world-xxxx.vercel.app`.
5. **Branch `redesain-v3`** otomatis mendapat alamat *Preview*. Uji dulu di HP Anda. Jika sudah puas, minta Claude Code: *"Gabungkan branch redesain-v3 ke main dan push."* Vercel akan memperbarui alamat utama secara otomatis.

Setiap kali Anda push perubahan baru ke GitHub, Vercel akan deploy ulang sendiri.

## Masalah umum

| Masalah | Solusi |
|---|---|
| `npm` / `claude` tidak dikenal | Tutup dan buka lagi terminal. Jika masih gagal, instal ulang Node.js atau Claude Code. |
| Build gagal di Vercel | Buka tab *Deployments → (deploy yang gagal) → Build Logs*, salin pesan error-nya, lalu tempel ke Claude Code. |
| Dunia 3D hitam atau kosong | Coba browser lain (Chrome atau Edge terbaru) dan pastikan akselerasi hardware aktif. Lalu cek konsol (F12) dan tempel error-nya ke Claude Code. |
| Perubahan tidak muncul | Muat ulang paksa dengan Ctrl+Shift+R. |
| Game terasa berat di HP | Minta Claude Code: *"Jadikan kualitas grafis 'hemat' sebagai default di layar HP."* |

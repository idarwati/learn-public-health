# Panduan untuk Claude: menulis di repo Learn Public Health

Repo ini adalah situs belajar kesehatan masyarakat berbahasa Indonesia, dari jenjang dasar sampai ahli. Situs statis: HTML, satu `style.css`, satu `app.js`, tanpa proses build. Semua file di satu tingkat.

## Pembaca

Mahasiswa baru sampai dosen dan praktisi. Banyak yang membuka dari HP dengan koneksi lambat. Tulis untuk orang cerdas yang belum mengenal istilahnya.

## Bahasa

- Bahasa Indonesia baku yang hangat dan langsung. Sapa pembaca dengan "Anda".
- Istilah teknis diperkenalkan sekali dengan padanan Indonesia dan istilah Inggrisnya, lalu dipakai konsisten.
- Desimal memakai koma (7,00), ribuan memakai titik.
- Kalimat pendek. Satu paragraf, satu gagasan.

## Struktur setiap modul

Salin `epidemiologi-01.html` dan pertahankan urutan ini:

1. Kepala modul: remah roti, judul, ringkasan satu kalimat, waktu belajar, prasyarat.
2. "Setelah modul ini, Anda bisa": tiga tujuan yang bisa diukur.
3. Kasus: pembaca ditempatkan sebagai petugas yang harus memutuskan sesuatu. Konteks Indonesia.
4. Langkah-langkah bernomor: konsep diperkenalkan saat dibutuhkan kasus, diikuti soal yang dikerjakan pembaca dan jawaban di dalam `<details>`.
5. Uji diri: lima soal pilihan ganda dengan penjelasan (`fieldset.soal`, lihat `app.js`).
6. Naik jenjang: masalah yang sama dari sudut jenjang 2, 3, dan 4.
7. Terapkan: tiga tugas untuk kampus atau tempat kerja.
8. Rujukan.

Nama file: `bidang-nomor.html` dengan bidang `epidemiologi`, `biostatistik`, `akk`, atau `ai`.

## Aturan isi

- Tulis orisinal. Jangan menyalin atau menerjemahkan utuh dari buku berhak cipta; jelaskan gagasannya dengan contoh sendiri dan sebut sumbernya di Rujukan.
- Sumber terbuka boleh diadaptasi sesuai lisensinya (lihat `sumber.html`).
- Data kasus rekaan harus masuk akal dan diberi keterangan "rekaan". Jangan memakai nama orang nyata.
- Hitung ulang setiap angka dengan kode sebelum menulisnya. Jumlah baris dan kolom tabel harus cocok.
- Untuk peraturan, tarif, atau angka resmi Indonesia: cari sumber terbaru. Jika tidak bisa dipastikan, tulis agar pembaca memeriksa peraturan yang berlaku.
- Jangan menulis nasihat medis untuk perorangan.

## Tampilan

- Pakai kelas yang sudah ada di `style.css`. Jangan menambah CSS di dalam halaman kecuali benar-benar perlu.
- Warna dan huruf hanya diubah lewat variabel di `:root`.
- Setiap halaman harus tetap terbaca tanpa JavaScript dan nyaman di layar selebar 360 piksel.
- Interaksi baru ditambahkan ke `app.js` sebagai fungsi kecil, dengan `localStorage` dibungkus `try/catch`.

## Setelah menulis modul

1. Di `kurikulum.html`, ubah topik menjadi tautan dengan `class="tersedia"` dan lencana `data-status-modul`.
2. Periksa semua tautan antarhalaman.
3. Sebutkan kepada pemilik repo bagian mana yang perlu ditinjau ahli.

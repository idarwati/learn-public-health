# Learn Public Health

Tempat belajar kesehatan masyarakat dari jenjang dasar sampai ahli, berbasis kasus nyata, gratis, dan berbahasa Indonesia.

Empat bidang: **epidemiologi**, **biostatistik**, **administrasi, manajemen, dan kebijakan kesehatan**, serta **AI dan data di kesehatan**. Masing-masing empat jenjang: dasar, menengah, lanjut, ahli.


## Isi repo

| File | Fungsi |
|---|---|
| `index.html` | Beranda |
| `kurikulum.html` | Peta kurikulum: daftar topik per bidang dan jenjang |
| `sumber.html` | Buku dan sumber terbuka yang dirujuk |
| `epidemiologi-01.html` | Modul pertama, sekaligus contoh untuk modul berikutnya |
| `bidang-nomor.html` | Halaman modul lain, misalnya `biostatistik-02.html` atau `akk-04.html` |
| `style.css` | Tampilan semua halaman (warna diatur di bagian `:root`) |
| `app.js` | Kurva epidemi, kuis, kalkulator, penanda "selesai" |
| `CLAUDE.md` | Aturan menulis modul, dibaca Claude sebelum membantu |

Semua file berada di satu tingkat (tanpa folder) supaya mudah diunggah lewat peramban atau HP.

## Menayangkan situs dengan GitHub Pages

1. Buat repository baru yang **Public**, misalnya `learn-public-health`.
2. Klik **Add file → Upload files**, pilih semua file di atas, lalu **Commit changes**.
3. Buka **Settings → Pages**. Pada *Source* pilih **Deploy from a branch**, lalu branch `main` dan folder `/ (root)`. Klik **Save**.
4. Tunggu 1–2 menit. Situs tayang di `https://NAMA-PENGGUNA.github.io/learn-public-health/`.

Setiap kali sebuah file diubah dan di-commit, situs ikut diperbarui dalam beberapa menit.

## Menambah modul baru

1. Salin `epidemiologi-01.html`, beri nama dengan pola `bidang-nomor.html`. Contoh: `biostatistik-01.html`, `akk-01.html`, `ai-01.html`.
2. Ganti isinya, tetapi pertahankan urutan bagian: Tujuan, Kasus, Langkah-langkah, Uji diri, Naik jenjang, Terapkan, Rujukan.
3. Ganti `data-modul="epidemiologi-01"` pada tombol "Tandai modul ini selesai" dengan nama modul baru.
4. Di `kurikulum.html`, ubah topik terkait menjadi tautan seperti contoh modul pertama.

## Menulis modul bersama Claude

Di chat Claude, klik **+ → Add from GitHub**, pilih repo ini, lalu sertakan `CLAUDE.md`, `epidemiologi-01.html`, dan `kurikulum.html`. Contoh permintaan:

> Tulis modul `biostatistik-01.html` untuk topik "Rata-rata, median, dan sebaran", jenjang 1. Ikuti CLAUDE.md dan struktur epidemiologi-01.html. Kasusnya: data lama tunggu pasien di poliklinik sebuah rumah sakit.

Unggah file hasilnya ke repo, lalu perbarui `kurikulum.html`.

## Aturan isi

- Semua materi ditulis dengan kata-kata sendiri. Buku berhak cipta hanya dirujuk, tidak disalin atau diterjemahkan utuh.
- Setiap angka dalam modul harus bisa dihitung ulang dari data yang ditampilkan.
- Setiap modul ditinjau oleh orang yang menguasai bidangnya sebelum ditandai tersedia.
- Data kasus rekaan diberi keterangan "rekaan". Data nyata diberi sumber.

## Lisensi

Belum ditetapkan. Jika ingin materi ini boleh dipakai ulang oleh dosen dan kampus lain, lisensi yang lazim untuk bahan ajar terbuka adalah CC BY-SA 4.0.

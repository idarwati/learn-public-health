/* Learn Public Health — skrip bersama.
   Isi: kurva epidemi, kuis, kalkulator risiko, dan penanda "modul selesai". */
(function () {
  'use strict';

  /* Penyimpanan kecil di peramban. Dibungkus try/catch karena sebagian
     peramban (mode privat) menolak akses localStorage. */
  function simpan(kunci, nilai) { try { localStorage.setItem(kunci, nilai); } catch (e) {} }
  function ambil(kunci) { try { return localStorage.getItem(kunci); } catch (e) { return null; } }
  function hapus(kunci) { try { localStorage.removeItem(kunci); } catch (e) {} }

  function angka(n, desimal) {
    return n.toFixed(desimal).replace('.', ',');
  }

  /* ---------- Kurva epidemi ----------
     Pakai: <div class="kurva" data-kurva="2,7,13,12,8,4,2"></div>
     Tiap angka = jumlah kasus pada jam ke-1, ke-2, dst. */
  function gambarKurva(el) {
    var data = (el.getAttribute('data-kurva') || '').split(',').map(Number);
    var sumbu = document.createElement('div');
    sumbu.className = 'kurva-sumbu';
    sumbu.setAttribute('aria-hidden', 'true');
    data.forEach(function (jumlah, i) {
      var kolom = document.createElement('div');
      kolom.className = 'kolom';
      for (var k = 0; k < jumlah; k++) {
        var kotak = document.createElement('span');
        kotak.className = 'kasus';
        kolom.appendChild(kotak);
      }
      el.appendChild(kolom);
      var label = document.createElement('span');
      label.textContent = (i + 1);
      sumbu.appendChild(label);
    });
    el.parentNode.insertBefore(sumbu, el.nextSibling);
  }

  /* ---------- Kalkulator attack rate dan rasio risiko ---------- */
  function hitungRisiko(ts, tt, ns, nt) {
    var semua = [ts, tt, ns, nt];
    for (var i = 0; i < semua.length; i++) {
      if (!isFinite(semua[i]) || semua[i] < 0 || Math.floor(semua[i]) !== semua[i]) {
        return { galat: 'Isi keempat kotak dengan bilangan bulat, 0 atau lebih.' };
      }
    }
    if (tt === 0 || nt === 0) return { galat: 'Jumlah orang di tiap kelompok harus lebih dari 0.' };
    if (ts > tt || ns > nt) return { galat: 'Jumlah yang sakit tidak boleh melebihi jumlah orang di kelompoknya.' };

    var ar1 = ts / tt;
    var ar0 = ns / nt;
    var hasil = { ar1: ar1, ar0: ar0, selisih: ar1 - ar0, rr: null, bawah: null, atas: null };
    if (ar0 > 0) {
      hasil.rr = ar1 / ar0;
      if (ts > 0) {
        /* Selang kepercayaan 95% dengan metode log (Katz). */
        var se = Math.sqrt(1 / ts - 1 / tt + 1 / ns - 1 / nt);
        hasil.bawah = Math.exp(Math.log(hasil.rr) - 1.96 * se);
        hasil.atas = Math.exp(Math.log(hasil.rr) + 1.96 * se);
      }
    }
    return hasil;
  }

  function pasangKalkulator(form) {
    var keluaran = document.getElementById('hasil-kalkulator');
    var pesan = document.getElementById('pesan-kalkulator');

    function tampil() {
      var nilai = ['ts', 'tt', 'ns', 'nt'].map(function (id) {
        var v = form.elements[id].value;
        return v === '' ? NaN : Number(v);
      });
      var h = hitungRisiko(nilai[0], nilai[1], nilai[2], nilai[3]);
      if (h.galat) {
        pesan.textContent = h.galat;
        pesan.hidden = false;
        keluaran.hidden = true;
        return;
      }
      pesan.hidden = true;
      keluaran.hidden = false;
      document.getElementById('k-ar1').textContent = angka(h.ar1 * 100, 1) + '%';
      document.getElementById('k-ar0').textContent = angka(h.ar0 * 100, 1) + '%';
      document.getElementById('k-selisih').textContent = angka(h.selisih * 100, 1) + ' poin persen';
      document.getElementById('k-rr').textContent = h.rr === null
        ? 'Tidak dapat dihitung (tidak ada yang sakit di kelompok tidak makan)'
        : angka(h.rr, 2);
      document.getElementById('k-ci').textContent = h.bawah === null
        ? 'Tidak dapat dihitung'
        : angka(h.bawah, 2) + ' sampai ' + angka(h.atas, 2);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); tampil(); });

    /* Tombol "Hitung" pada tabel mengisi kalkulator secara otomatis. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-isi]'), function (tombol) {
      tombol.addEventListener('click', function () {
        var d = tombol.getAttribute('data-isi').split(',');
        form.elements.ts.value = d[0];
        form.elements.tt.value = d[1];
        form.elements.ns.value = d[2];
        form.elements.nt.value = d[3];
        document.getElementById('nama-makanan').textContent = tombol.getAttribute('data-nama');
        tampil();
        form.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  /* ---------- Kuis ----------
     <fieldset class="soal" data-benar="b"> berisi tombol .pilihan[data-nilai]
     dan <p class="penjelasan" hidden>. */
  function pasangKuis() {
    var soal = document.querySelectorAll('.soal');
    if (!soal.length) return;
    var skorEl = document.getElementById('skor');
    var terjawab = 0;
    var benar = 0;

    Array.prototype.forEach.call(soal, function (kotak) {
      var kunci = kotak.getAttribute('data-benar');
      var tombol = kotak.querySelectorAll('.pilihan');
      var penjelasan = kotak.querySelector('.penjelasan');
      Array.prototype.forEach.call(tombol, function (t) {
        t.addEventListener('click', function () {
          var tepat = t.getAttribute('data-nilai') === kunci;
          Array.prototype.forEach.call(tombol, function (lain) {
            lain.disabled = true;
            if (lain.getAttribute('data-nilai') === kunci) lain.classList.add('benar');
          });
          if (!tepat) t.classList.add('salah');
          var awal = document.createElement('strong');
          awal.textContent = tepat ? 'Benar. ' : 'Belum tepat. ';
          penjelasan.insertBefore(awal, penjelasan.firstChild);
          penjelasan.hidden = false;
          terjawab += 1;
          if (tepat) benar += 1;
          if (skorEl && terjawab === soal.length) {
            skorEl.textContent = 'Skor Anda: ' + benar + ' dari ' + soal.length + ' soal benar.';
            skorEl.hidden = false;
          }
        });
      });
    });
  }

  /* ---------- Penanda modul selesai ---------- */
  function pasangPenanda() {
    var tombol = document.getElementById('tandai-selesai');
    if (tombol) {
      var kunci = 'lph-selesai-' + tombol.getAttribute('data-modul');
      var segarkan = function () {
        var sudah = ambil(kunci) === '1';
        tombol.textContent = sudah ? 'Batalkan tanda selesai' : 'Tandai modul ini selesai';
        tombol.setAttribute('aria-pressed', sudah ? 'true' : 'false');
      };
      tombol.addEventListener('click', function () {
        if (ambil(kunci) === '1') hapus(kunci); else simpan(kunci, '1');
        segarkan();
      });
      segarkan();
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-status-modul]'), function (el) {
      if (ambil('lph-selesai-' + el.getAttribute('data-status-modul')) === '1') {
        el.textContent = 'Selesai';
        el.classList.add('selesai');
      }
    });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-kurva]'), gambarKurva);
      var form = document.getElementById('kalkulator');
      if (form) pasangKalkulator(form);
      pasangKuis();
      pasangPenanda();
    });
  }

  /* Agar rumus bisa diuji di luar peramban. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hitungRisiko: hitungRisiko };
  }
})();

/* Learn Public Health — skrip bersama.
   Isi: kurva epidemi, kuis, kalkulator risiko, kalkulator ringkasan data, kalkulator distribusi normal, kalkulator selang kepercayaan, dan penanda "modul selesai". */
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

  /* Rasio odds dari tabel 2 x 2: (a × d) ÷ (b × c). */
  function rasioOdds(ts, tt, ns, nt) {
    var b = tt - ts, d = nt - ns;
    if (b <= 0 || ns <= 0) return null;
    return (ts * d) / (b * ns);
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
        ? 'Tidak dapat dihitung (tidak ada yang sakit di kelompok pembanding)'
        : angka(h.rr, 2);
      var orEl = document.getElementById('k-or');
      if (orEl) {
        var or = rasioOdds(nilai[0], nilai[1], nilai[2], nilai[3]);
        orEl.textContent = or === null ? 'Tidak dapat dihitung' : angka(or, 2);
      }
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

  /* ---------- Kalkulator ringkasan data ----------
     Angka dipisahkan spasi, baris baru, atau titik koma. Koma dibaca sebagai tanda desimal. */
  function hitungRingkasan(teks) {
    var potong = String(teks).split(/[\s;]+/).map(function (t) { return t.replace(/,+$/, ''); })
      .filter(function (t) { return t !== ''; });
    if (potong.length < 2) return { galat: 'Ketik sedikitnya dua angka, dipisahkan dengan spasi.' };
    var data = [];
    for (var i = 0; i < potong.length; i++) {
      var n = Number(potong[i].replace(',', '.'));
      if (!isFinite(n)) return { galat: 'Bagian "' + potong[i] + '" bukan angka. Pisahkan tiap angka dengan spasi.' };
      data.push(n);
    }
    data.sort(function (a, b) { return a - b; });
    var banyak = data.length;
    var jumlah = data.reduce(function (a, b) { return a + b; }, 0);
    var mean = jumlah / banyak;
    var tengah = Math.floor(banyak / 2);
    var median = banyak % 2 ? data[tengah] : (data[tengah - 1] + data[tengah]) / 2;
    var jk = data.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0);
    return { n: banyak, mean: mean, median: median, min: data[0], max: data[banyak - 1],
      rentang: data[banyak - 1] - data[0], sd: Math.sqrt(jk / (banyak - 1)) };
  }

  function rapi(n) {
    return String(Math.round(n * 100) / 100).replace('.', ',');
  }

  function pasangRingkasan(form) {
    var kotak = form.elements.angka;
    var keluaran = document.getElementById('hasil-ringkasan');
    var pesan = document.getElementById('pesan-ringkasan');
    function tampil() {
      var h = hitungRingkasan(kotak.value);
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('r-n').textContent = h.n;
      document.getElementById('r-mean').textContent = rapi(h.mean);
      document.getElementById('r-median').textContent = rapi(h.median);
      document.getElementById('r-minmax').textContent = rapi(h.min) + ' dan ' + rapi(h.max);
      document.getElementById('r-rentang').textContent = rapi(h.rentang);
      document.getElementById('r-sd').textContent = rapi(h.sd);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); tampil(); });
    Array.prototype.forEach.call(form.querySelectorAll('[data-angka]'), function (tombol) {
      tombol.addEventListener('click', function () { kotak.value = tombol.getAttribute('data-angka'); tampil(); });
    });
  }

  /* ---------- Kalkulator distribusi normal ----------
     peluangNormal(z) = bagian distribusi normal baku yang berada di bawah z.
     Fungsi galat dihampiri dengan rumus Abramowitz dan Stegun 7.1.26. */
  function peluangNormal(z) {
    var x = Math.abs(z) / Math.SQRT2;
    var t = 1 / (1 + 0.3275911 * x);
    var erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
  }

  function pasangNormal(form) {
    var keluaran = document.getElementById('hasil-normal');
    var pesan = document.getElementById('pesan-normal');
    function baca(nama) { return Number(String(form.elements[nama].value).trim().replace(',', '.')); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var rata = baca('rata'), sb = baca('sb'), nilai = baca('nilai');
      var kosong = ['rata', 'sb', 'nilai'].some(function (n) { return String(form.elements[n].value).trim() === ''; });
      if (kosong || !isFinite(rata) || !isFinite(sb) || !isFinite(nilai)) {
        pesan.textContent = 'Isi ketiga kotak dengan angka.'; pesan.hidden = false; keluaran.hidden = true; return;
      }
      if (sb <= 0) {
        pesan.textContent = 'Simpangan baku harus lebih dari 0.'; pesan.hidden = false; keluaran.hidden = true; return;
      }
      var z = (nilai - rata) / sb;
      var bawah = peluangNormal(z);
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('n-z').textContent = angka(z, 2);
      document.getElementById('n-bawah').textContent = angka(bawah * 100, 1) + '%';
      document.getElementById('n-atas').textContent = angka((1 - bawah) * 100, 1) + '%';
    });
  }

  /* ---------- Kalkulator selang kepercayaan proporsi ----------
     Selang kepercayaan 95% dengan hampiran normal: p ± 1,96 × √(p(1−p)/n). */
  function selangProporsi(x, n) {
    if (!isFinite(x) || !isFinite(n) || Math.floor(x) !== x || Math.floor(n) !== n || x < 0) {
      return { galat: 'Isi kedua kotak dengan bilangan bulat, 0 atau lebih.' };
    }
    if (n < 1) return { galat: 'Besar sampel harus sedikitnya 1.' };
    if (x > n) return { galat: 'Jumlah yang memiliki ciri tidak boleh melebihi besar sampel.' };
    var p = x / n;
    var se = Math.sqrt(p * (1 - p) / n);
    return { p: p, se: se, bawah: Math.max(0, p - 1.96 * se), atas: Math.min(1, p + 1.96 * se) };
  }

  function pasangSelang(form) {
    var keluaran = document.getElementById('hasil-selang');
    var pesan = document.getElementById('pesan-selang');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var vx = form.elements.x.value, vn = form.elements.n.value;
      var h = selangProporsi(vx === '' ? NaN : Number(vx), vn === '' ? NaN : Number(vn));
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('s-p').textContent = angka(h.p * 100, 1) + '%';
      document.getElementById('s-se').textContent = angka(h.se * 100, 2) + ' poin persen';
      document.getElementById('s-ci').textContent = angka(h.bawah * 100, 1) + '% sampai ' + angka(h.atas * 100, 1) + '%';
    });
  }

  /* ---------- Kalkulator nilai p dari z ---------- */
  function nilaiP(z) {
    return 2 * (1 - peluangNormal(Math.abs(z)));
  }

  function pasangNilaiP(form) {
    var keluaran = document.getElementById('hasil-nilaip');
    var pesan = document.getElementById('pesan-nilaip');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var teks = String(form.elements.z.value).trim().replace(',', '.');
      var z = Number(teks);
      if (teks === '' || !isFinite(z)) {
        pesan.textContent = 'Isi nilai z dengan angka, misalnya 2,12.'; pesan.hidden = false; keluaran.hidden = true; return;
      }
      var p = nilaiP(z);
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('p-dua').textContent = p < 0.001 ? 'kurang dari 0,001' : angka(p, 3);
    });
  }

  /* ---------- Kalkulator kai kuadrat tabel 2 x 2 ---------- */
  function kaiKuadrat(a, b, c, d) {
    var sel = [a, b, c, d];
    for (var i = 0; i < 4; i++) {
      if (!isFinite(sel[i]) || sel[i] < 0 || Math.floor(sel[i]) !== sel[i]) {
        return { galat: 'Isi keempat kotak dengan bilangan bulat, 0 atau lebih.' };
      }
    }
    var n = a + b + c + d;
    var baris1 = a + b, baris2 = c + d, kolom1 = a + c, kolom2 = b + d;
    if (baris1 === 0 || baris2 === 0 || kolom1 === 0 || kolom2 === 0) {
      return { galat: 'Tiap kelompok dan tiap kategori harus berisi sedikitnya satu orang.' };
    }
    var chi = n * Math.pow(a * d - b * c, 2) / (baris1 * baris2 * kolom1 * kolom2);
    var harapanMin = Math.min(baris1, baris2) * Math.min(kolom1, kolom2) / n;
    return { chi: chi, p: nilaiP(Math.sqrt(chi)), harapanMin: harapanMin };
  }

  function pasangKai(form) {
    var keluaran = document.getElementById('hasil-kai');
    var pesan = document.getElementById('pesan-kai');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = ['a', 'b', 'c', 'd'].map(function (k) { var t = form.elements[k].value; return t === '' ? NaN : Number(t); });
      var h = kaiKuadrat(v[0], v[1], v[2], v[3]);
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('x-chi').textContent = angka(h.chi, 2);
      document.getElementById('x-p').textContent = h.p < 0.001 ? 'kurang dari 0,001' : angka(h.p, 3);
      document.getElementById('x-min').textContent = angka(h.harapanMin, 1) + (h.harapanMin < 5 ? ' (di bawah 5: gunakan uji eksak Fisher)' : '');
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
      var ringkas = document.getElementById('ringkasan');
      if (ringkas) pasangRingkasan(ringkas);
      var normal = document.getElementById('normal');
      if (normal) pasangNormal(normal);
      var selang = document.getElementById('selang');
      if (selang) pasangSelang(selang);
      var formP = document.getElementById('nilaip');
      if (formP) pasangNilaiP(formP);
      var formKai = document.getElementById('kai');
      if (formKai) pasangKai(formKai);
      pasangKuis();
      pasangPenanda();
    });
  }

  /* Agar rumus bisa diuji di luar peramban. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hitungRisiko: hitungRisiko, hitungRingkasan: hitungRingkasan, peluangNormal: peluangNormal, selangProporsi: selangProporsi, nilaiP: nilaiP, rasioOdds: rasioOdds, kaiKuadrat: kaiKuadrat };
  }
})();

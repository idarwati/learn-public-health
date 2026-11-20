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

  /* ---------- Kalkulator skrining ---------- */
  function hitungSkrining(n, prev, sens, spes) {
    var semua = [n, prev, sens, spes];
    for (var i = 0; i < 4; i++) { if (!isFinite(semua[i])) return { galat: 'Isi keempat kotak dengan angka.' }; }
    if (n < 1) return { galat: 'Jumlah orang harus sedikitnya 1.' };
    if (prev < 0 || prev > 100 || sens < 0 || sens > 100 || spes < 0 || spes > 100) {
      return { galat: 'Prevalens, sensitivitas, dan spesifisitas harus antara 0 dan 100.' };
    }
    var sakit = n * prev / 100, sehat = n - sakit;
    var pb = sakit * sens / 100, np = sakit - pb;
    var nb = sehat * spes / 100, pp = sehat - nb;
    return { pb: pb, pp: pp, np: np, nb: nb,
      npp: pb + pp > 0 ? pb / (pb + pp) : null, npn: nb + np > 0 ? nb / (nb + np) : null };
  }

  function pasangSkrining(form) {
    var keluaran = document.getElementById('hasil-skrining');
    var pesan = document.getElementById('pesan-skrining');
    function baca(nama) { var t = String(form.elements[nama].value).trim().replace(',', '.'); return t === '' ? NaN : Number(t); }
    function bulat(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = hitungSkrining(baca('n'), baca('prev'), baca('sens'), baca('spes'));
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('sk-pb').textContent = bulat(h.pb);
      document.getElementById('sk-pp').textContent = bulat(h.pp);
      document.getElementById('sk-np').textContent = bulat(h.np);
      document.getElementById('sk-nb').textContent = bulat(h.nb);
      document.getElementById('sk-npp').textContent = h.npp === null ? 'Tidak dapat dihitung' : angka(h.npp * 100, 1) + '%';
      document.getElementById('sk-npn').textContent = h.npn === null ? 'Tidak dapat dihitung' : angka(h.npn * 100, 1) + '%';
    });
  }

  /* ---------- Kalkulator korelasi dan regresi linear ---------- */
  function bacaDeret(teks) {
    return String(teks).split(/[\s;]+/).map(function (t) { return t.replace(/,+$/, ''); })
      .filter(function (t) { return t !== ''; }).map(function (t) { return Number(t.replace(',', '.')); });
  }

  function hitungRegresi(xs, ys) {
    if (xs.length !== ys.length) return { galat: 'Banyaknya nilai x dan y harus sama. Sekarang ' + xs.length + ' dan ' + ys.length + '.' };
    if (xs.length < 3) return { galat: 'Ketik sedikitnya tiga pasang nilai.' };
    if (xs.concat(ys).some(function (v) { return !isFinite(v); })) return { galat: 'Ada isian yang bukan angka. Pisahkan tiap angka dengan spasi.' };
    var n = xs.length;
    var rx = xs.reduce(function (a, b) { return a + b; }, 0) / n;
    var ry = ys.reduce(function (a, b) { return a + b; }, 0) / n;
    var sxx = 0, syy = 0, sxy = 0;
    for (var i = 0; i < n; i++) { sxx += (xs[i] - rx) * (xs[i] - rx); syy += (ys[i] - ry) * (ys[i] - ry); sxy += (xs[i] - rx) * (ys[i] - ry); }
    if (sxx === 0 || syy === 0) return { galat: 'Nilai x atau y semuanya sama, sehingga hubungan tidak dapat dihitung.' };
    var b = sxy / sxx;
    var r = sxy / Math.sqrt(sxx * syy);
    return { n: n, r: r, r2: r * r, b: b, a: ry - b * rx };
  }

  function pasangRegresi(form) {
    var keluaran = document.getElementById('hasil-regresi');
    var pesan = document.getElementById('pesan-regresi');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = hitungRegresi(bacaDeret(form.elements.x.value), bacaDeret(form.elements.y.value));
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('g-n').textContent = h.n;
      document.getElementById('g-r').textContent = angka(h.r, 3);
      document.getElementById('g-r2').textContent = angka(h.r2, 3);
      document.getElementById('g-b').textContent = rapi(h.b);
      document.getElementById('g-a').textContent = rapi(h.a);
    });
  }

  /* ---------- Kalkulator besar sampel ---------- */
  function sampelProporsi(pPersen, dPersen) {
    if (!isFinite(pPersen) || !isFinite(dPersen)) return { galat: 'Isi kedua kotak dengan angka.' };
    if (pPersen <= 0 || pPersen >= 100) return { galat: 'Perkiraan proporsi harus di antara 0 dan 100.' };
    if (dPersen <= 0 || dPersen >= 50) return { galat: 'Ketelitian harus lebih dari 0 dan kurang dari 50.' };
    var p = pPersen / 100, d = dPersen / 100;
    return { n: Math.ceil(1.96 * 1.96 * p * (1 - p) / (d * d) - 1e-9) };
  }

  function sampelRata(sb, delta) {
    if (!isFinite(sb) || !isFinite(delta)) return { galat: 'Isi kedua kotak dengan angka.' };
    if (sb <= 0 || delta <= 0) return { galat: 'Simpangan baku dan selisih harus lebih dari 0.' };
    return { n: Math.ceil(2 * Math.pow(1.96 + 0.84, 2) * sb * sb / (delta * delta) - 1e-9) };
  }

  function ribuan(x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function bacaAngka(form, nama) { var t = String(form.elements[nama].value).trim().replace(',', '.'); return t === '' ? NaN : Number(t); }

  function pasangSampel() {
    var f1 = document.getElementById('sampel-proporsi');
    if (f1) f1.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = sampelProporsi(bacaAngka(f1, 'p'), bacaAngka(f1, 'd'));
      var pesan = document.getElementById('pesan-sp'), keluaran = document.getElementById('hasil-sp');
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('sp-n').textContent = ribuan(h.n) + ' orang';
    });
    var f2 = document.getElementById('sampel-rata');
    if (f2) f2.addEventListener('submit', function (e) {
      e.preventDefault();
      var h = sampelRata(bacaAngka(f2, 'sb'), bacaAngka(f2, 'delta'));
      var pesan = document.getElementById('pesan-sr'), keluaran = document.getElementById('hasil-sr');
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('sr-n').textContent = ribuan(h.n);
      document.getElementById('sr-total').textContent = ribuan(h.n * 2);
    });
  }

  /* ---------- Kalkulator peluang dari model logistik ----------
     Koefisien dibaca dari atribut data-b0, data-b1, data-b2 pada form. */
  function peluangLogistik(logOdds) { return 1 / (1 + Math.exp(-logOdds)); }

  function pasangLogistik(form) {
    var b0 = Number(form.getAttribute('data-b0')), b1 = Number(form.getAttribute('data-b1')), b2 = Number(form.getAttribute('data-b2'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lo = b0 + (form.elements.asap.checked ? b1 : 0) + (form.elements.padat.checked ? b2 : 0);
      document.getElementById('hasil-logistik').hidden = false;
      document.getElementById('lg-lo').textContent = angka(lo, 3);
      document.getElementById('lg-odds').textContent = angka(Math.exp(lo), 3);
      document.getElementById('lg-p').textContent = angka(peluangLogistik(lo) * 100, 1) + '%';
    });
  }

  /* ---------- Kalkulator Kaplan–Meier ----------
     Masukan: waktu dipisah spasi; akhiran + berarti tersensor. */
  function hitungKM(teks) {
    var token = String(teks).split(/[\s;]+/).map(function (t) { return t.replace(/,+$/, ''); })
      .filter(function (t) { return t !== ''; });
    if (token.length < 2) return { galat: 'Ketik sedikitnya dua waktu.' };
    var data = [];
    for (var i = 0; i < token.length; i++) {
      var sensor = /\+$/.test(token[i]);
      var v = Number(token[i].replace(/\+$/, '').replace(',', '.'));
      if (!isFinite(v) || v < 0) return { galat: '"' + token[i] + '" bukan waktu yang sah. Contoh: 3 atau 3+.' };
      data.push({ t: v, kejadian: !sensor });
    }
    var waktu = data.filter(function (d) { return d.kejadian; }).map(function (d) { return d.t; })
      .sort(function (a, b) { return a - b; })
      .filter(function (t, j, arr) { return j === 0 || t !== arr[j - 1]; });
    if (!waktu.length) return { galat: 'Semua waktu tersensor, jadi belum ada kejadian untuk dihitung.' };
    var s = 1, baris = [], median = null, jumlah = 0;
    waktu.forEach(function (t) {
      var r = data.filter(function (d) { return d.t >= t; }).length;
      var k = data.filter(function (d) { return d.t === t && d.kejadian; }).length;
      s = s * (1 - k / r); jumlah += k;
      baris.push({ t: t, r: r, k: k, s: s });
      if (median === null && s <= 0.5 + 1e-12) median = t;
    });
    return { n: data.length, kejadian: jumlah, baris: baris, median: median };
  }

  function pasangKM(form) {
    var keluaran = document.getElementById('hasil-km'), pesan = document.getElementById('pesan-km');
    function tampil() {
      var h = hitungKM(form.elements.waktu.value);
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      var badan = document.getElementById('km-baris');
      badan.textContent = '';
      h.baris.forEach(function (b) {
        var tr = document.createElement('tr');
        [rapi(b.t), b.r, b.k, angka(Math.round(b.s * 1000 + 1e-9) / 1000, 3)].forEach(function (isi, j) {
          var sel = document.createElement(j === 0 ? 'th' : 'td');
          if (j === 0) sel.scope = 'row';
          sel.textContent = isi; tr.appendChild(sel);
        });
        badan.appendChild(tr);
      });
      document.getElementById('km-n').textContent = h.n;
      document.getElementById('km-kejadian').textContent = h.kejadian;
      document.getElementById('km-median').textContent = h.median === null ? 'Belum tercapai' : rapi(h.median);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); tampil(); });
    Array.prototype.forEach.call(form.querySelectorAll('[data-km]'), function (tombol) {
      tombol.addEventListener('click', function () { form.elements.waktu.value = tombol.getAttribute('data-km'); tampil(); });
    });
  }

  /* ---------- Kalkulator kesulitan keuangan rumah tangga ----------
     Ambang lama: 10% dari seluruh pengeluaran.
     Ambang SDG 3.8.2 revisi 2025: 40% dari anggaran diskresioner. */
  function hitungKesulitan(total, oop, garis) {
    if ([total, oop, garis].some(function (v) { return !isFinite(v); })) return { galat: 'Isi ketiga kotak dengan angka.' };
    if (total <= 0) return { galat: 'Seluruh pengeluaran harus lebih dari 0.' };
    if (oop < 0 || garis < 0) return { galat: 'Angka tidak boleh negatif.' };
    if (oop > total) return { galat: 'Pembayaran untuk kesehatan tidak boleh melebihi seluruh pengeluaran.' };
    var diskresi = total - garis;
    return {
      porsi: oop / total, lama: oop / total > 0.10, diskresi: diskresi,
      porsiD: diskresi > 0 ? oop / diskresi : null,
      baru: oop > 0 && (diskresi <= 0 || oop / diskresi > 0.40)
    };
  }

  function pasangKesulitan(form) {
    var keluaran = document.getElementById('hasil-kt'), pesan = document.getElementById('pesan-kt');
    function tampil() {
      var h = hitungKesulitan(bacaAngka(form, 'total'), bacaAngka(form, 'oop'), bacaAngka(form, 'garis'));
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('kt-porsi').textContent = rapi(h.porsi * 100) + '%';
      document.getElementById('kt-lama').textContent = h.lama ? 'Ya' : 'Tidak';
      document.getElementById('kt-diskresi').textContent = h.diskresi > 0 ? 'Rp' + rapi(h.diskresi) + ' juta' : 'Tidak ada (pengeluaran di bawah garis)';
      document.getElementById('kt-porsi-d').textContent = h.porsiD === null ? 'Tidak dapat dihitung' : rapi(h.porsiD * 100) + '%';
      document.getElementById('kt-baru').textContent = h.baru ? 'Ya' : 'Tidak';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); tampil(); });
    Array.prototype.forEach.call(form.querySelectorAll('[data-rumah]'), function (tombol) {
      tombol.addEventListener('click', function () {
        var d = tombol.getAttribute('data-rumah').split(',');
        form.elements.total.value = d[0]; form.elements.oop.value = d[1]; form.elements.garis.value = d[2];
        tampil();
      });
    });
  }

  /* ---------- Simulasi model SIR ----------
     Model deterministik sederhana, langkah waktu 0,05 hari. */
  function hitungSIR(r0, durasi, n, awal, kebalPersen) {
    if ([r0, durasi, n, awal, kebalPersen].some(function (v) { return !isFinite(v); })) return { galat: 'Isi semua kotak dengan angka.' };
    if (r0 <= 0 || durasi <= 0) return { galat: 'R0 dan lama menular harus lebih dari 0.' };
    if (n < 10 || awal < 1) return { galat: 'Populasi minimal 10 dan kasus awal minimal 1.' };
    if (kebalPersen < 0 || kebalPersen >= 100) return { galat: 'Persen kebal harus antara 0 dan kurang dari 100.' };
    var rentan0 = n * (1 - kebalPersen / 100);
    if (awal > rentan0) return { galat: 'Kasus awal melebihi jumlah orang yang rentan.' };
    var b = r0 / durasi, g = 1 / durasi, dt = 0.05;
    var S = rentan0 - awal, I = awal, total = awal, puncak = I, hariPuncak = 0, kurva = [I];
    for (var k = 1; k <= 365 / dt; k++) {
      var inf = b * S * I / n * dt, sembuh = g * I * dt;
      S -= inf; I += inf - sembuh; total += inf;
      if (I > puncak) { puncak = I; hariPuncak = k * dt; }
      if (k % 20 === 0) kurva.push(I);
    }
    return { re: r0 * rentan0 / n, ambang: r0 > 1 ? 1 - 1 / r0 : 0, puncak: puncak, hariPuncak: hariPuncak,
      total: total, rentan: rentan0, sisa: S, kurva: kurva };
  }

  function pasangSIR(form) {
    var keluaran = document.getElementById('hasil-sir'), pesan = document.getElementById('pesan-sir');
    var garis = document.getElementById('sir-garis');
    function tampil() {
      var h = hitungSIR(bacaAngka(form, 'r0'), bacaAngka(form, 'durasi'), bacaAngka(form, 'n'), bacaAngka(form, 'awal'), bacaAngka(form, 'kebal'));
      if (h.galat) { pesan.textContent = h.galat; pesan.hidden = false; keluaran.hidden = true; return; }
      pesan.hidden = true; keluaran.hidden = false;
      document.getElementById('sir-re').textContent = angka(h.re, 2);
      document.getElementById('sir-ambang').textContent = angka(h.ambang * 100, 1) + '%';
      document.getElementById('sir-total').textContent = ribuan(Math.round(h.total)) + ' dari ' + ribuan(Math.round(h.rentan)) + ' orang rentan';
      document.getElementById('sir-puncak').textContent = h.puncak < 1.5 ? 'Tidak terjadi wabah' : ribuan(Math.round(h.puncak)) + ' orang, sekitar hari ke-' + Math.round(h.hariPuncak);
      if (garis) {
        var maks = Math.max.apply(null, h.kurva) || 1;
        garis.setAttribute('points', h.kurva.map(function (v, i) {
          return (40 + i * 270 / 365).toFixed(1) + ',' + (150 - v / maks * 130).toFixed(1);
        }).join(' '));
        document.getElementById('sir-maks').textContent = ribuan(Math.round(maks));
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); tampil(); });
    Array.prototype.forEach.call(form.querySelectorAll('[data-kebal]'), function (tombol) {
      tombol.addEventListener('click', function () { form.elements.kebal.value = tombol.getAttribute('data-kebal'); tampil(); });
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
      var formSk = document.getElementById('skrining');
      if (formSk) pasangSkrining(formSk);
      var formReg = document.getElementById('regresi');
      if (formReg) pasangRegresi(formReg);
      pasangSampel();
      var formLog = document.getElementById('logistik');
      if (formLog) pasangLogistik(formLog);
      var formKM = document.getElementById('km');
      if (formKM) pasangKM(formKM);
      var formKt = document.getElementById('katastropik');
      if (formKt) pasangKesulitan(formKt);
      var formSIR = document.getElementById('sir');
      if (formSIR) pasangSIR(formSIR);
      pasangKuis();
      pasangPenanda();
    });
  }

  /* Agar rumus bisa diuji di luar peramban. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hitungRisiko: hitungRisiko, hitungRingkasan: hitungRingkasan, peluangNormal: peluangNormal, selangProporsi: selangProporsi, nilaiP: nilaiP, rasioOdds: rasioOdds, kaiKuadrat: kaiKuadrat, hitungSkrining: hitungSkrining, hitungRegresi: hitungRegresi,
      sampelProporsi: sampelProporsi, sampelRata: sampelRata, peluangLogistik: peluangLogistik,
      hitungKM: hitungKM, hitungKesulitan: hitungKesulitan, hitungSIR: hitungSIR };
  }
})();

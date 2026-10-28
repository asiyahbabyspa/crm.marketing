// =========================================================================
// pantauan.js - tab "Pantauan" untuk dashboard marketing Bento for Kids.
// Memantau angka iklan harian, mingguan, dan bulanan dari data yang SUDAH ada
// (dataMarketing = isi tab Data_Ads). Semua dihitung di browser. Tidak ada
// panggilan ke server, tidak ada penulisan data.
//
// Pasang: letakkan di folder marketing/, muat SETELAH ui-marketing.js dan
// api-marketing.js. Ambang warna ada di PANTAUAN_CFG di bawah (ubah di sini).
// =========================================================================
(function () {
  'use strict';

  // Ambang diambil dari Laporan Mingguan Minggu 1 (Bagian A).
  // arah 'rendah' = makin kecil makin baik; 'tinggi' = makin besar makin baik.
  var PANTAUAN_CFG = {
    spend: { target: 1000000, merah: 1500000, arah: 'rendah', label: 'Spend' },
    chat:  { target: 200,     merah: 150,     arah: 'tinggi', label: 'Chat dari iklan' },
    cpl:   { target: 5000,    merah: 7500,    arah: 'rendah', label: 'CPL' },
    ctr:   { target: 1,       merah: 0.7,     arah: 'tinggi', label: 'CTR' },
    frek:  { target: 2.0,     merah: 2.5,     arah: 'rendah', label: 'Frekuensi (perkiraan)' },
    cpm:   { target: null,    merah: null,    arah: 'rendah', label: 'CPM' },
    omzetBaru:  { target: 7500000, merah: 5000000, arah: 'tinggi', label: 'Omzet pelanggan baru' },
    pelBaru:    { target: 50,      merah: 35,      arah: 'tinggi', label: 'Pelanggan baru' },
    closingBaru:{ target: 25,      merah: 18,      arah: 'tinggi', label: 'Chat jadi pembeli (closing rate)' },
    aovBaru:    { target: 150000,  merah: 120000,  arah: 'tinggi', label: 'Belanja rata-rata (AOV)' },
    roasBaru:   { target: 7.5,     merah: 5,       arah: 'tinggi', label: 'ROAS pelanggan baru' },
    cacBaru:    { target: 20000,   merah: 30000,   arah: 'rendah', label: 'Biaya per pelanggan baru (CAC)' },
    jumlahMinggu: 6,
    jumlahHari: 7,
    // Batas harian untuk spend dan chat = batas mingguan dibagi 7 (asumsi).
    bagiHarian: 7
  };

  var BELUM_ADA = [
    
    'Repeat order dan reminder reorder',
    'Respons dibalas ≤5 menit dan follow-up sesuai SLA',
    'Hook rate video (butuh data tayangan 3 detik dari Meta)',
    'Pengunjung, lead form, checkout WA (sheet web tracking belum dihubungkan)'
  ];

  // ---------------------------------------------------------------- util
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmtTgl(d) { return d.toISOString().slice(0, 10); }

  // Tanggal dari server bisa berupa string 'yyyy-MM-dd' atau ISO UTC (mis. 2026-10-06T17:00:00.000Z
  // = 7 Okt 2026 WIB). Selalu dinormalkan ke tanggal WIB (UTC+7).
  function tglWib(v) {
    if (v instanceof Date) return isNaN(v) ? '' : fmtTgl(new Date(v.getTime() + 7 * 3600000));
    var s = String(v == null ? '' : v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var d = new Date(s);
    return isNaN(d) ? '' : fmtTgl(new Date(d.getTime() + 7 * 3600000));
  }
  function geser(s, hari) {
    var d = new Date(s + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + hari);
    return fmtTgl(d);
  }
  function seninDari(s) {
    var d = new Date(s + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return fmtTgl(d);
  }
  var NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function tglPendek(s) { return Number(s.slice(8, 10)) + ' ' + NAMA_BULAN[Number(s.slice(5, 7)) - 1]; }
  function bulanPanjang(ym) { return NAMA_BULAN[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); }
  function rp(n) { return n == null ? '-' : 'Rp' + Math.round(n).toLocaleString('id-ID'); }
  function angka(n) { return n == null ? '-' : Math.round(n).toLocaleString('id-ID'); }
  function des(n, d) { return n == null ? '-' : Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  // ---------------------------------------------------------- agregasi
  function agg0() { return { spend: 0, chat: 0, impr: 0, klik: 0, fw: 0, hari: {} }; }
  function tambah(a, r) {
    a.spend += r.spend; a.chat += r.chat; a.impr += r.impr; a.klik += r.klik;
    a.fw += r.frek * r.impr; a.hari[r.t] = 1;
  }
  function turunan(a) {
    return {
      spend: a.spend,
      chat: a.chat,
      cpl: a.chat > 0 ? a.spend / a.chat : null,
      ctr: a.impr > 0 ? a.klik / a.impr * 100 : null,
      cpm: a.impr > 0 ? a.spend / a.impr * 1000 : null,
      frek: a.impr > 0 ? a.fw / a.impr : null,
      nHari: Object.keys(a.hari).length
    };
  }

  function bacaBaris() {
    var sumber = (typeof dataMarketing !== 'undefined') ? dataMarketing : (window.dataMarketing || []);
    var hasil = [];
    (sumber || []).forEach(function (r) {
      var t = tglWib(r.tanggal);
      if (!t) return;
      hasil.push({
        t: t,
        nama: String(r.nama_campaign_meta || r.campaign || ''),
        spend: Number(r.spend) || 0,
        chat: Number(r.results) || 0,
        impr: Number(r.impressions) || 0,
        klik: Number(r.link_clicks) || 0,
        frek: Number(r.frequency) || 0
      });
    });
    return hasil;
  }

  // ------------------------------------------------------------- status
  // Mengembalikan 'h' (hijau), 'k' (kuning), 'm' (merah), atau 'x' (tanpa status).
  function status(kunci, v, faktor) {
    var c = PANTAUAN_CFG[kunci];
    if (v == null || !c || c.target == null) return 'x';
    var f = faktor || 1, target = c.target / f, merah = c.merah / f;
    if (c.arah === 'rendah') return v <= target ? 'h' : (v > merah ? 'm' : 'k');
    return v >= target ? 'h' : (v < merah ? 'm' : 'k');
  }

  function sel(kunci, v, teks, faktor, tanpaWarna) {
    var st = tanpaWarna ? 'x' : status(kunci, v, faktor);
    return '<td class="pn-n pn-' + st + '">' + teks + '</td>';
  }

  function delta(sekarang, lalu, naikBaik) {
    if (sekarang == null || lalu == null || lalu === 0) return '';
    var p = (sekarang - lalu) / lalu * 100;
    if (Math.abs(p) < 0.5) return '<small class="pn-d">≈ sama</small>';
    var baik = naikBaik ? p > 0 : p < 0;
    return '<small class="pn-d ' + (baik ? 'pn-dbaik' : 'pn-dburuk') + '">' + (p > 0 ? '▲ ' : '▼ ') + des(Math.abs(p), 0) + '%</small>';
  }

  // ------------------------------------------------------------- gaya
  function pasangGaya() {
    if (document.getElementById('pnGaya')) return;
    var s = document.createElement('style');
    s.id = 'pnGaya';
    s.textContent =
      '.pn-wrap{font-size:13px;color:#1e293b}.pn-wrap h3{margin:22px 0 8px;font-size:15px}' +
      '.pn-meta{font-size:12px;color:#64748b;margin:4px 0 10px}.pn-warn{background:#fef3c7;color:#92400e;padding:8px 12px;border-radius:8px;margin:8px 0;font-size:12.5px}' +
      '.pn-kartu{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:8px 0}' +
      '.pn-card{border-radius:10px;padding:10px 12px;background:#f1f5f9;border-left:5px solid #94a3b8}.pn-card b{display:block;font-size:17px;margin-top:2px}.pn-card span{font-size:11px;color:#475569}' +
      '.pn-card.pn-h{background:#dcfce7;border-color:#16a34a}.pn-card.pn-k{background:#fef9c3;border-color:#ca8a04}.pn-card.pn-m{background:#fee2e2;border-color:#dc2626}' +
      '.pn-scroll{overflow-x:auto}.pn-t{border-collapse:collapse;width:100%;min-width:560px}' +
      '.pn-t th,.pn-t td{padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:left;white-space:nowrap}.pn-t th{background:#f8fafc;font-size:11.5px;color:#475569}' +
      '.pn-t td.pn-n{text-align:right;font-variant-numeric:tabular-nums}.pn-t th.pn-n{text-align:right}' +
      'td.pn-h{background:#dcfce7}td.pn-k{background:#fef9c3}td.pn-m{background:#fee2e2}td.pn-x{background:transparent}' +
      '.pn-d{display:block;font-size:10.5px;margin-top:1px;color:#64748b}.pn-dbaik{color:#15803d}.pn-dburuk{color:#b91c1c}' +
      '.pn-gray{color:#94a3b8;font-style:italic}.pn-ul{margin:6px 0 0;padding-left:18px;color:#64748b}' +
      '.pn-leg{font-size:11.5px;color:#475569;margin:6px 0}.pn-leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin:0 4px 0 10px;vertical-align:middle}' +
      '.pn-btn{padding:7px 14px;border:none;border-radius:6px;background:#0369a1;color:#fff;font-weight:700;cursor:pointer;font-size:12.5px}';
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------- render
  function renderHarian(baris, terakhir) {
    var perHari = {};
    baris.forEach(function (r) { (perHari[r.t] = perHari[r.t] || agg0()); tambah(perHari[r.t], r); });
    var f = PANTAUAN_CFG.bagiHarian;
    var d0 = turunan(perHari[terakhir]);

    var kartu = function (kunci, label, nilai, teks, faktor) {
      var st = status(kunci, nilai, faktor);
      return '<div class="pn-card pn-' + st + '"><span>' + label + '</span><b>' + teks + '</b></div>';
    };
    var html = '<h3>📅 Harian: ' + tglPendek(terakhir) + ' (data terakhir)</h3><div class="pn-kartu">' +
      kartu('spend', 'Spend', d0.spend, rp(d0.spend), f) +
      kartu('chat', 'Chat', d0.chat, angka(d0.chat), f) +
      kartu('cpl', 'CPL', d0.cpl, rp(d0.cpl)) +
      kartu('ctr', 'CTR', d0.ctr, des(d0.ctr, 2) + '%') +
      kartu('cpm', 'CPM', d0.cpm, rp(d0.cpm)) +
      kartu('frek', 'Frekuensi ≈', d0.frek, des(d0.frek, 2)) + '</div>';

    html += '<div class="pn-scroll"><table class="pn-t"><thead><tr><th>Tanggal</th><th class="pn-n">Spend</th><th class="pn-n">Chat</th><th class="pn-n">CPL</th><th class="pn-n">CTR</th><th class="pn-n">CPM</th><th class="pn-n">Frek ≈</th></tr></thead><tbody>';
    for (var i = 0; i < PANTAUAN_CFG.jumlahHari; i++) {
      var t = geser(terakhir, -i), a = perHari[t];
      if (!a) { html += '<tr><td>' + tglPendek(t) + '</td><td colspan="6" class="pn-gray">tidak ada data (tidak tayang atau belum disinkronkan)</td></tr>'; continue; }
      var d = turunan(a);
      html += '<tr><td>' + tglPendek(t) + '</td>' + sel('spend', d.spend, rp(d.spend), f) + sel('chat', d.chat, angka(d.chat), f) +
        sel('cpl', d.cpl, rp(d.cpl)) + sel('ctr', d.ctr, des(d.ctr, 2) + '%') + sel('cpm', d.cpm, rp(d.cpm)) + sel('frek', d.frek, des(d.frek, 2)) + '</tr>';
    }
    html += '</tbody></table></div>';

    // Lima kampanye dengan spend terbesar pada hari terakhir
    var perKamp = {};
    baris.filter(function (r) { return r.t === terakhir; }).forEach(function (r) { (perKamp[r.nama] = perKamp[r.nama] || agg0()); tambah(perKamp[r.nama], r); });
    var daftar = Object.keys(perKamp).map(function (n) { return { n: n, d: turunan(perKamp[n]) }; })
      .sort(function (a, b) { return b.d.spend - a.d.spend; }).slice(0, 5);
    html += '<h3>🏷️ Lima kampanye dengan spend terbesar (' + tglPendek(terakhir) + ')</h3><div class="pn-scroll"><table class="pn-t"><thead><tr><th>Kampanye</th><th class="pn-n">Spend</th><th class="pn-n">Chat</th><th class="pn-n">CPL</th><th class="pn-n">CTR</th></tr></thead><tbody>';
    daftar.forEach(function (x) {
      html += '<tr><td style="white-space:normal;min-width:220px">' + esc(x.n) + '</td><td class="pn-n">' + rp(x.d.spend) + '</td><td class="pn-n">' + angka(x.d.chat) + '</td>' +
        sel('cpl', x.d.cpl, rp(x.d.cpl)) + '<td class="pn-n">' + des(x.d.ctr, 2) + '%</td></tr>';
    });
    return html + '</tbody></table></div>';
  }

  function renderMingguan(baris, terakhir) {
    var perMinggu = {};
    baris.forEach(function (r) { var k = seninDari(r.t); (perMinggu[k] = perMinggu[k] || agg0()); tambah(perMinggu[k], r); });
    var senin0 = seninDari(terakhir), kolom = [];
    for (var i = PANTAUAN_CFG.jumlahMinggu - 1; i >= 0; i--) kolom.push(geser(senin0, -7 * i));

    var baris_ = [
      ['spend', 'Spend', function (d) { return rp(d.spend); }, false, true],
      ['chat', 'Chat dari iklan', function (d) { return angka(d.chat); }, true, true],
      ['cpl', 'CPL', function (d) { return rp(d.cpl); }, false, false],
      ['ctr', 'CTR', function (d) { return des(d.ctr, 2) + '%'; }, true, false],
      ['cpm', 'CPM', function (d) { return rp(d.cpm); }, false, false],
      ['frek', 'Frekuensi ≈', function (d) { return des(d.frek, 2); }, false, false]
    ];
    var data = kolom.map(function (k) { return perMinggu[k] ? turunan(perMinggu[k]) : null; });
    var om = window.dataPenjualanSemua, adaOrder = Array.isArray(om) && om.length > 0;
    var agOrder = {}, agLead = {};
    var tipeKode = {};
    (typeof dataGlobal !== 'undefined' && Array.isArray(dataGlobal) ? dataGlobal : []).forEach(function (r) { if (r.kode_leads && r.tipe_kontak) tipeKode[r.kode_leads] = r.tipe_kontak; });
    if (adaOrder) om.forEach(function (o) {
      if (!o.tgl || !o.tertaut || !o.baru) return;
      if (tipeKode[o.kode] && tipeKode[o.kode] !== 'Customer') return;
      var kk = seninDari(o.tgl), x = agOrder[kk] || (agOrder[kk] = { n: 0, om: 0 });
      x.n++; x.om += Number(o.total) || 0;
    });
    (typeof dataGlobal !== 'undefined' && Array.isArray(dataGlobal) ? dataGlobal : []).forEach(function (r) {
      var tt = String(r.tanggal_chat || '').slice(0, 10);
      if (!tt || !r.no_hp) return;
      (agLead[seninDari(tt)] = agLead[seninDari(tt)] || {})[r.no_hp] = 1;
    });
    data.forEach(function (d, i) {
      if (!d || !adaOrder) return;
      var kk = kolom[i], x = agOrder[kk] || { n: 0, om: 0 }, nl = Object.keys(agLead[kk] || {}).length;
      d.omzetBaru = x.om; d.pelBaru = x.n;
      d.aovBaru = x.n ? x.om / x.n : null;
      d.roasBaru = d.spend > 0 ? x.om / d.spend : null;
      d.cacBaru = (d.spend > 0 && x.n) ? d.spend / x.n : null;
      d.closingBaru = nl ? x.n / nl * 100 : null;
    });
    baris_.push(
      ['omzetBaru', 'Omzet pelanggan baru', function (d) { return rp(d.omzetBaru); }, true, false, '>= ' + rp(7500000)],
      ['pelBaru', 'Pelanggan baru', function (d) { return angka(d.pelBaru); }, true, false, '>= 50'],
      ['closingBaru', 'Chat jadi pembeli (closing rate)', function (d) { return d.closingBaru == null ? '-' : des(d.closingBaru, 1) + '%'; }, true, false, '>= 25%'],
      ['aovBaru', 'Belanja rata-rata (AOV)', function (d) { return rp(d.aovBaru); }, true, false, '>= ' + rp(150000)],
      ['roasBaru', 'ROAS pelanggan baru', function (d) { return d.roasBaru == null ? '-' : des(d.roasBaru, 1) + 'x'; }, true, false, '>= 7,5x'],
      ['cacBaru', 'Biaya per pelanggan baru (CAC)', function (d) { return rp(d.cacBaru); }, false, false, '<= ' + rp(20000)]
    );

    var html = '<h3>🗓️ Mingguan (Senin sampai Minggu)</h3><div class="pn-scroll"><table class="pn-t"><thead><tr><th>Angka</th><th>Target</th>';
    kolom.forEach(function (k, i) {
      var d = data[i], akhir = geser(k, 6);
      html += '<th class="pn-n">' + tglPendek(k) + ' – ' + tglPendek(akhir) + (d && d.nHari < 7 ? '<br><small>data ' + d.nHari + ' hari</small>' : '') + '</th>';
    });
    html += '</tr></thead><tbody>';
    baris_.forEach(function (b) {
      var c = PANTAUAN_CFG[b[0]];
      var tgt = c.target == null ? 'pantau' : (b[0] === 'spend' ? '≤' + rp(c.target) : b[0] === 'cpl' ? '≤' + rp(c.target) : b[0] === 'ctr' ? '≥' + c.target + '%' : b[0] === 'frek' ? '≤' + des(c.target, 1) : angka(c.target));
      html += '<tr><td><b>' + b[1] + '</b></td><td class="pn-gray">' + (b[5] || tgt) + '</td>';
      kolom.forEach(function (k, i) {
        var d = data[i];
        if (!d) { html += '<td class="pn-n pn-gray">-</td>'; return; }
        // Minggu berjalan (kurang dari 7 hari): angka volume (spend, chat) tidak diberi warna.
        var volume = (b[0] === 'spend' || b[0] === 'chat' || b[0] === 'omzetBaru' || b[0] === 'pelBaru') && d.nHari < 7;
        var sebelum = i > 0 ? data[i - 1] : null;
        var nilai = d[b[0]], lalu = sebelum ? sebelum[b[0]] : null;
        var tanpaDelta = volume || (sebelum && sebelum.nHari < 7 && (b[0] === 'spend' || b[0] === 'chat'));
        html += '<td class="pn-n pn-' + (volume ? 'x' : status(b[0], nilai)) + '">' + b[2](d) + (tanpaDelta ? '' : delta(nilai, lalu, b[3])) + '</td>';
      });
      html += '</tr>';
    });
    return html + '</tbody></table></div><div class="pn-leg">Warna: <i style="background:#dcfce7"></i>sesuai target<i style="background:#fef9c3"></i>antara target dan batas merah<i style="background:#fee2e2"></i>di bawah batas. Panah: perubahan dibanding minggu sebelumnya.</div>';
  }

  function renderBulanan(baris, terakhir) {
    var perBulan = {};
    baris.forEach(function (r) { var k = r.t.slice(0, 7); (perBulan[k] = perBulan[k] || agg0()); tambah(perBulan[k], r); });
    var bulanIni = terakhir.slice(0, 7);
    var y = Number(bulanIni.slice(0, 4)), m = Number(bulanIni.slice(5, 7)) - 1;
    var lalu = m === 0 ? (y - 1) + '-12' : y + '-' + ('0' + m).slice(-2);
    var daftar = [lalu, bulanIni];

    var html = '<h3>📆 Bulanan</h3><div class="pn-scroll"><table class="pn-t"><thead><tr><th>Bulan</th><th class="pn-n">Hari ada data</th><th class="pn-n">Spend</th><th class="pn-n">Chat</th><th class="pn-n">CPL</th><th class="pn-n">CTR</th><th class="pn-n">CPM</th></tr></thead><tbody>';
    var d = daftar.map(function (k) { return perBulan[k] ? turunan(perBulan[k]) : null; });
    daftar.forEach(function (k, i) {
      var x = d[i];
      if (!x) { html += '<tr><td>' + bulanPanjang(k) + '</td><td colspan="6" class="pn-gray">tidak ada data</td></tr>'; return; }
      var p = i === 1 ? d[0] : null;
      html += '<tr><td><b>' + bulanPanjang(k) + '</b>' + (i === 1 ? ' <small class="pn-gray">(berjalan)</small>' : '') + '</td><td class="pn-n">' + x.nHari + '</td>' +
        '<td class="pn-n">' + rp(x.spend) + '</td><td class="pn-n">' + angka(x.chat) + '</td>' +
        sel('cpl', x.cpl, rp(x.cpl) + (p ? delta(x.cpl, p.cpl, false) : '')) +
        sel('ctr', x.ctr, des(x.ctr, 2) + '%' + (p ? delta(x.ctr, p.ctr, true) : '')) +
        '<td class="pn-n">' + rp(x.cpm) + (p ? delta(x.cpm, p.cpm, false) : '') + '</td></tr>';
    });
    html += '</tbody></table></div><div class="pn-meta">Spend dan chat bulan berjalan belum bisa dibandingkan langsung dengan bulan lalu karena jumlah hari datanya berbeda. Perbandingan yang adil: CPL, CTR, dan CPM.</div>';
    return html;
  }

  function render() {
    var el = document.getElementById('mktSub_pantauan');
    if (!el) return;
    pasangGaya();
    var baris = bacaBaris();
    var head = '<div class="pn-wrap"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><b style="font-size:16px">📊 Report Manager Marketing</b>' +
      '<button class="pn-btn" type="button" onclick="pantauanMuatUlang(this)">🔄 Muat ulang data</button></div>';
    if (!baris.length) {
      el.innerHTML = head + '<div class="pn-warn">Belum ada data iklan. Pastikan Data_Ads sudah terisi dan data sudah dimuat dari server.</div></div>';
      return;
    }
    var terakhir = baris.reduce(function (m, r) { return r.t > m ? r.t : m; }, '');
    var awal = baris.reduce(function (m, r) { return r.t < m ? r.t : m; }, terakhir);
    var hariIni = fmtTgl(new Date(Date.now() + 7 * 3600000));
    var umur = Math.round((new Date(hariIni + 'T00:00:00Z') - new Date(terakhir + 'T00:00:00Z')) / 86400000);

    var html = head + '<div class="pn-meta">Sumber: Data_Ads · ' + baris.length + ' baris · ' + tglPendek(awal) + ' sampai ' + tglPendek(terakhir) +
      ' · Chat = Results (Messaging) di Meta · Frekuensi gabungan adalah perkiraan (rata-rata berbobot tayangan)</div>';
    if (umur > 1) html += '<div class="pn-warn">⚠️ Data terakhir ' + umur + ' hari lalu (' + tglPendek(terakhir) + '). Angka di bawah belum mencakup hari-hari setelahnya. Jalankan sinkronisasi Meta dulu.</div>';
    html += renderHarian(baris, terakhir) + renderMingguan(baris, terakhir) + renderBulanan(baris, terakhir);
    html += '<h3>⏳ Belum tersedia (belum ada sumber data)</h3><ul class="pn-ul">' + BELUM_ADA.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    html += '<div class="pn-meta">Batas harian spend dan chat = batas mingguan ÷ 7. Ambang lain sama dengan Laporan Mingguan. Ubah di PANTAUAN_CFG pada pantauan.js.</div></div>';
    el.innerHTML = html;
  }

  // ------------------------------------------------------------ pemasangan
  function pasang() {
    if (document.getElementById('mktSub_pantauan')) return true;
    var chip = document.querySelector('.mkt-chip'), sub = document.querySelector('.mkt-sub');
    if (!chip || !sub) return false;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mkt-chip'; b.setAttribute('data-sub', 'pantauan'); b.textContent = '🗓️ Report Manager Marketing';
    b.onclick = function () { window.pantauanBuka(); };
    chip.parentNode.appendChild(b);
    var d = document.createElement('div');
    d.className = 'mkt-sub'; d.id = 'mktSub_pantauan';
    sub.parentNode.appendChild(d);
    if (typeof MKT_SUBS !== 'undefined' && MKT_SUBS.indexOf('pantauan') < 0) MKT_SUBS.push('pantauan');
    return true;
  }

  window.pantauanBuka = function () {
    pasang();
    try { if (typeof mktBukaSub === 'function') mktBukaSub('pantauan'); }
    catch (e) { console.warn('pantauan: mktBukaSub gagal, lihat konteks pemasangan', e); }
    render();
  };

  window.pantauanMuatUlang = function (btn) {
    var teks = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Memuat...'; }
    var p = (typeof tarikDataServer === 'function') ? Promise.resolve(tarikDataServer()) : Promise.resolve();
    p.catch(function () {}).then(function () {
      render();
      if (btn) { btn.disabled = false; btn.textContent = teks; }
    });
  };

  window.pantauanRender = render;
  window.pantauanPasang = pasang;

  // Daftarkan sub-tab sejak skrip dimuat (bukan menunggu DOMContentLoaded), supaya
  // mktBukaSub('pantauan') tidak dialihkan ke 'funnel'.
  if (typeof MKT_SUBS !== 'undefined' && MKT_SUBS.indexOf('pantauan') < 0) MKT_SUBS.push('pantauan');

  function panelAktif() {
    var el = document.getElementById('mktSub_pantauan');
    return !!(el && el.classList.contains('active'));
  }

  // Setelah data baru dimuat (tarikDataServer -> renderMarketingTab), segarkan panel bila sedang terbuka.
  var renderAsli = window.renderMarketingTab;
  if (typeof renderAsli === 'function') {
    window.renderMarketingTab = function () {
      var hasil = renderAsli.apply(this, arguments);
      try { if (panelAktif()) render(); } catch (e) { console.warn('pantauan: gagal render ulang', e); }
      return hasil;
    };
  }

  // Setiap pindah sub-tab: segarkan sorotan menu samping (nav.js), karena mktBukaSub
  // mengganti #hash lewat replaceState yang tidak memicu hashchange.
  var bukaAsli = window.mktBukaSub;
  if (typeof bukaAsli === 'function') {
    window.mktBukaSub = function () {
      var hasil = bukaAsli.apply(this, arguments);
      try { if (typeof window.navSegarkan === 'function') window.navSegarkan(); } catch (e) { /* abaikan */ }
      return hasil;
    };
  }

  // Menu samping "Pantauan" (index-marketing.html#pantauan): buka saat halaman dimuat dan saat #hash berubah.
  function bukaDariHash() {
    if ((location.hash || '') === '#pantauan') window.pantauanBuka();
  }
  document.addEventListener('DOMContentLoaded', function () { pasang(); bukaDariHash(); });
  window.addEventListener('hashchange', bukaDariHash);
})();

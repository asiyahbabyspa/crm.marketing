// =========================================================================
// kesimpulan-marketing.js - kartu "Kesimpulan" di atas halaman Marketing.
// Ringkasan poin + 1 langkah yang disarankan, mengikuti filter aktif.
// Omzet & ROAS = SEMUA order terbayar (window.dataPenjualanSemua dari backend),
// dengan rincian tertaut ke leads vs tanpa Kode Leads.
// Biaya per orang yang bayar = hanya dari leads yang tertaut.
// Harus dimuat SETELAH ui-marketing.js (membungkus renderMarketingTab).
// =========================================================================
(function () {
  'use strict';
  var ID = 'kartuKesimpulanMarketing';

  function pasangCss() {
    if (document.getElementById('km-css')) return;
    var s = document.createElement('style');
    s.id = 'km-css';
    s.textContent = [
      '.km-kartu{background:#fff;border:1px solid #e2e8f0;border-left:6px solid #94a3b8;border-radius:12px;padding:16px 18px;margin-bottom:18px;box-shadow:0 2px 6px rgba(0,0,0,.04);}',
      '.km-kartu.km-sehat{border-left-color:#10b981;}',
      '.km-kartu.km-perhatian{border-left-color:#f59e0b;}',
      '.km-kartu.km-masalah{border-left-color:#ef4444;}',
      '.km-judul{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;}',
      '.km-judul b{font-size:15px;color:#0f172a;}',
      '.km-lencana{font-size:11.5px;font-weight:800;padding:3px 12px;border-radius:14px;color:#fff;background:#94a3b8;}',
      '.km-sehat .km-lencana{background:#059669;}',
      '.km-perhatian .km-lencana{background:#d97706;}',
      '.km-masalah .km-lencana{background:#dc2626;}',
      '.km-kartu ul{margin:0 0 10px 18px;padding:0;font-size:13px;line-height:1.7;color:#334155;}',
      '.km-aksi{background:#f1f5f9;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.6;color:#0f172a;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hitung() {
    var camp = typeof getMsFilterSelected === 'function' ? getMsFilterSelected('msFilterMktCampaign') : [];
    var meta = typeof getMsFilterSelected === 'function' ? getMsFilterSelected('msFilterMktNamaMeta') : [];
    var fStart = (document.getElementById('fMktStart') || {}).value || '';
    var fEnd = (document.getElementById('fMktEnd') || {}).value || '';

    var norm = typeof normalisasiMinat === 'function' ? normalisasiMinat : function (x) { return x; };

    var fd = (dataGlobal || []).map(function (r) { return Object.assign({}, r, { minat: norm(r.minat) }); });
    if (camp.length) fd = fd.filter(function (r) { return camp.indexOf(r.minat) > -1; });
    if (fStart) fd = fd.filter(function (r) { return formati(r.tanggal_chat) >= fStart; });
    if (fEnd) fd = fd.filter(function (r) { return formati(r.tanggal_chat) <= fEnd; });

    var ads = (dataMarketing || []).map(function (m) { return Object.assign({}, m, { campaign: norm(m.campaign) }); });
    if (camp.length) ads = ads.filter(function (m) { return camp.indexOf(m.campaign) > -1; });
    if (meta.length) ads = ads.filter(function (m) { return meta.indexOf(m.nama_campaign_meta) > -1; });
    if (fStart) ads = ads.filter(function (m) { return formati(m.tanggal) >= fStart; });
    if (fEnd) ads = ads.filter(function (m) { return formati(m.tanggal) <= fEnd; });

    var leads = new Set(), dp = 0, omzet = 0, spend = 0, baru = 0, ulang = 0;
    fd.forEach(function (r) {
      if (!r.no_hp && !r.nama && !r.status) return;
      leads.add(r.no_hp);
      if (typeof isClosingRow_ === 'function' ? isClosingRow_(r) : /new order|repeat order|dp|lunas/i.test(r.status || '')) {
        dp++; if (/repeat/i.test(r.status || '')) ulang++; else baru++;
        omzet += Number(r.total) || 0;
      }
    });
    ads.forEach(function (m) { spend += Number(m.spend) || 0; });

    // Semua order terbayar (tertaut leads + tanpa Kode Leads), mengikuti rentang tanggal ORDER.
    // Filter minat/produk tidak bisa diterapkan ke order tanpa kode leads, jadi dimatikan saat filter minat aktif.
    var semua = null;
    var ps = window.dataPenjualanSemua;
    if (Array.isArray(ps) && ps.length && !camp.length) {
      semua = { n: 0, omzet: 0, nT: 0, omzetT: 0, nX: 0, omzetX: 0 };
      ps.forEach(function (o) {
        if ((fStart || fEnd) && !o.tgl) return;
        if (fStart && o.tgl < fStart) return;
        if (fEnd && o.tgl > fEnd) return;
        var v = Number(o.total) || 0;
        semua.n++; semua.omzet += v;
        if (o.tertaut) { semua.nT++; semua.omzetT += v; } else { semua.nX++; semua.omzetX += v; }
      });
    }

    var jmlLeads = leads.size;
    var kel = null;
    if (semua) {
      var chatByKode = {};
      (dataGlobal || []).forEach(function (r) { if (r.kode_leads) chatByKode[r.kode_leads] = formati(r.tanggal_chat); });
      var tglPerKode = {};
      ps.forEach(function (o) { if (!o.tertaut || !o.kode || !o.tgl) return; (tglPerKode[o.kode] = tglPerKode[o.kode] || []).push(o.tgl); });
      function dalam(t) { return (!fStart || t >= fStart) && (!fEnd || t <= fEnd); }
      kel = { dalam: 0, susul: 0, sebelum: 0, kohortLama: 0, tanpaLead: 0 };
      Object.keys(tglPerKode).forEach(function (k) {
        var c = chatByKode[k];
        if (!c) { kel.tanpaLead++; return; }
        var tg = tglPerKode[k];
        var adaDalam = tg.some(dalam);
        if (dalam(c)) {
          if (adaDalam) kel.dalam++;
          else if (fEnd && tg.some(function (t) { return t > fEnd; })) kel.susul++;
          else if (fStart && tg.some(function (t) { return t < fStart; })) kel.sebelum++;
        } else if (adaDalam) kel.kohortLama++;
      });
    }
    var target = ambilTargetAktif(camp).target;
    var omzetPakai = omzet;
    return {
      spend: spend, omzet: omzetPakai, omzetLead: omzet, semua: semua, kel: kel, filterMinat: camp.length > 0,
      leads: jmlLeads, dp: dp, baru: baru, ulang: ulang,
      roas: spend > 0 ? omzetPakai / spend : 0,
      cpl: jmlLeads > 0 ? Math.round(spend / jmlLeads) : 0,
      cac: dp > 0 ? Math.round(spend / dp) : 0,
      cr: jmlLeads > 0 ? (dp / jmlLeads) * 100 : 0,
      roasTarget: (target && target.roasMin) || 2
    };
  }

  function render() {
    var tab = document.getElementById('tabMarketing');
    if (!tab) return;
    pasangCss();

    var kartu = document.getElementById(ID);
    if (!kartu) {
      kartu = document.createElement('div');
      kartu.id = ID;
      var filter = tab.querySelector('.filter-panel');
      if (filter && filter.parentNode) filter.parentNode.insertBefore(kartu, filter.nextSibling);
      else tab.insertBefore(kartu, tab.firstChild);
    }

    var d = hitung();
    var kelas, label, poin = [], aksi;
    var matang = { tunggu: false, teks: '' };
    try {
      if (typeof FI !== 'undefined' && FI && FI.data && FI.data.data) {
        var fd = FI.data.data, ko = fd.kohort_harian || [], am = fd.ambang || { minResults: 5, matangHari: 30 };
        var bm = ko.filter(function (k) { return !k.matang; }).length;
        var cs = ((fd.ringkasan || {}).closing_iklan || 0) < am.minResults;
        if (bm > 0 || cs) { matang.tunggu = true; matang.teks = bm + ' dari ' + ko.length + ' hari kohort belum berumur ' + am.matangHari + ' hari'; }
      }
    } catch (e) {}

    if (d.spend === 0 && d.leads === 0) {
      kelas = ''; label = 'Belum ada data';
      poin.push('Belum ada biaya iklan maupun leads pada filter dan periode ini.');
      aksi = 'Coba ganti periode, atau tekan Sinkron Meta Ads kalau data iklan memang belum masuk.';
    } else if (d.spend === 0) {
      kelas = ''; label = 'Biaya iklan belum terbaca';
      poin.push('Ada ' + d.leads + ' leads dan ' + d.dp + ' closing, tetapi belum ada data biaya iklan, jadi ROAS belum bisa dihitung.');
      aksi = 'Sinkronkan data iklan dari Meta supaya biaya iklannya ikut terhitung.';
    } else {
      if (matang.tunggu) { kelas = 'km-perhatian'; label = 'Belum bisa dinilai'; }
      else if (d.dp < 10) { kelas = 'km-perhatian'; label = 'Data masih sedikit'; }
      else if (d.roas >= d.roasTarget) { kelas = 'km-sehat'; label = 'Sehat'; }
      else if (d.roas >= 1) { kelas = 'km-perhatian'; label = 'Perlu perhatian'; }
      else { kelas = 'km-masalah'; label = 'Bermasalah'; }

      var s = d.semua;
      if (s) {
        poin.push('Biaya iklan <b>Rp ' + rp(d.spend) + '</b> menghasilkan omzet <b>Rp ' + rp(d.omzet) + '</b> dari leads yang chat di periode ini (ROAS iklan <b>' + d.roas.toFixed(1) + 'x</b>, target minimal ' + d.roasTarget + 'x).');
        poin.push('Penjualan semua kanal: <b>Rp ' + rp(s.omzet) + '</b> dari <b>' + s.n + '</b> order terbayar (total bisnis, bukan hasil iklan).');
        poin.push('Dari <b>' + s.n + '</b> order terbayar: <b>' + s.nT + '</b> tertaut ke leads (Rp ' + rp(s.omzetT) + ') dan <b>' + s.nX + '</b> tanpa kode leads (Rp ' + rp(s.omzetX) + ': Shopee, mitra, catering, dan lainnya). Order tertaut dihitung menurut tanggal order, jadi mencakup repeat order dan leads lama; ROAS iklan memakai omzet leads yang chat di periode ini.');
      } else {
        poin.push('Biaya iklan <b>Rp ' + rp(d.spend) + '</b> menghasilkan omzet <b>Rp ' + rp(d.omzet) + '</b> (ROAS <b>' + d.roas.toFixed(1) + 'x</b>, target minimal ' + d.roasTarget + 'x).');
        poin.push(d.filterMinat
          ? 'Filter minat produk aktif, jadi omzet hanya dari order yang tertaut ke leads produk itu. Penjualan tanpa kode leads tidak dapat dipilah per produk.'
          : 'Total semua transaksi belum termuat dari server, jadi omzet di sini hanya dari order yang tertaut ke leads.');
      }
      if (d.kel) {
        var kl = d.kel;
        poin.push('Dari <b>' + d.leads + '</b> leads yang chat di periode ini: <b>' + kl.dalam + '</b> sudah order di dalam periode, <b>' + kl.susul + '</b> order menyusul setelah periode, <b>' + kl.sebelum + '</b> sudah order sebelum periode. Order di periode ini dari leads yang chat sebelum periode: <b>' + kl.kohortLama + '</b> lead.' + (kl.tanpaLead ? ' (' + kl.tanpaLead + ' kode leads tidak ditemukan di data leads.)' : ''));
      }
      poin.push('Dari <b>' + d.leads + '</b> orang yang chat, <b>' + d.dp + '</b> sudah punya order terbayar (' + d.cr.toFixed(1) + '%): <b>' + d.baru + '</b> New Order dan <b>' + d.ulang + '</b> Repeat Order.');
      poin.push('Biaya per orang yang chat <b>Rp ' + rp(d.cpl) + '</b>' + (d.dp > 0 ? ', biaya per orang yang bayar (dari leads tertaut) <b>Rp ' + rp(d.cac) + '</b>.' : '. Belum ada yang bayar pada periode ini.'));
      if (d.dp < 10) poin.push('Closing dari leads masih sedikit (' + d.dp + '), jadi ROAS dan biaya per closing belum layak dinilai final.');

      if (d.leads === 0) aksi = 'Belum ada leads yang tercatat. Cek apakah iklan sedang tayang dan apakah chat sudah dicatat ke database.';
      else if (d.cr < 10) aksi = 'Banyak yang chat tapi sedikit yang bayar. Fokus ke <b>follow up</b> dan penawaran, bukan menambah biaya iklan.';
      else if (d.cpl > 50000) aksi = 'Biaya per leads mahal. Lihat bagian <b>adset dan materi iklan</b> di bawah, lalu matikan yang boros.';
      else if (d.roas >= d.roasTarget) aksi = 'Alur dari iklan sampai bayar berjalan baik. Pertimbangkan menaikkan budget 20-30% pada produk terbaik.';
      else aksi = 'Alurnya cukup wajar, tetapi belum mencapai target. Cek produk dengan ROAS terendah di tabel perbandingan.';
    }

    if (matang.tunggu && d.spend > 0 && d.leads > 0) {
      poin.push('Catatan: ' + (matang.teks ? matang.teks + '. ' : '') + 'ROAS, biaya per closing, dan konversi belum layak dinilai final (sama dengan panel Keputusan).');
      aksi = 'Tunggu data matang sebelum mengubah budget. Fokus ke <b>follow up</b> leads yang masuk dan perbaiki pencatatan.';
    }
    kartu.className = 'km-kartu ' + kelas;
    kartu.innerHTML =
      '<div class="km-judul"><b>Kesimpulan periode ini</b><span class="km-lencana">' + label + '</span></div>' +
      '<ul>' + poin.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
      '<div class="km-aksi"><b>Langkah yang disarankan:</b> ' + aksi + '</div>';
  }

  window.addEventListener('load', function () {
    var fr = window.fiRender;
    if (typeof fr === 'function' && !fr.__km) {
      var w = function () { var h = fr.apply(this, arguments); try { render(); } catch (e) {} return h; };
      w.__km = true; window.fiRender = w;
    }
  });

  var asli = window.renderMarketingTab;
  if (typeof asli !== 'function') { console.warn('kesimpulan-marketing.js: renderMarketingTab tidak ditemukan.'); return; }
  window.renderMarketingTab = function () {
    var hasil = asli.apply(this, arguments);
    try { render(); } catch (e) { console.warn('Kesimpulan marketing gagal:', e); }
    return hasil;
  };
})();
// =========================================================================
// kesimpulan-crm.js - kartu "Kesimpulan" di halaman crm.html
// Dimuat SETELAH crm/ui-crm.js dan crm/api-crm.js, dan setelah kesimpulan-ui.js.
// Membaca dataCrm (seluruh data, tidak ikut filter di halaman).
// =========================================================================
(function () {
  'use strict';

  function tgl(s) {
    if (!s) return null;
    var d = new Date(String(s).substring(0, 10) + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function hariLalu(d, sekarang) { return Math.floor((sekarang - d) / 86400000); }
  function sudahBayar(r) { return /new order|repeat order|\bdp\b|lunas/i.test(String(r.status || '')); }
  function adaData() { return typeof dataCrm !== 'undefined' && Array.isArray(dataCrm) && dataCrm.length > 0; }

  function render() {
    if (!adaData()) return;
    var sekarang = new Date(); sekarang.setHours(0, 0, 0, 0);

    var semua = dataCrm.filter(function (r) { return r.no_hp || r.nama || r.status; });
    var baru90 = semua.filter(function (r) { var d = tgl(r.tanggal_chat); return d && hariLalu(d, sekarang) <= 90; });
    var dasar = baru90.length ? baru90 : semua;
    var label90 = baru90.length ? '90 hari terakhir' : 'seluruh data';

    var closing = dasar.filter(sudahBayar).length;
    var cr = dasar.length ? (closing / dasar.length) * 100 : 0;

    var repeatOrder = semua.filter(function (r) { return /repeat order/i.test(String(r.status || '')); }).length;

    var tertinggal = semua.filter(function (r) {
      if (sudahBayar(r)) return false;
      var d = tgl(r.tanggal_chat); if (!d) return false;
      var h = hariLalu(d, sekarang);
      return h >= 3 && h <= 30;
    }).length;

    var kelas, label;
    if (cr >= 15) { kelas = 'km-sehat'; label = 'Sehat'; }
    else if (cr >= 8) { kelas = 'km-perhatian'; label = 'Perlu perhatian'; }
    else { kelas = 'km-masalah'; label = 'Perlu ditingkatkan'; }

    var aksi;
    if (tertinggal > 0) aksi = 'Buka tab <b>Prioritas Hari Ini</b> dan hubungi leads yang belum bayar. Ada <b>' + tertinggal + '</b> yang masih bisa dikejar.';
    else if (repeatOrder > 0) aksi = 'Ada <b>' + repeatOrder + '</b> pelanggan Repeat Order. Pertahankan dengan penawaran lanjutan atau paket loyalitas.';
    else aksi = 'Tidak ada yang mendesak. Pertahankan kecepatan membalas chat baru.';

    KartuKesimpulan.tampil({
      id: 'kartuKesimpulanCrm',
      sesudah: '#crmKpi',
      judul: 'Kesimpulan CRM',
      kelas: kelas,
      label: label,
      poin: [
        label90 + ': <b>' + dasar.length + '</b> leads masuk, <b>' + closing + '</b> sudah punya order terbayar (<b>' + cr.toFixed(1) + '%</b>).',
        '<b>' + repeatOrder + '</b> pelanggan sudah Repeat Order (order terbayar 2 kali atau lebih).',
        '<b>' + tertinggal + '</b> leads yang chat 3-30 hari lalu belum bayar (peluang yang masih bisa dikejar).'
      ],
      aksi: aksi
    });
  }

  KartuKesimpulan.bungkus('renderCrm', render);
  KartuKesimpulan.bungkus('tarikDataCrm', render);
  KartuKesimpulan.pantau(render, adaData);
})();

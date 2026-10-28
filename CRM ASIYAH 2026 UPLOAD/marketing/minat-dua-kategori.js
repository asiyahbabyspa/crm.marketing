// Memaksa minat hanya 2 kategori: Mitra dan Promo Customer.
// Muat SETELAH minat-settings-ui.js.
(function () {
  'use strict';
  var asli = window.normalisasiMinat;
  var POLA_MITRA = /mitra|affiliate|reseller|deposit|agen|cabang|join/i;

  window.normalisasiMinat = function (nilai) {
    var hasil = typeof asli === 'function' ? asli.apply(this, arguments) : nilai;
    var teks = String(hasil == null ? '' : hasil).trim();
    if (!teks) return 'Promo Customer';            // kosong dianggap Promo Customer                       // kosong tetap kosong
    if (teks === 'Mitra' || teks === 'Promo Customer') return teks;
    return POLA_MITRA.test(teks) ? 'Mitra' : 'Promo Customer';
  };
})();

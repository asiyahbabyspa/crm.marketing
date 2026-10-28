// =========================================================================
// tour-pengaturan.js - panduan halaman Pengaturan (pengaturan.html) +
// penanda "Belum diisi" untuk pengaturan penting. Butuh tour.js.
// Bagian "Perawatan Data / sinkron jurnal" (Keuangan) sengaja tidak dipandu.
// =========================================================================
TourPanduan.daftar('pengaturan', {
  aktif: function () { return true; },
  langkah: [
    {
      judul: 'Halaman ini mengatur "aturan main" bisnis',
      isi: 'Isi di sini dipakai oleh CRM, Marketing, dan Follow-up. Beberapa pengaturan <b>wajib diisi</b> supaya sistem berjalan benar. Yang belum terisi diberi tanda <b>⚠ Belum diisi</b>.'
    },
    {
      target: '#pkKelengkapan',
      judul: 'Cek kelengkapan',
      isi: 'Kotak ini menghitung pengaturan penting yang sudah terisi. Klik salah satu yang belum terisi untuk langsung menuju ke kolomnya.'
    },
    {
      target: { induk: '#set_sumber' },
      judul: 'Sumber leads',
      isi: 'Dari mana pelanggan datang (misalnya Instagram, WhatsApp, Meta Ads), <b>satu baris satu sumber</b>. Dipakai di filter CRM dan laporan sumber.'
    },
    {
      target: { induk: '#set_minat' },
      judul: 'Kategori utama (produk)',
      isi: 'Daftar produk atau layanan, satu baris satu. Namanya dipakai sebagai <b>nama campaign di laporan Marketing</b>, jadi tulis konsisten dan jangan diganti-ganti.'
    },
    {
      target: { induk: '#set_lokasi' },
      judul: 'Lokasi dan promo',
      isi: 'Daftar lokasi sesi, dan promo yang sedang berjalan. Isi seperlunya, boleh dikosongkan kalau belum ada.'
    },
    {
      target: { induk: '#set_paketMap' },
      judul: 'Pemetaan produk ke paket',
      isi: 'Menghubungkan tiap produk dengan paketnya, dalam format JSON. <b>Nama harus sama persis</b> dengan yang dipakai di CRM. Hati-hati dengan tanda kutip dan koma, karena satu salah ketik membuat seluruhnya tidak terbaca.'
    },
    {
      target: '#formSettings .btn-submit',
      judul: 'Simpan Konfigurasi',
      isi: 'Perubahan di bagian atas <b>tidak tersimpan otomatis</b>. Tekan tombol ini setelah selesai mengisi.'
    },
    {
      target: { induk: '#fuAktif' },
      judul: 'Saklar follow-up otomatis',
      isi: 'Menyalakan atau mematikan seluruh balasan dan pengingat WhatsApp otomatis. Matikan kalau Anda ingin semua pesan ditangani manual.'
    },
    {
      target: { induk: '#fuTemplateQualifying' },
      judul: 'Pesan pertama ke chat baru',
      isi: 'Menanyakan usia anak atau HPL dan domisili. Kata dalam kurung siku seperti <b>[NAMA]</b> otomatis diganti dengan data pelanggan. Jangan dihapus kurung sikunya.'
    },
    {
      target: { induk: '#fuBatasAman' },
      judul: 'Batas hari',
      isi: 'Usia di bawah <b>batas Aman</b> langsung dikirimi price list. Di antara batas Aman dan <b>batas Abu-abu</b> perlu review CS. Di atas itu dianggap di luar jangkauan dan dijawab dengan halus.'
    },
    {
      target: { induk: '#fuUrlPdf' },
      judul: 'Price list PDF',
      isi: 'Link file price list yang dikirim otomatis. Kalau kosong, price list <b>tidak bisa terkirim</b> secara otomatis.'
    },
    {
      target: 'button[onclick="simpanPengaturanFollowUpUI()"]',
      judul: 'Simpan Pengaturan Follow-Up',
      isi: 'Bagian follow-up punya tombol simpan sendiri. Tekan setelah mengubah pesan, batas hari, atau link PDF.'
    }
  ]
});

(function () {
  'use strict';

  // Pengaturan penting: id elemen + nama yang tampil
  var WAJIB = [
    { id: 'set_sumber', nama: 'Sumber leads' },
    { id: 'set_minat', nama: 'Kategori utama (produk)' },
    { id: 'set_paketMap', nama: 'Pemetaan produk ke paket' },
    { id: 'fuTemplateQualifying', nama: 'Pesan pertama ke chat baru' },
    { id: 'fuBatasAman', nama: 'Batas hari Aman' },
    { id: 'fuBatasAbuabu', nama: 'Batas hari Abu-abu' },
    { id: 'fuUrlPdf', nama: 'Link price list PDF' }
  ];

  function pasangCss() {
    if (document.getElementById('pk-css')) return;
    var s = document.createElement('style');
    s.id = 'pk-css';
    s.textContent = [
      '.pk-box{background:#fff;border:1px solid #e2e8f0;border-left:6px solid #94a3b8;border-radius:12px;padding:14px 18px;margin:0 0 16px;}',
      '.pk-box.pk-ok{border-left-color:#10b981;}',
      '.pk-box.pk-kurang{border-left-color:#f59e0b;}',
      '.pk-box b{font-size:14px;color:#0f172a;}',
      '.pk-box ul{margin:8px 0 0 18px;padding:0;font-size:13px;line-height:1.8;color:#334155;}',
      '.pk-box a{color:#b45309;font-weight:700;cursor:pointer;text-decoration:underline;}',
      '.pk-badge{display:inline-block;margin-left:8px;font-size:10.5px;font-weight:800;color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:10px;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function kosong(el) {
    if (!el) return false;               // elemen tidak ada: jangan ditandai
    var v = String(el.value || '').trim();
    return v === '' || v === '{}' || v === '[]';
  }

  function labelDari(el) {
    var g = el.closest('.form-group') || el.parentElement;
    return g ? g.querySelector('label') : null;
  }

  function periksa() {
    var form = document.getElementById('formSettings');
    if (!form) return;
    pasangCss();

    var belum = [];
    var ada = 0;
    WAJIB.forEach(function (w) {
      var el = document.getElementById(w.id);
      if (!el) return;
      ada++;
      var lbl = labelDari(el);
      var badge = lbl ? lbl.querySelector('.pk-badge') : null;
      if (kosong(el)) {
        belum.push(w);
        if (lbl && !badge) { var b = document.createElement('span'); b.className = 'pk-badge'; b.textContent = '⚠ Belum diisi'; lbl.appendChild(b); }
      } else if (badge) {
        badge.parentNode.removeChild(badge);
      }
    });
    if (!ada) return;

    var box = document.getElementById('pkKelengkapan');
    if (!box) {
      box = document.createElement('div');
      box.id = 'pkKelengkapan';
      form.parentNode.insertBefore(box, form);
    }
    var terisi = ada - belum.length;
    box.className = 'pk-box ' + (belum.length ? 'pk-kurang' : 'pk-ok');
    box.innerHTML = '<b>Kelengkapan pengaturan penting: ' + terisi + ' dari ' + ada + ' terisi</b>' +
      (belum.length
        ? '<ul>' + belum.map(function (w) { return '<li><a data-pk="' + w.id + '">' + w.nama + '</a> belum diisi</li>'; }).join('') + '</ul>'
        : '<div style="font-size:13px;color:#166534;margin-top:6px;">Semua pengaturan penting sudah terisi.</div>');
  }

  document.addEventListener('click', function (ev) {
    var id = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-pk');
    if (!id) return;
    var el = document.getElementById(id);
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { el.focus(); }, 400); }
  });

  // Data pengaturan dimuat asinkron: periksa berkala, dan sesudah tombol simpan ditekan.
  document.addEventListener('DOMContentLoaded', function () {
    setInterval(function () { try { periksa(); } catch (e) {} }, 2000);
  });
})();

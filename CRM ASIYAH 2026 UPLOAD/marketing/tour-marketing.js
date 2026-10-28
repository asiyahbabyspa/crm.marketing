// =========================================================================
// tour-marketing.js - isi panduan halaman Analisis Marketing
// Butuh tour.js dimuat lebih dulu.
// =========================================================================
TourPanduan.daftar('marketing', {
  aktif: function () {
    var t = document.getElementById('tabMarketing');
    return !!(t && t.classList.contains('active'));
  },
    langkah: [
    { judul: 'Halaman ini menjawab satu pertanyaan',
      isi: 'Uang yang dikeluarkan untuk iklan, <b>kembalinya berapa?</b> Tur singkat ini menunjukkan cara membacanya. Tekan <b>Lanjut</b>, atau tombol panah di keyboard.' },
    { target: '#tabMarketing .filter-panel', judul: 'Pilih apa yang mau dilihat',
      isi: 'Pilih produk atau campaign tertentu. Kalau dikosongkan, yang tampil adalah <b>semua</b> produk.' },
    { target: '#grupPresetTglMkt', judul: 'Pilih periode dengan cepat',
      isi: 'Tekan <b>7 Hari</b>, <b>30 Hari</b>, atau <b>Bulan Ini</b>. Seluruh angka di halaman ikut berubah sesuai periode yang dipilih.' },
    { target: '#kartuKesimpulanMarketing', judul: 'Baca kesimpulan ini dulu',
      isi: 'Kotak ini merangkum kondisi iklan Anda: <b>sehat</b>, <b>perlu perhatian</b>, atau <b>bermasalah</b>, lengkap dengan satu langkah yang disarankan. Bagian di bawahnya hanya rincian.' },
    { sub: 'funnel', target: '.funnel-stage-section', judul: 'Perjalanan calon klien, 4 tahap',
      isi: 'Iklan <b>dilihat</b>, lalu orang <b>chat</b>, lalu <b>bayar DP</b>, lalu <b>uang masuk</b>. Makin ke bawah makin sedikit orangnya, dan itu wajar. Yang perlu dilihat adalah tahap mana yang paling banyak "bocor".' },
    { sub: 'funnel', target: '#cardInsightMarketing', judul: 'Saran otomatis dan daftar tugas',
      isi: 'Sistem membaca angka lalu menuliskan temuan dan <b>To-Do</b> yang bisa langsung dibawa ke rapat. Tombol <b>Analisis AI</b> memberi ringkasan yang lebih panjang.' },
    { sub: 'produk', target: '#tblMarketingSummary', judul: 'Perbandingan antar produk',
      isi: '<b>ROAS</b> = tiap Rp1 iklan menghasilkan berapa rupiah omzet. Di atas 1x berarti sudah balik modal. <b>CPL</b> = biaya per orang yang chat. <b>CAC</b> = biaya per orang yang akhirnya bayar.' },
    { sub: 'tren', target: '#bannerTargetMingguan', judul: 'Target minggu lalu tercapai atau belum',
      isi: 'Hijau berarti target tercapai, merah berarti belum. Angka target bisa diubah lewat tombol <b>Atur Target Mingguan</b> di panel filter.' },
    { sub: 'tren', target: '#containerScorecardMingguan', judul: 'Rapor mingguan untuk rapat',
      isi: 'Satu baris satu ukuran, satu kolom satu minggu. <b>Hijau</b> sehat, <b>kuning</b> perlu perhatian, <b>merah</b> di bawah target.' },
    { sub: 'adset', target: '#tblAdsetPerformance', judul: 'Cari biang kerok di level adset',
      isi: 'Kalau ada produk yang ROAS-nya rendah, lihat di sini adset mana yang boros (hasil 0 tapi biaya jalan). Cukup matikan adset itu, tidak perlu mematikan seluruh campaign.' },
    { sub: 'iklan', target: '#cardKandidatAdsetContent', judul: 'Mana yang dinaikkan, mana yang dimatikan',
      isi: 'Ringkasan cepat adset dan materi iklan <b>terbaik</b> (layak ditambah budget) dan <b>terburuk</b> (kandidat dimatikan atau diganti).' },
    { target: '#btnRefreshMarketing', judul: 'Data terasa belum terbaru?',
      isi: 'Tekan <b>Refresh</b> untuk menarik data terbaru. Untuk mengambil data iklan baru dari Meta, buka sub-tab <b>🔗 Sinkronisasi Meta</b>.' }
  ]
});

// =========================================================================
// tour-crm.js - panduan halaman CRM Leads (crm.html). Butuh tour.js.
// =========================================================================
TourPanduan.daftar('crm', {
  aktif: function () { return true; },
  langkah: [
    {
      judul: 'Halaman ini untuk mengelola calon klien',
      isi: 'Di sini Anda melihat <b>siapa yang sudah chat, siapa yang sudah bayar, dan siapa yang perlu dihubungi lagi</b>. Tur singkat ini menunjukkan bagian yang paling sering dipakai.'
    },
    {
      target: '.topbar',
      judul: 'Tombol di bagian atas',
      isi: '<b>Refresh</b> menarik data terbaru. <b>Import Massal WA</b> memasukkan banyak kontak sekaligus dari chat WhatsApp. <b>PDF</b> mencetak laporan menu yang sedang dibuka. <b>Field Kustom</b> menambah kolom data sendiri.'
    },
    {
      target: '#crmKpi',
      judul: 'Angka ringkas',
      isi: 'Jumlah leads, closing, dan angka utama lain. Ini gambaran cepat sebelum masuk ke rincian.'
    },
    {
      target: '#kartuKesimpulanCrm',
      judul: 'Baca kesimpulan ini dulu',
      isi: 'Kotak ini menjawab: <b>apakah penjualan sehat, dan apa yang sebaiknya dikerjakan sekarang</b>. Bagian di bawahnya hanya rincian pendukung.'
    },
    {
      target: '.filter-panel',
      judul: 'Cari dan saring data',
      isi: 'Ketik nama atau nomor HP, atau pilih minat, status, dan tanggal. Sepuluh tombol <b>Rentang tanggal chat</b> (Hari Ini sampai Tahun Ini) mempercepat pemilihan tanggal chat. <b>Reset Semua</b> mengembalikan ke awal.'
    },
    {
      target: { induk: '#tabBtn_hariini' },
      judul: 'Lima menu data',
      isi: '<b>Prioritas Hari Ini</b>: siapa yang harus dihubungi hari ini (mulai dari sini tiap pagi).<br><b>Master Data</b>: semua klien dalam satu tabel.<br><b>Evaluasi</b>: funnel follow-up dan sumber leads terbaik.<br><b>Keberatan &amp; Tindakan</b>: alasan calon klien ragu dan langkah menanganinya.<br><b>Setup CAPI</b>: sambungan ke Meta untuk iklan.'
    },
    {
      target: '#panel_master',
      judul: 'Tabel klien',
      isi: 'Satu baris satu klien. Kolom <b>Total / Status</b> menunjukkan Follow-up / Pending, New Order, atau Repeat Order (otomatis dari order terbayar). Kolom <b>Follow-up &amp; AI</b> menunjukkan posisi percakapan. Kolom <b>Aksi</b> dipakai untuk membuka riwayat chat atau mengubah data klien.'
    },
    {
      judul: 'Siap dipakai',
      isi: 'Tombol <b>❓ Panduan</b> di pojok kanan bawah bisa ditekan kapan saja untuk mengulang tur ini.'
    }
  ]
});

// =========================================================================
// funnel-insight-ui.js — menata kartu "Insight Otomatis" dan "To-Do Evaluasi".
// Pasang di index-marketing.html SESUDAH ui-marketing.js (atau di akhir body):
//   <script src="marketing/funnel-insight-ui.js"></script>
// Tidak mengubah teks insight. Hanya membaca penanda di awal tiap butir
// (merah/kuning/hijau/abu), memberi warna, dan mengurutkan insight dari yang terburuk.
// Hapus file ini = tampilan lama kembali. Simpan sebagai UTF-8.
// =========================================================================
(function () {
  const URUTKAN_INSIGHT = true;   // false = pertahankan urutan asli dari ui-marketing.js
  const URUT = { jelek: 0, waspada: 1, info: 2, netral: 3, bagus: 4 };

  const TANDA = [
    ['jelek',   ['\uD83D\uDD34', '\u274C', '\u26D4']],       // merah, silang, dilarang
    ['waspada', ['\uD83D\uDFE1', '\u26A0']],                  // kuning, peringatan
    ['bagus',   ['\uD83D\uDFE2', '\u2705', '\uD83C\uDFC6']],      // hijau, centang, piala (Produk Terbaik)                  // hijau, centang
    ['info',    ['\u26AA', '\u2139', '\uD83D\uDCC5']]            // abu, info, kalender (MoM)                         // abu, info
  ];
  const IKON = { jelek: '\u2716', waspada: '\u26A0', bagus: '\u2714', info: '\u2139', netral: '' };
  const NAMA = { jelek: 'Perlu tindakan', waspada: 'Waspada', bagus: 'Bagus', info: 'Info / tunggu data' };

  function jenis_(teks) {
    const awal = teks.trim().slice(0, 6);
    for (const [j, daftar] of TANDA) if (daftar.some(e => awal.indexOf(e) !== -1)) return j;
    return 'netral';
  }

  const CSS = `
#cardInsightMarketing ul{list-style:none;margin:8px 0 14px 0 !important;padding:0 !important;display:flex;flex-direction:column;gap:8px;}
#cardInsightMarketing li.fi-li{border-radius:10px !important;padding:10px 12px 10px 14px !important;margin-bottom:0 !important;border-left:5px solid #94a3b8;background:#fff !important;font-size:13.5px;line-height:1.55;color:#1e293b;box-shadow:0 1px 2px rgba(15,23,42,.05);}
#cardInsightMarketing li.fi-jelek{border-left-color:#dc2626;background:#fff5f5 !important;}
#cardInsightMarketing li.fi-waspada{border-left-color:#ca8a04;background:#fffdf0 !important;}
#cardInsightMarketing li.fi-bagus{border-left-color:#16a34a;background:#f4fdf6 !important;}
#cardInsightMarketing li.fi-info{border-left-color:#94a3b8;background:#f8fafc !important;color:#475569;}
#cardInsightMarketing .fi-tag{display:inline-block;font-size:10.5px;font-weight:800;border-radius:99px;padding:1px 9px;margin-right:8px;color:#fff;vertical-align:1px;}
#cardInsightMarketing .fi-t-jelek{background:#dc2626;}#cardInsightMarketing .fi-t-waspada{background:#ca8a04;}
#cardInsightMarketing .fi-t-bagus{background:#16a34a;}#cardInsightMarketing .fi-t-info{background:#64748b;}
#cardInsightMarketing .fi-ring{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px;}
#cardInsightMarketing .fi-ring span{font-size:12.5px;font-weight:800;border-radius:99px;padding:4px 12px;}
#cardInsightMarketing .fi-r-jelek{background:#fee2e2;color:#991b1b;}#cardInsightMarketing .fi-r-waspada{background:#fef9c3;color:#854d0e;}
#cardInsightMarketing .fi-r-bagus{background:#dcfce7;color:#166534;}#cardInsightMarketing .fi-r-info{background:#f1f5f9;color:#475569;}
#aiFunnelOutput{font-size:14px !important;max-width:100%;overflow-wrap:anywhere;}
@media (max-width:600px){
 #cardInsightMarketing li.fi-li{font-size:14.5px;padding:12px 12px 12px 14px !important;}
 #cardInsightMarketing .fi-ring span{font-size:13px;}
 #btnAiFunnel{width:100%;min-height:46px;font-size:14px !important;}
}
`;

  function pasangCss_() {
    if (document.getElementById('fiStyle')) return;
    const st = document.createElement('style'); st.id = 'fiStyle'; st.textContent = CSS; document.head.appendChild(st);
  }

  let sibuk = false;
  function tata_(ul, urut, ringkasId) {
    if (!ul || sibuk) return;
    const items = Array.prototype.slice.call(ul.children).filter(x => x.tagName === 'LI');
    if (!items.length) { const r = document.getElementById(ringkasId); if (r) r.remove(); return; }
    sibuk = true;
    try {
      const hitung = { jelek: 0, waspada: 0, bagus: 0, info: 0 };
      items.forEach((li, idx) => {
        if (!li.dataset.fiJenis) {
          const j = jenis_(li.textContent);
          li.dataset.fiJenis = j; li.dataset.fiIdx = String(idx);
          li.classList.add('fi-li', 'fi-' + j);
          if (j !== 'netral') {
            const tag = document.createElement('span');
            tag.className = 'fi-tag fi-t-' + j; tag.textContent = IKON[j] + ' ' + NAMA[j];
            li.insertBefore(tag, li.firstChild);
          }
        }
        const j = li.dataset.fiJenis; if (hitung[j] !== undefined) hitung[j]++;
      });
      if (urut) {
        const terurut = items.slice().sort((a, b) => (URUT[a.dataset.fiJenis] - URUT[b.dataset.fiJenis]) || (Number(a.dataset.fiIdx) - Number(b.dataset.fiIdx)));
        // appendChild memicu observer lagi; hanya susun ulang kalau urutannya memang berbeda (mencegah loop tak berujung).
        const beda = terurut.some((li, i) => li !== items[i]);
        if (beda) terurut.forEach(li => ul.appendChild(li));
      }
      let r = document.getElementById(ringkasId);
      if (!r) { r = document.createElement('div'); r.id = ringkasId; r.className = 'fi-ring'; ul.parentNode.insertBefore(r, ul); }
      r.innerHTML = ['jelek', 'waspada', 'bagus', 'info'].filter(k => hitung[k] > 0)
        .map(k => `<span class="fi-r-${k}">${IKON[k]} ${hitung[k]} ${NAMA[k].toLowerCase()}</span>`).join('');
    } finally { sibuk = false; }
  }

  function mulai_() {
    const ulI = document.getElementById('listInsightMarketing');
    const ulT = document.getElementById('listTodoMarketing');
    if (!ulI && !ulT) return;
    pasangCss_();
    const jalan = () => { tata_(ulI, URUTKAN_INSIGHT, 'fiRingInsight'); tata_(ulT, false, 'fiRingTodo'); };
    const obs = new MutationObserver(() => { if (!sibuk) jalan(); });
    [ulI, ulT].forEach(u => { if (u) obs.observe(u, { childList: true }); });
    jalan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai_);
  else mulai_();
})();

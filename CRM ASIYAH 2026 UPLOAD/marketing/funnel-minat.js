// =========================================================================
// funnel-minat.js — v4. Panel "Funnel per Minat" sebagai jalur INPUT -> PROSES -> OUTPUT
// untuk index-marketing.html. FILE BARU, tidak mengubah kode lama.
// Pasang SETELAH funnel-iklan.js:  <script src="marketing/funnel-minat.js"></script>
// Sumber: backend getFunnelPerMinat. Bergantung pada: scriptURL, fetchJsonAman.
// =========================================================================

const FMN = { memuat: false, data: null, err: '', timer: null, urut: { k: 'spend_penuh', arah: -1 } };

const fmnEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmnRp = n => (n === null || n === undefined) ? '-' : 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const fmnInt = n => (n === null || n === undefined) ? '-' : Math.round(Number(n) || 0).toLocaleString('id-ID');
const fmnX = n => (n === null || n === undefined) ? '-' : String(n).replace('.', ',') + 'x';
const fmnPct = n => (n === null || n === undefined || !isFinite(n)) ? '-' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const fmnHari = n => (n === null || n === undefined) ? '-' : String(n).replace('.', ',') + ' hari';

// Lima tahap untuk menghitung konversi antar tahap (dipakai penanda "bocor terbesar").
const FMN_TAHAP = [
  { k: 'impressions',      label: 'Lihat' },
  { k: 'klik',             label: 'Klik' },
  { k: 'lead_semua',       label: 'Leads' },
  { k: 'closing',          label: 'Order' },
  { k: 'repeat_pelanggan', label: 'Repeat' }
];
const FMN_LANGKAH = ['CTR', 'Klik → Lead', 'Lead → Order', 'Order → Repeat'];
const FMN_MIN_BASIS = 20;   // tahap sebelumnya minimal segini supaya persentasenya dianggap layak dibandingkan

// Sebaran waktu keputusan: dari tanggal lead sampai order terbayar pertama.
const FMN_WAKTU = [
  { k: 'order_hari1',      label: 'Hari ke-1',   ket: 'order di hari lead masuk atau 1 hari sesudahnya', warna: '#059669' },
  { k: 'order_hari7',      label: 'Hari 2–7',    ket: 'order 2 sampai 7 hari sesudah lead',               warna: '#65a30d' },
  { k: 'order_hari14',     label: 'Hari 8–14',   ket: 'order 8 sampai 14 hari sesudah lead',              warna: '#eab308' },
  { k: 'order_hari30',     label: 'Hari 15–30',  ket: 'order 15 sampai 30 hari sesudah lead',             warna: '#f97316' },
  { k: 'order_hari31plus', label: 'Hari > 30',   ket: 'order lebih dari 30 hari sesudah lead',            warna: '#dc2626' },
  { k: 'belum_order',      label: 'Belum order', ket: 'lead yang sampai kini belum punya order terbayar', warna: '#cbd5e1' }
];

function fmnRate_(b, i) {   // konversi tahap i -> i+1
  const a = Number(b[FMN_TAHAP[i].k]) || 0, c = Number(b[FMN_TAHAP[i + 1].k]) || 0;
  return a > 0 ? c / a * 100 : null;
}

// Langkah dengan kebocoran terbesar per minat = langkah yang paling jauh di bawah rata-rata semua minat.
function fmnBocor_(baris, total) {
  const hasil = {};
  const pooled = FMN_LANGKAH.map((_, i) => fmnRate_(total, i));
  baris.forEach(b => {
    let terburuk = -1, rasioMin = 0.8;   // hanya ditandai kalau < 80% dari rata-rata
    FMN_LANGKAH.forEach((_, i) => {
      const basis = Number(b[FMN_TAHAP[i].k]) || 0, r = fmnRate_(b, i);
      if (r === null || pooled[i] === null || pooled[i] <= 0 || basis < FMN_MIN_BASIS) return;
      const rasio = r / pooled[i];
      if (rasio < rasioMin) { rasioMin = rasio; terburuk = i; }
    });
    hasil[b.minat] = terburuk;
  });
  return hasil;
}

const FMN_CSS = `
#fmnPanel .fmn-kartu{border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:12px 14px;margin-top:12px;box-shadow:0 1px 2px rgba(15,23,42,.04);}
#fmnPanel .fmn-kartu.total{background:#f8fafc;border-color:#cbd5e1;}
#fmnPanel .fmn-kepala{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
#fmnPanel .fmn-nama{font-size:14px;font-weight:800;color:#0f172a;}
#fmnPanel .fmn-meta{font-size:11px;color:#94a3b8;}
#fmnPanel .fmn-zona{display:grid;grid-template-columns:1fr 96px 1.45fr 96px 1fr;gap:0;margin-bottom:8px;}
#fmnPanel .fmn-zona>.z-in{grid-column:1/3;}#fmnPanel .fmn-zona>.z-pr{grid-column:3/5;}#fmnPanel .fmn-zona>.z-out{grid-column:5/6;}
#fmnPanel .fmn-zona>div{color:#fff;font-size:11px;font-weight:800;letter-spacing:.6px;padding:5px 14px 5px 18px;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,0 100%,12px 50%);text-align:center;}
#fmnPanel .fmn-zona>div:first-child{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,0 100%);}
#fmnPanel .z-in{background:#0369a1;}#fmnPanel .z-pr{background:#4338ca;}#fmnPanel .z-out{background:#047857;}
#fmnPanel .fmn-alur{display:grid;grid-template-columns:1fr 96px 1.45fr 96px 1fr;align-items:stretch;}
#fmnPanel .fmn-kolom{display:flex;flex-direction:column;align-items:stretch;border-radius:12px;padding:8px;}
#fmnPanel .k-in{background:#f0f9ff;border:1px solid #bae6fd;}
#fmnPanel .k-pr{background:#eef2ff;border:1px solid #c7d2fe;}
#fmnPanel .k-out{background:#ecfdf5;border:1px solid #a7f3d0;}
#fmnPanel .fmn-node{background:#fff;border-radius:10px;padding:8px 10px;border:1px solid rgba(100,116,139,.18);}
#fmnPanel .fmn-node .jdl{font-size:10.5px;font-weight:700;color:#64748b;display:flex;gap:5px;align-items:center;}
#fmnPanel .fmn-node .nil{font-size:19px;font-weight:800;color:#0f172a;line-height:1.15;}
#fmnPanel .fmn-node .sub{font-size:10.5px;color:#94a3b8;margin-top:1px;}
#fmnPanel .fmn-turun{display:flex;flex-direction:column;align-items:center;padding:2px 0;}
#fmnPanel .fmn-turun .gr{width:3px;height:12px;background:repeating-linear-gradient(180deg,#94a3b8 0 4px,transparent 4px 7px);background-size:3px 14px;animation:fmnTurun 1s linear infinite;}
#fmnPanel .fmn-turun .kp{width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #94a3b8;}
#fmnPanel .fmn-pipa{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:0 4px;}
#fmnPanel .fmn-pipa .fmn-chip{white-space:normal;max-width:88px;line-height:1.25;}
#fmnPanel .fmn-pipa .gr{width:100%;height:4px;background:repeating-linear-gradient(90deg,#94a3b8 0 6px,transparent 6px 10px);background-size:20px 4px;animation:fmnAlir 1s linear infinite;}
#fmnPanel .fmn-pipa .kp{width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid #94a3b8;margin-top:-11px;align-self:flex-end;}
#fmnPanel .fmn-chip{font-size:10.5px;font-weight:800;color:#475569;background:#f1f5f9;border-radius:99px;padding:1px 8px;white-space:nowrap;text-align:center;}
#fmnPanel .fmn-chip small{display:block;font-size:9px;font-weight:700;color:#475569;}
#fmnPanel .fmn-chip.bocor{background:#fee2e2;color:#b91c1c;}#fmnPanel .fmn-chip.bocor small{color:#b91c1c;}
#fmnPanel .fmn-bar{display:flex;height:11px;border-radius:99px;overflow:hidden;background:#e2e8f0;margin-top:6px;}
#fmnPanel .fmn-bar i{display:block;height:100%;}
#fmnPanel .fmn-leg{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:4px;font-size:10.5px;color:#475569;}
#fmnPanel .fmn-leg b{color:#0f172a;}
#fmnPanel .fmn-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;}
#fmnPanel .fmn-waktu{margin-top:8px;border-top:1px dashed #cbd5e1;padding-top:6px;}
#fmnPanel .fmn-waktu .jdl{font-size:10.5px;font-weight:800;color:#4338ca;}
#fmnPanel .fmn-wk{display:grid;grid-template-columns:auto 1fr auto auto;gap:2px 8px;align-items:center;font-size:10.5px;color:#475569;margin-top:4px;}
#fmnPanel .fmn-wk .bt{height:7px;border-radius:99px;background:#e2e8f0;overflow:hidden;min-width:40px;}
#fmnPanel .fmn-wk .bt i{display:block;height:100%;}
#fmnPanel .fmn-wk .n{font-weight:800;color:#0f172a;text-align:right;}
#fmnPanel .fmn-cat{font-size:10px;color:#94a3b8;margin-top:4px;}
@keyframes fmnAlir{to{background-position:20px 0;}}
@keyframes fmnTurun{to{background-position:0 14px;}}
@media (prefers-reduced-motion:reduce){#fmnPanel .fmn-pipa .gr,#fmnPanel .fmn-turun .gr{animation:none;}}
@media (max-width:900px){
 #fmnPanel .fmn-zona{display:none;}
 #fmnPanel .fmn-alur{grid-template-columns:1fr;}
 #fmnPanel .fmn-pipa{flex-direction:row;padding:4px 0;}
 #fmnPanel .fmn-pipa .gr{width:3px;height:16px;background:repeating-linear-gradient(180deg,#94a3b8 0 4px,transparent 4px 7px);background-size:3px 14px;animation:fmnTurun 1s linear infinite;}
 #fmnPanel .fmn-pipa .kp{border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #94a3b8;border-bottom:0;margin:0;align-self:center;}
}
`;

function fmnPastikanPanel_() {
  let p = document.getElementById('fmnPanel');
  if (p) return p;
  p = document.createElement('div');
  p.id = 'fmnPanel';
  p.style.cssText = 'background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:0 0 18px;';
  if (!document.getElementById('fmnStyle')) {
    const st = document.createElement('style'); st.id = 'fmnStyle'; st.textContent = FMN_CSS; document.head.appendChild(st);
  }
  const jangkar = document.querySelector('#tabMarketing .funnel-container');
  if (jangkar && jangkar.parentNode) jangkar.parentNode.insertBefore(p, jangkar);
  else { const tab = document.getElementById('tabMarketing'); if (tab) tab.appendChild(p); else return null; }
  return p;
}

function fmnKartuRingkas_(label, nilai, ket, warna) {
  return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;background:#f8fafc;">
    <div style="font-size:11px;color:#64748b;font-weight:700;">${label}</div>
    <div style="font-size:20px;font-weight:800;color:${warna || '#0f172a'};">${nilai}</div>
    ${ket ? `<div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">${ket}</div>` : ''}</div>`;
}

function fmnNode_(ikon, judul, nilai, sub, extra) {
  return `<div class="fmn-node"><div class="jdl"><span>${ikon}</span>${judul}</div><div class="nil">${nilai}</div>${sub ? `<div class="sub">${sub}</div>` : ''}${extra || ''}</div>`;
}
function fmnChip_(b, i, bocorIdx) {
  const bocor = bocorIdx === i;
  return `<span class="fmn-chip ${bocor ? 'bocor' : ''}" title="${FMN_LANGKAH[i]}">${FMN_LANGKAH[i]} ${fmnPct(fmnRate_(b, i))}${bocor ? '<small>bocor terbesar</small>' : ''}</span>`;
}
function fmnTurun_(chip) { return `<div class="fmn-turun"><div class="gr"></div>${chip}<div class="gr"></div><div class="kp"></div></div>`; }
function fmnPipa_(chip) { return `<div class="fmn-pipa">${chip}<div class="gr"></div><div class="kp"></div></div>`; }

function fmnBarSegmen_(bagian, total) {
  const t = Number(total) || 0;
  if (t <= 0) return '<div class="fmn-bar"></div>';
  return `<div class="fmn-bar">${bagian.map(x => `<i style="width:${Math.max(0, (Number(x.n) || 0) / t * 100)}%;background:${x.warna};" title="${fmnEsc(x.label)}: ${fmnInt(x.n)}"></i>`).join('')}</div>`;
}

function fmnWaktuHtml_(b) {
  const lead = Number(b.lead_semua) || 0;
  const ord = Number(b.closing) || 0;
  const belum = Number(b.belum_order) || 0;
  const bagian = FMN_WAKTU.filter(w => w.k !== 'belum_order').map(w => ({ label: w.label, n: Number(b[w.k]) || 0, warna: w.warna, ket: w.ket }));
  const pct = n => ord > 0 ? n / ord * 100 : null;
  const baris = bagian.map(x => `<span><i class="fmn-dot" style="background:${x.warna};"></i>${x.label}</span>
    <span class="bt"><i style="width:${ord > 0 ? Math.min(100, x.n / ord * 100) : 0}%;background:${x.warna};"></i></span>
    <span class="n" title="${fmnEsc(x.ket)}">${fmnInt(x.n)}</span><span>${fmnPct(pct(x.n))}</span>`).join('');
  const isi = ord > 0
    ? fmnBarSegmen_(bagian, ord) + `<div class="fmn-wk">${baris}</div>`
    : '<div class="fmn-cat" style="margin-top:6px;">Belum ada order untuk diukur waktu keputusannya.</div>';
  return `<div class="fmn-waktu">
    <div class="jdl">⏱ Waktu keputusan order pertama</div>
    ${isi}
    <div class="fmn-cat"><b>${fmnInt(ord)}</b> dari ${fmnInt(lead)} lead sudah order (median ${fmnHari(b.median_hari_ke_order)}, rata-rata ${fmnHari(b.hari_ke_order_pertama)}); <b>${fmnInt(belum)}</b> lead (${fmnPct(lead > 0 ? belum / lead * 100 : null)}) belum order. Persen di atas = bagian dari order pertama, dihitung dari tanggal lead masuk. Lead yang baru masuk belum tentu sempat order.</div></div>`;
}

// Spend penuh per minat (backend: spend_penuh). Cadangan: spend terlacak.
function fmnSpP_(b) { const p = Number(b.spend_penuh) || 0; return p > 0 ? p : b.spend; }
function fmnSpKet_(b) {
  if ((Number(b.spend_penuh) || 0) <= 0) return '';
  const per = FMN.data && FMN.data.data && FMN.data.data.periode;
  return 'sejak pelacakan CTWA ' + fmnEsc((per && per.since) || '') + ': ' + fmnRp(b.spend) + '<br>';
}

function fmnKartuMinat_(b, bocorIdx, total) {
  const lead = Number(b.lead_semua) || 0;
  const komposisi = [
    { label: 'Iklan (jejak CTWA)', n: b.lead_iklan, warna: '#4f46e5' },
    { label: 'Form', n: b.lead_form, warna: '#0ea5e9' },
    { label: 'Lain', n: b.lead_lain, warna: '#94a3b8' }
  ];
  const legKomposisi = komposisi.map(x => `<span><i class="fmn-dot" style="background:${x.warna};"></i>${x.label} <b>${fmnInt(x.n)}</b></span>`).join('');

  const kolIn = fmnNode_('💰', 'Belanja iklan', fmnRp(fmnSpP_(b)), fmnSpKet_(b) + fmnInt(b.jumlah_iklan) + ' iklan · CPM ' + fmnRp(b.cpm) + ' (terlacak)') +
    fmnTurun_('<span class="fmn-chip">tayang</span>') +
    fmnNode_('👁', 'Lihat (impresi)', fmnInt(b.impressions), '') +
    fmnTurun_(fmnChip_(b, 0, bocorIdx)) +
    fmnNode_('🖱', 'Klik tautan', fmnInt(b.klik), 'CPC ' + fmnRp(b.cpc) + ' (terlacak)');

  const kolPr = fmnNode_('💬', 'Leads CRM', fmnInt(lead), 'CPL CRM ' + fmnRp(b.real_cpl) + ' (terlacak)' + ' · CPL Meta ' + fmnRp(b.cpl_meta),
      fmnBarSegmen_(komposisi, lead) + `<div class="fmn-leg">${legKomposisi}</div>`) +
    fmnTurun_(fmnChip_(b, 2, bocorIdx)) +
    fmnNode_('🛒', 'Order pertama', fmnInt(b.closing), 'CAC ' + fmnRp(b.cac) + ' (terlacak)' + ' · konversi ' + fmnPct(b.konversi_lead_ke_order_persen), fmnWaktuHtml_(b));

  const kolOut = fmnNode_('💵', 'Omzet', fmnRp(b.omzet), 'ROAS ' + fmnX(b.roas_riil) + ' (terlacak)' + ' · kas ' + fmnX(b.roas_kas) + '<br>rata-rata order ' + fmnRp(b.rata_nilai_order)) +
    fmnTurun_(fmnChip_(b, 3, bocorIdx)) +
    fmnNode_('🔁', 'Repeat', fmnInt(b.repeat_pelanggan), 'repeat rate ' + fmnPct(b.repeat_rate_persen) + ' · ' + fmnInt(b.order_ulang) + ' order ulang');

  return `<div class="fmn-kartu ${total ? 'total' : ''}">
    <div class="fmn-kepala"><span class="fmn-nama">${total ? '🌐 Semua minat' : fmnEsc(b.minat)}</span>
      <span class="fmn-meta">${fmnRp(fmnSpP_(b))} · ${fmnInt(b.jumlah_iklan)} iklan · ${fmnInt(lead)} leads · ${fmnInt(b.closing)} order</span></div>
    <div class="fmn-zona"><div class="z-in">INPUT · tarik perhatian</div><div class="z-pr">PROSES · ubah jadi pembeli</div><div class="z-out">OUTPUT · hasil</div></div>
    <div class="fmn-alur">
      <div class="fmn-kolom k-in">${kolIn}</div>
      ${fmnPipa_(fmnChip_(b, 1, bocorIdx))}
      <div class="fmn-kolom k-pr">${kolPr}</div>
      ${fmnPipa_('<span class="fmn-chip">order → uang</span>')}
      <div class="fmn-kolom k-out">${kolOut}</div>
    </div></div>`;
}

const FMN_KOLOM = [
  ['minat', 'Minat', 'teks', x => fmnEsc(x.minat)],
  ['spend_penuh', 'Spend penuh', 'angka', x => fmnRp(fmnSpP_(x))],
  ['spend', 'Spend terlacak', 'angka', x => fmnRp(x.spend)],
  ['impressions', 'Impresi', 'angka', x => fmnInt(x.impressions)],
  ['cpm', 'CPM', 'angka', x => fmnRp(x.cpm)],
  ['klik', 'Klik', 'angka', x => fmnInt(x.klik)],
  ['ctr_persen', 'CTR', 'angka', x => fmnPct(x.ctr_persen)],
  ['cpc', 'CPC', 'angka', x => fmnRp(x.cpc)],
  ['results_meta', 'Chat Meta', 'angka', x => fmnInt(x.results_meta)],
  ['cpl_meta', 'CPL Meta', 'angka', x => fmnRp(x.cpl_meta)],
  ['lead_semua', 'Lead CRM', 'angka', x => fmnInt(x.lead_semua)],
  ['lead_iklan', 'Lead Iklan', 'angka', x => fmnInt(x.lead_iklan)],
  ['lead_form', 'Lead Form', 'angka', x => fmnInt(x.lead_form)],
  ['real_cpl', 'CPL CRM', 'angka', x => fmnRp(x.real_cpl)],
  ['closing', 'Order', 'angka', x => fmnInt(x.closing)],
  ['order_hari1', 'Order hari ke-1', 'angka', x => fmnInt(x.order_hari1)],
  ['order_hari7', 'Order hari 2–7', 'angka', x => fmnInt(x.order_hari7)],
  ['order_hari14', 'Order hari 8–14', 'angka', x => fmnInt(x.order_hari14)],
  ['order_hari30', 'Order hari 15–30', 'angka', x => fmnInt(x.order_hari30)],
  ['order_hari31plus', 'Order hari >30', 'angka', x => fmnInt(x.order_hari31plus)],
  ['median_hari_ke_order', 'Median hari ke order', 'angka', x => x.median_hari_ke_order === null || x.median_hari_ke_order === undefined ? '-' : String(x.median_hari_ke_order).replace('.', ',')],
  ['cac', 'CAC', 'angka', x => fmnRp(x.cac)],
  ['rata_nilai_order', 'Rata nilai order', 'angka', x => fmnRp(x.rata_nilai_order)],
  ['repeat_pelanggan', 'Repeat', 'angka', x => fmnInt(x.repeat_pelanggan)],
  ['repeat_rate_persen', 'Repeat rate', 'angka', x => fmnPct(x.repeat_rate_persen)],
  ['omzet', 'Omzet', 'angka', x => fmnRp(x.omzet)],
  ['roas_riil', 'ROAS', 'angka', x => fmnX(x.roas_riil)]
];

function fmnUrutkan(k) {
  FMN.urut = { k: k, arah: FMN.urut.k === k ? -FMN.urut.arah : -1 };
  fmnRender();
}

function fmnTabel_(baris, total) {
  const { k, arah } = FMN.urut;
  const tipe = (FMN_KOLOM.find(c => c[0] === k) || [])[2];
  // "Tidak terpetakan" selalu paling bawah, apa pun urutannya.
  const biasa = baris.filter(b => b.minat !== 'Tidak terpetakan'), tak = baris.filter(b => b.minat === 'Tidak terpetakan');
  biasa.sort((a, b) => {
    if (tipe === 'teks') return String(a[k]).localeCompare(String(b[k]), 'id') * arah;
    const x = a[k] === null || a[k] === undefined ? -Infinity : Number(a[k]);
    const y = b[k] === null || b[k] === undefined ? -Infinity : Number(b[k]);
    return (x - y) * arah;
  });
  const th = FMN_KOLOM.map(c => `<th onclick="fmnUrutkan('${c[0]}')" style="cursor:pointer;padding:6px;white-space:nowrap;text-align:${c[2] === 'teks' ? 'left' : 'right'};">${c[1]}${k === c[0] ? (arah < 0 ? ' ▼' : ' ▲') : ''}</th>`).join('');
  const tr = (x, tebal) => `<tr style="${tebal ? 'font-weight:800;background:#f8fafc;' : ''}">${FMN_KOLOM.map(c =>
    `<td style="padding:5px 6px;white-space:nowrap;text-align:${c[2] === 'teks' ? 'left' : 'right'};">${c[3](x)}</td>`).join('')}</tr>`;
  return `<div style="overflow-x:auto;margin-top:8px;"><table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead><tr style="background:#f1f5f9;">${th}</tr></thead>
    <tbody>${biasa.concat(tak).map(x => tr(x, false)).join('')}${tr(total, true)}</tbody></table></div>`;
}

// Spend penuh = angka kartu atas (kpiSpendAwareness). Jika tidak tersedia, pakai spend terlacak.
function fmnSpendPenuh_(t) {
  if (Number(t.spend_penuh) > 0) return Number(t.spend_penuh);
  try {
    const el = document.getElementById('kpiSpendAwareness');
    const n = el ? Number(String(el.textContent).replace(/[^0-9]/g, '')) : 0;
    if (n > 0 && n >= (Number(t.spend) || 0)) return n;
  } catch (e) {}
  return t.spend;
}

function fmnRender() {
  const p = fmnPastikanPanel_(); if (!p) return;
  const kepala = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
    <h3 style="margin:0;font-size:15px;color:#1e293b;">🧭 Funnel per Minat — jalur Input → Proses → Output</h3>
    <button type="button" onclick="fmnMuat(true)" style="border:none;border-radius:7px;padding:6px 12px;font-weight:700;font-size:12px;cursor:pointer;background:#0f766e;color:#fff;" ${FMN.memuat ? 'disabled' : ''}>${FMN.memuat ? '⏳ Memuat...' : '↻ Muat ulang'}</button></div>`;

  if (FMN.memuat && !FMN.data) { p.innerHTML = kepala + '<div style="margin-top:10px;color:#64748b;font-size:13px;">⏳ Memuat... (pertama kali tanpa cache bisa sekitar 20 detik)</div>'; return; }
  if (FMN.err && !FMN.data) { p.innerHTML = kepala + `<div style="margin-top:10px;color:#b91c1c;font-size:13px;">❌ ${fmnEsc(FMN.err)}</div>`; return; }
  if (!FMN.data) { p.innerHTML = kepala; return; }

  const d = FMN.data.data, t = d.total, per = d.periode, dg = d.diagnosis || {};
  const amb = d.ambang || { matangHari: 30, minResults: 5 };
  const peringatan = [];
  if (per.catatan) peringatan.push('📅 ' + fmnEsc(per.catatan) + '. Periode yang dihitung: ' + fmnEsc(per.since) + ' s/d ' + fmnEsc(per.until) + '.');
  if ((t.closing || 0) < amb.minResults) peringatan.push('⏳ Order baru ' + fmnInt(t.closing) + '. CAC, ROAS, repeat rate, dan sebaran waktu keputusan <b>belum layak dinilai final</b>.');
  if (dg.jumlah_campaign_tak_terpetakan > 0) peringatan.push('🗂️ ' + dg.jumlah_campaign_tak_terpetakan + ' campaign iklan belum punya aturan minat sehingga spend-nya masuk baris <b>Tidak terpetakan</b>: ' + fmnEsc((dg.campaign_tak_terpetakan || []).join('; ')) + '. Tambahkan aturannya di Mapping Minat.');
  if (!dg.jumlah_aturan_minat) peringatan.push('⚠️ Belum ada aturan di DB_MappingMinat, jadi semua spend iklan masuk Tidak terpetakan.');
  peringatan.push('ℹ️ Klik → Lead bisa melebihi 100% karena lead mencakup semua sumber (termasuk organik), sedangkan klik hanya dari iklan.');
  if (d.lini_lain && d.lini_lain.spend > 0) peringatan.push('🧩 Lini tak terlacak (chat masuk CRM lain): spend ' + fmnRp(d.lini_lain.spend) + ', tidak ikut baris minat.');

  const kartu = [
    fmnKartuRingkas_('Ad Spend', fmnRp(fmnSpendPenuh_(t)), 'terlacak sejak CTWA ' + fmnEsc(per.since) + ': ' + fmnRp(t.spend)),
    fmnKartuRingkas_('Leads CRM', fmnInt(t.lead_semua), 'total · iklan ' + fmnInt(t.lead_iklan) + ' · form ' + fmnInt(t.lead_form) + ' · lain ' + fmnInt(t.lead_lain)),
    fmnKartuRingkas_('Order', fmnInt(t.closing), 'repeat ' + fmnInt(t.repeat_pelanggan) + ' pelanggan'),
    fmnKartuRingkas_('Waktu keputusan', t.median_hari_ke_order === null || t.median_hari_ke_order === undefined ? '-' : fmnHari(t.median_hari_ke_order), 'median ke order pertama · rata-rata ' + fmnHari(t.hari_ke_order_pertama)),
    fmnKartuRingkas_('CPL Meta', fmnRp(t.cpl_meta), 'spend ÷ chat Meta'),
    fmnKartuRingkas_('CPL CRM', fmnRp(t.real_cpl), 'spend ÷ semua lead unik (hari iklan berjalan)', '#4338ca'),
    fmnKartuRingkas_('CAC', fmnRp(t.cac), 'spend ÷ order pertama (semua lead)'),
    fmnKartuRingkas_('ROAS riil', fmnX(t.roas_riil), 'omzet semua lead · ROAS kas ' + fmnX(t.roas_kas))
  ].join('');

  const bocor = fmnBocor_(d.minat, t);
  const besar = d.minat.filter(b => (Number(b.spend_penuh) || Number(b.spend) || 0) > 0 || (Number(b.lead_semua) || 0) >= 5 || b.minat === 'Tidak terpetakan');
  const kecil = d.minat.filter(b => besar.indexOf(b) === -1);
  p.innerHTML = kepala +
    `<div style="font-size:11.5px;color:#64748b;margin:6px 0 10px;">Dihitung ${fmnEsc(FMN.data.dibuat || '')} · cache: ${fmnEsc(FMN.data.cache || '-')} · Spend, impresi, klik menurut minat campaign iklan (aturan Mapping Minat); Leads, Order, Repeat menurut kolom Minat di sheet Leads apa adanya (Leads Iklan = punya jejak CTWA, Leads Form = berasal dari Form). Persentase merah = langkah yang paling jauh di bawah rata-rata semua minat.</div>` +
    (peringatan.length ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12.5px;color:#78350f;">${peringatan.map(x => `<div style="margin:2px 0;">${x}</div>`).join('')}</div>` : '') +
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">${kartu}</div>` +
    fmnKartuMinat_(t, -1, true) +
    (besar.map(b => fmnKartuMinat_(b, bocor[b.minat], false)).join('') || '<div style="color:#94a3b8;font-size:13px;margin-top:10px;">Tidak ada data iklan pada periode ini.</div>') +
    (kecil.length ? `<details style="margin-top:12px;"><summary style="cursor:pointer;font-weight:700;font-size:13px;color:#334155;">${kecil.length} minat lain (lead sedikit, tanpa spend)</summary>${kecil.map(b => fmnKartuMinat_(b, bocor[b.minat], false)).join('')}</details>` : '') +
    `<details style="margin-top:14px;" open><summary style="cursor:pointer;font-weight:700;font-size:13px;color:#334155;">Tabel pembanding minat (klik judul kolom untuk mengurutkan)</summary>${fmnTabel_(d.minat, t)}</details>`;
}

async function fmnMuat(paksa) {
  if (FMN.memuat) return;
  const s = (document.getElementById('fMktStart') || {}).value || '';
  const e = (document.getElementById('fMktEnd') || {}).value || '';
  let url = scriptURL + '?action=getFunnelPerMinat';
  if (s) url += '&since=' + encodeURIComponent(s);
  if (e) url += '&until=' + encodeURIComponent(e);
  if (paksa) url += '&refresh=1';
  FMN.memuat = true; FMN.err = ''; fmnRender();
  try {
    let res;
    try { res = await fetchJsonAman(url); }
    catch (e1) { await new Promise(r => setTimeout(r, 1500)); res = await fetchJsonAman(url); }
    if (!res || res.result !== 'success') throw new Error((res && res.message) || 'Respon tidak valid');
    FMN.data = res;
  } catch (err) {
    FMN.err = String((err && err.message) || err);
  } finally {
    FMN.memuat = false; fmnRender();
  }
}

function fmnJadwalMuat_() {
  clearTimeout(FMN.timer);
  FMN.timer = setTimeout(() => fmnMuat(false), 1200);
}

document.addEventListener('DOMContentLoaded', () => {
  ['fMktStart', 'fMktEnd'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', fmnJadwalMuat_); });
  document.querySelectorAll('#grupPresetTglMkt button').forEach(el => el.addEventListener('click', fmnJadwalMuat_));
  document.querySelectorAll('.input-bulan-preset').forEach(el => el.addEventListener('change', fmnJadwalMuat_));
  setTimeout(() => fmnMuat(false), 1500);   // sesudah funnel-iklan (600 ms) supaya tidak berebut koneksi
});

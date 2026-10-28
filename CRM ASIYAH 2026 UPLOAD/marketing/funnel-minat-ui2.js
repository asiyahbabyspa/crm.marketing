// =========================================================================
// funnel-minat-ui2.js — tampilan baru "Funnel per Minat".
// Pasang TEPAT SESUDAH:  <script src="marketing/funnel-minat.js"></script>
// Tidak mengubah funnel-minat.js. File ini menimpa fmnKartuMinat_, fmnTabel_,
// membungkus fmnRender, dan menambah CSS. Hapus file ini = tampilan lama kembali.
// Simpan sebagai UTF-8.
// Ambang warna dibaca dari TENANT_CONFIG.thresholds (tenant-config.js).
// =========================================================================

const FM2_ARROW_UP = '\u25B2', FM2_ARROW_DN = '\u25BC';
const FM2_LABEL = { bagus: 'Bagus', waspada: 'Waspada', jelek: 'Jelek' };

function fm2T_() { return (typeof TENANT_CONFIG !== 'undefined' && TENANT_CONFIG.thresholds) || {}; }
function fm2Num_(v) { return (v === null || v === undefined || v === '' || !isFinite(Number(v))) ? null : Number(v); }

// Status satu metrik. 'cac' dan 'rep' belum punya ambang absolut -> dinilai relatif terhadap rata-rata semua minat.
function fm2Status_(m, v, avg) {
  v = fm2Num_(v); if (v === null) return null;
  const t = fm2T_();
  if (m === 'ctr') { const lo = t.ctrRendahPersen != null ? t.ctrRendahPersen : 1; return v < lo ? 'jelek' : v < lo * 1.5 ? 'waspada' : 'bagus'; }
  if (m === 'cpl') { const hi = t.cplMahalRp || 30000; return v > hi ? 'jelek' : v > hi * 0.7 ? 'waspada' : 'bagus'; }
  if (m === 'roas') { const s = t.roasSehat || 2, k = t.roasTipisBawah || 1; return v < k ? 'jelek' : v < s ? 'waspada' : 'bagus'; }
  if (m === 'konv') { const s = t.crSehatPersen || 15, w = t.crWaspadaPersen || 8; return v >= s ? 'bagus' : v >= w ? 'waspada' : 'jelek'; }
  if (m === 'kl') { const s = t.clickToLeadSehatPersen || 15, w = t.clickToLeadWaspadaPersen || 5; return v >= s ? 'bagus' : v >= w ? 'waspada' : 'jelek'; }
  avg = fm2Num_(avg); if (avg === null || avg <= 0) return null;
  const r = v / avg;
  if (m === 'cac') return r <= 0.8 ? 'bagus' : r <= 1.2 ? 'waspada' : 'jelek';
  if (m === 'rep') return r >= 1.2 ? 'bagus' : r >= 0.8 ? 'waspada' : 'jelek';
  return null;
}

// Selisih terhadap rata-rata semua minat. arah: 1 = makin tinggi makin baik, -1 = makin rendah makin baik.
function fm2Delta_(v, avg, arah) {
  v = fm2Num_(v); avg = fm2Num_(avg);
  if (v === null || avg === null || avg <= 0) return '';
  const pct = (v - avg) / avg * 100;
  if (Math.abs(pct) < 5) return '<div class="fmn-dl eq">\u2248 setara rata-rata</div>';
  const baik = pct * arah > 0, n = Math.round(Math.abs(pct)).toLocaleString('id-ID');
  return baik ? `<div class="fmn-dl up">${FM2_ARROW_UP} ${n}% lebih baik dari rata-rata</div>`
              : `<div class="fmn-dl dn">${FM2_ARROW_DN} ${n}% lebih buruk dari rata-rata</div>`;
}

function fm2Badge_(st) { return st ? `<span class="fmn-bd b-${st}">${FM2_LABEL[st]}</span>` : ''; }

function fm2Node_(ikon, judul, nilai, sub, extra, st, delta) {
  return `<div class="fmn-node ${st ? 's-' + st : ''}"><div class="jdl"><span>${ikon}</span>${judul}${fm2Badge_(st)}</div><div class="nil">${nilai}</div>${delta || ''}${sub ? `<div class="sub">${sub}</div>` : ''}${extra || ''}</div>`;
}

function fm2Chip_(b, i, bocorIdx, st) {
  const bocor = bocorIdx === i;
  const cls = bocor ? 'bocor' : (st ? 'st-' + st : '');
  return `<span class="fmn-chip ${cls}" title="${FMN_LANGKAH[i]}">${FMN_LANGKAH[i]} ${fmnPct(fmnRate_(b, i))}${bocor ? '<small>bocor terbesar</small>' : ''}</span>`;
}

function fm2Konteks_() {
  const d = (FMN.data && FMN.data.data) || {};
  return { tot: d.total || {}, minResults: (d.ambang && d.ambang.minResults) || 5 };
}

function fmnKartuMinat_(b, bocorIdx, total) {
  const { tot, minResults } = fm2Konteks_();
  const lead = Number(b.lead_semua) || 0;
  const t = fm2T_();
  const kecil = !total && fmnSpP_(b) < (t.kontenMinSpendRp || 150000);
  const belumFinal = (Number(b.closing) || 0) < minResults;      // CAC/ROAS/repeat belum layak
  const pakai = (m, v, avg, final) => (total || kecil || (final && belumFinal)) ? null : fm2Status_(m, v, avg);
  const delta = (v, avg, arah, final) => (total || kecil || (final && belumFinal)) ? '' : fm2Delta_(v, avg, arah);

  const st = {
    ctr: pakai('ctr', fmnRate_(b, 0), null, false),
    kl: pakai('kl', fmnRate_(b, 1), null, false),
    cpl: pakai('cpl', b.real_cpl, null, false),
    konv: pakai('konv', b.konversi_lead_ke_order_persen, null, true),
    cac: pakai('cac', b.cac, tot.cac, true),
    roas: pakai('roas', b.roas_riil, null, true),
    rep: pakai('rep', b.repeat_rate_persen, tot.repeat_rate_persen, true)
  };

  // Ringkasan satu baris per minat.
  const NAMA = { ctr: 'CTR', kl: 'Klik\u2192Lead', cpl: 'CPL CRM', konv: 'Lead\u2192Order', cac: 'CAC', roas: 'ROAS', rep: 'Repeat' };
  const jelek = Object.keys(st).filter(k => st[k] === 'jelek').map(k => NAMA[k]);
  const waspada = Object.keys(st).filter(k => st[k] === 'waspada').map(k => NAMA[k]);
  let vk = 'bagus', vt = 'Sehat: tidak ada metrik merah';
  if (total) { vk = 'info'; vt = 'Rata-rata semua minat \u2014 patokan untuk kartu di bawah'; }
  else if (kecil) { vk = 'info'; vt = 'Sampel kecil: spend di bawah Rp ' + fmnInt(t.kontenMinSpendRp || 150000) + ', belum dinilai'; }
  else {
    const bagian = [];
    if (bocorIdx >= 0) bagian.push('Bocor di ' + FMN_LANGKAH[bocorIdx]);
    if (jelek.length) bagian.push('Jelek: ' + jelek.join(', '));
    if (bagian.length) { vk = 'jelek'; vt = bagian.join(' \u00B7 '); }
    else if (waspada.length) { vk = 'waspada'; vt = 'Waspada: ' + waspada.join(', '); }
    if (belumFinal) vt += ' \u00B7 order baru ' + fmnInt(b.closing) + ', CAC/ROAS belum final';
  }
  const ikonV = { bagus: '\u2714', waspada: '\u26A0', jelek: '\u2716', info: '\u2139' }[vk];

  const komposisi = [
    { label: 'Iklan (jejak CTWA)', n: b.lead_iklan, warna: '#4f46e5' },
    { label: 'Form', n: b.lead_form, warna: '#0ea5e9' },
    { label: 'Lain', n: b.lead_lain, warna: '#94a3b8' }
  ];
  const legKomposisi = komposisi.map(x => `<span><i class="fmn-dot" style="background:${x.warna};"></i>${x.label} <b>${fmnInt(x.n)}</b></span>`).join('');

  const kolIn = fm2Node_('\uD83D\uDCB0', 'Belanja iklan', fmnRp(fmnSpP_(b)), fmnSpKet_(b) + fmnInt(b.jumlah_iklan) + ' iklan \u00B7 CPM ' + fmnRp(b.cpm) + ' (terlacak)') +
    fmnTurun_('<span class="fmn-chip">tayang</span>') +
    fm2Node_('\uD83D\uDC41', 'Lihat (impresi)', fmnInt(b.impressions), '') +
    fmnTurun_(fm2Chip_(b, 0, bocorIdx, st.ctr)) +
    fm2Node_('\uD83D\uDDB1', 'Klik tautan', fmnInt(b.klik), 'CPC ' + fmnRp(b.cpc) + ' (terlacak)');

  const kolPr = fm2Node_('\uD83D\uDCAC', 'Leads CRM', fmnInt(lead), 'CPL CRM ' + fmnRp(b.real_cpl) + ' (terlacak) \u00B7 CPL Meta ' + fmnRp(b.cpl_meta),
      fmnBarSegmen_(komposisi, lead) + `<div class="fmn-leg">${legKomposisi}</div>`, st.cpl, delta(b.real_cpl, tot.real_cpl, -1, false)) +
    fmnTurun_(fm2Chip_(b, 2, bocorIdx, st.konv)) +
    fm2Node_('\uD83D\uDED2', 'Order pertama', fmnInt(b.closing), 'CAC ' + fmnRp(b.cac) + ' (terlacak) \u00B7 konversi ' + fmnPct(b.konversi_lead_ke_order_persen),
      fmnWaktuHtml_(b), st.cac, delta(b.cac, tot.cac, -1, true));

  const kolOut = fm2Node_('\uD83D\uDCB5', 'Omzet', fmnRp(b.omzet), 'ROAS ' + fmnX(b.roas_riil) + ' (terlacak) \u00B7 kas ' + fmnX(b.roas_kas) + '<br>rata-rata order ' + fmnRp(b.rata_nilai_order),
      '', st.roas, delta(b.roas_riil, tot.roas_riil, 1, true)) +
    fmnTurun_(fm2Chip_(b, 3, bocorIdx, null)) +
    fm2Node_('\uD83D\uDD01', 'Repeat', fmnInt(b.repeat_pelanggan), 'repeat rate ' + fmnPct(b.repeat_rate_persen) + ' \u00B7 ' + fmnInt(b.order_ulang) + ' order ulang',
      '', st.rep, delta(b.repeat_rate_persen, tot.repeat_rate_persen, 1, true));

  return `<div class="fmn-kartu ${total ? 'total' : ''}">
    <div class="fmn-kepala"><span class="fmn-nama">${total ? '\uD83C\uDF10 Semua minat' : fmnEsc(b.minat)}</span>
      <span class="fmn-meta">${fmnRp(fmnSpP_(b))} \u00B7 ${fmnInt(b.jumlah_iklan)} iklan \u00B7 ${fmnInt(lead)} leads \u00B7 ${fmnInt(b.closing)} order</span></div>
    <div class="fmn-verdict v-${vk}"><span class="vi">${ikonV}</span><span>${vt}</span></div>
    <div class="fmn-zona"><div class="z-in">INPUT \u00B7 tarik perhatian</div><div class="z-pr">PROSES \u00B7 ubah jadi pembeli</div><div class="z-out">OUTPUT \u00B7 hasil</div></div>
    <div class="fmn-alur">
      <div class="fmn-kolom k-in">${kolIn}</div>
      ${fmnPipa_(fm2Chip_(b, 1, bocorIdx, st.kl))}
      <div class="fmn-kolom k-pr">${kolPr}</div>
      ${fmnPipa_('<span class="fmn-chip">order \u2192 uang</span>')}
      <div class="fmn-kolom k-out">${kolOut}</div>
    </div></div>`;
}

// Kolom tabel yang diberi warna: [metrik, arah]
const FM2_KOLSTAT = { ctr_persen: 'ctr', cpl_meta: 'cpl', real_cpl: 'cpl', cac: 'cac', roas_riil: 'roas', repeat_rate_persen: 'rep' };

function fmnTabel_(baris, total) {
  const { k, arah } = FMN.urut;
  const tipe = (FMN_KOLOM.find(c => c[0] === k) || [])[2];
  const t = fm2T_(), minResults = fm2Konteks_().minResults;
  const biasa = baris.filter(b => b.minat !== 'Tidak terpetakan'), tak = baris.filter(b => b.minat === 'Tidak terpetakan');
  biasa.sort((a, b) => {
    if (tipe === 'teks') return String(a[k]).localeCompare(String(b[k]), 'id') * arah;
    const x = a[k] === null || a[k] === undefined ? -Infinity : Number(a[k]);
    const y = b[k] === null || b[k] === undefined ? -Infinity : Number(b[k]);
    return (x - y) * arah;
  });
  const th = FMN_KOLOM.map(c => `<th onclick="fmnUrutkan('${c[0]}')" class="${c[2] === 'teks' ? 'l' : 'r'}">${c[1]}${k === c[0] ? (arah < 0 ? ' ' + FM2_ARROW_DN : ' ' + FM2_ARROW_UP) : ''}</th>`).join('');
  const tr = (x, isTotal) => {
    const kecil = !isTotal && fmnSpP_(x) < (t.kontenMinSpendRp || 150000);
    const belumFinal = (Number(x.closing) || 0) < minResults;
    return `<tr class="${isTotal ? 'tot' : ''}">${FMN_KOLOM.map(c => {
      let kls = c[2] === 'teks' ? 'l' : 'r';
      const m = FM2_KOLSTAT[c[0]];
      if (m && !isTotal && !kecil && !(belumFinal && (m === 'cac' || m === 'roas' || m === 'rep'))) {
        const s = fm2Status_(m, x[c[0]], total[c[0]]);
        if (s) kls += ' c-' + s;
      }
      return `<td class="${kls}">${c[3](x)}</td>`;
    }).join('')}</tr>`;
  };
  return `<div class="fm2-tbl-wrap"><table class="fm2-tbl">
    <thead><tr>${th}</tr></thead>
    <tbody>${biasa.concat(tak).map(x => tr(x, false)).join('')}${tr(total, true)}</tbody></table></div>
    <div class="fmn-cat">Kolom berwarna: hijau bagus, kuning waspada, merah jelek. Baris sampel kecil tidak diberi warna. Geser ke samping untuk kolom lain; kolom Minat tetap menempel.</div>`;
}

// Bungkus fmnRender: tambah legenda warna di bawah judul panel.
const fm2RenderAsli = fmnRender;
fmnRender = function () {
  fm2RenderAsli();
  const p = document.getElementById('fmnPanel');
  if (p && FMN.data && !p.querySelector('.fmn-legenda') && p.firstElementChild) {
    p.firstElementChild.insertAdjacentHTML('afterend',
      '<div class="fmn-legenda"><span><i class="fmn-dot" style="background:#16a34a"></i>Bagus</span><span><i class="fmn-dot" style="background:#ca8a04"></i>Waspada</span><span><i class="fmn-dot" style="background:#dc2626"></i>Jelek</span>' +
      '<span class="ar"><b style="color:#15803d">' + FM2_ARROW_UP + '</b> lebih baik / <b style="color:#b91c1c">' + FM2_ARROW_DN + '</b> lebih buruk dari rata-rata semua minat</span>' +
      '<span class="cat">Ambang dari tenant-config.js (thresholds). CAC dan repeat rate belum punya ambang, jadi dinilai relatif ke rata-rata.</span></div>');
  }
};

const FM2_CSS = `
#fmnPanel .fmn-legenda{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;font-size:12px;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:8px 0;}
#fmnPanel .fmn-legenda .cat{flex-basis:100%;font-size:11px;color:#94a3b8;}
#fmnPanel .fmn-verdict{display:flex;align-items:center;gap:8px;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:800;margin-bottom:10px;line-height:1.3;}
#fmnPanel .fmn-verdict .vi{font-size:15px;}
#fmnPanel .v-bagus{background:#dcfce7;color:#166534;}
#fmnPanel .v-waspada{background:#fef9c3;color:#854d0e;}
#fmnPanel .v-jelek{background:#fee2e2;color:#991b1b;}
#fmnPanel .v-info{background:#f1f5f9;color:#475569;}
#fmnPanel .fmn-node.s-bagus{border-left:5px solid #16a34a;background:#f7fef9;}
#fmnPanel .fmn-node.s-waspada{border-left:5px solid #ca8a04;background:#fffdf0;}
#fmnPanel .fmn-node.s-jelek{border-left:5px solid #dc2626;background:#fff7f7;}
#fmnPanel .fmn-bd{margin-left:auto;font-size:10px;font-weight:800;border-radius:99px;padding:1px 8px;color:#fff;}
#fmnPanel .b-bagus{background:#16a34a;}#fmnPanel .b-waspada{background:#ca8a04;}#fmnPanel .b-jelek{background:#dc2626;}
#fmnPanel .fmn-dl{font-size:11.5px;font-weight:800;margin-top:2px;}
#fmnPanel .fmn-dl.up{color:#15803d;}#fmnPanel .fmn-dl.dn{color:#b91c1c;}#fmnPanel .fmn-dl.eq{color:#64748b;}
#fmnPanel .fmn-chip.st-bagus{background:#dcfce7;color:#166534;}#fmnPanel .fmn-chip.st-bagus small{color:#166534;}
#fmnPanel .fmn-chip.st-waspada{background:#fef9c3;color:#854d0e;}#fmnPanel .fmn-chip.st-waspada small{color:#854d0e;}
#fmnPanel .fmn-chip.st-jelek{background:#fee2e2;color:#b91c1c;}#fmnPanel .fmn-chip.st-jelek small{color:#b91c1c;}
#fmnPanel .fm2-tbl-wrap{overflow-x:auto;margin-top:8px;border:1px solid #e2e8f0;border-radius:10px;-webkit-overflow-scrolling:touch;}
#fmnPanel .fm2-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12px;}
#fmnPanel .fm2-tbl th{background:#f1f5f9;cursor:pointer;padding:8px 8px;white-space:nowrap;position:sticky;top:0;}
#fmnPanel .fm2-tbl td{padding:7px 8px;white-space:nowrap;border-top:1px solid #f1f5f9;background:#fff;}
#fmnPanel .fm2-tbl .l{text-align:left;}#fmnPanel .fm2-tbl .r{text-align:right;}
#fmnPanel .fm2-tbl tr.tot td{font-weight:800;background:#f8fafc;}
#fmnPanel .fm2-tbl th:first-child,#fmnPanel .fm2-tbl td:first-child{position:sticky;left:0;z-index:2;box-shadow:2px 0 0 #e2e8f0;}
#fmnPanel .fm2-tbl td.c-bagus{background:#dcfce7;color:#166534;font-weight:700;}
#fmnPanel .fm2-tbl td.c-waspada{background:#fef9c3;color:#854d0e;font-weight:700;}
#fmnPanel .fm2-tbl td.c-jelek{background:#fee2e2;color:#991b1b;font-weight:700;}
@media (max-width:900px){
 #fmnPanel .fmn-kolom{padding:10px;}
 #fmnPanel .fmn-pipa .fmn-chip{max-width:none;}
}
@media (max-width:600px){
 #fmnPanel{padding:12px !important;}
 #fmnPanel .fmn-kartu{padding:12px;}
 #fmnPanel .fmn-nama{font-size:16px;}
 #fmnPanel .fmn-meta{font-size:12px;}
 #fmnPanel .fmn-verdict{font-size:13.5px;}
 #fmnPanel .fmn-node{padding:10px 12px;}
 #fmnPanel .fmn-node .jdl{font-size:12px;flex-wrap:wrap;}
 #fmnPanel .fmn-node .nil{font-size:23px;}
 #fmnPanel .fmn-node .sub,#fmnPanel .fmn-leg,#fmnPanel .fmn-wk,#fmnPanel .fmn-cat{font-size:12px;}
 #fmnPanel .fmn-chip{font-size:12px;padding:3px 10px;}
 #fmnPanel .fmn-bar{height:13px;}
 #fmnPanel summary{min-height:44px;display:flex;align-items:center;}
 #fmnPanel .fm2-tbl{font-size:13px;}
 #fmnPanel .fm2-tbl th,#fmnPanel .fm2-tbl td{padding:10px 9px;}
 #fmnPanel .fmn-legenda{font-size:12.5px;}
}
`;
(function () {
  if (!document.getElementById('fmnStyle2')) {
    const st = document.createElement('style'); st.id = 'fmnStyle2'; st.textContent = FM2_CSS; document.head.appendChild(st);
  }
  if (typeof FMN !== 'undefined' && FMN.data) fmnRender();
})();

// samakan-kartu-atas.js
// Menyamakan kartu Tahap 1-4 (index-marketing) dengan total Funnel per Minat (FMN.data).
// Ad Spend kartu = total penuh (tidak ditimpa); spend terlacak sejak CTWA = keterangan pendukung.
(function () {
  'use strict';
  var lama = null;
  function $(id) { return document.getElementById(id); }
  function rpf(n) { return (typeof rp === 'function') ? rp(n) : Number(n || 0).toLocaleString('id-ID'); }
  function ada(v) { return v !== null && v !== undefined && !isNaN(v); }
  function set(id, txt) { var el = $(id); if (el) el.innerText = txt; }
  function teks(id) { var el = $(id); return el ? el.innerText : '-'; }

  function filterAktif() {
    try {
      if (typeof getMsFilterSelected !== 'function') return false;
      return getMsFilterSelected('msFilterMktCampaign').length > 0 || getMsFilterSelected('msFilterMktNamaMeta').length > 0;
    } catch (e) { return false; }
  }

  function simpanLama() {
    lama = { spend: teks('kpiSpendAwareness'), leads: teks('kpiLeads'), closing: teks('kpiClosing'), omzet: teks('kpiOmzet') };
  }

  function terap() {
    try {
      if (typeof FMN === 'undefined' || !FMN || !FMN.data || !FMN.data.data) return;
      var d = FMN.data.data, t = d.total, p = d.periode || {};
      if (!t || filterAktif()) return;
      var s = ($('fMktStart') || {}).value || '', e = ($('fMktEnd') || {}).value || '';
      if (s && p.since_diminta && p.since_diminta !== s) return;
      if (e && p.until && p.until !== e) return;

      // Ad Spend kartu = total penuh: sengaja tidak ditimpa
      set('kpiImpresi', rpf(t.impressions));
      set('kpiCTR', ada(t.ctr_persen) ? Number(t.ctr_persen).toFixed(2) + '%' : '-');
      set('kpiLeadsMeta', rpf(t.results_meta));
      set('kpiLeads', (t.lead_semua || 0) + ' Klien');
      set('kpiCPL', ada(t.real_cpl) ? 'Rp ' + rpf(t.real_cpl) : '-');
      set('kpiMatchRate', t.results_meta > 0 ? Math.round(t.lead_semua / t.results_meta * 100) + '%' : '-');
      set('kpiClosing', (t.closing || 0) + ' Transaksi');
      set('kpiCR', ada(t.konversi_lead_ke_order_persen) ? t.konversi_lead_ke_order_persen + '%' : '-');
      set('kpiCAC', ada(t.cac) ? 'Rp ' + rpf(t.cac) : '-');
      set('kpiTime', ada(t.hari_ke_order_pertama) ? t.hari_ke_order_pertama + ' Hari' : '-');
      set('kpiOmzet', 'Rp ' + rpf(t.omzet));
      set('kpiROAS', ada(t.roas_riil) ? t.roas_riil + 'x' : '-');

      var kartu = $('kpiSpendAwareness');
      kartu = kartu && kartu.closest ? kartu.closest('.kpi-card') : null;
      if (!kartu || !kartu.parentNode) return;

      // keterangan pendukung di dalam kartu Ad Spend
      var cap = $('capSpendTerlacak');
      if (!cap) {
        cap = document.createElement('div');
        cap.id = 'capSpendTerlacak';
        cap.style.cssText = 'font-size:10.5px;opacity:.9;margin-top:3px;';
        kartu.appendChild(cap);
      }
      cap.textContent = 'Spend terlacak sejak CTWA (' + (p.since || '-') + '): Rp ' + rpf(t.spend);

      var note = $('noteSamakanKartu');
      if (!note) {
        note = document.createElement('div');
        note.id = 'noteSamakanKartu';
        note.style.cssText = 'font-size:11.5px;color:#475569;background:#f1f5f9;border-radius:6px;padding:6px 10px;margin:6px 0;';
        kartu.parentNode.insertAdjacentElement('afterend', note);
      }
      note.innerHTML = 'Kartu Tahap 1-4 disamakan dengan <b>Funnel per Minat</b> (' + (p.since || '-') + ' s/d ' + (p.until || '-') +
        '). Ad Spend di kartu = <b>total penuh</b>; Leads, Closing, Omzet, CPL, CAC, dan ROAS dihitung dari spend terlacak sejak CTWA (' + (p.since || '-') + '). Reach tetap angka lama.' +
        (lama ? '<br>Angka sebelum disamakan: Leads ' + lama.leads + ' · Closing ' + lama.closing + ' · Omzet ' + lama.omzet : '');
    } catch (err) { if (window.console) console.warn('samakan-kartu-atas:', err); }
  }

  var rm = window.renderMarketingTab;
  if (typeof rm === 'function') {
    window.renderMarketingTab = function () {
      var r = rm.apply(this, arguments);
      simpanLama(); terap();
      return r;
    };
  }
  var fr = window.fmnRender;
  if (typeof fr === 'function') {
    window.fmnRender = function () {
      var r = fr.apply(this, arguments);
      terap();
      return r;
    };
  }
})();
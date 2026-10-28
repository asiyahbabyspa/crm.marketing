// =========================================================================
// tour.js - mesin tur panduan per halaman (dipakai Marketing, CRM, Follow Up, dst)
// Cara pakai di file lain:
//   TourPanduan.daftar('marketing', {
//     aktif: function () { return /* true kalau halaman ini sedang tampil */; },
//     langkah: [ { target: '#idElemen', judul: '...', isi: '...' }, ... ]
//   });
// Langkah tanpa "target" tampil di tengah layar (untuk pembuka).
// Langkah yang elemennya tidak tampil / kosong dilewati otomatis.
// =========================================================================
(function () {
  'use strict';

  var KUNCI = 'tour_panduan_v1_';
  var registry = {};
  var state = { id: null, langkah: [], i: 0 };
  var el = {};

  function pasangCss() {
    if (document.getElementById('tp-css')) return;
    var s = document.createElement('style');
    s.id = 'tp-css';
    s.textContent = [
      '#tp-btn{position:fixed;right:18px;bottom:18px;z-index:9990;padding:11px 18px;border:none;border-radius:24px;background:#4338ca;color:#fff;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 6px 18px rgba(67,56,202,.35);}',
      '#tp-btn:hover{background:#3730a3;}',
      '#tp-btn.tp-pulse{animation:tpPulse 1.6s infinite;}',
      '@keyframes tpPulse{0%{box-shadow:0 0 0 0 rgba(67,56,202,.55);}70%{box-shadow:0 0 0 14px rgba(67,56,202,0);}100%{box-shadow:0 0 0 0 rgba(67,56,202,0);}}',
      '.tp-lapis{position:fixed;inset:0;z-index:9999;}',
      '.tp-sorot{position:fixed;z-index:10000;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.62);pointer-events:none;transition:all .25s ease;}',
      '.tp-kartu{position:fixed;z-index:10001;width:min(340px,92vw);background:#fff;border-radius:12px;padding:16px 18px;box-shadow:0 12px 32px rgba(0,0,0,.28);font-family:inherit;}',
      '.tp-kartu .tp-hit{font-size:11px;color:#64748b;font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px;}',
      '.tp-kartu h4{margin:0 0 6px;font-size:15px;color:#0f172a;}',
      '.tp-kartu p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#334155;}',
      '.tp-aksi{display:flex;justify-content:space-between;align-items:center;gap:8px;}',
      '.tp-aksi button{border:none;border-radius:8px;padding:8px 14px;font-size:12.5px;font-weight:700;cursor:pointer;}',
      '.tp-lewati{background:transparent;color:#94a3b8;padding-left:0!important;}',
      '.tp-sek{background:#f1f5f9;color:#475569;margin-right:6px;}',
      '.tp-lanjut{background:#4338ca;color:#fff;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function terlihat(e) {
    if (!e) return false;
    var r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function halamanAktif() {
    var ids = Object.keys(registry);
    for (var k = 0; k < ids.length; k++) {
      var def = registry[ids[k]];
      try { if (def.aktif && def.aktif()) return ids[k]; } catch (e) {}
    }
    return null;
  }

  function bangun() {
    tutup();
    el.lapis = document.createElement('div');
    el.lapis.className = 'tp-lapis';
    el.sorot = document.createElement('div');
    el.sorot.className = 'tp-sorot';
    el.kartu = document.createElement('div');
    el.kartu.className = 'tp-kartu';
    el.kartu.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.getAttribute('data-a');
      if (a === 'next') maju(1);
      else if (a === 'prev') maju(-1);
      else if (a === 'tutup') tutup();
    });
    document.body.appendChild(el.lapis);
    document.body.appendChild(el.sorot);
    document.body.appendChild(el.kartu);
  }

   function tutup() {
    var balik = state.id && state.subAwal;
    ['lapis', 'sorot', 'kartu'].forEach(function (k) {
      if (el[k] && el[k].parentNode) el[k].parentNode.removeChild(el[k]);
      el[k] = null;
    });
    state.id = null;
    if (balik && window.mktBukaSub && window._rpKini !== balik) {
      try { window.mktBukaSub(balik); } catch (e) {}
    }
    state.subAwal = null;
  }

  function tampil() {
    if (!el.kartu) return;
    var l = state.langkah[state.i];
    var total = state.langkah.length;

    el.kartu.innerHTML =
      '<div class="tp-hit">Langkah ' + (state.i + 1) + ' dari ' + total + '</div>' +
      '<h4>' + l.judul + '</h4><p>' + l.isi + '</p>' +
      '<div class="tp-aksi"><button type="button" class="tp-lewati" data-a="tutup">Lewati</button><span>' +
      (state.i > 0 ? '<button type="button" class="tp-sek" data-a="prev">Kembali</button>' : '') +
      '<button type="button" class="tp-lanjut" data-a="next">' + (state.i === total - 1 ? 'Selesai' : 'Lanjut') + '</button></span></div>';

    // buka sub-tab yang berisi target (kalau langkah ini menyebut "sub")
    if (l.sub && typeof window.mktBukaSub === 'function') {
      try { window.mktBukaSub(l.sub); } catch (e) {}
    }
    var tunda = l.sub ? 500 : 0;
    var nomor = state.i;
    setTimeout(function () {
      if (!el.kartu || state.i !== nomor) return;
      var t = l.target ? document.querySelector(l.target) : null;
      if (t && !terlihat(t)) t = null;
      if (t) {
        t.scrollIntoView({ block: 'center', behavior: l.sub ? 'auto' : 'smooth' });
        setTimeout(function () { if (el.kartu) posisi(t); }, 380);
      } else {
        posisi(null);
      }
    }, tunda);
  }

  function mulai(id) {
    var def = registry[id];
    if (!def) return;
    var subAwal = window._rpKini || null;
    state.langkah = def.langkah.filter(function (l) {
      return !l.target || l.sub || terlihat(document.querySelector(l.target));
    });
    if (!state.langkah.length) { alert('Belum ada bagian yang bisa dipandu di halaman ini.'); return; }
    state.i = 0;
    bangun();
    state.id = id;
    state.subAwal = subAwal;
    tampil();
  }

  function maju(arah) {
    var baru = state.i + arah;
    if (baru >= state.langkah.length) { tutup(); return; }
    if (baru < 0) return;
    state.i = baru;
    tampil();
  }

 

  function posisi(t) {
    if (!el.kartu) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var k = el.kartu;

    if (!t) {
      el.sorot.style.display = 'none';
      el.lapis.style.background = 'rgba(15,23,42,.62)';
      k.style.left = Math.max(8, (vw - k.offsetWidth) / 2) + 'px';
      k.style.top = Math.max(8, (vh - k.offsetHeight) / 2) + 'px';
      return;
    }

    el.lapis.style.background = 'transparent';
    var r = t.getBoundingClientRect();
    var pad = 6;
    var top = r.top - pad, left = r.left - pad, w = r.width + pad * 2, h = r.height + pad * 2;
    el.sorot.style.display = 'block';
    el.sorot.style.top = top + 'px';
    el.sorot.style.left = left + 'px';
    el.sorot.style.width = w + 'px';
    el.sorot.style.height = h + 'px';

    var kh = k.offsetHeight, kw = k.offsetWidth;
    var y;
    if (vh - (top + h) >= kh + 12) y = top + h + 12;
    else if (top >= kh + 12) y = top - kh - 12;
    else y = vh - kh - 12;
    var x = Math.min(Math.max(8, left), vw - kw - 8);
    k.style.top = Math.max(8, y) + 'px';
    k.style.left = x + 'px';
  }

  

  function pasangTombol() {
    if (document.getElementById('tp-btn')) return;
    var b = document.createElement('button');
    b.id = 'tp-btn';
    b.type = 'button';
    b.textContent = '\u2753 Panduan';
    var sudahKlik = false;
    try { sudahKlik = localStorage.getItem(KUNCI + 'btn') === '1'; } catch (e) {}
    if (!sudahKlik) b.className = 'tp-pulse';
    b.onclick = function () {
      try { localStorage.setItem(KUNCI + 'btn', '1'); } catch (e) {}
      b.className = '';
      var id = halamanAktif();
      if (id) mulai(id); else alert('Halaman ini belum punya panduan.');
    };
    document.body.appendChild(b);
  }

  document.addEventListener('keydown', function (ev) {
    if (!state.id) return;
    if (ev.key === 'Escape') tutup();
    else if (ev.key === 'ArrowRight') maju(1);
    else if (ev.key === 'ArrowLeft') maju(-1);
  });
  window.addEventListener('resize', function () { if (state.id) tampil(); });

  function init() { pasangCss(); pasangTombol(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TourPanduan = {
    daftar: function (id, def) { registry[id] = def; },
    mulai: mulai,
    halamanAktif: halamanAktif
  };
})();

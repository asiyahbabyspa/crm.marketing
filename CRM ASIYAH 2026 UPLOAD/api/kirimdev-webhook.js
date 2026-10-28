const crypto = require('crypto');

function samaAman(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).send('ok');
  if (req.method !== 'POST') return res.status(405).end();

  const rahasia = (process.env.KD_WEBHOOK_TOKEN || '').trim();
  const tujuan = (process.env.APPS_SCRIPT_URL || '').trim();
  if (!rahasia || !tujuan) return res.status(500).send('config');
  if (!samaAman(req.query.wh, rahasia)) return res.status(403).send('FORBIDDEN');

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const url = tujuan + (tujuan.includes('?') ? '&' : '?') + 'wh=' + encodeURIComponent(rahasia);

  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(25000)
    });
  } catch (e) {
    console.error('proxy gagal kirim:', e.name);
    return res.status(502).send('upstream error');
  }

  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get('location');
    if (loc) { try { await fetch(loc, { method: 'GET' }); } catch (e) {} }
    return res.status(200).send('ok');
  }
  if (r.status >= 500) {
    console.error('upstream status:', r.status);
    return res.status(502).send('upstream ' + r.status);
  }
  return res.status(200).send('ok');
};

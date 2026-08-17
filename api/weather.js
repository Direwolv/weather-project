const METEOBLUE_BASE = 'https://my.meteoblue.com/packages/';
const DEFAULT_PACKAGE = 'basic-1h_basic-day_clouds-3h_clouds-day';

module.exports = async function handler(req, res) {
  const key = process.env.METEOBLUE_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Server not configured: METEOBLUE_KEY env var missing' });
  }

  const { lat, lon, asl, pkg } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat/lon' });
  }

  const p = new URLSearchParams({ apikey: key, lat, lon, format: 'json' });
  if (asl) p.set('asl', asl);

  const url = `${METEOBLUE_BASE}${pkg || DEFAULT_PACKAGE}?${p}`;
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Meteoblue upstream error ${upstream.status}` });
    }
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(await upstream.text());
  } catch (e) {
    return res.status(502).json({ error: 'Meteoblue upstream fetch failed' });
  }
};

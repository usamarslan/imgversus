import { json } from '../../lib/shared.js';

// Yönetici özeti (/admin sayfası için). Sadece doğru ADMIN_KEY ile açılır; anahtar Cloudflare'da gizli değişken olarak durur.
export async function onRequestGet({ request, env }) {
  const key = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_KEY || !(await sameSecret(key, env.ADMIN_KEY))) return json({ error: 'unauthorized' }, 401);

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const all = (sql, ...args) => env.STATS.prepare(sql).bind(...args).all().then((r) => r.results);

  const [[totals], days, recent, top, countries] = await Promise.all([
    all(`SELECT SUM(type = 'upload') AS albums,
                SUM(CASE WHEN type = 'upload' THEN images ELSE 0 END) AS images,
                SUM(CASE WHEN type = 'upload' THEN bytes ELSE 0 END) AS bytes,
                SUM(type = 'view') AS views,
                SUM(type = 'feedback') AS feedback
         FROM events`),
    all(`SELECT date(ts / 1000, 'unixepoch') AS day, SUM(type = 'upload') AS albums, SUM(type = 'view') AS views
         FROM events WHERE ts > ? GROUP BY day ORDER BY day DESC`, now - 30 * DAY),
    all(`SELECT u.album, u.ts, u.images, u.bytes, u.country,
                (SELECT COUNT(*) FROM events v WHERE v.type = 'view' AND v.album = u.album) AS views
         FROM events u WHERE u.type = 'upload' ORDER BY u.ts DESC LIMIT 50`),
    all(`SELECT album, COUNT(*) AS views FROM events WHERE type = 'view' AND ts > ?
         GROUP BY album ORDER BY views DESC LIMIT 10`, now - 30 * DAY),
    all(`SELECT country, COUNT(*) AS n FROM events WHERE type = 'view' AND ts > ? AND country IS NOT NULL
         GROUP BY country ORDER BY n DESC LIMIT 15`, now - 30 * DAY),
  ]);

  // Son yüklemelerin başlıkları (silinmiş linkler null döner)
  const titles = await Promise.all(recent.map((r) => env.IMAGES.get(`album:${r.album}`, 'json')));
  recent.forEach((r, i) => {
    r.title = titles[i]?.title || '';
    r.exists = !!titles[i];
  });

  const list = await env.IMAGES.list({ prefix: 'feedback:', limit: 50 });
  const feedback = (await Promise.all(list.keys.map((k) => env.IMAGES.get(k.name, 'json'))))
    .filter(Boolean)
    .sort((x, y) => y.created.localeCompare(x.created));

  return json({ totals, days, recent, top, countries, feedback, storageLimit: 1024 ** 3 }, 200, {
    'cache-control': 'no-store',
  });
}

// Zamanlama saldırılarına karşı sabit süreli karşılaştırma
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return crypto.subtle.timingSafeEqual(ha, hb);
}

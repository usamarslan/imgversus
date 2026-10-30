import { ID_RE, bearer, json, sameSecret, track } from '../../lib/shared.js';
import { deleteAlbum } from '../../lib/storage.js';

// Yönetici özeti (/admin sayfası için). Sadece doğru ADMIN_KEY ile açılır; anahtar Cloudflare'da gizli değişken olarak durur.
export async function onRequestGet({ request, env }) {
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401);

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const all = (sql, ...args) => env.STATS.prepare(sql).bind(...args).all().then((r) => r.results);

  const [[totals], days, recent, top, countries] = await Promise.all([
    all(`SELECT SUM(type = 'upload') AS albums,
                SUM(CASE WHEN type = 'upload' THEN images ELSE 0 END) AS images,
                SUM(CASE WHEN type = 'upload' THEN bytes WHEN type = 'delete' THEN -bytes ELSE 0 END) AS bytes,
                SUM(type = 'delete') AS deleted,
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

  // Ücretsiz depolama: KV 1 GB, R2 10 GB (fazlası GB başına aylık ~0,015 $)
  const storageLimit = env.BUCKET ? 10 * 1024 ** 3 : 1024 ** 3;
  return json({ totals, days, recent, top, countries, feedback, storageLimit, storage: env.BUCKET ? 'R2' : 'KV' }, 200, {
    'cache-control': 'no-store',
  });
}

// Bir karşılaştırmayı ve resimlerini kalıcı olarak siler: DELETE /api/admin?album=<id>
// İstatistik satırları kalır, yönetici sayfasında "silinmiş" olarak görünür.
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401);
  const id = new URL(request.url).searchParams.get('album') || '';
  if (!ID_RE.test(id)) return json({ error: 'bad' }, 400);

  const album = await env.IMAGES.get(`album:${id}`, 'json');
  if (!album) return json({ error: 'notfound' }, 404);
  await deleteAlbum(env, id, album);
  track(context, 'delete', { album: id, images: album.images.length, bytes: album.images.reduce((s, im) => s + (im.size || 0), 0) });
  return json({ ok: true, deleted: id });
}

async function authorized(request, env) {
  return !!env.ADMIN_KEY && (await sameSecret(bearer(request), env.ADMIN_KEY));
}

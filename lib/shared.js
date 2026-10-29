export const MAX_FILES = 12;
export const MAX_SIZE = 20 * 1024 * 1024; // KV tek değer sınırı 25 MiB
export const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/bmp'];
export const ID_RE = /^[A-Za-z0-9]{4,32}$/;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export function newId(len = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

// İstatistik kaydı: isteği bekletmeden arka planda D1'e yazar; STATS bağlı değilse hiçbir şey yapmaz.
export function track(context, type, data = {}) {
  const db = context.env.STATS;
  if (!db) return;
  const insert = db
    .prepare('INSERT INTO events (ts, type, album, images, bytes, country) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(Date.now(), type, data.album ?? null, data.images ?? 0, data.bytes ?? 0, context.request.cf?.country ?? null)
    .run()
    .catch(() => {});
  context.waitUntil(insert);
}

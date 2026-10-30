import { ID_RE, bearer, json, sameSecret, sha256Hex, track } from '../../../lib/shared.js';
import { deleteAlbum } from '../../../lib/storage.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  if (!ID_RE.test(params.id)) return json({ error: 'notfound' }, 404);
  const album = await env.IMAGES.get(`album:${params.id}`, 'json');
  if (!album) return json({ error: 'notfound' }, 404);
  track(context, 'view', { album: params.id, images: album.images.length });
  return json(
    { title: album.title, images: album.images.map(({ name }) => ({ name })) },
    200,
    { 'cache-control': 'public, max-age=60' }
  );
}

// Yükleyen başlığı ve resim isimlerini düzeltir: PATCH /api/album/<id>  { title, names: [...] }
export async function onRequestPatch(context) {
  const { request, params, env } = context;
  const album = await ownedAlbum(request, env, params.id);
  if (album instanceof Response) return album;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad' }, 400);
  }
  const names = Array.isArray(body.names) ? body.names : [];
  if (names.length !== album.images.length) return json({ error: 'bad' }, 400);

  album.title = String(body.title ?? '').trim().slice(0, 120);
  album.images.forEach((im, i) => {
    im.name = String(names[i] ?? '').trim().slice(0, 80) || `Image ${i + 1}`;
  });
  await env.IMAGES.put(`album:${params.id}`, JSON.stringify(album));
  return json({ title: album.title, images: album.images.map(({ name }) => ({ name })) });
}

// Yükleyen kıyası ve tüm resimlerini kalıcı olarak siler: DELETE /api/album/<id>
export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const album = await ownedAlbum(request, env, params.id);
  if (album instanceof Response) return album;

  await deleteAlbum(env, params.id, album);
  track(context, 'delete', { album: params.id, images: album.images.length, bytes: album.images.reduce((s, im) => s + (im.size || 0), 0) });
  return json({ ok: true });
}

// Albümü yalnızca yükleyenin anahtarı doğruysa döndürür; değilse hata yanıtı döner
async function ownedAlbum(request, env, id) {
  if (!ID_RE.test(id)) return json({ error: 'notfound' }, 404);
  const album = await env.IMAGES.get(`album:${id}`, 'json');
  if (!album) return json({ error: 'notfound' }, 404);
  const token = bearer(request);
  if (!album.owner || !token || !(await sameSecret(await sha256Hex(token), album.owner))) {
    return json({ error: 'forbidden' }, 403);
  }
  return album;
}

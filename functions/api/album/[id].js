import { ID_RE, json } from '../../../lib/shared.js';

export async function onRequestGet({ params, env }) {
  if (!ID_RE.test(params.id)) return json({ error: 'Bulunamadı.' }, 404);
  const album = await env.IMAGES.get(`album:${params.id}`, 'json');
  if (!album) return json({ error: 'Bulunamadı.' }, 404);
  return json(
    { title: album.title, images: album.images.map(({ name }) => ({ name })) },
    200,
    { 'cache-control': 'public, max-age=300' }
  );
}

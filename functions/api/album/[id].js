import { ID_RE, json, track } from '../../../lib/shared.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  if (!ID_RE.test(params.id)) return json({ error: 'notfound' }, 404);
  const album = await env.IMAGES.get(`album:${params.id}`, 'json');
  if (!album) return json({ error: 'notfound' }, 404);
  track(context, 'view', { album: params.id, images: album.images.length });
  return json(
    { title: album.title, images: album.images.map(({ name }) => ({ name })) },
    200,
    { 'cache-control': 'public, max-age=300' }
  );
}

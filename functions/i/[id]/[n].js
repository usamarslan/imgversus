import { ID_RE, TYPES } from '../../../lib/shared.js';
import { getImage } from '../../../lib/storage.js';

export async function onRequestGet({ params, env }) {
  if (!ID_RE.test(params.id) || !/^\d{1,2}$/.test(params.n)) return new Response('Not found', { status: 404 });
  const image = await getImage(env, `img:${params.id}:${params.n}`);
  if (!image) return new Response('Not found', { status: 404 });
  const type = TYPES.includes(image.type) ? image.type : 'application/octet-stream';
  return new Response(image.body, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}

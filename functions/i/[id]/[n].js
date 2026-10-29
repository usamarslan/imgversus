import { ID_RE, TYPES } from '../../../lib/shared.js';

export async function onRequestGet({ params, env }) {
  if (!ID_RE.test(params.id) || !/^\d{1,2}$/.test(params.n)) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.IMAGES.getWithMetadata(`img:${params.id}:${params.n}`, 'stream');
  if (!value) return new Response('Not found', { status: 404 });
  const type = TYPES.includes(metadata?.type) ? metadata.type : 'application/octet-stream';
  return new Response(value, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}

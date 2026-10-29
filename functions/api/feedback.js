import { json, newId } from '../../lib/shared.js';

// Geri bildirimler KV'de "feedback:<tarih>:<id>" anahtarıyla saklanır; "npm run feedback" ile okunur.
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad' }, 400);
  }
  // Tuzak alan doluysa bottur: başarılı gibi davran ama kaydetme
  if (body.website) return json({ ok: true });

  const message = String(body.message || '').trim().slice(0, 4000);
  if (message.length < 2) return json({ error: 'bad' }, 400);

  const entry = {
    message,
    email: String(body.email || '').trim().slice(0, 200),
    lang: String(body.lang || '').slice(0, 10),
    country: request.cf?.country || '',
    userAgent: (request.headers.get('user-agent') || '').slice(0, 300),
    created: new Date().toISOString(),
  };
  await env.IMAGES.put(`feedback:${entry.created}:${newId(6)}`, JSON.stringify(entry));
  return json({ ok: true });
}

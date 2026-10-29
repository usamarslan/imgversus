import { MAX_FILES, MAX_SIZE, TYPES, json, newId } from '../../lib/shared.js';

// Hatalar dil bağımsız kodlarla döner; mesajı tarayıcı kullanıcının dilinde gösterir.
export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'bad' }, 400);
  }

  const files = form.getAll('files').filter((f) => typeof f !== 'string');
  const names = form.getAll('names').map(String);
  const title = String(form.get('title') || '').trim().slice(0, 120);

  if (files.length < 2) return json({ error: 'min' }, 400);
  if (files.length > MAX_FILES) return json({ error: 'max', n: MAX_FILES }, 400);
  for (const f of files) {
    if (!TYPES.includes(f.type)) return json({ error: 'type', name: f.name }, 400);
    if (f.size > MAX_SIZE) return json({ error: 'size', name: f.name }, 400);
  }

  let id = newId();
  while (await env.IMAGES.get(`album:${id}`)) id = newId();

  const images = files.map((f, i) => ({
    name: (names[i] || '').trim().slice(0, 80) || `Image ${i + 1}`,
    type: f.type,
    size: f.size,
  }));

  await Promise.all(
    files.map(async (f, i) =>
      env.IMAGES.put(`img:${id}:${i}`, await f.arrayBuffer(), { metadata: { type: f.type } })
    )
  );
  await env.IMAGES.put(`album:${id}`, JSON.stringify({ title, images, created: Date.now() }));

  return json({ id });
}

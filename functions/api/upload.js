import { MAX_FILES, MAX_SIZE, TYPES, json, newId, newToken, sha256Hex, sniffType, track } from '../../lib/shared.js';
import { putImage } from '../../lib/storage.js';

// Hatalar dil bağımsız kodlarla döner; mesajı tarayıcı kullanıcının dilinde gösterir.
export async function onRequestPost(context) {
  const { request, env } = context;
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
    if (f.size > MAX_SIZE) return json({ error: 'size', name: f.name }, 400);
  }

  // Tür, dosyanın içeriğinden belirlenir; içi desteklenen bir resim değilse yükleme reddedilir
  const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
  const types = buffers.map(sniffType);
  const bad = types.findIndex((type) => !TYPES.includes(type));
  if (bad !== -1) return json({ error: 'type', name: files[bad].name }, 400);

  let id = newId();
  while (await env.IMAGES.get(`album:${id}`)) id = newId();

  const images = files.map((f, i) => ({
    name: (names[i] || '').trim().slice(0, 80) || `Image ${i + 1}`,
    type: types[i],
    size: f.size,
  }));

  await Promise.all(buffers.map((buf, i) => putImage(env, `img:${id}:${i}`, buf, types[i])));
  const token = newToken();
  const owner = await sha256Hex(token);
  await env.IMAGES.put(`album:${id}`, JSON.stringify({ title, images, created: Date.now(), owner }));
  track(context, 'upload', { album: id, images: files.length, bytes: files.reduce((s, f) => s + f.size, 0) });

  return json({ id, token });
}

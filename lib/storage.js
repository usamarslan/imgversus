// Resim depolama: R2 bağlıysa (BUCKET) yeni resimler oraya yazılır, değilse KV'ye (IMAGES).
// Okurken önce R2'ye, bulamazsa KV'ye bakılır; böylece R2'ye geçince eski linkler de çalışır.

export async function putImage(env, key, data, type) {
  if (env.BUCKET) return env.BUCKET.put(key, data, { httpMetadata: { contentType: type } });
  return env.IMAGES.put(key, data, { metadata: { type } });
}

export async function getImage(env, key) {
  if (env.BUCKET) {
    const obj = await env.BUCKET.get(key);
    if (obj) return { body: obj.body, type: obj.httpMetadata?.contentType };
  }
  const { value, metadata } = await env.IMAGES.getWithMetadata(key, 'stream');
  return value ? { body: value, type: metadata?.type } : null;
}

// Resmi her iki depodan da siler (hangisinde olduğu fark etmez)
export async function deleteImage(env, key) {
  await Promise.all([env.BUCKET?.delete(key), env.IMAGES.delete(key)]);
}

// Kıyası ve tüm resimlerini kalıcı olarak siler
export async function deleteAlbum(env, id, album) {
  await Promise.all(album.images.map((_, i) => deleteImage(env, `img:${id}:${i}`)));
  await env.IMAGES.delete(`album:${id}`);
}

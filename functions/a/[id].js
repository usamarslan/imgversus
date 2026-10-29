import { ID_RE } from '../../lib/shared.js';

// /a/<id> paylaşım linkleri aynı tek sayfalık uygulamayı açar; albümü app.js yükler.
// Reddit, Discord gibi yerlerde önizleme çıksın diye başlık ve ilk resim sayfanın meta etiketlerine yazılır.
export async function onRequestGet({ request, env, params }) {
  const page = await env.ASSETS.fetch(new URL('/', request.url));
  if (!ID_RE.test(params.id)) return page;

  const album = await env.IMAGES.get(`album:${params.id}`, 'json');
  if (!album) return page;

  const url = `https://imgversus.com/a/${params.id}`;
  const names = album.images.map((im) => im.name).join(' vs ');
  const title = album.title ? `${album.title} – imgversus` : `${names} – imgversus`;
  const description = album.title ? `${names} · ${album.images.length} images compared on imgversus` : `${album.images.length} images compared on imgversus`;
  const meta = {
    'og:url': url,
    'og:title': title,
    'og:description': description,
    'og:image': `https://imgversus.com/i/${params.id}/0`,
  };

  return new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(title) })
    .on('link[rel="canonical"]', { element: (el) => el.setAttribute('href', url) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute('content', description) })
    .on('meta[property^="og:"]', {
      element: (el) => {
        const value = meta[el.getAttribute('property')];
        if (value) el.setAttribute('content', value);
      },
    })
    .transform(page);
}

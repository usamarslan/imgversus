import { ID_RE } from '../../lib/shared.js';

// /a/<id> (ve /a/<id>/2/4) paylaşım linkleri aynı tek sayfalık uygulamayı açar; albümü app.js yükler.
// Reddit, Discord gibi yerlerde önizleme çıksın diye başlık ve ilk resim sayfanın meta etiketlerine yazılır.
export async function onRequestGet({ request, env, params }) {
  const page = await env.ASSETS.fetch(new URL('/', request.url));
  if (!ID_RE.test(params.id)) return page;

  const album = await env.IMAGES.get(`album:${params.id}`, 'json');
  if (!album) return page;

  const base = `https://imgversus.com/a/${params.id}`;
  // /a/<id>/2/4: önizleme o iki resmi anlatsın (numaralar 1'den başlar)
  const x = +params.x - 1, y = +params.y - 1;
  const pair = params.x && x !== y && album.images[x] && album.images[y] ? [x, y] : null;
  const url = pair ? `${base}/${x + 1}/${y + 1}` : base;
  const names = (pair ? pair.map((i) => album.images[i]) : album.images).map((im) => im.name).join(' vs ');
  const title = album.title ? `${album.title} – imgversus` : `${names} – imgversus`;
  const description = pair
    ? `${names} · compared on imgversus`
    : album.title ? `${names} · ${album.images.length} images compared on imgversus` : `${album.images.length} images compared on imgversus`;
  const meta = {
    'og:url': url,
    'og:title': pair && album.title ? `${album.title}: ${names} – imgversus` : title,
    'og:description': description,
    'og:image': `https://imgversus.com/i/${params.id}/${pair ? pair[0] : 0}`,
  };

  return new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(title) })
    .on('link[rel="canonical"]', { element: (el) => el.setAttribute('href', base) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute('content', description) })
    .on('meta[property^="og:"]', {
      element: (el) => {
        const value = meta[el.getAttribute('property')];
        if (value) el.setAttribute('content', value);
      },
    })
    .transform(page);
}

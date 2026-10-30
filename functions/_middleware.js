import { version } from '../package.json';

// Tek adres: imgversus.pages.dev ve www.imgversus.com istekleri kalıcı olarak imgversus.com'a yönlenir.
// Önizleme adresleri (ör. abc123.imgversus.pages.dev) ve yerel geliştirme olduğu gibi kalır.
const CANONICAL = 'imgversus.com';
const REDIRECT_HOSTS = ['imgversus.pages.dev', 'www.imgversus.com'];

// Tarayıcı .js ve .css dosyalarını 4 saat önbellekte tutuyor; HTML ise her seferinde yenileniyor.
// HTML'deki bu dosyaların adresine sürümü ekliyoruz (/app.js?v=1.3.1), yeni sürümde tarayıcı eskisini kullanmasın.
const versioned = (attr) => ({
  element(el) {
    const value = el.getAttribute(attr);
    if (value && /^\/[^?#]+\.(js|css)$/.test(value)) el.setAttribute(attr, `${value}?v=${version}`);
  },
});

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (REDIRECT_HOSTS.includes(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    url.protocol = 'https:';
    url.hostname = CANONICAL;
    return Response.redirect(url.toString(), 301);
  }
  const res = await next();
  if (!(res.headers.get('content-type') || '').startsWith('text/html')) return res;
  return new HTMLRewriter()
    .on('script[src]', versioned('src'))
    .on('link[rel="stylesheet"][href]', versioned('href'))
    .transform(res);
}

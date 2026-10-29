// Tek adres: imgversus.pages.dev ve www.imgversus.com istekleri kalıcı olarak imgversus.com'a yönlenir.
// Önizleme adresleri (ör. abc123.imgversus.pages.dev) ve yerel geliştirme olduğu gibi kalır.
const CANONICAL = 'imgversus.com';
const REDIRECT_HOSTS = ['imgversus.pages.dev', 'www.imgversus.com'];

export function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (REDIRECT_HOSTS.includes(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    url.protocol = 'https:';
    url.hostname = CANONICAL;
    return Response.redirect(url.toString(), 301);
  }
  return next();
}

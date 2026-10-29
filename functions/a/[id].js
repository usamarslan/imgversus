// /a/<id> paylaşım linkleri aynı tek sayfalık uygulamayı açar; albümü app.js yükler.
export function onRequestGet({ request, env }) {
  return env.ASSETS.fetch(new URL('/', request.url));
}

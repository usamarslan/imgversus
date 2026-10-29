// Sürüm numarasını, CHANGELOG'u ve site haritasını siteye yazar. "npm run dev" ve "npm run deploy" öncesi otomatik çalışır.
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

fs.writeFileSync(new URL('public/meta.js', root), `const APP_VERSION = '${version}';\n`);
fs.copyFileSync(new URL('CHANGELOG.md', root), new URL('public/changelog.md', root));
fs.writeFileSync(
  new URL('public/sitemap.xml', root),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://imgversus.com/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>https://imgversus.com/changelog</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>
</urlset>
`
);
console.log(`imgversus v${version}`);

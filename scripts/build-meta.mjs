// Sürüm numarasını ve CHANGELOG'u siteye kopyalar. "npm run dev" ve "npm run deploy" öncesi otomatik çalışır.
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', root), 'utf8'));

fs.writeFileSync(new URL('public/meta.js', root), `const APP_VERSION = '${version}';\n`);
fs.copyFileSync(new URL('CHANGELOG.md', root), new URL('public/changelog.md', root));
console.log(`imgversus v${version}`);

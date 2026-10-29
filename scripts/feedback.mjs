// Gelen geri bildirimleri listeler: "npm run feedback" (yerel test için: "npm run feedback -- --local")
import { execFileSync } from 'node:child_process';

const where = process.argv.includes('--local') ? '--local' : '--remote';
const wrangler = (...args) =>
  execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--binding', 'IMAGES', where], { encoding: 'utf8' });

const keys = JSON.parse(wrangler('list', '--prefix', 'feedback:'));
if (!keys.length) {
  console.log('Henüz geri bildirim yok.');
  process.exit(0);
}
for (const { name } of keys.sort((a, b) => b.name.localeCompare(a.name))) {
  const fb = JSON.parse(wrangler('get', name, '--text'));
  console.log('─'.repeat(60));
  console.log(`${fb.created}  ${fb.email || '(e-posta yok)'}  [${fb.lang}${fb.country ? ', ' + fb.country : ''}]`);
  console.log(fb.message);
}
console.log('─'.repeat(60));
console.log(`Toplam: ${keys.length}`);

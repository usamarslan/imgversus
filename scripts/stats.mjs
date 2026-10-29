// Kullanım istatistiklerini gösterir: "npm run stats" (yerel test için: "npm run stats -- --local")
import { execFileSync } from 'node:child_process';

const where = process.argv.includes('--local') ? '--local' : '--remote';

function query(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'imgversus-stats', where, '--json', '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  );
  return JSON.parse(out)[0].results;
}

const DAY = 24 * 60 * 60 * 1000;
const since = (days) => Date.now() - days * DAY;
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';

const [total] = query(`
  SELECT
    SUM(type = 'upload') AS albums,
    SUM(CASE WHEN type = 'upload' THEN images ELSE 0 END) AS images,
    SUM(CASE WHEN type = 'upload' THEN bytes ELSE 0 END) AS bytes,
    SUM(type = 'view') AS views,
    SUM(type = 'feedback') AS feedback
  FROM events`);

console.log('\nimgversus – toplam');
console.log(`  Karşılaştırma (link): ${total.albums ?? 0}`);
console.log(`  Yüklenen resim:       ${total.images ?? 0}  (${mb(total.bytes ?? 0)})`);
console.log(`  Link görüntülenme:    ${total.views ?? 0}`);
console.log(`  Geri bildirim:        ${total.feedback ?? 0}`);

const days = query(`
  SELECT date(ts / 1000, 'unixepoch') AS day,
         SUM(type = 'upload') AS albums,
         SUM(type = 'view') AS views
  FROM events WHERE ts > ${since(14)}
  GROUP BY day ORDER BY day DESC`);
console.log('\nSon 14 gün (gün / yeni link / görüntülenme)');
if (!days.length) console.log('  Henüz kayıt yok.');
for (const d of days) console.log(`  ${d.day}   ${String(d.albums).padStart(4)}   ${String(d.views).padStart(6)}`);

const top = query(`
  SELECT album, COUNT(*) AS views FROM events
  WHERE type = 'view' AND ts > ${since(30)}
  GROUP BY album ORDER BY views DESC LIMIT 10`);
if (top.length) {
  console.log('\nEn çok görüntülenen linkler (son 30 gün)');
  for (const t of top) console.log(`  ${String(t.views).padStart(6)}  https://imgversus.pages.dev/a/${t.album}`);
}

const countries = query(`
  SELECT country, COUNT(*) AS n FROM events
  WHERE type = 'view' AND ts > ${since(30)} AND country IS NOT NULL
  GROUP BY country ORDER BY n DESC LIMIT 10`);
if (countries.length) {
  console.log('\nGörüntülenmelerin geldiği ülkeler (son 30 gün)');
  console.log('  ' + countries.map((c) => `${c.country} ${c.n}`).join(' · '));
}
console.log('');

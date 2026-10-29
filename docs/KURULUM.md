# imgversus – Türkçe kurulum ve bakım rehberi

Bu dosya projeyi kendin yayınlamak ve güncellemek için. Ziyaretçilere yönelik tanıtım İngilizce olarak ana README.md dosyasında.

## Özellikler

- Sürükle-bırak, dosya seçme veya Ctrl+V ile resim ekleme; isim verme, sıralama, kaldırma
- Yüklemeden önce **Önizle** (resimler hiçbir yere gitmez)
- Kaydırıcı: sürükle / tıkla, ←/→ (Shift ile büyük adım)
- Alternatif **Tıkla-geç** modu: resme her tıklamada (veya `Space`) iki resim arasında geçiş. Modlar arasında `M` ile geçilir; varsayılan kaydırıcı
- Tam ekran: ⛶ butonu veya `F` (iPhone Safari tam ekranı desteklemediği için orada buton gizlenir)
- Sol üst ve sağ üst köşede resim seçici (2'den fazla resim varsa aralarında geçiş)
- Klavye: `1`–`9` sağ resmi, `Shift`+`1`–`9` sol resmi seçer, `S` yer değiştirir
- Fare tekerleği / iki parmakla yakınlaştırma, yakınken sürükleyerek kaydırma, çift tık = yakınlaştır/sıfırla, `0` sıfırla
- Yüksek yakınlaştırmada piksel piksel (bulanıklaştırmadan) gösterim
- Resimler yeniden sıkıştırılmaz, orijinal haliyle saklanır
- Mobil uyumlu
- 18 dil: English, Türkçe, Deutsch, Français, Español, Italiano, Português, Nederlands, Polski, Русский, Українська, العربية (sağdan sola), हिन्दी, Bahasa Indonesia, Tiếng Việt, 日本語, 한국어, 中文. Tarayıcının/sistemin dili otomatik seçilir, desteklenmiyorsa İngilizce açılır. Ana sayfadaki menüden seçilen dil tarayıcıda hatırlanır.
- Ana sayfa alt bilgisinde GitHub, GitHub Sponsors, geri bildirim formu ve "Hata bildir" (GitHub Issues) linkleri

## Geri bildirimleri okuma

Sitedeki form mesajları Cloudflare KV'ye kaydeder (anahtar: `feedback:<tarih>:<id>`). Hepsini terminalde görmek için:

```bash
npm run feedback
```

Ya da Cloudflare panelinde: Storage & Databases → KV → IMAGES → `feedback:` ile başlayan anahtarlar.

## Kullanım istatistikleri

Her yeni link, her link açılışı ve her geri bildirim Cloudflare D1 veritabanına (`imgversus-stats`) bir satır olarak yazılır. Kişisel veri tutulmaz, sadece zaman, link kimliği, resim sayısı/boyutu ve ülke kodu. Özet görmek için:

```bash
npm run stats
```

Toplam link, resim, görüntülenme; son 14 günün dökümü; en çok açılan linkler ve ülkeler listelenir. Kod açık kaynak olsa da veriler senin Cloudflare hesabında durur, başkası göremez.

**Sayfa görüntülenmeleri** (kaç kişi siteye girdi, nereden geldi) için Cloudflare Web Analytics'i aç: Cloudflare paneli → Workers & Pages → imgversus → **Metrics** → Web Analytics → **Enable**. Ücretsiz, çerez kullanmaz.

## Resim depolama: KV ve R2

Resimler şu an KV'de (ücretsiz 1 GB). 4K oyun ekran görüntüleri tanesi 5–15 MB olabildiği için bu alan hızlı dolabilir. Cloudflare R2 10 GB'a kadar ücretsiz, sonrası GB başına ayda yaklaşık 0,015 $; ama R2'yi açmak için hesapta kayıtlı bir ödeme yöntemi gerekiyor.

R2'ye geçmek için:
1. Cloudflare panelinde R2'yi etkinleştir (kart ekli olmalı).
2. `npx wrangler r2 bucket create imgversus-images`
3. `wrangler.toml` içindeki `[[r2_buckets]]` satırlarının başındaki `#` işaretlerini kaldır.
4. Yeni sürüm olarak yayınla. Yeni resimler R2'ye gider, eski linkler KV'den okunmaya devam eder.

## Bağış (GitHub Sponsors)

"Destek ol" linki `https://github.com/sponsors/usamarslan` adresine gider. Linkin çalışması için https://github.com/sponsors adresinden GitHub Sponsors'a başvurup profilini onaylatman gerekiyor.

## Yapı

```
public/           Statik site (index.html, app.js, style.css)
  i18n.js             Çeviriler ve dil algılama (yeni dil eklemek için LANGS + STRINGS)
functions/        Cloudflare Pages Functions (sunucu tarafı)
  api/upload.js       POST /api/upload  → resimleri KV'ye kaydeder, id döner
  api/feedback.js     POST /api/feedback → geri bildirimi KV'ye kaydeder
  api/album/[id].js   GET  /api/album/:id → başlık + resim isimleri
  i/[id]/[n].js       GET  /i/:id/:n     → resmin kendisi
  a/[id].js           GET  /a/:id        → paylaşım sayfası
lib/shared.js     Ortak sabitler, yardımcılar ve istatistik kaydı
lib/storage.js    Resim okuma/yazma (R2 varsa R2, yoksa KV)
migrations/       İstatistik veritabanı tabloları (D1)
scripts/feedback.mjs  Geri bildirimleri listeler (npm run feedback)
scripts/stats.mjs     Kullanım istatistiklerini gösterir (npm run stats)
wrangler.toml     Cloudflare ayarları (KV, D1, R2 bağlantıları)
```

## Ücretsiz yayınlama (Cloudflare Pages + KV)

Kredi kartı gerekmez. Adres `https://<proje-adı>.pages.dev` olur.

1. **Cloudflare hesabı aç** (ücretsiz): https://dash.cloudflare.com/sign-up
2. **Node.js kur** (LTS sürümü): https://nodejs.org
3. Bu klasörde terminal aç ve bağımlılıkları kur:
   ```bash
   npm install
   ```
4. Cloudflare'a giriş yap (tarayıcı açılır):
   ```bash
   npx wrangler login
   ```
5. Resimlerin saklanacağı KV alanını oluştur:
   ```bash
   npx wrangler kv namespace create IMAGES
   ```
   Çıktıdaki `id = "..."` değerini `wrangler.toml` içindeki KV `id` satırına yapıştır.
6. İstatistik veritabanını oluştur ve tablolarını kur:
   ```bash
   npx wrangler d1 create imgversus-stats
   npx wrangler d1 migrations apply imgversus-stats --remote
   ```
   İlk komutun verdiği `database_id` değerini `wrangler.toml`'a yaz.
7. Yayınla:
   ```bash
   npm run deploy
   ```
   İlk seferde proje adı sorar (ör. `imgversus`). Bitince sana `https://imgversus.pages.dev` gibi bir adres verir.

Sonraki güncellemeler için sadece `npm run deploy` yeterli.

### Yerelde çalıştırma

```bash
npm run dev
```
http://localhost:8788 adresinde açılır. Yerelde KV taklit edilir, Cloudflare hesabı gerekmez.

## Ücretsiz katman sınırları (yaklaşık)

| Kaynak | Ücretsiz sınır | Bu sitede ne demek |
|---|---|---|
| KV depolama | 1 GB | Toplam yüklenen resim boyutu |
| KV yazma | 1.000 / gün | Her karşılaştırma = resim sayısı + 1 yazma (≈ günde 250–300 karşılaştırma) |
| KV okuma | 100.000 / gün | Her resim görüntüleme 1 okuma (tarayıcı önbelleğe alır) |
| Functions istekleri | 100.000 / gün | API + resim istekleri |
| Statik dosyalar | Sınırsız | index.html, css, js |

Kişisel kullanım ve arkadaş çevresi için fazlasıyla yeterli. Büyürse:
- Resimleri **Cloudflare R2**'ye taşımak (10 GB ücretsiz, ama hesaba kart eklemek gerekir)
- Sınırı aşınca Workers Paid planı: aylık 5$

## Kendi alan adın (isteğe bağlı)

Site `imgversus.com` adresinde yayında (Cloudflare Registrar, yıllık ~10,5 $, otomatik yenileme açık olmalı). `imgversus.pages.dev` ve `www.imgversus.com` adresleri `functions/_middleware.js` ile kalıcı olarak `imgversus.com`a yönlendirilir. Not: Türkiye’de bazı internet sağlayıcıları `*.pages.dev` adreslerini engelliyor; kendi alan adı bundan etkilenmez.

## Herkese açık yaparken dikkat

- Herkes resim yükleyebilir. Kötüye kullanımı (spam, yasa dışı içerik) önlemek için ileride ücretsiz **Cloudflare Turnstile** (CAPTCHA) eklenebilir.
- Şu an silme / süre sonu yok; resimler kalıcı. İstenirse yükleyene özel silme linki ya da X gün sonra otomatik silme (KV `expirationTtl`) eklenebilir.

## Yeni sürüm yayınlama

Her güncellemede sürüm numarası artar ve CHANGELOG.md'ye not düşülür. Sürüm numarası sitenin alt kısmında görünür, tıklayınca değişiklik listesi açılır.

- Varsayılan: her güncellemede son rakam artar (1.2.1 → 1.2.2) → `npm version patch`. x.y.9’dan sonra ortadaki rakam artar (1.2.9 → 1.3.0) → `npm version minor`
- İlk ya da ortadaki rakam sadece sen istediğinde değişir

Adımlar:

1. `CHANGELOG.md`'nin en üstüne yeni sürümün başlığını ve maddelerini yaz, kaydet ve commit'le.
2. Sürümü artır (package.json'u günceller, commit ve `v1.1.0` gibi bir etiket oluşturur):
   ```bash
   npm version minor
   ```
3. GitHub'a gönder:
   ```bash
   git push --follow-tags
   ```
4. Siteyi güncelle:
   ```bash
   npm run deploy
   ```
5. GitHub'da sürüm sayfası (Releases) oluştur:
   ```bash
   gh release create v1.1.0 --title "v1.1.0" --notes "CHANGELOG'daki maddeler"
   ```

# imgversus – Claude için proje notları

Bu dosya, bu projede çalışan Claude oturumlarının kaldığı yerden devam edebilmesi için. Proje sahibi Üsame (GitHub: `usamarslan`). İlk sürümden 1.3.0'a kadar her şey başka bir Claude hesabında yapıldı, 1.3.1'den beri bu hesapta devam ediyor; kararlar aşağıda.

## Proje

- **Ne:** imgsli kapandıktan sonra yapılmış basit bir resim karşılaştırma sitesi. 2–12 resim yükle, kısa link al, tıkla-geç ya da kaydırıcıyla karşılaştır. Hesap yok.
- **Canlı:** https://imgversus.com (Cloudflare Pages projesi `imgversus`)
- **Repo:** https://github.com/usamarslan/imgversus (herkese açık, GitHub Sponsors için)
- **Kitle:** Oyun grafik karşılaştırması yapanlar (NeoGAF, Reddit r/FuckTAA, r/pcgaming, r/PS5). Kalite modu / performans modu, RT açık-kapalı gibi.
- Ziyaretçiye dönük metinler İngilizce (README, CHANGELOG, site varsayılanı). Türkçe kurulum rehberi `docs/KURULUM.md`.

## Üsame ile çalışırken

- **Türkçe konuş.** Teknik terimleri sade anlat; kod bilgisi sınırlı, kararları o veriyor.
- **Her mesajın sonuna `📣 Pazarlama hatırlatması` ekle** (SEO/pazarlama taktiği, kısa). Üsame "tamam daha hatırlatma" diyene kadar devam. Bu kuralı o söyleyene kadar kaldırma.
- **Site metinleri insan gibi yazılır:** birinci tekil şahıs, samimi, "ben yaptım" tonu. Yapay zekâ kokan kalıplar, abartılı pazarlama dili yok. CHANGELOG maddeleri de bu tonda.
- Dışarıya dönük ya da geri alınamaz işlerden önce sor (yeni repo, ödeme, hesap ayarı, canlı veriyi silme). Üsame "yap" dediyse commit, push ve deploy serbest.
- Sorulmadan özellik ekleme; öneriyi anlat, onay al, sonra yap.

## Sürüm kuralları (Üsame'nin kuralı)

- Her güncelleme yeni sürüm + `CHANGELOG.md` başına bir madde.
- Varsayılan: son rakam artar, `npm version patch` (1.2.5 → 1.2.6).
- x.y.9'dan sonra sormadan ortadaki rakam artar, `npm version minor` (1.2.9 → 1.3.0).
- İlk ya da ortadaki rakamı başka durumda sadece Üsame isterse değiştir.
- Sürüm sitenin altında görünür (`public/meta.js`'teki `APP_VERSION`), tıklayınca `/changelog` açılır.

## Yayınlama adımları

Node.js sistemde kurulu olmalı (`node -v`). Değilse nodejs.org'dan LTS kurulur, sonra `npm install`.

1. Değişikliği yap, yerelde test et: `npm run dev` → http://127.0.0.1:8788
2. `CHANGELOG.md` en üstüne `## <yeni sürüm> – <YYYY-MM-DD>` ve maddeler.
3. Commit (değişiklik + changelog).
4. `npm version patch -m "Release v%s"` (ya da `minor`). Bu commit ve `vX.Y.Z` etiketi oluşturur.
5. `git push origin HEAD --follow-tags`
6. `npm run deploy` (`predeploy` önce `scripts/build-meta.mjs` çalıştırır: `meta.js`, `changelog.md`, `sitemap.xml` üretir; bunlar git'e girmez).
7. Canlıda kontrol: `curl -s https://imgversus.com/meta.js` yeni sürümü göstermeli.
8. GitHub sürüm sayfası (Üsame'ye "her sürümde açılıyor" diye söz verildi, atlama): `gh release create vX.Y.Z --title vX.Y.Z --notes "<CHANGELOG maddeleri>"`. `gh` kurulu değilse tarayıcıdan `https://github.com/usamarslan/imgversus/releases/new?tag=vX.Y.Z&title=vX.Y.Z&body=<maddeler>` açıp Publish release (GitHub oturumu tarayıcıda açık).

Sadece CLAUDE.md, docs ya da `.gitignore` gibi siteyi değiştirmeyen düzenlemelerde sürüm artmaz, deploy gerekmez.

## Yapı

```
public/index.html        Tek sayfa: yükleme ekranı, ana sayfa örneği, görüntüleyici, geri bildirim ve düzenleme pencereleri
public/app.js            Tüm istemci kodu (yükleme, görüntüleyici, düzenleme penceresi, ana sayfa örneği)
public/i18n.js           18 dil (LANGS + STRINGS), dil algılama, data-i18n* öznitelikleri
public/style.css         Koyu tema; değişkenler :root'ta
public/admin.html        /admin: Üsame'nin istatistik ve silme sayfası (ADMIN_KEY ile)
public/changelog.html    /changelog: changelog.md'yi gösterir
public/sample/           Ana sayfa örneğinin 1920px kopyaları (asıl kıyas: /a/D5hMptW8)
functions/_middleware.js imgversus.pages.dev ve www → imgversus.com 301
functions/a/[id].js      /a/<id> sayfası + link önizleme (Open Graph) etiketleri
functions/a/[id]/[x]/[y].js  /a/<id>/2/4 ikili linkleri (aynı işleyici)
functions/api/upload.js  POST: dosya türünü içerikten bulur (sniffType), R2'ye yazar, {id, token} döner
functions/api/album/[id].js  GET albüm; PATCH (başlık/isim) ve DELETE yalnızca yükleyen anahtarıyla
functions/api/admin.js   GET istatistik, DELETE albüm (ADMIN_KEY)
functions/api/feedback.js POST geri bildirim → KV
functions/i/[id]/[n].js  Resmin kendisi (R2, yoksa KV), 1 yıl önbellek
lib/shared.js            Sabitler, json(), newId(), newToken(), sha256Hex(), sameSecret(), sniffType(), track()
lib/storage.js           putImage/getImage/deleteImage/deleteAlbum (R2 önce, KV yedek)
migrations/0001_events.sql  D1 events tablosu
scripts/                 build-meta.mjs, stats.mjs (npm run stats), feedback.mjs (npm run feedback)
```

## Veri

- **KV `IMAGES`:** `album:<id>` → `{ title, images: [{name, type, size}], created, owner }`. `owner` yükleyen anahtarının SHA-256'sı; 1.3.0'dan önceki albümlerde yok. `feedback:<iso>:<id>` geri bildirimler. Eski (R2 öncesi) resimler `img:<id>:<n>` olarak KV'de.
- **R2 `imgversus-images`:** `img:<id>:<n>` (1.2.4'ten beri tüm yeni resimler).
- **D1 `imgversus-stats`:** `events(ts, type, album, images, bytes, country)`; type: upload, view, feedback, delete. Kişisel veri yok.
- **Gizli:** `ADMIN_KEY` Cloudflare Pages secret'ı; yerel kopyası `.admin-key`. `.admin-key` ve `.dev.vars` dosyalarını okuma, yazdırma, commit'leme.

## Önemli davranışlar ve kararlar

- Varsayılan mod **tıkla-geç**; kaydırıcı ikinci mod (`M`). Tıkla-geç modunda resmin üstünde 48px boşluk var (`TOP_BAND`), resim adı orada kısa süre görünür.
- **1:1 (`N`)**: resim pikseli = fiziksel ekran pikseli, `devicePixelRatio` hesaba katılır, konum fiziksel piksele hizalanır. 1:1 üstünde yakınlaştırma tam katlarla (%200, %300) ve nearest ile; altında tarayıcının yumuşatması. Köşede ölçek etiketi hep görünür.
- **Tam ekran:** üst çubuk, seçiciler ve etiket boştayken gizlenir; fare en üste gelince görünür. Tarayıcı panelinde gerçek tam ekran açılmıyor, `document.fullscreenElement` taklit edilerek test edildi.
- **İkili linkler:** `/a/<id>/<n>/<m>` (1'den başlar). Seçim değişince adres `history.replaceState` ile güncellenir; 1'e karşı 2 sade `/a/<id>`.
- **Yükleyen düzenleme/silme:** yükleyince dönen anahtar tarayıcıda `localStorage['imgversus:owned']`'da durur, paylaşılan linkte yoktur. ✎ düğmesi sadece o tarayıcıda görünür. Eski albümleri Üsame `/admin`'den siler.
- Resimler yeniden sıkıştırılmaz; tür dosya adına değil içeriğe göre belirlenir.
- Linkler süresiz. Yeni metin eklerken **18 dilin hepsine** çeviri ekle (`aboutTitle/about1/about2` sadece en/tr, diğerleri İngilizceye düşer). Arapça RTL; `#stage` her zaman `direction: ltr`.
- Türkiye'de bazı internet sağlayıcıları `*.pages.dev`'i engelliyor; her zaman imgversus.com kullan.

## Cloudflare tarafı

- Hesap Üsame'nin. Alan adı Cloudflare Registrar'da, 29 Ekim 2027'ye kadar kayıtlı, otomatik yenileme açık.
- E-posta yönlendirme: `feedback@imgversus.com` → Üsame'nin kişisel adresi (Email Routing kuralı). Bu adresten cevap gönderme kurulmadı; formdan mesaj gelince e-posta bildirimi de yok (mesajlar sadece KV'de).
- R2 ücretli plan açık; 9 GB'ta fatura uyarısı kurulu (eşik bayt cinsinden: 9663676416; ücretsiz kota 10 GB).
- Cloudflare Web Analytics açık (31 Ekim 2026); Cloudflare çerezsiz ölçüm kodunu HTML'e kendisi ekliyor.
- Kod dosyaları (`app.js`, `style.css`, `meta.js`) tarayıcıda 4 saat önbellekte kalıyor (alan adının Browser Cache TTL ayarı); HTML her seferinde yenileniyor. 1.3.1'den beri `functions/_middleware.js` HTML'deki `.js`/`.css` adreslerine `?v=<package.json sürümü>` ekliyor, yeni sürümde tarayıcı taze dosyayı alıyor. Yeni bir `<script src>` ya da stylesheet eklerken `/` ile başlayan adres kullan ki sürüm eklensin.

## Test ederken

- Yerel sunucu: `npm run dev` (port 8788). Yerelde KV/R2/D1 taklit edilir, canlı veriye dokunmaz.
- Canlıda test verisi oluşturma; gerekirse sonradan temizle (`/admin` ya da wrangler).
- Görüntüleyicide klavye testi için olayı `#stage`'e gönder, `window`'a değil (`e.target.matches` hata verir).
- Telefon görünümünü de kontrol et (375px).

## Yapılacaklar / açık konular

- [ ] Görüntüleyicide isteğe bağlı Lanczos filtresi (sadece "ekrana sığdır" görünümü için; varsayılan değil, 1:1 asıl doğru görünüm).
- [ ] `docs/KURULUM.md` bazı yerlerde eski (varsayılan modu kaydırıcı diyor, silme yok diyor); güncellenmeli.
- [ ] **Lisans kararı:** repoda LICENSE yok (kod görünür ama yasal olarak kullanılamaz). v1.0'da MIT önerildi, karar verilmedi. Üsame şimdilik "böyle kalsın" dedi (AlternativeTo'da "Source available").
- [ ] Canlıda hiç uçtan uca denenmedi: yükleyenin ✎ ile düzenleme/silmesi ve adı .jpg olan PNG'nin PNG kaydedilmesi. İlk gerçek yüklemede kontrol et.
- [ ] İsteğe bağlı: hakkında metnini diğer 16 dile çevirmek; kötüye kullanıma karşı Turnstile; formdan mesaj gelince e-posta bildirimi; feedback@ adresinden cevap gönderebilme; ana sayfaya görünür bir "imgsli alternative" bölümü (önerildi, cevap bekliyor).
- [ ] Ertelendi: marka tescili (TÜRKPATENT sınıf 42, ~9.800 TL resmi harç; site tutarsa).

Bitenler (31 Ekim 2026): önbellek düzeltmesi (1.3.1), Search Console'da sitemap gönderildi (alan adı mülkü, TXT ile doğrulanmış), Web Analytics açıldı, GitHub Sponsors başvurusu yapıldı (GitHub onayı bekliyor), AlternativeTo'ya eklendi (normal onay sırasında; imgsli, imgico, Slowpoke Pics, Improve ImgSLI, JuxtaposeJS, BAGen, Image Comparison & Analysis Tool alternatif olarak bağlandı, onları da AlternativeTo onaylayacak). AlternativeTo'nun ücretli hızlı inceleme teklifi (19/29 $) kabul edilmedi.

## Pazarlama notları

Paylaşım fikirleri Üsame'nin masaüstündeki "imgversus post fikirleri.pdf" dosyasında. Öne çıkarılacaklar: imgsli alternatifi, sıkıştırmasız PNG, gerçek 1:1 tam ekran, belirli ikiliye link, hesap gerektirmemesi.

- En yakın rakip **imgico** (AlternativeTo'da kendini "imgsli'nin yerine geçen" diye tanıtıyor; 2–10 resim, kaydırıcı, kalıcı link). Farkımız: 1:1, sıkıştırmasız PNG, ikili link, 12 resim, 18 dil.
- Reddit'te "Full disclosure, it's mine" demek kuralı; gizli reklam yapma.
- AlternativeTo için ikon ve ekran görüntüleri Üsame'nin masaüstünde `imgversus-alternativeto/` klasöründe.
- İlk sürümden 1.3.0'a kadarki eski sohbetin dökümü proje klasöründe `imgversus sohbet geçmişi.pdf` (git dışında, kişisel; repoya girmemeli).

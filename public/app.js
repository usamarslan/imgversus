'use strict';

const $ = (sel) => document.querySelector(sel);

const MAX_FILES = 12;
const MAX_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL = 90 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/bmp'];
const FEEDBACK_EMAIL = 'feedback@imgversus.com';

let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// Bu tarayıcıdan yüklenen kıyasların gizli anahtarları: { albümId: anahtar }.
// Anahtar paylaşılan linkte yoktur; yalnızca onu bilen tarayıcı kıyası düzenleyip silebilir.
const owned = {
  all() { try { return JSON.parse(localStorage.getItem('imgversus:owned')) || {}; } catch { return {}; } },
  get(id) { return this.all()[id] || ''; },
  set(id, token) {
    const all = this.all();
    if (token) all[id] = token; else delete all[id];
    try { localStorage.setItem('imgversus:owned', JSON.stringify(all)); } catch {}
  },
};

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('copied'));
  } catch {
    window.prompt(t('copyPrompt'), text);
  }
}

// Sunucu hata kodlarını mesaja çevir
const SERVER_ERRORS = { type: 'errType', size: 'errSize', max: 'errMax', min: 'errMin', bad: 'errBad' };

/* ======================= Yükleme sayfası ======================= */

const items = []; // { file, name, url }

function addFiles(fileList) {
  const msg = $('#msg');
  msg.textContent = '';
  msg.className = 'msg';
  for (const file of fileList) {
    if (!TYPES.includes(file.type)) { msg.textContent = t('errType', { name: file.name }); continue; }
    if (file.size > MAX_SIZE) { msg.textContent = t('errSize', { name: file.name }); continue; }
    if (items.length >= MAX_FILES) { msg.textContent = t('errMax', { n: MAX_FILES }); break; }
    const base = (file.name || '').replace(/\.[^.]+$/, '');
    const name = base && base !== 'image' ? base : t('imageN', { n: items.length + 1 });
    items.push({ file, name: name.slice(0, 80), url: URL.createObjectURL(file) });
  }
  renderList();
}

function renderList() {
  const list = $('#list');
  list.replaceChildren();
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'item';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.style.backgroundImage = `url("${item.url}")`;
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = i + 1;
    thumb.append(num);

    const name = document.createElement('input');
    name.className = 'name';
    name.value = item.name;
    name.maxLength = 80;
    name.setAttribute('aria-label', t('imageNameAria', { n: i + 1 }));
    name.addEventListener('input', () => { item.name = name.value; });

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = formatSize(item.file.size);

    const tools = document.createElement('div');
    tools.className = 'tools';
    const mk = (label, title, fn, disabled, cls) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.disabled = disabled;
      if (cls) b.className = cls;
      b.addEventListener('click', fn);
      tools.append(b);
    };
    // Sağdan sola dillerde liste ters aktığı için okları da çevir
    const rtl = document.documentElement.dir === 'rtl';
    mk(rtl ? '▶' : '◀', t(rtl ? 'moveRight' : 'moveLeft'), () => move(i, -1), i === 0);
    mk(rtl ? '◀' : '▶', t(rtl ? 'moveLeft' : 'moveRight'), () => move(i, 1), i === items.length - 1);
    mk('✕', t('remove'), () => {
      URL.revokeObjectURL(item.url);
      items.splice(i, 1);
      renderList();
    }, false, 'del');

    li.append(thumb, name, meta, tools);
    list.append(li);
  });

  const enough = items.length >= 2;
  $('#preview').disabled = !enough;
  $('#publish').disabled = !enough;
}

function move(i, dir) {
  const j = i + dir;
  [items[i], items[j]] = [items[j], items[i]];
  renderList();
}

function currentImages() {
  return items.map((it, i) => ({ src: it.url, name: it.name.trim() || t('imageN', { n: i + 1 }) }));
}

function publish() {
  const total = items.reduce((s, it) => s + it.file.size, 0);
  const msg = $('#msg');
  if (total > MAX_TOTAL) {
    msg.textContent = t('errTotal');
    return;
  }
  const form = new FormData();
  form.append('title', $('#title').value.trim());
  items.forEach((it, i) => {
    form.append('files', it.file, it.file.name || `image-${i}`);
    form.append('names', it.name.trim() || t('imageN', { n: i + 1 }));
  });

  const progress = $('#progress');
  const bar = progress.querySelector('i');
  const pct = progress.querySelector('span');
  progress.hidden = false;
  bar.style.width = '0';
  pct.textContent = '0%';
  msg.textContent = '';
  $('#publish').disabled = $('#preview').disabled = true;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload');
  xhr.upload.onprogress = (e) => {
    if (!e.lengthComputable) return;
    const p = Math.round((e.loaded / e.total) * 100);
    bar.style.width = p + '%';
    pct.textContent = p + '%';
  };
  xhr.onload = () => {
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch {}
    if (xhr.status === 200 && data.id) {
      if (data.token) owned.set(data.id, data.token);
      location.assign(`/a/${data.id}?new=1`);
      return;
    }
    const key = SERVER_ERRORS[data.error];
    fail(key ? t(key, data) : t('errUpload', { status: xhr.status }));
  };
  xhr.onerror = () => fail(t('errNetwork'));
  xhr.send(form);

  function fail(text) {
    progress.hidden = true;
    msg.textContent = text;
    renderList();
  }
}

function initUpload() {
  const setTitle = () => { if (!$('#upload').hidden) document.title = `imgversus – ${t('appTitle')}`; };
  $('#upload').hidden = false;
  $('#viewer').hidden = true;
  setTitle();
  if (new URLSearchParams(location.search).has('deleted')) {
    history.replaceState(null, '', '/');
    toast(t('deleted'));
  }
  onLangChange(() => { setTitle(); renderList(); });

  const drop = $('#drop');
  const input = $('#file');
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
  // Sayfanın herhangi bir yerine bırakılan dosyalar da eklensin
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => { e.preventDefault(); if (!drop.contains(e.target)) addFiles(e.dataTransfer.files); });
  window.addEventListener('paste', (e) => {
    if ($('#upload').hidden) return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); addFiles(files); }
  });

  $('#preview').addEventListener('click', () => {
    viewer.open({ title: $('#title').value.trim(), images: currentImages() }, { local: true });
  });
  $('#publish').addEventListener('click', publish);
  initFeedback();
  initDemo();
  $('#v-back').addEventListener('click', () => {
    viewer.close();
    $('#upload').hidden = false;
    setTitle();
  });
  renderList();
}

/* ======================= Ana sayfa örneği ======================= */

// Örnek karşılaştırma: tıklayınca ya da Space'e basınca resim değişir. Kimse dokunmadıysa ve
// ekranda görünüyorsa kendi kendine birkaç saniyede bir geçer; ilk etkileşimde durur.
function initDemo() {
  const box = $('#demo-box');
  const tabs = [...document.querySelectorAll('.demo-tabs button')];
  let shown = 0;
  let auto = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = false;

  const set = (i) => {
    shown = i;
    box.classList.toggle('show-b', i === 1);
    tabs.forEach((b, j) => {
      b.classList.toggle('active', j === i);
      b.setAttribute('aria-pressed', j === i);
    });
  };
  const stopAuto = () => { auto = false; };

  box.addEventListener('click', () => { stopAuto(); set(1 - shown); });
  box.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    stopAuto();
    set(1 - shown);
  });
  tabs.forEach((b, j) => b.addEventListener('click', () => { stopAuto(); set(j); }));

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.6 }).observe(box);
  setInterval(() => { if (auto && visible && !document.hidden) set(1 - shown); }, 2500);
}

/* ======================= Geri bildirim ======================= */

function initFeedback() {
  const dialog = $('#fb');
  const form = $('#fb-form');
  const msg = $('#fb-msg');
  const send = $('#fb-send');

  $('#fb-open').addEventListener('click', () => {
    msg.textContent = '';
    msg.className = 'msg';
    send.disabled = false;
    dialog.showModal();
    $('#fb-message').focus();
  });
  $('#fb-cancel').addEventListener('click', () => dialog.close());

  // "Ya da şu adrese yaz" satırı: çeviri metninin içine tıklanabilir e-posta linki yerleştir
  const renderAlt = () => {
    const link = document.createElement('a');
    link.href = `mailto:${FEEDBACK_EMAIL}`;
    link.textContent = FEEDBACK_EMAIL;
    const [before, after = ''] = t('fbOrEmail', { email: '\u0000' }).split('\u0000');
    $('#fb-alt').replaceChildren(before, link, after);
  };
  renderAlt();
  onLangChange(renderAlt);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    send.disabled = true;
    msg.textContent = '';
    msg.className = 'msg';
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: $('#fb-message').value,
          email: $('#fb-email').value,
          website: $('#fb-website').value,
          lang,
        }),
      });
      if (!res.ok) throw new Error('http');
      msg.textContent = t('fbThanks');
      msg.className = 'msg ok';
      form.reset();
      setTimeout(() => dialog.close(), 1600);
    } catch {
      msg.textContent = t('fbError');
      send.disabled = false;
    }
  });
}

/* ======================= Karşılaştırma ekranı ======================= */

const viewer = (() => {
  const stage = $('#stage');
  const frame = $('#frame');
  const imgA = $('#img-a');
  const imgB = $('#img-b');
  const divider = $('#divider');
  const selA = $('#sel-a');
  const selB = $('#sel-b');
  const zoomLabel = $('#zoom-label');
  const status = $('#v-status');
  const flashEl = $('#flash');
  const hintEl = $('#hint');
  const fullBtn = $('#v-full');
  const nativeBtn = $('#v-native');
  const viewerEl = $('#viewer');

  let images = [];
  let albumId = '';            // paylaşılan albümün kimliği (yerel önizlemede boş)
  let a = 0, b = 1;
  let mode = 'toggle';         // 'toggle' = tıkla-geç (varsayılan), 'slide' = kaydırıcı
  let shown = 'a';             // tıkla-geç modunda görünen taraf
  let flashTimer;
  let pos = 0.5;               // kaydırıcı konumu (sahne genişliğinin oranı)
  let ref = { w: 1, h: 1 };    // referans boyut: ilk resim
  let base = { x: 0, y: 0, w: 1, h: 1, s: 1 };
  let z = 1, tx = 0, ty = 0;   // yakınlaştırma ve kaydırma
  let ready = false;
  let bound = false;
  let zoomTimer;
  let uiTimer;
  let stageOff = { x: 0, y: 0 }; // sahnenin sayfadaki konumu (piksel hizalama için)
  const TOP_BAND = 48;         // tıkla-geç modunda resmin üstünde isim için bırakılan boşluk

  function open(album, opts = {}) {
    images = album.images;
    albumId = album.id || '';
    a = 0; b = 1; pos = 0.5; z = 1; tx = 0; ty = 0; ready = false; shown = 'a';
    // /a/<id>/2/4 linkinden gelen ikili (0'dan başlayan sıra numaraları)
    const [pa, pb] = album.pair || [];
    if (images[pa] && images[pb] && pa !== pb) { a = pa; b = pb; }

    $('#upload').hidden = true;
    $('#viewer').hidden = false;
    setTitle(album.title);
    $('#v-back').hidden = !opts.local;
    $('#v-copy').hidden = !!opts.local;

    fillSelect(selA);
    fillSelect(selB);
    status.textContent = t('loading');

    const first = new Image();
    first.onload = () => {
      ref = { w: first.naturalWidth, h: first.naturalHeight };
      status.textContent = '';
      ready = true;
      show();
    };
    first.onerror = () => { status.textContent = t('imgFail'); };
    first.src = images[0].src;
    // Diğer resimleri arka planda önceden yükle
    images.slice(1).forEach((im) => { new Image().src = im.src; });

    if (!bound) bind();
    setMode(mode);
    stage.focus({ preventScroll: true });
  }

  // Resmin üstündeki "ne yapmalıyım" ipucu: ilk etkileşime kadar görünür, mod değişince tekrar çıkar
  function showHint() {
    const main = document.createElement('strong');
    main.textContent = t(mode === 'toggle' ? 'hintToggle' : 'hintSlide');
    const sub = document.createElement('span');
    sub.textContent = t('hintMode');
    hintEl.replaceChildren(main, sub);
    hintEl.classList.add('show');
  }

  function hideHint() {
    hintEl.classList.remove('show');
  }

  function close() {
    if (fullscreenElement()) toggleFullscreen();
    $('#viewer').hidden = true;
    imgA.removeAttribute('src');
    imgB.removeAttribute('src');
  }

  function fillSelect(sel) {
    sel.replaceChildren(...images.map((im, i) => new Option(`${i + 1}. ${im.name}`, i)));
    sel.disabled = images.length < 2;
  }

  function setTitle(title) {
    $('#v-title').textContent = title || 'imgversus';
    document.title = (title ? title + ' – ' : '') + 'imgversus';
  }

  // Yükleyen başlığı ya da resim isimlerini değiştirince ekranı günceller
  function rename(title, names) {
    setTitle(title);
    names.forEach((name, i) => { images[i].name = name; });
    fillSelect(selA);
    fillSelect(selB);
    selA.value = a;
    selB.value = b;
  }

  // Adres çubuğu o an bakılan ikiliyi gösterir (/a/<id>/2/4); "Linki kopyala" da bunu kopyalar.
  // Varsayılan ikili (1'e karşı 2) için link sade kalır.
  function updateUrl() {
    if (!albumId) return;
    const path = a === 0 && b === 1 ? `/a/${albumId}` : `/a/${albumId}/${a + 1}/${b + 1}`;
    if (location.pathname !== path) history.replaceState(null, '', path);
  }

  function show() {
    updateUrl();
    selA.value = a;
    selB.value = b;
    imgA.src = images[a].src;
    imgB.src = images[b].src;
    imgA.alt = images[a].name;
    imgB.alt = images[b].name;
    layout();
  }

  function pick(side, i) {
    i = +i;
    if (side === 'a') { if (i === b) b = a; a = i; }
    else { if (i === a) a = b; b = i; }
    show();
  }

  function swap() { [a, b] = [b, a]; show(); }

  function setMode(m) {
    mode = m;
    $('#m-slide').classList.toggle('active', m === 'slide');
    $('#m-toggle').classList.toggle('active', m === 'toggle');
    $('#m-slide').setAttribute('aria-pressed', m === 'slide');
    $('#m-toggle').setAttribute('aria-pressed', m === 'toggle');
    stage.classList.toggle('toggle', m === 'toggle');
    showHint();
    if (ready) layout(); else render();
  }

  // Tıkla-geç modunda görünen resmi değiştir
  function flip() {
    shown = shown === 'a' ? 'b' : 'a';
    render();
    hideHint();
    flash(images[shown === 'a' ? a : b].name);
  }

  // Görünen resmin adını kısa süreliğine resmin hemen üstünde, ortada gösterir
  function flash(text) {
    if (!text) return;
    flashEl.textContent = text;
    const imgTop = base.y + ty;
    // Tam ekranda üst çubuk açıksa onun altında kalsın
    const minTop = fullscreenElement() && !viewerEl.classList.contains('fs-idle') ? $('.vbar').offsetHeight + 6 : 6;
    flashEl.style.top = Math.max(minTop, imgTop - flashEl.offsetHeight - 6) + 'px';
    flashEl.classList.add('show');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => flashEl.classList.remove('show'), 700);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }

  function toggleFullscreen() {
    if (fullscreenElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const req = (viewerEl.requestFullscreen || viewerEl.webkitRequestFullscreen).call(viewerEl);
      req?.catch?.(() => toast(t('fsDenied')));
    }
  }

  function updateFullTitle() {
    const on = !!fullscreenElement();
    const label = t(on ? 'exitFullscreen' : 'fullscreen');
    fullBtn.title = `${label} (${on ? 'F / Esc' : 'F'})`;
    fullBtn.setAttribute('aria-label', label);
    nativeBtn.title = `${t('nativeSize')} (N)`;
  }

  function onFullscreenChange() {
    const on = !!fullscreenElement();
    viewerEl.classList.toggle('fs', on);
    viewerEl.style.setProperty('--vbar-h', $('.vbar').offsetHeight + 'px');
    if (on) showUi();
    else viewerEl.classList.remove('fs-idle');
    updateFullTitle();
    layout();
    stage.focus({ preventScroll: true });
  }

  // Tam ekranda üst çubuk ve seçiciler gizlenir; fare en üste gelince ya da dokununca kısa süre görünür
  function showUi() {
    viewerEl.classList.remove('fs-idle');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(function hide() {
      if (!fullscreenElement()) return;
      if (viewerEl.querySelector('.vbar:hover, .picker:hover, .picker select:focus')) uiTimer = setTimeout(hide, 1000);
      else viewerEl.classList.add('fs-idle');
    }, 2200);
  }

  function layout() {
    if (!ready) return;
    const r = stage.getBoundingClientRect();
    stageOff = { x: r.left, y: r.top };
    const W = stage.clientWidth, H = stage.clientHeight;
    const top = bandTop();
    const s = Math.min(W / ref.w, (H - top) / ref.h);
    const w = ref.w * s, h = ref.h * s;
    base = { x: (W - w) / 2, y: top + (H - top - h) / 2, w, h, s };
    clampPan();
    render();
  }

  // Resmin bir pikseli ekranın kaç fiziksel pikseline denk geliyor (Windows/Mac ekran ölçeği dahil)
  function deviceScale() {
    return base.s * z * (window.devicePixelRatio || 1);
  }

  // 1:1 için gereken yakınlaştırma: resmin her pikseli ekranın tam bir pikseli olur
  function nativeZ() {
    return 1 / (base.s * (window.devicePixelRatio || 1));
  }

  function isNative() {
    return Math.abs(deviceScale() - 1) < 0.002;
  }

  function clampPan() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const fw = base.w * z, fh = base.h * z;
    const top = bandTop();
    tx = fw <= W + 0.5 ? W / 2 - base.x - fw / 2 : Math.min(-base.x, Math.max(W - base.x - fw, tx));
    ty = fh <= H - top + 0.5 ? top + (H - top - fh) / 2 - base.y : Math.min(-base.y, Math.max(H - base.y - fh, ty));
  }

  function bandTop() {
    return mode === 'toggle' && !fullscreenElement() ? TOP_BAND : 0;
  }

  function render() {
    const W = stage.clientWidth;
    // Konumu fiziksel piksele hizala ki 1:1 ve tam sayı büyütmede pikseller kaymasın, bulanıklaşmasın.
    // Boyutu transform: scale yerine doğrudan veriyoruz; tarayıcı resmi her seferinde hedef boyutta çizer.
    const dpr = window.devicePixelRatio || 1;
    const snap = (v, off) => Math.round((off + v) * dpr) / dpr - off;
    const left = snap(base.x + tx, stageOff.x);
    frame.style.left = left + 'px';
    frame.style.top = snap(base.y + ty, stageOff.y) + 'px';
    frame.style.width = base.w * z + 'px';
    frame.style.height = base.h * z + 'px';
    if (mode === 'toggle') {
      imgB.style.clipPath = shown === 'b' ? 'none' : 'inset(0 0 0 100%)';
    } else {
      const sx = pos * W;
      divider.style.left = sx + 'px';
      const c = Math.min(1, Math.max(0, (sx - left) / (base.w * z)));
      imgB.style.clipPath = `inset(0 0 0 ${c * 100}%)`;
    }
    selA.parentNode.classList.toggle('active', mode === 'toggle' && shown === 'a');
    selB.parentNode.classList.toggle('active', mode === 'toggle' && shown === 'b');
    // Ölçeklemesiz (1:1) ya da tam katlarda büyütürken pikselleri olduğu gibi göster (nearest);
    // küçültürken ve küsuratlı oranlarda tarayıcının yumuşak filtresi kalsın
    const e = deviceScale();
    frame.classList.toggle('pixelated', e > 0.999 && Math.abs(e - Math.round(e)) < 0.01);
    stage.classList.toggle('zoomed', z > 1.001);
    zoomLabel.textContent = !ready ? '' : isNative() ? '1:1' : Math.round(e * 100) + '%';
    nativeBtn.classList.toggle('on', isNative());
    nativeBtn.setAttribute('aria-pressed', isNative());
  }

  function setPos(clientX) {
    const r = stage.getBoundingClientRect();
    pos = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    render();
  }

  function zoomAt(px, py, nz) {
    const zmax = Math.max(1, 40 / base.s);
    nz = Math.min(zmax, Math.max(Math.min(1, nativeZ()), nz));
    const ux = (px - base.x - tx) / z;
    const uy = (py - base.y - ty) / z;
    z = nz;
    tx = px - base.x - z * ux;
    ty = py - base.y - z * uy;
    clampPan();
    render();
    // Tam ekranda gizliyken ölçek etiketi yakınlaştırınca kısa süre görünür
    zoomLabel.classList.add('bump');
    clearTimeout(zoomTimer);
    zoomTimer = setTimeout(() => zoomLabel.classList.remove('bump'), 1200);
  }

  // Bir adım yakınlaştır/uzaklaştır. Küçültülmüşken akıcı ilerler ve 1:1'de durur;
  // 1:1'in üstünde %200, %300… gibi tam katlara atlar ki pikseller eşit boyutta kalsın.
  function zoomStep(px, py, dir) {
    const e = deviceScale(), n = nativeZ();
    let nz;
    if (dir > 0) nz = e < 0.999 ? Math.min(z * 1.25, n) : n * (Math.floor(e + 0.01) + 1);
    else nz = e > 1.001 ? n * Math.max(1, Math.ceil(e - 0.01) - 1) : z / 1.25;
    zoomAt(px, py, nz);
  }

  // Parmakla yakınlaştırma bitince en yakın tam kata (ya da 1:1'e) otur
  function snapZoom(px, py) {
    const e = deviceScale();
    if (e > 1.001) zoomAt(px, py, nativeZ() * Math.round(e));
    else if (e > 0.97) zoomAt(px, py, nativeZ());
  }

  function toggleNative() {
    const cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
    if (isNative()) zoomAt(cx, cy, 1);
    else zoomAt(cx, cy, nativeZ());
  }

  function resetZoom() {
    const r = stage.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, 1);
  }

  function bind() {
    bound = true;
    selA.addEventListener('change', () => pick('a', selA.value));
    selB.addEventListener('change', () => pick('b', selB.value));
    $('#v-copy').addEventListener('click', () => copyText(location.origin + location.pathname));
    window.addEventListener('resize', layout);
    $('#m-slide').addEventListener('click', () => setMode('slide'));
    $('#m-toggle').addEventListener('click', () => setMode('toggle'));
    fullBtn.hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    fullBtn.addEventListener('click', toggleFullscreen);
    nativeBtn.addEventListener('click', toggleNative);
    viewerEl.addEventListener('pointermove', (e) => {
      if (fullscreenElement() && e.pointerType === 'mouse' && e.clientY < 90) showUi();
    });
    updateFullTitle();
    onLangChange(updateFullTitle);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    onLangChange(() => { if (hintEl.classList.contains('show')) showHint(); });

    const pointers = new Map();
    let drag = null; // 'slide' | 'pan' | 'pinch' | 'tap'
    let last = null;
    let pinch = null;
    let down = null; // tıkla-geç: tıklama mı sürükleme mi ayırt etmek için
    let wheelAcc = 0, wheelTimer;

    const local = (e) => {
      const r = stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.picker') || !ready) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      hideHint();
      if (fullscreenElement() && e.pointerType === 'touch') showUi();
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        drag = 'pinch';
        down = null;
        pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2 };
        return;
      }
      if (pointers.size > 2) return;
      const p = pointers.get(e.pointerId);
      down = { x: p.x, y: p.y, moved: false };
      const nearLine = Math.abs(p.x - pos * stage.clientWidth) < (e.pointerType === 'mouse' ? 18 : 32);
      if (mode === 'toggle' && z <= 1.001) {
        drag = 'tap';
      } else if (mode === 'slide' && (z <= 1.001 || nearLine)) {
        drag = 'slide';
        setPos(e.clientX);
      } else {
        drag = 'pan';
        last = p;
        stage.classList.add('panning');
      }
    });

    stage.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const p = local(e);
      pointers.set(e.pointerId, p);
      if (down && Math.hypot(p.x - down.x, p.y - down.y) > 6) down.moved = true;
      if (drag === 'slide') setPos(e.clientX);
      else if (drag === 'pan') {
        tx += p.x - last.x;
        ty += p.y - last.y;
        last = p;
        clampPan();
        render();
      } else if (drag === 'pinch' && pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        tx += mx - pinch.mx;
        ty += my - pinch.my;
        zoomAt(mx, my, z * (d / pinch.d));
        pinch = { d, mx, my };
      }
    });

    const end = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size === 0) {
        if (e.type === 'pointerup' && mode === 'toggle' && down && !down.moved) flip();
        drag = null;
        down = null;
        stage.classList.remove('panning');
      } else if (drag === 'pinch' && pointers.size === 1) {
        snapZoom(pinch.mx, pinch.my);
        // Bir parmak kalınca kaydırmaya devam et
        drag = 'pan';
        last = [...pointers.values()][0];
      }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    stage.addEventListener('wheel', (e) => {
      if (!ready) return;
      e.preventDefault();
      const p = local(e);
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (deviceScale() < 0.999) {
        // Küçültülmüşken akıcı yakınlaştır, 1:1'i geçme
        zoomAt(p.x, p.y, Math.min(z * Math.exp(-dy * 0.0015), nativeZ()));
        wheelAcc = 0;
      } else {
        // 1:1 ve üstünde tam katlar: bir tekerlek çentiği = bir adım (dokunmatik yüzeyde biriktir)
        wheelAcc += dy;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => { wheelAcc = 0; }, 250);
        if (Math.abs(wheelAcc) >= 80) {
          zoomStep(p.x, p.y, wheelAcc < 0 ? 1 : -1);
          wheelAcc = 0;
        }
      }
    }, { passive: false });

    stage.addEventListener('dblclick', (e) => {
      if (e.target.closest('.picker') || mode === 'toggle') return;
      const p = local(e);
      if (z > 1.001) resetZoom();
      else if (deviceScale() < 0.999) zoomAt(p.x, p.y, nativeZ()); // ilk çift tıklamada 1:1'e
      else zoomStep(p.x, p.y, 1);
    });

    window.addEventListener('keydown', (e) => {
      if ($('#viewer').hidden || e.target.matches('input, select, textarea')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = e.shiftKey ? 0.1 : 0.02;
      if (e.key === 'ArrowLeft') { pos = Math.max(0, pos - step); render(); }
      else if (e.key === 'ArrowRight') { pos = Math.min(1, pos + step); render(); }
      else if (e.key === 's' || e.key === 'S') swap();
      else if (e.key === 'm' || e.key === 'M') setMode(mode === 'slide' ? 'toggle' : 'slide');
      else if ((e.key === 'f' || e.key === 'F') && !fullBtn.hidden) toggleFullscreen();
      else if (e.key === ' ' && mode === 'toggle') flip();
      else if (e.key === '0') resetZoom();
      else if (e.key === 'n' || e.key === 'N') toggleNative();
      else if (e.key === '+' || e.key === '=') zoomStep(stage.clientWidth / 2, stage.clientHeight / 2, 1);
      else if (e.key === '-') zoomStep(stage.clientWidth / 2, stage.clientHeight / 2, -1);
      else if (/^Digit[1-9]$/.test(e.code)) {
        // 1-9: sağ resmi seç, Shift+1-9: sol resmi seç
        const i = +e.code.slice(5) - 1;
        if (i < images.length) pick(e.shiftKey ? 'a' : 'b', i);
      } else return;
      e.preventDefault();
    });
  }

  return { open, close, rename };
})();

/* ======================= Yükleyenin düzenleme penceresi ======================= */

// Kıyası bu tarayıcıdan yükleyen kişi başlığı ve resim isimlerini düzeltebilir ya da kıyası silebilir.
// Başkaları bu düğmeyi hiç görmez; sunucu da anahtarı tutmayan isteği reddeder.
function initOwner(id, album) {
  const token = owned.get(id);
  const btn = $('#v-edit');
  btn.hidden = !token;
  if (!token) return;

  const dialog = $('#edit');
  const form = $('#edit-form');
  const title = $('#edit-title');
  const list = $('#edit-names');
  const msg = $('#edit-msg');
  const save = $('#edit-save');
  const del = $('#edit-delete');
  const auth = { authorization: `Bearer ${token}` };

  const fill = () => {
    title.value = album.title || '';
    list.replaceChildren(...album.images.map((im, i) => {
      const row = document.createElement('label');
      row.className = 'edit-row';
      const num = document.createElement('span');
      num.textContent = `${i + 1}.`;
      const input = document.createElement('input');
      input.className = 'field';
      input.maxLength = 80;
      input.value = im.name;
      row.append(num, input);
      return row;
    }));
    msg.textContent = '';
  };

  // Anahtar artık geçerli değilse (ör. kıyas yönetici tarafından silindiyse) düğmeyi kaldır
  const lostAccess = () => {
    owned.set(id, '');
    btn.hidden = true;
    dialog.close();
  };

  btn.onclick = () => { fill(); dialog.showModal(); };
  $('#edit-cancel').onclick = () => dialog.close();

  form.onsubmit = async (e) => {
    e.preventDefault();
    save.disabled = true;
    msg.textContent = '';
    try {
      const names = [...list.querySelectorAll('input')].map((input) => input.value);
      const res = await fetch(`/api/album/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify({ title: title.value, names }),
      });
      if (res.status === 403 || res.status === 404) return lostAccess();
      if (!res.ok) throw new Error('http');
      const data = await res.json();
      album.title = data.title;
      data.images.forEach((im, i) => { album.images[i].name = im.name; });
      viewer.rename(data.title, data.images.map((im) => im.name));
      dialog.close();
      toast(t('saved'));
    } catch {
      msg.textContent = t('editFail');
    } finally {
      save.disabled = false;
    }
  };

  del.onclick = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    del.disabled = true;
    msg.textContent = '';
    try {
      const res = await fetch(`/api/album/${id}`, { method: 'DELETE', headers: auth });
      if (res.status === 403) return lostAccess();
      if (!res.ok && res.status !== 404) throw new Error('http');
      owned.set(id, '');
      location.assign('/?deleted=1');
    } catch {
      msg.textContent = t('editFail');
      del.disabled = false;
    }
  };
}

/* ======================= Paylaşılan albüm ======================= */

async function initAlbum(id, pair) {
  $('#upload').hidden = true;
  $('#viewer').hidden = false;
  const status = $('#v-status');
  status.textContent = t('loading');
  try {
    // Yükleyen az önce düzenlemiş olabilir; ona tarayıcı önbelleğindeki eski hâli gösterme
    const res = await fetch(`/api/album/${id}`, owned.get(id) ? { cache: 'no-cache' } : {});
    if (res.status === 404) throw new Error('notfound');
    if (!res.ok) throw new Error('http');
    const album = await res.json();
    if (new URLSearchParams(location.search).has('new')) {
      history.replaceState(null, '', `/a/${id}`);
      toast(t('linkReady'));
    }
    viewer.open({
      id,
      pair,
      title: album.title,
      images: album.images.map((im, i) => ({ src: `/i/${id}/${i}`, name: im.name })),
    });
    initOwner(id, album);
  } catch (err) {
    const showError = () => {
      if (err.message !== 'notfound') { status.textContent = t('loadError'); return; }
      const link = document.createElement('a');
      link.href = '/';
      link.textContent = t('createNew');
      status.replaceChildren(t('notFound'), document.createElement('br'), link);
    };
    showError();
    onLangChange(showError);
  }
}

initLangSelects();
if (typeof APP_VERSION !== 'undefined') $('#version').textContent = `v${APP_VERSION}`;
const match = location.pathname.match(/^\/a\/([A-Za-z0-9]{4,32})(?:\/(\d{1,2})\/(\d{1,2}))?\/?$/);
if (match) initAlbum(match[1], match[2] ? [match[2] - 1, match[3] - 1] : null);
else initUpload();

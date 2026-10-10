import { loadCollection } from './dataLoader.js';
import { catCorta, catIcono } from './translations.js';
import { escapeHtml } from './renderer.js';

/* =========================================================
   Lector de códigos de barras (solo móvil)

   Abre la cámara trasera, lee el código y busca en el campo
   `barcode` de la colección:
     - 1 coincidencia  → abre la ficha directamente.
     - varias          → deja elegir.
     - ninguna         → lo dice y permite escanear otro.

   Android/Chrome trae BarcodeDetector de serie. iPhone no, así
   que ahí se carga un polyfill (ZXing en WebAssembly, alojado en
   js/vendor) solo la primera vez que se abre el lector.
========================================================= */

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];
const SCAN_INTERVAL = 120; // ms entre lecturas: de sobra y no machaca la batería
const CONFIRM_WINDOW = 1500; // ms: hay que leer el mismo código 2 veces en este margen
const RETRY_COOLDOWN = 2500; // ms tras "Escanear otro" en que se ignora el último código
const INVERT_MAX_WIDTH = 1280; // px del fotograma invertido (más no aporta y cuesta)

let detectorPromise = null;
let detectorIsNative = false;
let index = null;

// Estado del bucle de lectura
let session = 0;          // se incrementa al abrir/reanudar: descarta lecturas viejas
let busy = false;         // hay un detect() en curso
let frameCount = 0;       // alterna fotograma normal / invertido
let pending = null;       // { value, at } primera lectura pendiente de confirmar
let ignored = null;       // { value, until } código a ignorar tras "Escanear otro"
let invertCanvas = null;
let invertCtx = null;
let pickingPhoto = false; // abierta la cámara de fotos: la página se oculta pero no hay que cerrar

let overlay = null;
let video = null;
let stream = null;
let track = null;
let scanning = false;
let lastScan = 0;
let rafId = 0;

// ---------------------------------------------------------------
// ¿Es un móvil con cámara?
// ---------------------------------------------------------------
function isMobileWithCamera() {
  const coarse = window.matchMedia('(pointer: coarse)').matches
    && window.matchMedia('(hover: none)').matches;
  return coarse && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
}

// ---------------------------------------------------------------
// Índice código → objetos
// ---------------------------------------------------------------

/**
 * Deja el código en una forma comparable: sin espacios ni guiones y, si es
 * numérico, sin ceros a la izquierda. Así un UPC-A de 12 cifras casa con el
 * mismo código leído como EAN-13 (que le antepone un 0) y viceversa.
 */
function normalizeCode(value) {
  const clean = String(value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (/^\d+$/.test(clean)) return clean.replace(/^0+/, '') || '0';
  return clean;
}

/** UPC-E (8 cifras) → UPC-A (12), por si en el JSON está guardado largo. */
function expandUpcE(code) {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const [ns, d1, d2, d3, d4, d5, d6, check] = code;
  let body;
  if ('012'.includes(d6)) body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  else if (d6 === '3') body = `${d1}${d2}${d3}00000${d4}${d5}`;
  else if (d6 === '4') body = `${d1}${d2}${d3}${d4}00000${d5}`;
  else body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  return `${ns}${body}${check}`;
}

async function getIndex() {
  if (index) return index;
  const items = await loadCollection();
  index = new Map();
  items.forEach((item) => {
    if (!item.barcode) return;
    const key = normalizeCode(item.barcode);
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(item);
  });
  return index;
}

async function findMatches(rawValue, format) {
  const map = await getIndex();
  const candidates = new Set([normalizeCode(rawValue)]);
  if (format === 'upc_e') {
    const upcA = expandUpcE(String(rawValue));
    if (upcA) candidates.add(normalizeCode(upcA));
  }
  const found = [];
  candidates.forEach((key) => (map.get(key) || []).forEach((item) => {
    if (!found.includes(item)) found.push(item);
  }));
  return found;
}

// ---------------------------------------------------------------
// Detector: nativo si existe, si no el polyfill
// ---------------------------------------------------------------
function getDetector() {
  if (detectorPromise) return detectorPromise;

  detectorPromise = (async () => {
    if ('BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const formats = FORMATS.filter((f) => supported.includes(f));
        if (formats.length) {
          detectorIsNative = true;
          return new window.BarcodeDetector({ formats });
        }
      } catch { /* caemos al polyfill */ }
    }

    const mod = await import('./vendor/barcode-detector.js');
    const wasmUrl = new URL('./vendor/zxing_reader.wasm', import.meta.url).href;
    mod.setZXingModuleOverrides({
      locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
    });
    detectorIsNative = false; // ZXing ya prueba la imagen invertida por su cuenta
    return new mod.BarcodeDetector({ formats: FORMATS });
  })();

  // Si falla (sin red, por ejemplo) que se pueda reintentar la próxima vez.
  detectorPromise.catch(() => { detectorPromise = null; });
  return detectorPromise;
}

// ---------------------------------------------------------------
// Interfaz
// ---------------------------------------------------------------
function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'scanner';
  overlay.id = 'scanner';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Lector de códigos de barras');
  overlay.hidden = true;
  overlay.innerHTML = `
    <video class="scanner__video" playsinline muted autoplay></video>

    <div class="scanner__frame" aria-hidden="true">
      <div class="scanner__window"><span class="scanner__laser"></span></div>
    </div>

    <div class="scanner__top">
      <button type="button" class="scanner__btn" data-action="close" aria-label="Cerrar lector">✕</button>
      <span class="scanner__title">Escanear código</span>
      <button type="button" class="scanner__btn" data-action="torch" aria-label="Linterna" aria-pressed="false" hidden>🔦</button>
    </div>

    <p class="scanner__hint" data-role="hint">Apunta al código de barras</p>

    <div class="scanner__alt">
      <button type="button" class="scanner__alt-btn" data-action="photo">📷 Hacer foto</button>
      <button type="button" class="scanner__alt-btn" data-action="manual">⌨️ Escribir código</button>
    </div>
    <input type="file" accept="image/*" capture="environment" data-role="photo" hidden>

    <div class="scanner__sheet" data-role="sheet" hidden></div>
  `;
  document.body.appendChild(overlay);

  video = overlay.querySelector('.scanner__video');

  overlay.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'close') closeScanner();
    else if (action === 'torch') toggleTorch(button);
    else if (action === 'retry') resumeScanning();
    else if (action === 'open') goTo(button.dataset.id);
    else if (action === 'photo') {
      pauseScanning();
      stopCamera(); // iOS no deja usar la cámara en dos sitios a la vez
      pickingPhoto = true;
      overlay.querySelector('[data-role="photo"]').click();
    } else if (action === 'manual') showManualEntry();
  });

  const photoInput = overlay.querySelector('[data-role="photo"]');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    pickingPhoto = false;
    if (file) readPhoto(file);
    else resumeScanning(); // canceló la foto
  });
  photoInput.addEventListener('cancel', () => {
    pickingPhoto = false;
    resumeScanning();
  });

  overlay.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-role="manual-form"]');
    if (!form) return;
    event.preventDefault();
    const value = form.querySelector('input').value.trim();
    if (value) lookUp(value, null);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && !overlay.hidden) closeScanner();
  });

  // Si el móvil se bloquea o cambias de app, soltamos la cámara.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && overlay && !overlay.hidden && !pickingPhoto) closeScanner();
  });

  // El botón atrás del móvil cierra el lector en vez de salir de la web.
  window.addEventListener('popstate', () => {
    if (overlay && !overlay.hidden) closeScanner({ fromHistory: true });
  });
}

function setHint(text, isError = false) {
  const hint = overlay.querySelector('[data-role="hint"]');
  hint.textContent = text;
  hint.classList.toggle('is-error', isError);
  hint.hidden = !text;
}

function showSheet(html) {
  const sheet = overlay.querySelector('[data-role="sheet"]');
  sheet.innerHTML = html;
  sheet.hidden = false;
  overlay.classList.add('has-sheet');
}

function hideSheet() {
  const sheet = overlay.querySelector('[data-role="sheet"]');
  sheet.hidden = true;
  sheet.innerHTML = '';
  overlay.classList.remove('has-sheet');
}

function optionMarkup(item) {
  const sub = [item.franchise || item.brand, item.year].filter(Boolean).join(' · ');
  return `
    <button type="button" class="scanner-option" data-action="open" data-id="${escapeHtml(item.id)}">
      <img class="scanner-option__img" src="${escapeHtml(item.image)}" alt="" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <span class="scanner-option__text">
        <span class="scanner-option__name">${escapeHtml(item.name)}</span>
        <span class="scanner-option__sub">${catIcono(item.category)} ${escapeHtml(catCorta(item.category))}${sub ? ` · ${escapeHtml(sub)}` : ''}</span>
      </span>
      <span class="scanner-option__chev" aria-hidden="true">›</span>
    </button>
  `;
}

function showResults(code, matches) {
  setHint('');
  if (!matches.length) {
    showSheet(`
      <div class="scanner__sheet-head">
        <strong>No está en la colección</strong>
        <code class="scanner__code">${escapeHtml(code)}</code>
      </div>
      <p class="scanner__sheet-text">Ningún objeto tiene este código de barras.</p>
      <div class="scanner__actions">
        <button type="button" class="scanner__cta" data-action="retry">Escanear otro</button>
      </div>
    `);
    return;
  }

  showSheet(`
    <div class="scanner__sheet-head">
      <strong>${matches.length} objetos con este código</strong>
      <code class="scanner__code">${escapeHtml(code)}</code>
    </div>
    <div class="scanner__options">${matches.map(optionMarkup).join('')}</div>
    <div class="scanner__actions">
      <button type="button" class="scanner__cta scanner__cta--ghost" data-action="retry">Escanear otro</button>
    </div>
  `);
}

// ---------------------------------------------------------------
// Cámara
// ---------------------------------------------------------------
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  });
  video.srcObject = stream;
  await video.play().catch(() => {});

  track = stream.getVideoTracks()[0] || null;
  const torchBtn = overlay.querySelector('[data-action="torch"]');
  const caps = track?.getCapabilities?.() || {};
  torchBtn.hidden = !caps.torch;
  torchBtn.setAttribute('aria-pressed', 'false');

  // Enfoque continuo donde se pueda: los códigos se leen de cerca.
  if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
    track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  track = null;
  if (video) video.srcObject = null;
}

async function toggleTorch(button) {
  if (!track) return;
  const on = button.getAttribute('aria-pressed') !== 'true';
  try {
    await track.applyConstraints({ advanced: [{ torch: on }] });
    button.setAttribute('aria-pressed', String(on));
  } catch { /* no soportado */ }
}

// ---------------------------------------------------------------
// Bucle de lectura
// ---------------------------------------------------------------
/**
 * Fotograma con los colores invertidos. Hace falta para los códigos impresos
 * en claro sobre fondo oscuro (barras blancas sobre caja negra): el lector
 * nativo de Android no los reconoce tal cual.
 */
function grabFrame(source, srcW, srcH, { invert = false, crop = false, maxWidth = INVERT_MAX_WIDTH } = {}) {
  if (!srcW || !srcH) return null;
  // Recorte: la franja central, que es donde está la ventana de lectura.
  const sx = crop ? Math.round(srcW * 0.1) : 0;
  const sy = crop ? Math.round(srcH * 0.25) : 0;
  const sw = srcW - sx * 2;
  const sh = srcH - sy * 2;
  const scale = Math.min(1, maxWidth / sw);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  if (!invertCanvas) {
    invertCanvas = document.createElement('canvas');
    invertCtx = invertCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (invertCanvas.width !== w) invertCanvas.width = w;
  if (invertCanvas.height !== h) invertCanvas.height = h;
  invertCtx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
  const img = invertCtx.getImageData(0, 0, w, h);
  if (invert) {
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = 255 - px[i];
      px[i + 1] = 255 - px[i + 1];
      px[i + 2] = 255 - px[i + 2];
    }
  }
  return img;
}

/**
 * Qué imagen se le pasa al detector en cada intento. Se va rotando:
 *  - fotograma entero
 *  - franja central a resolución completa (códigos pequeños o lejos)
 *  - (solo lector nativo) imagen invertida, para barras claras sobre fondo
 *    oscuro; ZXing ya lo prueba por su cuenta.
 */
function nextSource() {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const steps = detectorIsNative ? 4 : 2;
  const step = frameCount++ % steps;
  if (step === 0) return video;
  if (step === 1) return grabFrame(video, vw, vh, { crop: true, maxWidth: 1920 });
  if (step === 2) return grabFrame(video, vw, vh, { invert: true });
  return grabFrame(video, vw, vh, { invert: true, crop: true, maxWidth: 1920 });
}

/** Dígito de control EAN/UPC: descarta lecturas parciales o corruptas. */
function validChecksum(code) {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

function isPlausible(rawValue, format) {
  if (['ean_13', 'ean_8', 'upc_a'].includes(format)) return validChecksum(rawValue);
  // ITF y Code 39 dan falsos positivos con trozos de texto o rayas: mínimo 6.
  if (format === 'itf' || format === 'code_39') return rawValue.length >= 6;
  return true;
}

async function tick(detector, mySession) {
  if (!scanning || mySession !== session) return;
  rafId = requestAnimationFrame(() => tick(detector, mySession));

  const now = performance.now();
  // Nunca dos detect() a la vez: con el polyfill tardan más que el intervalo
  // y se acumulaban, devolviendo resultados viejos después de reanudar.
  if (busy || now - lastScan < SCAN_INTERVAL || video.readyState < 2) return;
  lastScan = now;
  busy = true;

  let codes;
  try {
    const source = nextSource();
    codes = source ? await detector.detect(source) : [];
  } catch {
    codes = [];
  } finally {
    busy = false;
  }
  if (!scanning || mySession !== session || !codes?.length) return;

  const hit = codes.find((c) => c.rawValue && isPlausible(c.rawValue, c.format));
  if (!hit) return;
  const { rawValue, format } = hit;
  const t = performance.now();

  // Recién pulsado "Escanear otro": el mismo código sigue delante de la cámara.
  if (ignored && ignored.value === rawValue && t < ignored.until) return;

  // Confirmación: el mismo valor dos veces seguidas antes de darlo por bueno.
  if (!pending || pending.value !== rawValue || t - pending.at > CONFIRM_WINDOW) {
    pending = { value: rawValue, at: t };
    return;
  }
  pending = null;

  if (navigator.vibrate) navigator.vibrate(60);
  lookUp(rawValue, format);
}

/** Para el bucle de lectura y congela la imagen. */
function pauseScanning() {
  scanning = false;
  session += 1;
  cancelAnimationFrame(rafId);
  overlay.classList.add('is-paused');
  video?.pause();
}

/** Busca un código (leído, fotografiado o escrito) y enseña el resultado. */
async function lookUp(rawValue, format) {
  pauseScanning();
  const mySession = session;
  const matches = await findMatches(rawValue, format);
  if (mySession !== session || overlay.hidden) return; // se cerró mientras buscaba
  if (matches.length === 1) {
    goTo(matches[0].id);
    return;
  }
  ignored = { value: rawValue, until: 0 };
  showResults(rawValue, matches);
}

// ---------------------------------------------------------------
// Alternativas: foto y código a mano
// ---------------------------------------------------------------

/**
 * Lee el código de una foto. En iPhone es lo más fiable: la cámara de fotos
 * enfoca de cerca y saca mucha más resolución que el vídeo de Safari.
 */
async function readPhoto(file) {
  pickingPhoto = false;
  hideSheet();
  setHint('Leyendo la foto…');
  try {
    const detector = await getDetector();
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    const attempts = [
      { maxWidth: 2400 },
      { invert: true, maxWidth: 2400 },
      { crop: true, maxWidth: 2400 },
      { maxWidth: 1200 },
      { invert: true, maxWidth: 1200 }
    ];
    for (const opts of attempts) {
      const img = grabFrame(bitmap, w, h, opts);
      const codes = img ? await detector.detect(img).catch(() => []) : [];
      const hit = codes.find((c) => c.rawValue && isPlausible(c.rawValue, c.format));
      if (hit) {
        bitmap.close?.();
        if (navigator.vibrate) navigator.vibrate(60);
        lookUp(hit.rawValue, hit.format);
        return;
      }
    }
    bitmap.close?.();
    setHint('');
    showSheet(`
      <div class="scanner__sheet-head"><strong>No se ve ningún código en la foto</strong></div>
      <p class="scanner__sheet-text">Prueba más cerca, con el código recto y sin reflejos, o escríbelo a mano.</p>
      <div class="scanner__actions">
        <button type="button" class="scanner__cta scanner__cta--ghost" data-action="manual">Escribir código</button>
        <button type="button" class="scanner__cta" data-action="photo">Otra foto</button>
      </div>
    `);
  } catch {
    setHint('No se pudo leer la foto.', true);
    resumeScanning();
  }
}

function showManualEntry() {
  pauseScanning();
  setHint('');
  showSheet(`
    <form class="scanner__manual" data-role="manual-form">
      <label class="scanner__sheet-head" for="scannerManual"><strong>Escribe el código de barras</strong></label>
      <input id="scannerManual" class="scanner__input" type="text" inputmode="numeric"
             autocomplete="off" enterkeyhint="search" placeholder="8432752039526">
      <div class="scanner__actions">
        <button type="button" class="scanner__cta scanner__cta--ghost" data-action="retry">Volver</button>
        <button type="submit" class="scanner__cta">Buscar</button>
      </div>
    </form>
  `);
  overlay.querySelector('#scannerManual')?.focus();
}

function startLoop(detector) {
  session += 1;
  pending = null;
  frameCount = 0;
  scanning = true;
  lastScan = 0;
  cancelAnimationFrame(rafId);
  tick(detector, session);
}

async function resumeScanning() {
  if (scanning) return; // doble toque en "Escanear otro"
  hideSheet();
  overlay.classList.remove('is-paused');
  setHint('Apunta al código de barras');
  if (ignored) ignored.until = performance.now() + RETRY_COOLDOWN;
  try {
    // Al volver de la cámara de fotos, iOS puede haber cortado el vídeo.
    if (!stream || !track || track.readyState === 'ended') await startCamera();
    await video.play().catch(() => {});
    const detector = await getDetector();
    if (overlay.hidden) return;
    startLoop(detector);
  } catch {
    setHint('No se pudo reabrir la cámara. Usa la foto o escribe el código.', true);
  }
}

// ---------------------------------------------------------------
// Abrir / cerrar
// ---------------------------------------------------------------
export async function openScanner() {
  if (!overlay) buildOverlay();
  if (!overlay.hidden) return;

  hideSheet();
  overlay.classList.remove('is-paused');
  overlay.hidden = false;
  document.documentElement.classList.add('scanner-open');
  history.pushState({ sweedScanner: true }, '');
  setHint('Abriendo cámara…');

  try {
    // En paralelo: pedir cámara, preparar el detector y el índice.
    const [, detector] = await Promise.all([startCamera(), getDetector(), getIndex()]);
    if (overlay.hidden) { stopCamera(); return; } // se cerró mientras cargaba
    setHint('Apunta al código de barras');
    ignored = null;
    startLoop(detector);
  } catch (error) {
    stopCamera();
    const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
    setHint(
      denied
        ? 'Sin permiso para usar la cámara. Actívalo en los ajustes del navegador.'
        : 'No se pudo iniciar el lector. Inténtalo de nuevo.',
      true
    );
  }
}

export function closeScanner({ fromHistory = false } = {}) {
  if (!overlay || overlay.hidden) return;
  scanning = false;
  session += 1;
  cancelAnimationFrame(rafId);
  stopCamera();
  hideSheet();
  overlay.hidden = true;
  document.documentElement.classList.remove('scanner-open');
  if (!fromHistory && history.state?.sweedScanner) history.back();
}

function goTo(id) {
  if (!id) return;
  scanning = false;
  session += 1;
  cancelAnimationFrame(rafId);
  stopCamera();
  hideSheet();
  overlay.hidden = true;
  document.documentElement.classList.remove('scanner-open');
  // Sustituimos la entrada del lector por la ficha: así "atrás" vuelve a la galería.
  if (history.state?.sweedScanner) {
    history.replaceState(null, '', `#${encodeURIComponent(id)}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = id;
  }
}

// ---------------------------------------------------------------
// Botón en la barra de búsqueda
// ---------------------------------------------------------------
export function setupScanner() {
  const button = document.getElementById('scanBtn');
  if (!button || !isMobileWithCamera()) return;

  button.hidden = false;
  button.closest('.toolbar__row')?.classList.add('has-scan');
  button.addEventListener('click', openScanner);

  // Calentamos el índice en segundo plano para que la búsqueda sea instantánea.
  getIndex();
}

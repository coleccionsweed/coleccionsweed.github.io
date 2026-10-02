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

let detectorPromise = null;
let index = null;

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
        if (formats.length) return new window.BarcodeDetector({ formats });
      } catch { /* caemos al polyfill */ }
    }

    const mod = await import('./vendor/barcode-detector.js');
    const wasmUrl = new URL('./vendor/zxing_reader.wasm', import.meta.url).href;
    mod.setZXingModuleOverrides({
      locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
    });
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
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && !overlay.hidden) closeScanner();
  });

  // Si el móvil se bloquea o cambias de app, soltamos la cámara.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && overlay && !overlay.hidden) closeScanner();
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
async function tick(detector) {
  if (!scanning) return;
  rafId = requestAnimationFrame(() => tick(detector));

  const now = performance.now();
  if (now - lastScan < SCAN_INTERVAL || video.readyState < 2) return;
  lastScan = now;

  let codes;
  try {
    codes = await detector.detect(video);
  } catch {
    return;
  }
  if (!scanning || !codes?.length) return;

  const { rawValue, format } = codes[0];
  if (!rawValue) return;

  scanning = false;
  cancelAnimationFrame(rafId);
  if (navigator.vibrate) navigator.vibrate(60);
  overlay.classList.add('is-paused');
  video.pause();

  const matches = await findMatches(rawValue, format);
  if (matches.length === 1) {
    goTo(matches[0].id);
    return;
  }
  showResults(rawValue, matches);
}

async function resumeScanning() {
  hideSheet();
  overlay.classList.remove('is-paused');
  setHint('Apunta al código de barras');
  await video.play().catch(() => {});
  const detector = await getDetector();
  scanning = true;
  lastScan = 0;
  tick(detector);
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
    scanning = true;
    lastScan = 0;
    tick(detector);
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

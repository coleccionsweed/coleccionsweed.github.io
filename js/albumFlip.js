/**
 * Lector del álbum escaneado.
 *
 * Dos modos:
 *  - "single": una página a pantalla completa con deslizamiento que sigue al
 *    dedo. Es el modo por defecto en móvil, donde el libro a doble página
 *    dejaba cada hoja en ~150 px de ancho (ilegible) y obligaba al navegador a
 *    mantener 27 capas 3D en memoria.
 *  - "spread": el libro clásico a doble página con giro 3D, para pantallas
 *    anchas.
 *
 * En ambos modos solo se cargan las imágenes cercanas a la página actual
 * (ventana deslizante), en vez de las 54 de golpe.
 */

import { openLightbox } from './lightbox.js';
import { chevron } from './translations.js';

const albumEscaneadoConfigs = {
  'la-liga-04-05-coleccion-incompleta': 53
};

const MODE_KEY = 'sweed:album-mode';
const SPREAD_MIN_WIDTH = 820;   // por debajo de esto, una sola página
const LOAD_WINDOW = 2;          // páginas cargadas a cada lado
const KEEP_WINDOW = 8;          // páginas que se conservan antes de liberar
const FLIP_MS = 620;            // debe coincidir con --flip-duration del CSS

let active = null;

/** Libera listeners y memoria del lector anterior. */
export function destroyAlbumFlip() {
  if (!active) return;
  active.destroy();
  active = null;
}

export async function renderAlbumFlip(containerId, item) {
  destroyAlbumFlip();

  const container = document.getElementById(containerId);
  if (!container) return;

  const lastPage = albumEscaneadoConfigs[item.folder];
  if (lastPage === undefined || lastPage <= 0) return;

  const pages = [];
  for (let i = 0; i <= lastPage; i++) {
    pages.push(`images/${item.category}/${item.folder}/album/${i}.webp`);
  }

  active = createReader(container, pages, item.name);
}

function createReader(container, pages, albumName) {
  const total = pages.length;
  const sheetCount = Math.ceil(total / 2);

  let mode = null;   // se decide más abajo, cuando ya se puede medir el hueco real
  let page = 0;
  let slideWidth = 0;
  let listeners = [];
  let resizeObserver = null;
  let animTimer = null;

  const pageLabel = (index) => (index === 0 ? 'Portada' : `Página ${index}`);

  container.innerHTML = `
    <section class="album" aria-roledescription="lector de álbum">
      <div class="section__head">
        <h3 class="section__title">📖 Álbum escaneado</h3>
        <span class="section__count">${total} páginas</span>
      </div>
      <p class="section__hint" id="albumHint"></p>

      <div class="album__stage" id="albumStage">
        <button class="album__arrow album__arrow--prev" id="albumPrev" type="button" aria-label="Página anterior">${chevron('left')}</button>
        <div id="albumSurface"></div>
        <button class="album__arrow album__arrow--next" id="albumNext" type="button" aria-label="Página siguiente">${chevron('right')}</button>
      </div>

      <div class="album__bar">
        <span class="album__counter" id="albumCounter" role="status" aria-live="polite"></span>
        <input class="album__scrub" id="albumScrub" type="range" min="0" max="${total - 1}" step="1" value="0"
               aria-label="Ir a una página del álbum">
        <button class="album__btn" id="albumMode" type="button" aria-pressed="false"></button>
        <button class="album__btn" id="albumZoom" type="button">🔍 Ampliar</button>
      </div>
    </section>
  `;

  const section = container.querySelector('.album');
  section.style.setProperty('--flip-duration', `${FLIP_MS}ms`);
  const stage = container.querySelector('#albumStage');
  const surface = container.querySelector('#albumSurface');
  const hint = container.querySelector('#albumHint');
  const counter = container.querySelector('#albumCounter');
  const scrub = container.querySelector('#albumScrub');
  const prevBtn = container.querySelector('#albumPrev');
  const nextBtn = container.querySelector('#albumNext');
  const modeBtn = container.querySelector('#albumMode');
  const zoomBtn = container.querySelector('#albumZoom');

  function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    listeners.push([target, type, handler, options]);
  }

  // ---------------------------------------------------------------
  // Estado y navegación
  // ---------------------------------------------------------------
  /** Hojas giradas equivalentes a la página actual (modo libro). */
  const flippedCount = () => Math.ceil(page / 2);

  function goTo(next, { animate = true } = {}) {
    const clamped = Math.max(0, Math.min(total - 1, next));
    page = mode === 'spread' ? Math.min(2 * Math.ceil(clamped / 2), total - 1) : clamped;
    paint({ animate });
  }

  const goNext = () => goTo(mode === 'spread' ? page + 2 : page + 1);
  const goPrev = () => goTo(mode === 'spread' ? page - 2 : page - 1);

  const atStart = () => page <= 0;
  const atEnd = () => (mode === 'spread' ? flippedCount() >= sheetCount : page >= total - 1);

  /** Números de página visibles, en base 1 ("52 · 53" o "1"). */
  function visibleLabel() {
    if (mode !== 'spread') return String(page + 1);
    const flipped = flippedCount();
    const visible = [];
    if (flipped > 0) visible.push(2 * flipped - 1);       // dorso de la última hoja girada
    if (2 * flipped < total) visible.push(2 * flipped);    // cara de la hoja siguiente
    return visible.map((index) => index + 1).join(' · ');
  }

  // ---------------------------------------------------------------
  // Construcción del DOM según el modo
  // ---------------------------------------------------------------
  /**
   * El modo depende del hueco real del lector, no de la ventana: es el ancho
   * que de verdad decide si una hoja se puede leer.
   */
  function autoMode() {
    const width = stage.clientWidth || window.innerWidth;
    return width >= SPREAD_MIN_WIDTH ? 'spread' : 'single';
  }

  function readStoredMode() {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === 'single' || stored === 'spread') return stored;
    } catch { /* almacenamiento no disponible */ }
    return autoMode();
  }

  function storeMode(value) {
    try { localStorage.setItem(MODE_KEY, value); } catch { /* ignorar */ }
  }

  function buildSurface() {
    if (mode === 'single') {
      surface.innerHTML = `
        <div class="album__viewport">
          <div class="album__track" id="albumTrack">
            ${pages.map((_, i) => `
              <div class="album__slide" data-page="${i}" data-label="${pageLabel(i)}">
                <div class="album__spinner" aria-hidden="true"></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="album__touch" id="albumTouch">
          <span data-zone="prev"></span><span data-zone="zoom"></span><span data-zone="next"></span>
        </div>
      `;
      hint.textContent = 'Desliza para pasar de página, toca el centro para ampliar.';
    } else {
      let sheets = '';
      for (let s = 0; s < sheetCount; s++) {
        sheets += `
          <div class="album-page" data-sheet="${s}"
               style="--z-normal: ${sheetCount - s}; --z-flipped: ${s + 1};">
            <div class="page-front" data-page="${s * 2}"></div>
            <div class="page-back" data-page="${s * 2 + 1}">
              ${s * 2 + 1 < total ? '' : '<div class="page-empty"></div>'}
            </div>
          </div>
        `;
      }
      surface.innerHTML = `
        <div class="album__book-wrap">
          <div class="album__book"><div class="album__book-inner" id="albumBook">${sheets}</div></div>
          <div class="album__touch" id="albumTouch">
            <span data-zone="prev"></span><span data-zone="next"></span>
          </div>
        </div>
      `;
      hint.textContent = 'Haz clic o desliza a los lados para pasar las hojas. También sirven las flechas del teclado.';
    }

    section.dataset.mode = mode;
    modeBtn.textContent = mode === 'single' ? '📖 Doble página' : '📄 Una página';
    modeBtn.setAttribute('aria-pressed', mode === 'spread' ? 'true' : 'false');
    bindStage();
    measure();
  }

  function setMode(next, { remember = true } = {}) {
    if (next === mode) return;
    mode = next;
    if (remember) storeMode(next);
    buildSurface();
    goTo(page, { animate: false });
  }

  // ---------------------------------------------------------------
  // Pintado: ventana de imágenes + posición
  // ---------------------------------------------------------------
  function slotFor(index) {
    return surface.querySelector(mode === 'single'
      ? `.album__slide[data-page="${index}"]`
      : `[data-page="${index}"]`);
  }

  function loadPage(index) {
    if (index < 0 || index >= total) return;
    const slot = slotFor(index);
    if (!slot || slot.querySelector('img')) return;

    const img = document.createElement('img');
    img.alt = `${albumName} — ${pageLabel(index)}`;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('load', () => slot.classList.add('is-loaded'), { once: true });
    img.addEventListener('error', () => slot.classList.add('is-loaded'), { once: true });
    img.src = pages[index];
    slot.appendChild(img);
  }

  function unloadPage(index) {
    const slot = slotFor(index);
    const img = slot && slot.querySelector('img');
    if (!img) return;
    img.remove();
    slot.classList.remove('is-loaded');
  }

  function paintWindow() {
    // En modo libro la referencia es la hoja, así que ampliamos la ventana.
    const span = mode === 'spread' ? LOAD_WINDOW * 2 + 1 : LOAD_WINDOW;
    for (let i = 0; i < total; i++) {
      const distance = Math.abs(i - page);
      if (distance <= span) loadPage(i);
      else if (distance > KEEP_WINDOW) unloadPage(i);
    }
  }

  function paint({ animate = true } = {}) {
    // Primero las imágenes: así la hoja que va a girar ya tiene su foto puesta
    // y no aparece a medio giro.
    paintWindow();

    if (mode === 'single') {
      const track = surface.querySelector('#albumTrack');
      if (track) {
        track.classList.toggle('is-animating', animate);
        track.style.setProperty('--offset', `${-page * slideWidth}px`);
        track.style.setProperty('--drag', '0px');
        clearTimeout(animTimer);
        if (animate) animTimer = setTimeout(() => track.classList.remove('is-animating'), 380);
      }
    } else {
      paintSpread(animate);
    }

    counter.innerHTML = `${visibleLabel()} <small>/ ${total}</small>`;
    scrub.value = String(page);
    prevBtn.disabled = atStart();
    nextBtn.disabled = atEnd();
  }

  /**
   * Coloca las hojas del libro.
   *
   * El z-index de la hoja que gira se sube a mano durante el giro en vez de
   * conmutarlo a mitad de la animación con un `transition: z-index`: ese salto
   * era lo que producía el parpadeo. Y si cambian varias hojas de golpe (al
   * arrastrar la barra) se aplica sin animación, porque ver 20 páginas girando
   * a la vez no aporta nada y satura la GPU.
   */
  function paintSpread(animate) {
    const flipped = flippedCount();
    const sheets = surface.querySelectorAll('.album-page');
    const cambian = [];

    sheets.forEach((sheet, index) => {
      const shouldFlip = index < flipped;
      if (sheet.classList.contains('flipped') !== shouldFlip) cambian.push([sheet, shouldFlip]);
    });

    if (!cambian.length) return;

    const book = surface.querySelector('#albumBook');
    const salto = !animate || cambian.length > 1;

    if (salto && book) book.classList.add('is-jumping');

    cambian.forEach(([sheet, shouldFlip]) => {
      sheet.classList.toggle('flipped', shouldFlip);

      if (salto) return;
      // Hoja en movimiento siempre por encima del resto mientras dura el giro.
      sheet.style.zIndex = String(sheetCount + 10);
      clearTimeout(sheet.dataset.timer);
      const timer = setTimeout(() => { sheet.style.zIndex = ''; }, FLIP_MS);
      sheet.dataset.timer = String(timer);
    });

    if (salto && book) {
      // Forzamos el reflujo para que el cambio se aplique sin transición.
      void book.offsetWidth;
      book.classList.remove('is-jumping');
    }
  }

  function measure() {
    const viewport = surface.querySelector('.album__viewport');
    slideWidth = viewport ? viewport.clientWidth : stage.clientWidth;
    if (mode === 'single') {
      const track = surface.querySelector('#albumTrack');
      if (track) {
        track.classList.remove('is-animating');
        track.style.setProperty('--offset', `${-page * slideWidth}px`);
      }
    }
  }

  // ---------------------------------------------------------------
  // Gestos
  // ---------------------------------------------------------------
  function bindStage() {
    const touch = surface.querySelector('#albumTouch');
    if (!touch) return;

    let start = null;
    let axis = null;

    touch.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      // Guardamos la zona ahora: con pointer capture, los eventos siguientes
      // apuntan al overlay y ya no al <span> pulsado.
      start = {
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
        zone: event.target.dataset ? event.target.dataset.zone : null
      };
      axis = null;
      try { touch.setPointerCapture(event.pointerId); } catch { /* ignorar */ }
      const track = surface.querySelector('#albumTrack');
      if (track) track.classList.remove('is-animating');
    });

    touch.addEventListener('pointermove', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (!axis && Math.hypot(dx, dy) > 8) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis !== 'x' || mode !== 'single') return;

      // Arrastre elástico en los extremos.
      let delta = dx;
      if ((page === 0 && dx > 0) || (page === total - 1 && dx < 0)) delta = dx * 0.28;
      const track = surface.querySelector('#albumTrack');
      if (track) track.style.setProperty('--drag', `${delta}px`);
    });

    function finish(event) {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const elapsed = Date.now() - start.time;
      const moved = Math.hypot(dx, dy);
      const wasAxisX = axis === 'x';
      const zone = start.zone;
      start = null;
      axis = null;

      // Toque limpio: usamos la zona pulsada.
      if (moved < 12 && elapsed < 500) {
        if (zone === 'prev') goPrev();
        else if (zone === 'next') goNext();
        else if (zone === 'zoom') openPages();
        else paint({ animate: true });
        return;
      }

      if (!wasAxisX) {
        paint({ animate: true });
        return;
      }

      // Deslizamiento: umbral por distancia o por velocidad.
      const threshold = Math.max(45, (slideWidth || 300) * 0.18);
      const fast = elapsed < 320 && Math.abs(dx) > 30;
      if (dx <= -threshold || (fast && dx < 0)) goNext();
      else if (dx >= threshold || (fast && dx > 0)) goPrev();
      else paint({ animate: true });
    }

    touch.addEventListener('pointerup', finish);
    touch.addEventListener('pointercancel', () => {
      start = null;
      axis = null;
      paint({ animate: true });
    });
  }

  function openPages() {
    openLightbox({
      items: pages.map((src, i) => ({ src, label: pageLabel(i) })),
      index: page,
      hint: 'Pinza o rueda para ampliar · desliza para pasar de página'
    });
  }

  // ---------------------------------------------------------------
  // Controles y ciclo de vida
  // ---------------------------------------------------------------
  // El modo automático solo manda mientras el usuario no elija uno.
  let userPicked = hasStoredMode();

  on(prevBtn, 'click', goPrev);
  on(nextBtn, 'click', goNext);
  on(zoomBtn, 'click', openPages);
  on(modeBtn, 'click', () => {
    userPicked = true;
    setMode(mode === 'single' ? 'spread' : 'single');
  });
  on(scrub, 'input', () => goTo(Number(scrub.value), { animate: false }));

  on(document, 'keydown', (event) => {
    if (!container.isConnected) return;
    if (document.querySelector('.lightbox')) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!isStageVisible()) return;

    if (event.key === 'ArrowRight') goNext();
    else if (event.key === 'ArrowLeft') goPrev();
    else if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(total - 1);
    else return;
    event.preventDefault();
  });

  function isStageVisible() {
    const rect = stage.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      measure();
      if (!userPicked && autoMode() !== mode) setMode(autoMode(), { remember: false });
    });
    resizeObserver.observe(stage);
  } else {
    on(window, 'resize', measure);
  }

  mode = readStoredMode();
  buildSurface();
  paint({ animate: false });

  return {
    destroy() {
      clearTimeout(animTimer);
      if (resizeObserver) resizeObserver.disconnect();
      listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
      listeners = [];
    }
  };
}

function hasStoredMode() {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    return stored === 'single' || stored === 'spread';
  } catch {
    return false;
  }
}

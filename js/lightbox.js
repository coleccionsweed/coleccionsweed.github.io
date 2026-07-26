/**
 * Visor a pantalla completa reutilizable (álbum, galería del detalle y cromos).
 * Soporta: zoom con rueda, pinch con dos dedos, doble toque, arrastrar para
 * desplazar la imagen ampliada, deslizar para cambiar y teclado.
 */

import { chevron } from './translations.js';

const MAX_SCALE = 5;
const MIN_SCALE = 1;

let current = null;

export function openLightbox({ items, index = 0, hint = '' }) {
  if (!items || !items.length) return;
  closeLightbox();

  const state = {
    items,
    index: Math.max(0, Math.min(index, items.length - 1)),
    scale: 1,
    tx: 0,
    ty: 0,
    pointers: new Map(),
    pinchStart: null,
    dragStart: null,
    lastTap: 0
  };

  const root = document.createElement('div');
  root.className = 'lightbox';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Visor de imagen');
  root.innerHTML = `
    <div class="lightbox__stage">
      <img class="lightbox__img" alt="" draggable="false">
    </div>
    <button class="lightbox__close" type="button" aria-label="Cerrar (Esc)">✕</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Anterior">${chevron('left')}</button>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Siguiente">${chevron('right')}</button>
    <div class="lightbox__bar">
      <b class="lightbox__label"></b>
      <span class="lightbox__hint">${hint || 'Rueda o pinza para ampliar · doble toque para acercar'}</span>
    </div>
  `;

  const stage = root.querySelector('.lightbox__stage');
  const img = root.querySelector('.lightbox__img');
  const label = root.querySelector('.lightbox__label');
  const prevBtn = root.querySelector('.lightbox__nav--prev');
  const nextBtn = root.querySelector('.lightbox__nav--next');

  function applyTransform() {
    img.style.setProperty('--scale', state.scale);
    img.style.setProperty('--tx', `${state.tx}px`);
    img.style.setProperty('--ty', `${state.ty}px`);
    stage.classList.toggle('is-zoomed', state.scale > 1.01);
  }

  function clampPan() {
    // Medimos el tamaño maquetado (offsetWidth no lo altera el transform) y lo
    // multiplicamos por la escala: así el límite es correcto aunque la
    // transición CSS esté a medias.
    const maxX = Math.max(0, (img.offsetWidth * state.scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * state.scale - stage.clientHeight) / 2);
    state.tx = Math.max(-maxX, Math.min(maxX, state.tx));
    state.ty = Math.max(-maxY, Math.min(maxY, state.ty));
  }

  function resetZoom() {
    state.scale = 1;
    state.tx = 0;
    state.ty = 0;
    applyTransform();
  }

  function show(nextIndex, { keepZoom = false } = {}) {
    state.index = (nextIndex + state.items.length) % state.items.length;
    const item = state.items[state.index];
    img.src = typeof item === 'string' ? item : item.src;
    img.alt = (typeof item === 'string' ? '' : item.label) || '';
    const name = typeof item === 'string' ? '' : item.label || '';
    label.textContent = state.items.length > 1
      ? `${name ? name + ' · ' : ''}${state.index + 1} / ${state.items.length}`
      : name || '';
    const single = state.items.length <= 1;
    prevBtn.disabled = single;
    nextBtn.disabled = single;
    if (!keepZoom) resetZoom();
  }

  function setZoom(nextScale, originX, originY) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
    if (clamped === state.scale) return;

    if (typeof originX === 'number') {
      // Mantenemos fijo el punto bajo el cursor/dedo al ampliar.
      const rect = stage.getBoundingClientRect();
      const cx = originX - rect.left - rect.width / 2;
      const cy = originY - rect.top - rect.height / 2;
      const ratio = clamped / state.scale;
      state.tx = cx - (cx - state.tx) * ratio;
      state.ty = cy - (cy - state.ty) * ratio;
    }

    state.scale = clamped;
    if (clamped === 1) {
      state.tx = 0;
      state.ty = 0;
    } else {
      clampPan();
    }
    applyTransform();
  }

  // --- Rueda del ratón ---
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(state.scale * (event.deltaY < 0 ? 1.18 : 1 / 1.18), event.clientX, event.clientY);
  }, { passive: false });

  // --- Punteros: arrastrar, pinza y deslizar ---
  stage.addEventListener('pointerdown', (event) => {
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    // Capturar puede fallar si el puntero ya no está activo: no debe cortar el gesto.
    try { stage.setPointerCapture(event.pointerId); } catch { /* ignorar */ }

    if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      state.pinchStart = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: state.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2
      };
      state.dragStart = null;
    } else if (state.pointers.size === 1) {
      state.dragStart = { x: event.clientX, y: event.clientY, tx: state.tx, ty: state.ty, time: Date.now() };
      img.classList.add('is-dragging');
    }
  });

  stage.addEventListener('pointermove', (event) => {
    if (!state.pointers.has(event.pointerId)) return;
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.pointers.size === 2 && state.pinchStart) {
      const [a, b] = [...state.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(state.pinchStart.scale * (dist / state.pinchStart.dist), state.pinchStart.cx, state.pinchStart.cy);
      return;
    }

    if (state.pointers.size === 1 && state.dragStart && state.scale > 1.01) {
      stage.classList.add('is-panning');
      state.tx = state.dragStart.tx + (event.clientX - state.dragStart.x);
      state.ty = state.dragStart.ty + (event.clientY - state.dragStart.y);
      clampPan();
      applyTransform();
    }
  });

  function endPointer(event) {
    const start = state.dragStart;
    state.pointers.delete(event.pointerId);
    if (state.pointers.size < 2) state.pinchStart = null;
    if (state.pointers.size === 0) {
      state.dragStart = null;
      img.classList.remove('is-dragging');
      stage.classList.remove('is-panning');
    }

    if (!start || state.scale > 1.01) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = Date.now() - start.time;

    // Deslizar en horizontal cambia de imagen.
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4 && state.items.length > 1) {
      show(state.index + (dx < 0 ? 1 : -1));
      return;
    }

    // Un toque limpio: doble toque amplía, toque simple cierra.
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 400) {
      const now = Date.now();
      if (now - state.lastTap < 300) {
        state.lastTap = 0;
        setZoom(2.6, event.clientX, event.clientY);
      } else {
        state.lastTap = now;
        setTimeout(() => {
          if (state.lastTap && Date.now() - state.lastTap >= 280 && state.scale <= 1.01) closeLightbox();
        }, 300);
      }
    }
  }

  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('dblclick', (event) => {
    event.preventDefault();
    if (state.scale > 1.01) resetZoom();
    else setZoom(2.6, event.clientX, event.clientY);
  });

  prevBtn.addEventListener('click', () => show(state.index - 1));
  nextBtn.addEventListener('click', () => show(state.index + 1));
  root.querySelector('.lightbox__close').addEventListener('click', closeLightbox);

  function onKey(event) {
    switch (event.key) {
      case 'Escape': closeLightbox(); break;
      case 'ArrowRight': show(state.index + 1); break;
      case 'ArrowLeft': show(state.index - 1); break;
      case '+': case '=': setZoom(state.scale * 1.3); break;
      case '-': setZoom(state.scale / 1.3); break;
      case '0': resetZoom(); break;
      default: return;
    }
    event.preventDefault();
  }

  document.addEventListener('keydown', onKey);
  document.body.classList.add('no-scroll');
  document.body.appendChild(root);
  show(state.index);
  root.querySelector('.lightbox__close').focus({ preventScroll: true });

  current = { root, onKey };
}

export function closeLightbox() {
  if (!current) return;
  document.removeEventListener('keydown', current.onKey);
  current.root.remove();
  document.body.classList.remove('no-scroll');
  current = null;
}

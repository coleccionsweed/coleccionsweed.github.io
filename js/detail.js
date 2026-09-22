import { renderStickers } from './stickers.js';
import { renderAlbumFlip, destroyAlbumFlip } from './albumFlip.js';
import { openLightbox } from './lightbox.js';
import { catCorta, catIcono, etiquetaCampo, chevron } from './translations.js';
import { formatPrice } from './dataLoader.js';
import { renderStrip } from './renderer.js';

const MAX_IMAGES = 24;

const CAMPOS_OCULTOS = new Set([
  'id', 'name', 'franchise', 'folder', 'category', 'tags', 'notes',
  'priceValue', 'totalValue', 'yearValue', 'image', 'searchText',
  'purchasePrice', 'year', 'brand', 'quantity', 'condition'
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escapa el texto y DESPUÉS convierte en enlaces las URLs que contenga.
 *
 * Es el orden importante: escapar primero deja el texto inerte (un <script>
 * escrito en las notas no puede hacer nada), y solo entonces se añade el
 * marcado que sí queremos. Al revés, cualquier cosa escrita en el JSON de
 * datos acabaría ejecutándose en la página.
 *
 * Se reconocen tanto las URLs con esquema (https://...) como las que empiezan
 * por www., porque en unas notas escritas a mano aparecen de las dos formas.
 */
function escapeHtmlWithLinks(value) {
  const escapado = escapeHtml(value);
  // El paréntesis y los signos finales se excluyen a propósito: una URL al
  // final de una frase se escribe muchas veces seguida de punto o coma, y sin
  // esto se los tragaba el enlace y el destino quedaba roto.
  return escapado.replace(/\b(https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]]/gi, (url) => {
    const destino = url.startsWith('www.') ? `https://${url}` : url;
    return `<a href="${destino}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

/** Copia al portapapeles con respaldo para navegadores sin permiso o sin HTTPS. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* probamos el método antiguo */ }

  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Busca las imágenes 1.webp, 2.webp… en paralelo por tandas.
 * La versión anterior las pedía de una en una esperando cada 404.
 */
async function findImages(item) {
  const found = [];
  const BATCH = 6;

  for (let start = 1; start <= MAX_IMAGES; start += BATCH) {
    const batch = [];
    for (let i = start; i < start + BATCH && i <= MAX_IMAGES; i++) {
      const src = `images/${item.category}/${item.folder}/${i}.webp`;
      batch.push(imageExists(src).then((exists) => (exists ? src : null)));
    }

    const results = await Promise.all(batch);
    const cut = results.indexOf(null);
    found.push(...(cut === -1 ? results : results.slice(0, cut)));
    if (cut !== -1) break;
  }

  return found.length ? found : [`images/${item.category}/${item.folder}/1.webp`];
}

export async function renderDetail(item, context = {}) {
  destroyAlbumFlip();

  const { prev = null, next = null, onNavigate = null, collection = [] } = context;

  // En la ficha no pintamos ni filtros, ni totales de la colección, ni el 3D.
  ['toolbar', 'items-counter', 'viewer3d', 'siteFooter'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.classList.add('hidden');
  });

  const grid = document.getElementById('collectionGrid');

  const images = await findImages(item);

  // --- Contexto: qué más hay de esta franquicia / categoría ---
  const sameFranchise = item.franchise
    ? collection.filter((entry) => entry.franchise === item.franchise && entry.id !== item.id)
    : [];
  const sameCategory = collection.filter((entry) => entry.category === item.category && entry.id !== item.id);

  const franchiseTotal = item.franchise
    ? collection.filter((entry) => entry.franchise === item.franchise).reduce((sum, entry) => sum + entry.totalValue, 0)
    : 0;

  // --- Etiquetas destacadas ---
  const tags = [];
  if (item.franchise) {
    tags.push(`<a class="tag tag--accent" href="?fran=${encodeURIComponent(item.franchise)}">${catIcono(item.category)} ${escapeHtml(item.franchise)}</a>`);
  }
  if (item.year) tags.push(`<span class="tag">📅 ${escapeHtml(item.year)}</span>`);
  if (item.brand) tags.push(`<span class="tag">🏷️ ${escapeHtml(item.brand)}</span>`);
  if (item.condition) tags.push(`<span class="tag">${item.condition === 'Usado' ? '🟡' : '🟢'} ${escapeHtml(item.condition)}</span>`);
  if (item.quantity > 1) tags.push(`<span class="tag">×${item.quantity} unidades</span>`);
  if (item.priceValue > 0) {
    const unit = item.quantity > 1 ? ` <small>(${formatPrice(item.priceValue)} c/u)</small>` : '';
    tags.push(`<span class="tag tag--price">💰 ${formatPrice(item.totalValue)}${unit}</span>`);
  }

  // --- Resto de campos del JSON, en su rejilla ---
  const infoBlocks = [
    `<div><span>Categoría</span><b>${catIcono(item.category)} ${escapeHtml(catCorta(item.category))}</b></div>`
  ];

  Object.keys(item).forEach((key) => {
    if (CAMPOS_OCULTOS.has(key)) return;
    const value = item[key];
    if (value === undefined || value === null || value === '') return;

    if (key === 'barcode') {
      infoBlocks.push(`
        <div>
          <span>${etiquetaCampo(key)}</span>
          <button class="copy-btn" type="button" data-copy="${escapeHtml(value)}">
            <span class="num">${escapeHtml(value)}</span><small>copiar</small>
          </button>
        </div>
      `);
      return;
    }

    infoBlocks.push(`<div><span>${etiquetaCampo(key)}</span><b>${escapeHtml(value)}</b></div>`);
  });

  grid.className = '';
  grid.innerHTML = `
    <div class="detail-container">
      <div class="detail-header">
        <button id="backBtn" class="back-btn" type="button">${chevron('left')} Volver a la galería</button>
        <div class="detail-nav">
          <button id="prevItem" type="button" aria-label="Objeto anterior" ${prev ? '' : 'disabled'}>${chevron('left')}</button>
          <button id="nextItem" type="button" aria-label="Objeto siguiente" ${next ? '' : 'disabled'}>${chevron('right')}</button>
        </div>
      </div>

      <div class="detail">
        <div class="gallery">
          <div class="slider" id="slider">
            <button class="nav prev" type="button" aria-label="Imagen anterior" ${images.length <= 1 ? 'hidden' : ''}>${chevron('left')}</button>
            <div class="slider-window">
              <img id="sliderImage" src="${images[0]}" alt="${escapeHtml(item.name)}" draggable="false">
            </div>
            <button class="nav next" type="button" aria-label="Imagen siguiente" ${images.length <= 1 ? 'hidden' : ''}>${chevron('right')}</button>
            <button class="slider__zoom" id="sliderZoom" type="button" aria-label="Ver a pantalla completa">⤢</button>
            ${images.length > 1 ? `<span class="slider__count num" id="sliderCount">1 / ${images.length}</span>` : ''}
          </div>

          ${images.length > 1 ? `
            <div class="thumbs" id="thumbs">
              ${images.map((src, i) => `
                <button class="thumb" type="button" data-index="${i}" aria-current="${i === 0}" aria-label="Imagen ${i + 1}">
                  <img src="${src}" alt="" loading="lazy" decoding="async">
                </button>
              `).join('')}
            </div>` : ''}
        </div>

        <div class="info-card">
          <h1>${escapeHtml(item.name)}</h1>
          <p class="subtitle">${escapeHtml(item.franchise || item.brand || '')}</p>

          ${item.franchise && sameFranchise.length ? `
            <p class="detail-context">
              <strong class="num">${sameFranchise.length + 1}</strong> objetos de ${escapeHtml(item.franchise)}
              <span class="results-bar__sep">·</span>
              <span class="num">${formatPrice(franchiseTotal)}</span> invertidos
            </p>` : ''}

          <div class="detail-tags">${tags.join('')}</div>
          <div class="info-grid">${infoBlocks.join('')}</div>

          ${item.notes ? `<div class="notes"><strong>Notas</strong>${escapeHtmlWithLinks(item.notes)}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  // --- Navegación ---
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = '';
  });

  const prevItemBtn = document.getElementById('prevItem');
  const nextItemBtn = document.getElementById('nextItem');
  if (prev && onNavigate) prevItemBtn.addEventListener('click', () => onNavigate(prev));
  if (next && onNavigate) nextItemBtn.addEventListener('click', () => onNavigate(next));

  // --- Copiar código de barras ---
  grid.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const small = button.querySelector('small');
      small.textContent = (await copyText(button.dataset.copy)) ? '¡copiado!' : 'no se pudo copiar';
      setTimeout(() => { small.textContent = 'copiar'; }, 1800);
    });
  });

  // --- Galería: flechas, miniaturas, deslizamiento, teclado y zoom ---
  setupGallery(images, item.name);

  // --- Extras de las colecciones de cromos ---
  if (item.category === 'card-collection') {
    const albumWrapper = document.createElement('div');
    albumWrapper.id = 'album-flip-container';
    albumWrapper.className = 'section';
    grid.appendChild(albumWrapper);
    await renderAlbumFlip('album-flip-container', item);
    if (!albumWrapper.childElementCount) albumWrapper.remove();

    const stickersWrapper = document.createElement('div');
    stickersWrapper.id = 'stickers-container';
    stickersWrapper.className = 'section';
    grid.appendChild(stickersWrapper);
    renderStickers('stickers-container', item.folder);
    if (!stickersWrapper.childElementCount) stickersWrapper.remove();
  }

  // --- Objetos relacionados ---
  addStrip(grid, `Más de ${item.franchise}`, sameFranchise, `?fran=${encodeURIComponent(item.franchise || '')}`);
  // Si ya se ha visto casi toda la franquicia, la categoría aporta más.
  if (sameFranchise.length < 12) {
    const resto = sameCategory.filter((entry) => entry.franchise !== item.franchise);
    addStrip(grid, `Más en ${catCorta(item.category)}`, resto, `?cat=${encodeURIComponent(item.category)}`);
  }
}

/** Añade una tira horizontal de objetos relacionados, si hay suficientes. */
function addStrip(grid, title, items, href) {
  if (items.length < 2) return;

  const section = document.createElement('section');
  section.className = 'section';
  section.innerHTML = `
    <div class="section__head">
      <h3 class="section__title">${escapeHtml(title)}</h3>
      <span class="section__count">${items.length}</span>
      ${items.length > 12 ? `<a class="section__more" href="${href}">Ver todos →</a>` : ''}
    </div>
  `;

  renderStrip(section, items.slice(0, 12));
  grid.appendChild(section);
}

function setupGallery(images, name) {
  const slider = document.getElementById('slider');
  const img = document.getElementById('sliderImage');
  const count = document.getElementById('sliderCount');
  const thumbs = document.getElementById('thumbs');
  const zoomBtn = document.getElementById('sliderZoom');
  let index = 0;

  img.addEventListener('error', () => { img.style.opacity = '0.15'; }, { once: true });

  function show(next) {
    index = (next + images.length) % images.length;
    img.classList.add('is-swapping');
    const loader = new Image();
    loader.onload = loader.onerror = () => {
      img.src = images[index];
      img.classList.remove('is-swapping');
    };
    loader.src = images[index];

    if (count) count.textContent = `${index + 1} / ${images.length}`;
    if (thumbs) {
      thumbs.querySelectorAll('.thumb').forEach((thumb, i) => {
        thumb.setAttribute('aria-current', String(i === index));
        if (i === index) thumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      });
    }
  }

  zoomBtn.addEventListener('click', () => {
    openLightbox({ items: images.map((src) => ({ src, label: name })), index });
  });

  if (images.length > 1) {
    slider.querySelector('.prev').addEventListener('click', () => show(index - 1));
    slider.querySelector('.next').addEventListener('click', () => show(index + 1));

    if (thumbs) {
      thumbs.addEventListener('click', (event) => {
        const thumb = event.target.closest('.thumb');
        if (thumb) show(Number(thumb.dataset.index));
      });
    }

    // Deslizamiento horizontal sobre la imagen.
    let start = null;
    slider.addEventListener('pointerdown', (event) => {
      start = { x: event.clientX, y: event.clientY };
    });
    slider.addEventListener('pointerup', (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    });

    document.addEventListener('keydown', function onKey(event) {
      if (!slider.isConnected) {
        document.removeEventListener('keydown', onKey);
        return;
      }
      if (document.querySelector('.lightbox')) return;
      // Las flechas del álbum tienen prioridad si está a la vista.
      const album = document.getElementById('albumStage');
      if (album) {
        const rect = album.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) return;
      }
      if (event.key === 'ArrowRight') show(index + 1);
      else if (event.key === 'ArrowLeft') show(index - 1);
      else return;
      event.preventDefault();
    });
  }
}

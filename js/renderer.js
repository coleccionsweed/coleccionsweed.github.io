import { catCorta, catIcono } from './translations.js';
import { formatPrice } from './dataLoader.js';

const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23e8ecf2" stroke-width="1.4">' +
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 16l5-4 4 3 3-2 6 5"/><circle cx="9" cy="9" r="1.6"/></svg>'
  );

let currentView = 'grid';
let queryWords = [];
let lastRendered = [];

export function setView(view) {
  currentView = view === 'list' ? 'list' : 'grid';
}

export function getView() {
  return currentView;
}

/** Palabras de la búsqueda activa, para resaltarlas en los títulos. */
export function setQuery(term) {
  const clean = (term || '').trim().toLowerCase();
  queryWords = clean ? clean.split(/\s+/).filter((w) => w.length > 1) : [];
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Escapa y además envuelve en <mark> lo que coincide con la búsqueda. */
function highlight(value) {
  const safe = escapeHtml(value);
  if (!queryWords.length) return safe;

  const pattern = new RegExp(`(${queryWords.map(escapeRegex).join('|')})`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
}

/** Evita repetir el mismo texto en título y subtítulo. */
function subtitleFor(item) {
  const franchise = item.franchise || '';
  if (franchise && !item.name.toLowerCase().startsWith(franchise.toLowerCase())) return franchise;
  return item.brand || franchise || '';
}

function extraBadge(item) {
  if (item.grade) return `<span class="badge badge--album">🏅 Grade ${escapeHtml(item.grade)}</span>`;
  if (item.platform) return `<span class="badge">${escapeHtml(item.platform)}</span>`;
  return '';
}

function cardMarkup(item, variant) {
  const price = item.priceValue > 0 ? formatPrice(item.priceValue) : '';
  const conditionClass = (item.condition || '').toLowerCase() === 'usado' ? 'usado' : 'nuevo';

  const media = `
    <div class="card-media">
      <div class="card-badges">
        <span class="badge badge--cat">${catIcono(item.category)} ${escapeHtml(catCorta(item.category))}</span>
        ${item.quantity > 1 ? `<span class="badge badge--qty">×${item.quantity}</span>` : ''}
      </div>
      <img class="card-image" src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
      ${price ? `<span class="card-price">${price}</span>` : ''}
    </div>
  `;

  if (variant === 'list') {
    return `
      ${media}
      <div class="card-content">
        <div class="card-main">
          <div class="card-title">${highlight(item.name)}</div>
          <div class="card-subtitle">${escapeHtml(subtitleFor(item))}</div>
        </div>
        <div class="card-cols">
          <span class="col-cat">${catIcono(item.category)} ${escapeHtml(catCorta(item.category))}</span>
          <span class="col-year num">${escapeHtml(item.year || '—')}</span>
          <span class="col-price num">${price || '—'}</span>
        </div>
      </div>
    `;
  }

  return `
    ${media}
    <div class="card-content">
      <div class="card-title">${highlight(item.name)}</div>
      <div class="card-subtitle">${escapeHtml(subtitleFor(item) || '—')}</div>
      <div class="card-meta">
        <span class="state-dot state-dot--${conditionClass}" title="${escapeHtml(item.condition || '')}"></span>
        ${item.year ? `<span class="num">${escapeHtml(item.year)}</span><span class="dot"></span>` : ''}
        <span>${escapeHtml(item.brand || item.author || item.language || '')}</span>
        ${extraBadge(item)}
      </div>
    </div>
  `;
}

/**
 * Crea una tarjeta. `variant` fuerza el aspecto: la tira de relacionados usa
 * siempre el formato de cuadrícula aunque la galería esté en modo lista.
 */
export function createCard(item, variant = currentView) {
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.setAttribute('role', 'link');
  card.dataset.id = item.id;
  card.innerHTML = cardMarkup(item, variant);

  const img = card.querySelector('.card-image');
  img.addEventListener('error', () => {
    img.src = PLACEHOLDER;
    img.classList.add('is-missing');
  }, { once: true });

  const open = () => { window.location.hash = item.id; };
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

/** ¿La nueva lista es la anterior más elementos al final? */
function isAppendOf(next, previous) {
  if (!previous.length || next.length <= previous.length) return false;
  return previous.every((item, index) => next[index] === item);
}

export function renderItems(items) {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;

  const className = currentView === 'list' ? 'collection-grid is-list' : 'collection-grid';
  const sameView = grid.className === className;

  if (!items.length) {
    grid.className = className;
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <h3>No hay nada que coincida</h3>
        <p>Prueba con otra búsqueda o quita algún filtro.</p>
      </div>
    `;
    lastRendered = [];
    return;
  }

  // El scroll infinito solo añade al final: repintar las 400 tarjetas
  // anteriores en cada tanda sería tirar trabajo a la basura.
  const append = sameView && isAppendOf(items, lastRendered);
  const pending = append ? items.slice(lastRendered.length) : items;

  const fragment = document.createDocumentFragment();
  pending.forEach((item) => {
    const card = createCard(item);
    card.classList.add('is-entering');
    // La clase se retira al acabar para no dejar estado de animación colgando.
    card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });
    fragment.appendChild(card);
  });

  if (append) {
    grid.appendChild(fragment);
  } else {
    grid.className = className;
    grid.replaceChildren(fragment);
  }

  lastRendered = items.slice();
}

export function renderSkeletons(count = 12) {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  lastRendered = [];
  grid.className = 'collection-grid';
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton-card__media"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-line w-70"></div>
        <div class="skeleton-line w-45"></div>
      </div>
    </div>
  `).join('');
}

/** Tira horizontal de tarjetas (objetos relacionados de la ficha). */
export function renderStrip(container, items) {
  const strip = document.createElement('div');
  strip.className = 'strip';
  items.forEach((item) => {
    const card = createCard(item, 'grid');
    card.classList.add('strip__card');
    strip.appendChild(card);
  });
  container.appendChild(strip);
}

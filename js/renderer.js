import { catCorta, catIcono } from './translations.js';
import { formatPrice } from './dataLoader.js';

const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23e8ecf4" stroke-width="1.4">' +
    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 16l5-4 4 3 3-2 6 5"/><circle cx="9" cy="9" r="1.6"/></svg>'
  );

let currentView = 'grid';

export function setView(view) {
  currentView = view === 'list' ? 'list' : 'grid';
}

export function getView() {
  return currentView;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Marca los álbumes escaneados y otros extras que aportan contexto visual. */
function extraBadge(item) {
  if (item.grade) return `<span class="badge badge--album">🏅 Grade ${escapeHtml(item.grade)}</span>`;
  if (item.platform) return `<span class="badge">${escapeHtml(item.platform)}</span>`;
  return '';
}

/** Evita repetir el mismo texto en título y subtítulo. */
function subtitleFor(item) {
  const franchise = item.franchise || '';
  if (franchise && !item.name.toLowerCase().startsWith(franchise.toLowerCase())) return franchise;
  return item.brand || franchise || '';
}

function cardMarkup(item) {
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

  if (currentView === 'list') {
    return `
      ${media}
      <div class="card-content">
        <div class="card-main">
          <div class="card-title">${escapeHtml(item.name)}</div>
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
      <div class="card-title">${escapeHtml(item.name)}</div>
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

export function renderItems(items) {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;

  grid.className = currentView === 'list' ? 'collection-grid is-list' : 'collection-grid';

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <h3>No hay nada que coincida</h3>
        <p>Prueba con otra búsqueda o quita algún filtro.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.dataset.id = item.id;
    card.innerHTML = cardMarkup(item);

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

    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
}

export function renderSkeletons(count = 12) {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
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

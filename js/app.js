import { loadCollection } from './dataLoader.js';
import { renderItems, renderSkeletons, setView, getView } from './renderer.js';
import { setupFilters } from './filters.js';
import { renderDetail } from './detail.js';
import { destroyAlbumFlip } from './albumFlip.js';
import { inicializarVisor } from './visor3d.js';

const VIEW_KEY = 'sweed:view';

let allItems = [];
let visibleItems = [];   // el trozo que se está pintando
let filteredItems = [];  // toda la lista filtrada (para anterior/siguiente)
let savedScroll = 0;

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  restoreView();
  renderSkeletons(12);

  allItems = await loadCollection();
  visibleItems = allItems;
  filteredItems = allItems;

  setupFilters(allItems, (slice, all) => {
    visibleItems = slice;
    filteredItems = all;
    if (!window.location.hash) renderItems(slice);
  });

  setupViewToggle();
  handleRoute();
  window.addEventListener('hashchange', handleRoute);
}

// ---------------------------------------------------------------
// Vista cuadrícula / lista
// ---------------------------------------------------------------
function restoreView() {
  let stored = null;
  try { stored = localStorage.getItem(VIEW_KEY); } catch { /* ignorar */ }
  setView(stored === 'list' ? 'list' : 'grid');
}

function setupViewToggle() {
  const gridBtn = document.getElementById('viewGrid');
  const listBtn = document.getElementById('viewList');
  if (!gridBtn || !listBtn) return;

  function sync() {
    const view = getView();
    gridBtn.setAttribute('aria-pressed', String(view === 'grid'));
    listBtn.setAttribute('aria-pressed', String(view === 'list'));
  }

  function choose(view) {
    if (getView() === view) return;
    setView(view);
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* ignorar */ }
    sync();
    if (!window.location.hash) renderItems(visibleItems);
  }

  gridBtn.addEventListener('click', () => choose('grid'));
  listBtn.addEventListener('click', () => choose('list'));
  sync();
}

// ---------------------------------------------------------------
// Enrutado
// ---------------------------------------------------------------
function showListView() {
  destroyAlbumFlip();

  ['toolbar', 'items-counter', 'viewer3d', 'siteFooter'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.classList.remove('hidden');
  });

  renderItems(visibleItems);
  requestAnimationFrame(() => window.scrollTo(0, savedScroll));
}

function handleRoute() {
  const id = decodeURIComponent(window.location.hash.replace('#', ''));

  if (!id) {
    showListView();
    return;
  }

  const item = allItems.find((entry) => entry.id === id);
  if (!item) {
    window.location.replace(`${window.location.pathname}${window.location.search}`);
    showListView();
    return;
  }

  if (!window.__sweedInDetail) savedScroll = window.scrollY;
  window.__sweedInDetail = true;

  const index = filteredItems.findIndex((entry) => entry.id === id);
  const context = {
    prev: index > 0 ? filteredItems[index - 1] : null,
    next: index >= 0 && index < filteredItems.length - 1 ? filteredItems[index + 1] : null,
    onNavigate: (target) => { window.location.hash = target.id; },
    collection: allItems
  };

  window.scrollTo(0, 0);
  document.getElementById('collectionGrid').innerHTML = '';
  renderDetail(item, context);
}

// Al volver a la lista dejamos de estar en detalle.
window.addEventListener('hashchange', () => {
  if (!window.location.hash) window.__sweedInDetail = false;
});

// ---------------------------------------------------------------
// Visor 3D: solo se carga cuando se ve (three.js pesa)
// ---------------------------------------------------------------
function initViewerWhenVisible() {
  const target = document.getElementById('visor-3d-container');
  if (!target) return;

  if (!window.IntersectionObserver) {
    inicializarVisor('visor-3d-container', 'modelos/esmeralda.glb');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    inicializarVisor('visor-3d-container', 'modelos/esmeralda.glb');
  }, { rootMargin: '200px' });

  observer.observe(target);
}

init();
initViewerWhenVisible();

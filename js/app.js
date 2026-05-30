import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // 1. Cargamos el catálogo inicial en memoria
  allItems = await loadCollection()
  itemsAMostrar = allItems 

  // 2. Encendemos los selectores interactivos de tu filters.js original
  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems 
    if (!window.location.hash) {
      renderItems(filteredItems)
    }
  })

  handleRoute()
  window.addEventListener('hashchange', handleRoute)
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '')
  const grid = document.getElementById('collectionGrid')
  const filters = document.getElementById('filters')
  const counter = document.getElementById('items-counter') 
  const sidebar = document.getElementById('filtersContainer')

  // ==========================================
  // VISTA PRINCIPAL (GALERÍA ORIGINAL)
  // ==========================================
  if (!hash) {
    if (filters) filters.style.display = ''; 
    if (counter) counter.style.display = '';
    if (sidebar) sidebar.style.display = ''; 
    
    if (grid) {
      grid.style.display = ''; 
      grid.style.opacity = '1'; 
      grid.style.height = 'auto';
      grid.className = 'collection-grid';
    }
    
    renderItems(itemsAMostrar);

    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0);
    return;
  }

  // ==========================================
  // VISTA DETALLE DE UN ITEM (Animación intacta)
  // ==========================================
  const item = allItems.find(i => i.id === hash);

  if (item) {
    posicionScrollGuardada = window.scrollY;

    if (filters) filters.style.display = 'none';
    if (counter) counter.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';

    if (grid) {
      grid.style.height = grid.offsetHeight + 'px'; 
      grid.style.opacity = '0';
      
      requestAnimationFrame(() => {
        grid.innerHTML = ''; 
        window.scrollTo(0, 0);
        renderDetail(item); 
        
        grid.style.height = 'auto';
        grid.style.opacity = '1'; 
      });
    }
    
  } else {
    if (filters) filters.style.display = '';
    if (counter) counter.style.display = '';
    if (sidebar) sidebar.style.display = '';
    if (grid) {
      grid.style.display = '';
      grid.style.opacity = '1';
      grid.className = 'collection-grid';
    }
    renderItems(itemsAMostrar);
  }
}

init();
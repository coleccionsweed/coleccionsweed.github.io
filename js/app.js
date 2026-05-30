import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'
import { initStatsPage } from './stats.js' // <-- IMPORTAMOS EL NUEVO MÓDULO

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  allItems = await loadCollection()
  itemsAMostrar = allItems 

  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems 
    // Solo renderiza ítems si estamos en la vista de lista normal
    if (!window.location.hash || window.location.hash === '#stats') {
      if (window.location.hash === '#stats') {
        initStatsPage(itemsAMostrar); // Si filtras desde la vista stats, se actualiza en vivo
      } else {
        renderItems(filteredItems)
      }
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
  const galleryView = document.getElementById('galleryView')
  const statsView = document.getElementById('statsView')

  // VISTA DE ESTADÍSTICAS GLOBAL
  if (hash === 'stats') {
    if (filters) filters.style.display = ''; // Permitimos que los filtros afecten a las stats
    if (counter) counter.style.display = 'none';
    
    galleryView.style.display = 'none';
    initStatsPage(itemsAMostrar); // Ejecutamos la lógica del dashboard
    return;
  }

  // VISTA LISTA PRINCIPAL (GALERÍA)
  if (!hash) {
    if (filters) filters.style.display = ''; 
    if (counter) counter.style.display = '';
    
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';
    
    document.getElementById('navGallery').style.color = '#fff';
    document.getElementById('navStats').style.color = '#9ca3af';

    grid.style.display = ''; 
    grid.style.opacity = '1'; 
    grid.style.height = 'auto';
    grid.className = 'collection-grid';
    
    renderItems(itemsAMostrar);

    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0);
    return;
  }

  // VISTA DETALLE DE UN ITEM
  const item = allItems.find(i => i.id === hash);

  if (item) {
    posicionScrollGuardada = window.scrollY;

    if (filters) filters.style.display = 'none';
    if (counter) counter.style.display = 'none';
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';

    grid.style.height = grid.offsetHeight + 'px'; 
    grid.style.opacity = '0';
    
    requestAnimationFrame(() => {
      grid.innerHTML = ''; 
      window.scrollTo(0, 0);
      renderDetail(item); 
      
      grid.style.height = 'auto';
      grid.style.opacity = '1'; 
    });
    
  } else {
    // Reset de seguridad
    if (filters) filters.style.display = '';
    if (counter) counter.style.display = '';
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';
    grid.style.display = '';
    grid.style.opacity = '1';
    grid.className = 'collection-grid';
    renderItems(itemsAMostrar);
  }
}

init();
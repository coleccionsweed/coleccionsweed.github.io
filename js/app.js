import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'
import { initStatsPage } from './stats.js' // Importamos el nuevo módulo analítico

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
    // Si estamos en la página de estadísticas, se actualizan en tiempo real al filtrar
    if (window.location.hash === '#stats') {
      initStatsPage(itemsAMostrar);
    } else if (!window.location.hash) {
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
  const galleryView = document.getElementById('galleryView')
  const statsView = document.getElementById('statsView')
  const sidebar = document.getElementById('filtersContainer')

  // ==========================================
  // VISTA DE ESTADÍSTICAS GLOBAL (#stats)
  // ==========================================
  if (hash === 'stats') {
    // Ocultamos de forma radical la vista de galería para que no pise espacio
    if (galleryView) galleryView.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    
    // Mostramos el contenedor de estadísticas
    if (statsView) statsView.style.display = 'block';
    if (filters) filters.style.display = ''; // Mantenemos el buscador de arriba visible

    // Pintamos las estadísticas pasándole el estado actual de los filtros
    initStatsPage(itemsAMostrar);
    return;
  }

  // ==========================================
  // VISTA LISTA PRINCIPAL (GALERÍA ORIGINAL)
  // ==========================================
  if (!hash) {
    if (filters) filters.style.display = ''; 
    if (counter) counter.style.display = '';
    if (sidebar) sidebar.style.display = ''; 
    
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';
    
    // Actualizamos el menú visual de la cabecera
    const navG = document.getElementById('navGallery');
    const navS = document.getElementById('navStats');
    if (navG) navG.style.color = '#ffffff';
    if (navS) navS.style.color = '#6b7280';

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
  // VISTA DETALLE DE UN ITEM
  // ==========================================
  const item = allItems.find(i => i.id === hash);

  if (item) {
    posicionScrollGuardada = window.scrollY;

    if (filters) filters.style.display = 'none';
    if (counter) counter.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';

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
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';
    if (grid) {
      grid.style.display = '';
      grid.style.opacity = '1';
      grid.className = 'collection-grid';
    }
    renderItems(itemsAMostrar);
  }
}

init();
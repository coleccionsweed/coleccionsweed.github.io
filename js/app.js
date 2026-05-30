import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'
import { initStatsPage } from './stats.js' 

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 
let filtersInitialized = false // Evita duplicar listeners de filtros al cambiar de sección

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Cargamos los datos maestros iniciales
  allItems = await loadCollection()
  itemsAMostrar = allItems 

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

  // ==========================================================
  // VISTA NUEVA: ESTADÍSTICAS COMO URL TOTALMENTE AISLADA (#stats)
  // ==========================================================
  if (hash === 'stats') {
    // 1. Apagamos drásticamente todo lo relacionado con la galería visual
    if (galleryView) galleryView.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (grid) grid.style.display = 'none';
    if (counter) counter.style.display = 'none';
    if (filters) filters.style.display = 'none'; // Ocultamos barra de búsqueda superior en estadísticas

    // 2. Encendemos el contenedor de estadísticas
    if (statsView) statsView.style.display = 'block';

    // 3. Ejecutamos la carga limpia y autónoma de estadísticas
    initStatsPage();
    return;
  }

  // ==========================================================
  // VISTA ORIGINAL: LISTA PRINCIPAL (GALERÍA ORIGINAL)
  // ==========================================================
  if (!hash) {
    if (filters) filters.style.display = ''; 
    if (counter) counter.style.display = '';
    if (sidebar) sidebar.style.display = ''; 
    if (grid) grid.style.display = '';
    
    if (statsView) statsView.style.display = 'none';
    if (galleryView) galleryView.style.display = 'block';
    
    const navG = document.getElementById('navGallery');
    const navS = document.getElementById('navStats');
    if (navG) navG.style.color = '#ffffff';
    if (navS) navS.style.color = '#6b7280';

    if (grid) {
      grid.className = 'collection-grid';
      grid.style.opacity = '1'; 
      grid.style.height = 'auto';
    }
    
    // Inicializamos o reconectamos los filtros originales de la galería
    if (!filtersInitialized) {
      setupFilters(allItems, (filteredItems) => {
        itemsAMostrar = filteredItems;
        renderItems(filteredItems);
      });
      filtersInitialized = true;
    } else {
      // Si ya estaban inicializados, simplemente repintamos lo que corresponda
      renderItems(itemsAMostrar);
    }

    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0);
    return;
  }

  // ==========================================================
  // VISTA: DETALLE DE UN ITEM (Mantiene tu bonita animación)
  // ==========================================================
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
    // Fallback por si el hash no corresponde a nada conocido
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
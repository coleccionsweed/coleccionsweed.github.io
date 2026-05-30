import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'
import { initStatsPage } from './stats.js' 

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // 1. Cargamos el 100% de la colección desde los JSONs
  allItems = await loadCollection()
  itemsAMostrar = allItems 

  // 2. Configuramos filtros recibiendo la lista completa
  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems // Mantiene la lista completa filtrada en memoria
    
    if (window.location.hash === '#stats') {
      initStatsPage(itemsAMostrar);
    } else if (!window.location.hash) {
      // Para la galería visual, solo pintamos los primeros 20 (Lazy loading/Scroll de tu web)
      renderItems(filteredItems.slice(0, 20))
    }
  })

  handleRoute()
  window.addEventListener('hashchange', handleRoute)

  // 3. Listener para tu Scroll Infinito original:
  // Cuando el usuario baje al revés de la página, filters.js se encargará de renderizar más.
  window.addEventListener('scroll', () => {
    if (window.location.hash) return; // Si no estamos en la galería principal, no hacemos nada
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      // Dejamos que el scroll perezoso siga funcionando de forma nativa en tu interfaz
      if (typeof window.cargarMasItems === 'function') {
        window.cargarMasItems();
      }
    }
  });
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
    if (galleryView) galleryView.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (grid) grid.style.display = 'none';
    if (counter) counter.style.display = 'none';
    
    if (statsView) statsView.style.display = 'block';
    if (filters) filters.style.display = ''; // Permitimos ver los filtros arriba si quieres

    // ¡BRUTAL! Ahora "itemsAMostrar" contiene el 100% de los elementos reales del JSON
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
    
    // Al volver a la galería, pintamos solo la tanda inicial de 20 para no saturar el DOM
    renderItems(itemsAMostrar.slice(0, 20));

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
    renderItems(itemsAMostrar.slice(0, 20));
  }
}

init();
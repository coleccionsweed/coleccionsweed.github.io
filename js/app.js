import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'
import { renderStickers } from './stickers.js'

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
    if (!window.location.hash) {
      renderItems(filteredItems)
    }
  })

  handleRoute()
  window.addEventListener('hashchange', handleRoute)
}

function handleRoute() {
  const id = window.location.hash.replace('#', '')
  const grid = document.getElementById('collectionGrid')
  const filters = document.getElementById('filters')
  const counter = document.getElementById('items-counter') 

  // Vista Lista
  if (!id) {
    if (filters) filters.style.display = ''; 
    if (counter) counter.style.display = '';
    
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

  // Vista Detalle
  const item = allItems.find(i => i.id === id);

  if (item) {
    posicionScrollGuardada = window.scrollY;

    // Ocultamos elementos: el navegador los ignora y el CSS colapsa el espacio
    if (filters) filters.style.display = 'none';
    if (counter) counter.style.display = 'none';

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
    grid.style.display = '';
    grid.style.opacity = '1';
    grid.className = 'collection-grid';
    renderItems(itemsAMostrar);
  }
}

init();
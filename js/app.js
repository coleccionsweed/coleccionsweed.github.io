import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  // Desactivar control automático de scroll del navegador
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // 1. Cargar datos
  allItems = await loadCollection()
  itemsAMostrar = allItems 

  // 2. Inicializar filtros
  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems 
    if (!window.location.hash) {
      renderItems(filteredItems)
    }
  })

  // 3. Detectar navegación
  handleRoute()
  window.addEventListener('hashchange', handleRoute)
}

function handleRoute() {
  const id = window.location.hash.replace('#', '')
  const grid = document.getElementById('collectionGrid')
  const filters = document.getElementById('filters')
  const counter = document.getElementById('items-counter') 

  // Función para manejar la visibilidad de forma limpia
  const toggleVisibility = (visible) => {
    if (visible) {
      if (filters) filters.classList.remove('hidden-element');
      if (counter) counter.classList.remove('hidden-element');
    } else {
      if (filters) filters.classList.add('hidden-element');
      if (counter) counter.classList.add('hidden-element');
    }
  };

  // --- VISTA LISTA ---
  // --- VISTA LISTA ---
  if (!id) {
    // 🔥 Aquí le decimos que elimine la clase "hidden-element"
    // Esto debería devolverles su visibilidad original
    if (filters) filters.classList.remove('hidden-element');
    if (counter) counter.classList.remove('hidden-element');
    
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

  // --- VISTA DETALLE ---
  const item = allItems.find(i => i.id === id);

  if (item) {
    posicionScrollGuardada = window.scrollY;

    // Fijamos altura y opacidad
    grid.style.height = grid.offsetHeight + 'px'; 
    grid.style.opacity = '0';
    
    // Ocultamos elementos usando la clase CSS potente
    toggleVisibility(false);

    requestAnimationFrame(() => {
      grid.innerHTML = ''; 
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      renderDetail(item); 
      
      grid.style.height = 'auto';
      grid.style.opacity = '1'; 
    });
    
  } else {
    toggleVisibility(true);
    grid.style.display = '';
    grid.style.opacity = '1';
    grid.className = 'collection-grid';
    renderItems(itemsAMostrar);
  }
}

init()
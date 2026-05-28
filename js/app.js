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

  // --- VISTA LISTA ---
  if (!id) {
    if (filters) filters.style.display = 'flex' 
    if (counter) counter.style.display = 'block' 
    
    grid.style.display = ''; 
    grid.style.opacity = '1'; 
    grid.style.height = 'auto';
    grid.className = 'collection-grid'          
    
    renderItems(itemsAMostrar)                       

    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0)
    return
  }

  // --- VISTA DETALLE ---
  const item = allItems.find(i => i.id === id)

  if (item) {
    posicionScrollGuardada = window.scrollY

    // 1. Fijamos altura y ocultamos opacidad para "congelar" la vista actual
    grid.style.height = grid.offsetHeight + 'px'; 
    grid.style.opacity = '0';
    
    // 2. Ocultamos controles
    if (filters) filters.style.display = 'none'
    if (counter) counter.style.display = 'none' 

    // 3. 🔥 Usamos requestAnimationFrame para asegurar que el navegador 
    // termine de procesar el ocultado antes de cambiar el contenido
    requestAnimationFrame(() => {
      grid.innerHTML = '' 
      
      // Scroll estricto
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Renderizamos detalle
      renderDetail(item) 
      
      // 4. 🔥 Solo cuando el detalle está pintado, restauramos la visibilidad
      grid.style.height = 'auto';
      grid.style.opacity = '1'; 
    });
    
  } else {
    // Fallback
    if (filters) filters.style.display = 'flex'
    if (counter) counter.style.display = 'block'
    grid.style.display = '';
    grid.style.opacity = '1';
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
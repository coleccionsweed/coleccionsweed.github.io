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

  // Vista Lista (Galería)
  if (!id) {
    if (filters) filters.style.display = 'flex' 
    if (counter) counter.style.display = 'block' 
    
    grid.style.display = ''; 
    grid.style.height = 'auto'; // Restaurar altura automática
    grid.className = 'collection-grid'          
    
    renderItems(itemsAMostrar)                       

    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0)

    return
  }

  // Vista Detalle
  const item = allItems.find(i => i.id === id)

  if (item) {
    // 1. Guardar scroll
    posicionScrollGuardada = window.scrollY

    // 2. 🔥 SOLUCIÓN: Fijar altura para que la cabecera no se mueva
    grid.style.height = grid.offsetHeight + 'px'; 
    
    // 3. Ocultar elementos de lista
    if (filters) filters.style.display = 'none'
    if (counter) counter.style.display = 'none' 

    // 4. Vaciado
    grid.innerHTML = '' 

    // 5. Scroll arriba inmediato
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 6. Renderizar detalle
    renderDetail(item) 
    
    // 7. Liberar altura fija para el contenido del detalle
    grid.style.height = 'auto';
    
  } else {
    // Fallback si no encuentra ítem
    if (filters) filters.style.display = 'flex'
    if (counter) counter.style.display = 'block'
    grid.style.display = '';
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
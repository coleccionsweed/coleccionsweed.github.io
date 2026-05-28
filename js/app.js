import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []

async function init() {

  // 1. Cargar datos
  allItems = await loadCollection()

  // 2. Inicializar filtros
  setupFilters(allItems, (filteredItems) => {
    renderItems(filteredItems)
  })

  // 3. Detectar navegación (detalle o lista)
  handleRoute()

  window.addEventListener('hashchange', handleRoute)
}

function handleRoute() {
  const id = window.location.hash.replace('#', '')
  const grid = document.getElementById('collectionGrid')
  const filters = document.getElementById('filters')

  // Si no hay hash → vista lista (Galería)
  if (!id) {
    if (filters) filters.style.display = 'flex' // 1. Mostramos filtros
    grid.className = 'collection-grid'          // 2. Restauramos cuadrícula
    renderItems(allItems)                       // 3. Pintamos tarjetas (Todo síncrono y limpio)
    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    // 🛑 YA NO OCULTAMOS FILTROS AQUÍ. Dejamos que renderDetail se encargue al final.
    renderDetail(item) 
  } else {
    if (filters) filters.style.display = 'flex'
    grid.className = 'collection-grid'
    renderItems(allItems)
  }
}

init()
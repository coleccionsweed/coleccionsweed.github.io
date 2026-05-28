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
    grid.className = 'collection-grid' // Volvemos a poner la cuadrícula
    if (filters) filters.style.display = 'flex'
    renderItems(allItems)
    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    if (filters) filters.style.display = 'none'
    // 🛑 QUITAMOS grid.className = '' de aquí.
    renderDetail(item) // Dejamos que renderDetail se encargue cuando esté 100% listo
  } else {
    grid.className = 'collection-grid'
    if (filters) filters.style.display = 'flex'
    renderItems(allItems)
  }
}

init()
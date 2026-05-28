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

  // si no hay hash → vista lista
  if (!id) {
    renderItems(allItems)
    return
  }

  // buscar item
  const item = allItems.find(i => i.id === id)

  if (item) {
    renderDetail(item)
  } else {
    renderItems(allItems)
  }
}

init()
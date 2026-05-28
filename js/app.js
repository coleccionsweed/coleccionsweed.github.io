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
  const grid = document.getElementById('collectionGrid') // 1. Capturamos el contenedor principal

  // Si no hay hash → vista lista (Galería)
  if (!id) {
    grid.className = 'collection-grid' // 2. Restauramos la cuadrícula de tarjetas para la galería
    renderItems(allItems)
    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    grid.className = '' // 3. ¡EL TRUCO! Eliminamos la clase para que el detalle ocupe el 100% del ancho libre
    renderDetail(item)
  } else {
    grid.className = 'collection-grid'
    renderItems(allItems)
  }
}

init()
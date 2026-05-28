import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []
let itemsAMostrar = []        // 🔥 NUEVO: Recuerda qué estaba viendo el usuario (con filtros incluidos)
let posicionScrollGuardada = 0 // 🔥 NUEVO: Almacena los píxeles exactos de la posición del scroll

async function init() {

  // 1. Cargar datos
  allItems = await loadCollection()
  itemsAMostrar = allItems // Al inicio, los ítems a mostrar son todos

  // 2. Inicializar filtros
  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems // Guardamos los ítems filtrados en tiempo real cada vez que se busca/filtra
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
    
    // 🔄 MEJORA: Pintamos 'itemsAMostrar' en vez de 'allItems'. 
    // Así, si el usuario filtró por "Libros", al volver seguirá viendo solo "Libros".
    renderItems(itemsAMostrar)                       

    // 🟢 NUEVO: Devolvemos al usuario a su posición exacta de scroll de forma instantánea
    setTimeout(() => {
      window.scrollTo({ top: posicionScrollGuardada, behavior: 'instant' })
    }, 0)

    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    // 🟢 NUEVO: Guardamos el scroll actual JUSTO ANTES de que la pantalla cambie al detalle
    posicionScrollGuardada = window.scrollY

    renderDetail(item) 

    // 🟢 NUEVO: Mandamos la pantalla al techo (0) inmediatamente para ver el producto desde arriba
    window.scrollTo({ top: 0, behavior: 'instant' })
  } else {
    if (filters) filters.style.display = 'flex'
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
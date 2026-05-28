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
    
    // Pintamos 'itemsAMostrar' en vez de 'allItems'. 
    renderItems(itemsAMostrar)                       

    // Devolvemos al usuario a su posición exacta de scroll de forma instantánea
    setTimeout(() => {
      window.scrollTo({ top: posicionScrollGuardada, behavior: 'instant' })
    }, 0)

    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    // 1. Guardamos el scroll actual antes de romper nada
    posicionScrollGuardada = window.scrollY

    // 2. 🔥 EL TRUCO: Ocultamos los filtros y vaciamos la cuadrícula instantáneamente.
    // Esto hace que la página "pese" 0 píxeles y el scroll suba al techo de forma invisible.
    if (filters) filters.style.display = 'none'
    grid.innerHTML = '' 

    // 3. 🔥 Subimos arriba DEL TODO ahora que la pantalla está limpia (así no hay saltos feos)
    window.scrollTo({ top: 0, behavior: 'instant' })

    // 4. Finalmente, dibujamos el detalle del producto ya estando situados arriba
    renderDetail(item) 
    
  } else {
    if (filters) filters.style.display = 'flex'
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
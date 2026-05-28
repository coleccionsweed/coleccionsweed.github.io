import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  // 1. Cargar datos
  allItems = await loadCollection()
  itemsAMostrar = allItems 

  // 2. Inicializar filtros
  // Cada vez que se cargue la web o se filtre, guardamos el resultado en itemsAMostrar
  setupFilters(allItems, (filteredItems) => {
    itemsAMostrar = filteredItems 
    
    // 🔥 SOLUCIÓN: Solo pintamos en la cuadrícula si el usuario está en la vista Galería (sin hash)
    if (!window.location.hash) {
      renderItems(filteredItems)
    }
  })

  // 3. Detectar navegación (detalle o lista)
  handleRoute()

  window.addEventListener('hashchange', handleRoute)
}

function handleRoute() {
  const id = window.location.hash.replace('#', '')
  const grid = document.getElementById('collectionGrid')
  const filters = document.getElementById('filters')
  const counter = document.getElementById('items-counter') 

  // Si no hay hash → vista lista (Galería)
  if (!id) {
    if (filters) filters.style.display = 'flex' 
    if (counter) counter.style.display = 'block' // Mostramos el contador
    grid.className = 'collection-grid'          
    
    // 🛑 CORRECCIÓN: Ya NO llamamos a 'renderItems(allItems)' a lo bruto.
    // Usamos 'itemsAMostrar' que ya viene precargado por el primer 'apply()' de tus filtros.
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
    // Guardamos el scroll actual antes de romper nada
    posicionScrollGuardada = window.scrollY

    if (filters) filters.style.display = 'none'
    if (counter) counter.style.display = 'none' // Ocultamos el contador en el detalle
    grid.innerHTML = '' 

    window.scrollTo({ top: 0, behavior: 'instant' })
    renderDetail(item) 
    
  } else {
    if (filters) filters.style.display = 'flex'
    if (counter) counter.style.display = 'block'
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
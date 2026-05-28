import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'
import { setupFilters } from './filters.js'
import { renderDetail } from './detail.js'

let allItems = []
let itemsAMostrar = []        
let posicionScrollGuardada = 0 

async function init() {
  // 🔥 NUEVO PARA MÓVILES: Le ordenamos al teléfono que desactive su control 
  // automático de scroll para que no intente adivinar dónde posicionar la pantalla.
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
    if (counter) counter.style.display = 'block' 
    
    // 🔥 Aseguramos que la cuadrícula vuelva a ser visible en la lista
    grid.style.display = ''; 
    grid.className = 'collection-grid'          
    
    renderItems(itemsAMostrar)                       

    // Devolvemos al usuario a su posición exacta de scroll
    setTimeout(() => {
      window.scrollTo(0, posicionScrollGuardada);
    }, 0)

    return
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id)

  if (item) {
    // 1. Guardamos el scroll actual
    posicionScrollGuardada = window.scrollY

    // 2. 🔥 EL TRUCO MAESTRO PARA MÓVILES: Convertimos el contenedor en invisible ('none').
    // Al no tener espacio físico en la pantalla, el móvil rompe cualquier animación de scroll automático.
    grid.style.display = 'none';
    if (filters) filters.style.display = 'none'
    if (counter) counter.style.display = 'none' 

    // 3. Vaciamos las tarjetas antiguas
    grid.innerHTML = '' 

    // 4. 🔥 Forzamos la subida a la posición 0 de la forma más estricta posible para iOS y Android.
    // Usar números directos en vez de objetos evita que el móvil obedezca al 'scroll-behavior: smooth' del CSS.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 5. Renderizamos el detalle del producto (estando ya situados arriba en total oscuridad)
    renderDetail(item) 
    
    // 6. 🔥 Volvemos a hacer visible el contenedor. Ahora aparecerá instantáneamente el detalle.
    grid.style.display = '';
    
  } else {
    if (filters) filters.style.display = 'flex'
    if (counter) counter.style.display = 'block'
    grid.style.display = '';
    grid.className = 'collection-grid'
    renderItems(itemsAMostrar)
  }
}

init()
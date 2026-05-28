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
  const id = window.location.hash.replace('#', '');
  const grid = document.getElementById('collectionGrid');
  const filters = document.getElementById('filters'); // 1. Capturamos el contenedor de filtros

  // Si no hay hash → Vista de la Galería
  if (!id) {
    grid.className = 'collection-grid';
    if (filters) filters.style.display = 'flex'; // 2. Mostramos los filtros en la galería
    renderItems(allItems);
    return;
  }

  // Buscar ítem
  const item = allItems.find(i => i.id === id);

  if (item) {
    grid.className = ''; 
    if (filters) filters.style.display = 'none'; // 3. ¡OCULTAMOS los filtros en el detalle! Espacio libre instantáneo.
    renderDetail(item);
  } else {
    grid.className = 'collection-grid';
    if (filters) filters.style.display = 'flex';
    renderItems(allItems);
  }
}

init()
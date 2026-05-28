import { t } from './translations.js';

// Configuración centralizada de filtros
const FILTER_CONFIG = [
  { key: 'category', label: 'Categoría' },
  { key: 'franchise', label: 'Franquicia' }
];

export function setupFilters(items, onChange) {

  const category = document.getElementById('categoryFilter')
  const franchise = document.getElementById('franchiseFilter')
  const sortOrder = document.getElementById('sortOrder')
  const search = document.getElementById('search')
  // 🔥 NUEVO: Capturamos el contenedor del contador
  const counterContainer = document.getElementById('items-counter')

  let itemsFiltradosYOrdenados = [];
  let limiteActual = 20; 

  // únicos (filtramos nulos o undefined por si acaso con .filter(Boolean))
  const categories = [...new Set(items.map(i => i.category))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  const franchises = [...new Set(items.map(i => i.franchise))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  category.innerHTML = `<option value="">${t('Category')}</option>` +
    categories.map(c => `<option value="${c}">${t(c)}</option>`).join('')

  franchise.innerHTML = `<option value="">${t('Franchise')}</option>` +
    franchises.map(f => `<option value="${f}">${t(f)}</option>`).join('')

  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace('€', '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  // 🔥 ACTUALIZADO: Evento de scroll
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100) {
      if (limiteActual < itemsFiltradosYOrdenados.length) {
        limiteActual += 20; 
        
        const porciones = itemsFiltradosYOrdenados.slice(0, limiteActual);
        onChange(porciones);

        // 🔥 NUEVO: Actualizamos el texto al cargar más con el scroll
        actualizarContador(porciones.length, itemsFiltradosYOrdenados.length);
      }
    }
  };

  // 🔥 NUEVO: Función auxiliar para pintar el contador de forma dinámica
  function actualizarContador(mostrados, totales) {
    if (!counterContainer) return;
    
    // Si no hay resultados
    if (totales === 0) {
      counterContainer.textContent = "No se encontraron objetos";
    } else {
      counterContainer.textContent = `Mostrando ${mostrados} de ${totales} objetos`;
    }
  }

  function apply() {
    limiteActual = 20; 

    // 1. Filtramos el array original
    let result = items.filter(i => {
      return (
        (!category.value || i.category === category.value) &&
        (!franchise.value || i.franchise === franchise.value) &&
        (!search.value ||
          i.name.toLowerCase().includes(search.value.toLowerCase()))
      )
    })

    // 2. Ordenamos el resultado
    const order = sortOrder.value;
    if (order === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } 
    else if (order === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } 
    else if (order === 'price-asc') {
      result.sort((a, b) => parsePrice(a.purchasePrice) - parsePrice(b.purchasePrice));
    } 
    else if (order === 'price-desc') {
      result.sort((a, b) => parsePrice(b.purchasePrice) - parsePrice(a.purchasePrice));
    }

    itemsFiltradosYOrdenados = result;
    const primeraTanda = itemsFiltradosYOrdenados.slice(0, limiteActual);

    // 🔥 NUEVO: Actualizamos el contador nada más aplicar los filtros/búsqueda inicial
    actualizarContador(primeraTanda.length, itemsFiltradosYOrdenados.length);

    onChange(primeraTanda);
  }

  category.onchange = apply
  franchise.onchange = apply
  sortOrder.onchange = apply
  search.oninput = apply
  
  apply();
}
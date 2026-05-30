import { t } from './translations.js';

export function setupFilters(items, onChange) {

  const category = document.getElementById('categoryFilter');
  const franchise = document.getElementById('franchiseFilter');
  const sortOrder = document.getElementById('sortOrder');
  const search = document.getElementById('search');
  const counterContainer = document.getElementById('items-counter');

  // Guardamos el total real de la colección (esto no cambia nunca)
  const totalAbsoluto = items.length;
  
  let itemsFiltradosYOrdenados = [];
  let limiteActual = 20; 

  // --- Inicialización de los selectores ---\r
  const categories = [...new Set(items.map(i => i.category))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)));

  const franchises = [...new Set(items.map(i => i.franchise))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)));

  category.innerHTML = `<option value="">${t('Category')}</option>` +
    categories.map(c => `<option value="${c}">${t(c)}</option>`).join('');

  franchise.innerHTML = `<option value="">${t('Franchise')}</option>` +
    franchises.map(f => `<option value="${f}">${t(f)}</option>`).join('');

  // --- Funciones auxiliares ---
  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    let clean = priceStr.replace('€', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
    return parseFloat(clean) || 0;
  }

  function actualizarContador(mostrados, total) {
    if (counterContainer) {
      counterContainer.textContent = `${mostrados} / ${total}`;
    }
  }

  // --- Función central de filtrado y ordenación ---
  function apply() {
    limiteActual = 20; 

    // 1. Filtrado
    let result = items.filter(i => {
      return (
        (!category.value || i.category === category.value) &&
        (!franchise.value || i.franchise === franchise.value) &&
        (!search.value ||
          i.name.toLowerCase().includes(search.value.toLowerCase()))
      );
    });

    // 2. Ordenación
    const order = sortOrder.value;
    if (order === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (order === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (order === 'price-asc') {
      result.sort((a, b) => parsePrice(a.purchasePrice) - parsePrice(b.purchasePrice));
    } else if (order === 'price-desc') {
      result.sort((a, b) => parsePrice(b.purchasePrice) - parsePrice(a.purchasePrice));
    }

    itemsFiltradosYOrdenados = result;
    const primeraTanda = itemsFiltradosYOrdenados.slice(0, limiteActual);

    // 3. Actualizar contador usando el total absoluto
    actualizarContador(itemsFiltradosYOrdenados.length, totalAbsoluto);

    onChange(primeraTanda); 
  }

  // --- Carga infinita al hacer scroll al fondo (Manejador global asignado por filters.js) ---
  window.cargarMasItems = function() {
    if (limiteActual >= itemsFiltradosYOrdenados.length) return; 

    limiteActual += 20; 
    const nuevaTanda = itemsFiltradosYOrdenados.slice(0, limiteActual);
    onChange(nuevaTanda); 
  };

  // --- Listeners de eventos ---
  category.addEventListener('change', apply);
  franchise.addEventListener('change', apply);
  sortOrder.addEventListener('change', apply);
  search.addEventListener('input', apply);

  // Ejecución inicial para pintar la primera tanda al cargar la web
  apply();
}
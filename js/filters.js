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

  // 🔥 SOLUCIÓN: Filtramos los existentes y los ORDENAMOS alfabéticamente por su traducción en español
  const categories = [...new Set(items.map(i => i.category))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  const franchises = [...new Set(items.map(i => i.franchise))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  // 1. Traducimos la opción por defecto y mapeamos los valores internos manteniendo el value original
  category.innerHTML = `<option value="">${t('Category')}</option>` +
    categories.map(c => `<option value="${c}">${t(c)}</option>`).join('')

  // 2. Lo mismo para las franquicias (ahora saldrán de la A a la Z en la web)
  franchise.innerHTML = `<option value="">${t('Franchise')}</option>` +
    franchises.map(f => `<option value="${f}">${t(f)}</option>`).join('')

  // NUEVO: Función auxiliar para transformar "25,00€" en el número decimal 25.00
  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    // Quitamos el símbolo €, reemplazamos la coma decimal por un punto y quitamos espacios
    const clean = priceStr.replace('€', '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  function apply() {

    // 3. ¡Magia! category.value seguirá valiendo "books" en vez de "Libros", por lo que esta comparación funciona perfecta:
    let result = items.filter(i => {
      return (
        (!category.value || i.category === category.value) &&
        (!franchise.value || i.franchise === franchise.value) &&
        (!search.value ||
          i.name.toLowerCase().includes(search.value.toLowerCase()))
      )
    })

    // 2. NUEVO: Ordenamos el resultado filtrado según la opción seleccionada
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

    // 3. Enviamos los datos listos al cargador visual
    onChange(result)
  }

  category.onchange = apply
  franchise.onchange = apply
  sortOrder.onchange = apply
  search.oninput = apply
}
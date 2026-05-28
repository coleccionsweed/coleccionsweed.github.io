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

  // 🔥 NUEVO: Variables para controlar el paginado de elementos
  let itemsFiltradosYOrdenados = [];
  let limiteActual = 20; // Cuántos elementos cargamos de golpe (puedes subirlo a 30 o 40 si quieres)

  // únicos (filtramos nulos o undefined por si acaso con .filter(Boolean))
  const categories = [...new Set(items.map(i => i.category))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  const franchises = [...new Set(items.map(i => i.franchise))]
    .filter(Boolean)
    .sort((a, b) => t(a).localeCompare(t(b)))

  // Traducimos la opción por defecto y mapeamos los valores internos manteniendo el value original
  category.innerHTML = `<option value="">${t('Category')}</option>` +
    categories.map(c => `<option value="${c}">${t(c)}</option>`).join('')

  // Lo mismo para las franquicias
  franchise.innerHTML = `<option value="">${t('Franchise')}</option>` +
    franchises.map(f => `<option value="${f}">${t(f)}</option>`).join('')

  // Función auxiliar para transformar "25,00€" en el número decimal 25.00
  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace('€', '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  // 🔥 NUEVO: Evento que detecta cuando el usuario llega al final de la página para cargar más
  window.onscroll = () => {
    // Si el usuario ha bajado hasta el fondo de la pantalla (con un margen de 100px para que sea fluido)
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100) {
      // Si todavía quedan elementos por mostrar del total filtrado
      if (limiteActual < itemsFiltradosYOrdenados.length) {
        limiteActual += 20; // Aumentamos el límite en otros 20
        
        // Cortamos el array desde el principio hasta el nuevo límite y los mandamos a pintar
        const porciones = itemsFiltradosYOrdenados.slice(0, limiteActual);
        onChange(porciones);
      }
    }
  };

  function apply() {
    // Cada vez que el usuario cambia un filtro o busca, reiniciamos el límite a los primeros 20
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

    // 2. Ordenamos el resultado filtrado según la opción seleccionada
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

    // 🔥 NUEVO: Guardamos todo el resultado completo en la variable persistente
    itemsFiltradosYOrdenados = result;

    // 🔥 NUEVO: En lugar de enviar TODO el resultado, solo enviamos una "porción" (los primeros 20)
    const primeraTanda = itemsFiltradosYOrdenados.slice(0, limiteActual);

    // 3. Enviamos los datos listos al cargador visual
    onChange(primeraTanda);
  }

  category.onchange = apply
  franchise.onchange = apply
  sortOrder.onchange = apply
  search.oninput = apply
}
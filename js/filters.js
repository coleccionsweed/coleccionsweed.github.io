// Configuración centralizada de filtros
const FILTER_CONFIG = [
  { key: 'category', label: 'Categoría' },
  { key: 'franchise', label: 'Franquicia' }
];

export function setupFilters(items, onChange) {
  // Sincronizado con el id="filters" real de tu segunda.html
  const container = document.getElementById('filters');
  if (!container) return;
  
  // Limpiamos el contenedor para generarlo todo de forma limpia y dinámica
  container.innerHTML = '';
  const selects = {};

  // 1. Generar los menús desplegables dinámicamente
  FILTER_CONFIG.forEach(config => {
    // Extraer valores únicos ignorando nulos/undefined y limpiando espacios
    const rawValues = items.map(i => i[config.key]).filter(Boolean);
    const cleanValues = [...new Set(rawValues.map(v => String(v).trim()))];
    
    // Ordenar alfabéticamente para que quede impecable
    cleanValues.sort((a, b) => a.localeCompare(b));
    
    const select = document.createElement('select');
    select.id = `filter-${config.key}`;
    select.className = 'filter-select';
    
    // Guardamos los values en minúsculas para una comparación infalible después
    let optionsHtml = `<option value="">${config.label}</option>`;
    cleanValues.forEach(val => {
      optionsHtml += `<option value="${val.toLowerCase()}">${val}</option>`;
    });
    
    select.innerHTML = optionsHtml;
    container.appendChild(select);
    selects[config.key] = select;
    
    select.addEventListener('change', apply);
  });

  // 2. Inyectar el input de búsqueda de nuevo para que no se pierda al limpiar
  const search = document.createElement('input');
  search.id = 'search';
  search.placeholder = 'Buscar...';
  container.appendChild(search);
  
  search.addEventListener('input', apply);

  // 3. Lógica de filtrado inteligente y tolerante a propiedades vacías
  function apply() {
    const searchQuery = search.value.trim().toLowerCase();

    const result = items.filter(item => {
      // Evaluar cada uno de los desplegables
      const matchesFilters = FILTER_CONFIG.every(config => {
        const selectValue = selects[config.key].value; // Valor seleccionado (en minúsculas)
        
        // Si no se ha seleccionado ninguna opción en este filtro, el artículo pasa automáticamente
        if (!selectValue) return true;
        
        const itemValue = item[config.key];
        // Si el artículo no tiene esta propiedad (como el juguete con 'type'), 
        // pero el usuario SÍ busca un tipo concreto, este artículo no coincide
        if (!itemValue) return false;

        // Comparación segura ignorando mayúsculas/minúsculas y espacios rebeldes
        return String(itemValue).trim().toLowerCase() === selectValue;
      });

      // Evaluar la barra de búsqueda por texto
      const matchesSearch = !searchQuery || 
        (item.name && item.name.toLowerCase().includes(searchQuery));

      return matchesFilters && matchesSearch;
    });

    onChange(result);
  }
}
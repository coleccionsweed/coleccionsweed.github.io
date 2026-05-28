// Configuración centralizada de filtros
const FILTER_CONFIG = [
  { key: 'category', label: 'Categoría' },
  { key: 'franchise', label: 'Franquicia' },
  { key: 'type', label: 'Tipo' } // Puedes añadir más fácilmente
];

export function setupFilters(items, onChange) {
  const container = document.getElementById('dynamicFilters');
  const search = document.getElementById('search');
  
  // 1. Generar los selects dinámicamente
  container.innerHTML = '';
  const selects = {};

  FILTER_CONFIG.forEach(config => {
    // Obtener valores únicos para este filtro ignorando nulos
    const uniqueValues = [...new Set(items.map(i => i[config.key]).filter(Boolean))];
    
    const select = document.createElement('select');
    select.id = `filter-${config.key}`;
    select.className = 'filter-select';
    
    // Opción por defecto
    select.innerHTML = `<option value="">${config.label}</option>` +
      uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
      
    container.appendChild(select);
    selects[config.key] = select;
    
    // Asignar evento
    select.addEventListener('change', apply);
  });

  function apply() {
    const result = items.filter(item => {
      // Comprobar todos los selects dinámicos
      const matchesFilters = FILTER_CONFIG.every(config => {
        const selectValue = selects[config.key].value;
        return !selectValue || item[config.key] === selectValue;
      });

      // Comprobar la búsqueda
      const matchesSearch = !search.value || 
        item.name.toLowerCase().includes(search.value.toLowerCase());

      return matchesFilters && matchesSearch;
    });

    onChange(result);
  }

  search.addEventListener('input', apply);
}
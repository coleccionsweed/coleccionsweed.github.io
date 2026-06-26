// js/filters.js
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

  // --- Inicialización de los selectores ---
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
    const clean = priceStr.replace('€', '').replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  function actualizarContador(mostrados, totalGeneral) {
    if (!counterContainer) return;
    
    if (mostrados === 0) {
      counterContainer.textContent = "No se encontraron objetos";
    } else {
      // Muestra: "Mostrando X de Y objetos"
      counterContainer.textContent = `Mostrando ${mostrados} de ${totalGeneral} objetos`;
    }
  }

  // --- Lógica de Scroll Infinito ---
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100) {
      if (limiteActual < itemsFiltradosYOrdenados.length) {
        limiteActual += 20; 
        
        const porciones = itemsFiltradosYOrdenados.slice(0, limiteActual);
        onChange(porciones);

        // Actualizamos el contador con los nuevos cargados vs el total de la base de datos
        actualizarContador(porciones.length, totalAbsoluto);
      }
    }
  };

  // --- Lógica principal de filtrado y ordenación ---
  function apply() {
    limiteActual = 20; 

	// 1. Filtrado
    let result = items.filter(i => {
      const searchTerm = search.value ? search.value.toLowerCase().trim() : '';
      
      const matchesCategory = !category.value || i.category === category.value;
      const matchesFranchise = !franchise.value || i.franchise === franchise.value;
      
      let matchesSearch = true;
      if (searchTerm) {
        // Campos para buscar de forma segura
        const fieldsToSearch = [
          i.name,
          i.franchise,
          i.platform,
          i.brand,
          i.year,
          i.category,
          i.language,
          i.condition
        ];

        // Comprobamos si alguno de los campos existentes contiene el texto
        matchesSearch = fieldsToSearch.some(field => {
          if (field === undefined || field === null) return false;
          return field.toString().toLowerCase().includes(searchTerm);
        });
      }

      return matchesCategory && matchesFranchise && matchesSearch;
    });

    // 2. Ordenación (Corregido: Si no hay valor o es name-asc, ordena A-Z)
    const order = sortOrder.value;
    if (order === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (order === 'price-asc') {
      result.sort((a, b) => parsePrice(a.purchasePrice) - parsePrice(b.purchasePrice));
    } else if (order === 'price-desc') {
      result.sort((a, b) => parsePrice(b.purchasePrice) - parsePrice(a.purchasePrice));
    } else if (order === 'year-asc') {
      result.sort((a, b) => parseInt(a.year || 0, 10) - parseInt(b.year || 0, 10));
    } else if (order === 'year-desc') {
      result.sort((a, b) => parseInt(b.year || 0, 10) - parseInt(a.year || 0, 10));
    } else {
      // Por defecto (cuando está vacío "Ordenar por..." o se selecciona "name-asc") ordena de la A a la Z
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    itemsFiltradosYOrdenados = result;
    const primeraTanda = itemsFiltradosYOrdenados.slice(0, limiteActual);

    // 3. Actualizar contador usando el total absoluto
    actualizarContador(primeraTanda.length, totalAbsoluto);

    // 4. Enviar resultados al renderizador
    onChange(primeraTanda);
  }

  // --- Listeners ---
  category.onchange = apply;
  franchise.onchange = apply;
  sortOrder.onchange = apply;
  search.oninput = apply;
  
  // Ejecución inicial para que al entrar ya se vea el estado correcto y ordenado de la A-Z
  apply();
}
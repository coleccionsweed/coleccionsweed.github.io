// js/filters.js
import { t, catCorta } from './translations.js';
import { formatPrice, formatNumber } from './dataLoader.js';

const PAGE_SIZE = 24;

/**
 * Monta buscador, filtros, orden y scroll infinito.
 * `onChange(items)` recibe siempre el trozo visible de la lista ya filtrada.
 */
export function setupFilters(items, onChange) {
  const category = document.getElementById('categoryFilter');
  const franchise = document.getElementById('franchiseFilter');
  const brand = document.getElementById('brandFilter');
  const sortOrder = document.getElementById('sortOrder');
  const search = document.getElementById('search');
  const searchField = document.getElementById('searchField');
  const searchClear = document.getElementById('searchClear');
  const counter = document.getElementById('items-counter');
  const chips = document.getElementById('activeFilters');
  const sentinel = document.getElementById('loadMoreSentinel');
  const footerTotal = document.getElementById('footerTotal');

  const totalAbsoluto = items.length;
  let filtered = [];
  let limit = PAGE_SIZE;

  // --- Rellenado de los selectores ---
  function fillSelect(select, values, placeholderKey, translate) {
    const options = values
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort((a, b) => translate(a).localeCompare(translate(b), 'es'));

    select.innerHTML =
      `<option value="">${t(placeholderKey)}</option>` +
      options.map((value) => `<option value="${value}">${translate(value)}</option>`).join('');
  }

  fillSelect(category, items.map((i) => i.category), 'Category', catCorta);
  fillSelect(franchise, items.map((i) => i.franchise), 'Franchise', (v) => v);
  fillSelect(brand, items.map((i) => i.brand), 'Brand', (v) => v);

  // --- Estado en la URL: los filtros se pueden compartir y sobreviven al F5 ---
  const controls = {
    q: search,
    cat: category,
    fran: franchise,
    brand,
    sort: sortOrder
  };

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    Object.entries(controls).forEach(([key, control]) => {
      const value = params.get(key);
      if (value === null) return;
      // Solo aceptamos valores que existan de verdad en el selector.
      if (control.tagName === 'SELECT' && !Array.from(control.options).some((o) => o.value === value)) return;
      control.value = value;
    });
  }

  function writeUrl() {
    const params = new URLSearchParams();
    Object.entries(controls).forEach(([key, control]) => {
      const value = control.value.trim ? control.value.trim() : control.value;
      if (value && !(key === 'sort' && value === 'name-asc')) params.set(key, value);
    });
    const query = params.toString();
    const url = `${window.location.pathname}${query ? '?' + query : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }

  // --- Resumen de resultados ---
  // Siempre sobre el total filtrado, nunca sobre lo que se lleva cargado:
  // el scroll infinito iría cambiando la cifra y no significa nada.
  function updateCounter() {
    if (!counter) return;

    if (!filtered.length) {
      counter.innerHTML = '<span>Sin resultados</span>';
      return;
    }

    const value = filtered.reduce((sum, item) => sum + item.totalValue, 0);
    const units = filtered.reduce((sum, item) => sum + item.quantity, 0);

    counter.innerHTML = `
      <span><strong class="num">${formatNumber(filtered.length)}</strong> objetos</span>
      <span class="results-bar__sep">·</span>
      <span><strong class="num">${formatNumber(units)}</strong> unidades</span>
      <span class="results-bar__sep">·</span>
      <span><span class="results-bar__value num">${formatPrice(value)}</span></span>
    `;
  }

  // --- Chips de filtros activos ---
  function renderChips() {
    if (!chips) return;

    const activos = [
      { key: 'cat', label: 'Categoría', control: category, text: catCorta(category.value) },
      { key: 'fran', label: 'Franquicia', control: franchise, text: franchise.value },
      { key: 'brand', label: 'Marca', control: brand, text: brand.value },
      { key: 'q', label: 'Búsqueda', control: search, text: search.value.trim() }
    ].filter((entry) => entry.control.value.trim());

    [category, franchise, brand].forEach((select) => {
      select.classList.toggle('is-active', Boolean(select.value));
    });

    if (!activos.length) {
      chips.innerHTML = '';
      return;
    }

    chips.innerHTML =
      activos
        .map(
          (entry) => `
        <span class="chip">
          <span class="chip__label">${entry.label}:</span>${entry.text}
          <button type="button" data-clear="${entry.key}" aria-label="Quitar filtro ${entry.label}">✕</button>
        </span>`
        )
        .join('') +
      (activos.length > 1 ? '<button class="chip chip--reset" type="button" data-clear="all">Limpiar todo</button>' : '');
  }

  if (chips) {
    chips.addEventListener('click', (event) => {
      const target = event.target.closest('[data-clear]');
      if (!target) return;
      const key = target.dataset.clear;
      if (key === 'all') {
        category.value = '';
        franchise.value = '';
        brand.value = '';
        search.value = '';
      } else {
        controls[key].value = '';
      }
      apply();
    });
  }

  // --- Ordenación ---
  const sorters = {
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'es'),
    'name-desc': (a, b) => b.name.localeCompare(a.name, 'es'),
    'price-asc': (a, b) => a.priceValue - b.priceValue || a.name.localeCompare(b.name, 'es'),
    'price-desc': (a, b) => b.priceValue - a.priceValue || a.name.localeCompare(b.name, 'es'),
    'year-asc': (a, b) => (a.yearValue ?? 9999) - (b.yearValue ?? 9999) || a.name.localeCompare(b.name, 'es'),
    'year-desc': (a, b) => (b.yearValue ?? -1) - (a.yearValue ?? -1) || a.name.localeCompare(b.name, 'es')
  };

  // --- Filtrado principal ---
  function apply({ resetLimit = true } = {}) {
    if (resetLimit) limit = PAGE_SIZE;

    const term = search.value.trim().toLowerCase();
    const words = term ? term.split(/\s+/) : [];

    filtered = items.filter((item) => {
      if (category.value && item.category !== category.value) return false;
      if (franchise.value && item.franchise !== franchise.value) return false;
      if (brand.value && item.brand !== brand.value) return false;
      // Todas las palabras deben aparecer: "panini 2004" funciona.
      return words.every((word) => item.searchText.includes(word));
    });

    filtered.sort(sorters[sortOrder.value] || sorters['name-asc']);

    if (searchField) searchField.classList.toggle('has-value', Boolean(search.value));
    renderChips();
    writeUrl();
    emit();
  }

  function emit() {
    updateCounter();
    onChange(filtered.slice(0, limit), filtered);
  }

  function loadMore() {
    if (limit >= filtered.length) return false;
    limit += PAGE_SIZE;
    emit();
    return true;
  }

  // --- Scroll infinito ---
  // El sentinel con IntersectionObserver es el mecanismo principal; el listener
  // de scroll queda como red de seguridad (el observador no vuelve a avisar si
  // el sentinel sigue visible sin cambiar de estado).
  const MARGIN = 600;

  function nearBottom() {
    if (sentinel) {
      const rect = sentinel.getBoundingClientRect();
      return rect.top <= window.innerHeight + MARGIN;
    }
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - MARGIN;
  }

  function fillViewport() {
    if (window.location.hash) return;   // en la vista de detalle no cargamos más
    let guard = 0;
    while (guard++ < 10 && nearBottom() && loadMore()) { /* seguir llenando */ }
  }

  if (sentinel && window.IntersectionObserver) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fillViewport();
      },
      { rootMargin: `${MARGIN}px 0px` }
    );
    observer.observe(sentinel);
  }

  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    setTimeout(() => {
      scrollQueued = false;
      fillViewport();
    }, 90);
  }, { passive: true });

  // --- Listeners ---
  let debounce = null;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(apply, 140);
  });
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      search.value = '';
      search.focus();
      apply();
    });
  }
  [category, franchise, brand, sortOrder].forEach((control) => {
    control.addEventListener('change', () => apply());
  });

  if (footerTotal) {
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    footerTotal.textContent = `${formatNumber(totalAbsoluto)} objetos · ${formatPrice(totalValue)}`;
  }

  readUrl();
  apply();

  return { apply: () => apply({ resetLimit: false }) };
}

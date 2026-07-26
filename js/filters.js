// js/filters.js
import { t, catCorta, catIcono } from './translations.js';
import { formatPrice, formatNumber } from './dataLoader.js';
import { setQuery } from './renderer.js';

const PAGE_SIZE = 24;

/**
 * Monta buscador, categorías, filtros, orden y scroll infinito.
 * `onChange(visibles, todos)` recibe el trozo pintado y la lista filtrada entera.
 */
export function setupFilters(items, onChange) {
  const franchise = document.getElementById('franchiseFilter');
  const brand = document.getElementById('brandFilter');
  const sortOrder = document.getElementById('sortOrder');
  const search = document.getElementById('search');
  const searchField = document.getElementById('searchField');
  const searchClear = document.getElementById('searchClear');
  const counter = document.getElementById('items-counter');
  const chips = document.getElementById('activeFilters');
  const catBar = document.getElementById('catBar');
  const sentinel = document.getElementById('loadMoreSentinel');

  // La categoría vive aquí porque su control son las pastillas, no un <select>.
  const state = { q: '', cat: '', fran: '', brand: '', sort: 'name-asc' };

  let filtered = [];
  let limit = PAGE_SIZE;

  // --- Rellenado de los selectores ---
  function fillSelect(select, values, placeholderKey) {
    const options = values
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b, 'es'));

    select.innerHTML =
      `<option value="">${t(placeholderKey)}</option>` +
      options.map((value) => `<option value="${value}">${value}</option>`).join('');
  }

  fillSelect(franchise, items.map((i) => i.franchise), 'Franchise');
  fillSelect(brand, items.map((i) => i.brand), 'Brand');

  const categories = [...new Set(items.map((i) => i.category))]
    .filter(Boolean)
    .sort((a, b) => catCorta(a).localeCompare(catCorta(b), 'es'));

  // --- Filtrado (reutilizable para contar por categoría) ---
  function matches(item, { ignoreCategory = false } = {}) {
    if (!ignoreCategory && state.cat && item.category !== state.cat) return false;
    if (state.fran && item.franchise !== state.fran) return false;
    if (state.brand && item.brand !== state.brand) return false;
    const words = state.q ? state.q.toLowerCase().split(/\s+/) : [];
    return words.every((word) => item.searchText.includes(word));
  }

  /**
   * Pastillas de categoría con el número de objetos que quedarían al pulsarlas
   * (es decir, contando el resto de filtros pero no la categoría actual).
   */
  function renderCatBar() {
    if (!catBar) return;

    const base = items.filter((item) => matches(item, { ignoreCategory: true }));
    const counts = new Map();
    base.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));

    const pills = [
      `<button class="cat-pill" type="button" data-cat="" aria-pressed="${!state.cat}">
         <span class="cat-pill__icon">✦</span>Todo
         <span class="cat-pill__n num">${formatNumber(base.length)}</span>
       </button>`
    ];

    categories.forEach((category) => {
      const count = counts.get(category) || 0;
      const active = state.cat === category;
      if (!count && !active) return;   // no ofrecemos categorías vacías
      pills.push(`
        <button class="cat-pill" type="button" data-cat="${category}" aria-pressed="${active}">
          <span class="cat-pill__icon">${catIcono(category)}</span>${catCorta(category)}
          <span class="cat-pill__n num">${formatNumber(count)}</span>
        </button>
      `);
    });

    catBar.innerHTML = pills.join('');
  }

  if (catBar) {
    catBar.addEventListener('click', (event) => {
      const pill = event.target.closest('[data-cat]');
      if (!pill) return;
      // Volver a pulsar la categoría activa la quita.
      state.cat = pill.dataset.cat === state.cat ? '' : pill.dataset.cat;
      apply();
      pill.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
  }

  // --- Estado en la URL: los filtros se comparten y sobreviven al F5 ---
  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const get = (key) => params.get(key) || '';

    state.q = get('q');
    state.cat = categories.includes(get('cat')) ? get('cat') : '';
    state.fran = get('fran');
    state.brand = get('brand');
    state.sort = sorters[get('sort')] ? get('sort') : 'name-asc';

    search.value = state.q;
    franchise.value = state.fran;
    brand.value = state.brand;
    sortOrder.value = state.sort;

    // Un valor que ya no existe en el selector se descarta.
    if (franchise.selectedIndex < 0 || !franchise.value) state.fran = franchise.value = '';
    if (brand.selectedIndex < 0 || !brand.value) state.brand = brand.value = '';
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.cat) params.set('cat', state.cat);
    if (state.fran) params.set('fran', state.fran);
    if (state.brand) params.set('brand', state.brand);
    if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);

    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? '?' + query : ''}${window.location.hash}`);
  }

  // --- Resumen de resultados (siempre sobre el total filtrado) ---
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
      { key: 'fran', label: 'Franquicia', text: state.fran },
      { key: 'brand', label: 'Marca', text: state.brand },
      { key: 'q', label: 'Búsqueda', text: state.q }
    ].filter((entry) => entry.text);

    [franchise, brand].forEach((select) => select.classList.toggle('is-active', Boolean(select.value)));

    if (!activos.length) {
      chips.innerHTML = '';
      return;
    }

    chips.innerHTML =
      activos.map((entry) => `
        <span class="chip">
          <span class="chip__label">${entry.label}:</span>${entry.text}
          <button type="button" data-clear="${entry.key}" aria-label="Quitar filtro ${entry.label}">✕</button>
        </span>`).join('') +
      (activos.length > 1 || state.cat
        ? '<button class="chip chip--reset" type="button" data-clear="all">Limpiar todo</button>'
        : '');
  }

  if (chips) {
    chips.addEventListener('click', (event) => {
      const target = event.target.closest('[data-clear]');
      if (!target) return;

      if (target.dataset.clear === 'all') {
        state.q = state.cat = state.fran = state.brand = '';
        search.value = franchise.value = brand.value = '';
      } else {
        const key = target.dataset.clear;
        state[key] = '';
        if (key === 'q') search.value = '';
        if (key === 'fran') franchise.value = '';
        if (key === 'brand') brand.value = '';
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

  // --- Ciclo principal ---
  function apply({ resetLimit = true } = {}) {
    if (resetLimit) limit = PAGE_SIZE;

    filtered = items.filter((item) => matches(item));
    filtered.sort(sorters[state.sort] || sorters['name-asc']);

    setQuery(state.q);
    if (searchField) searchField.classList.toggle('has-value', Boolean(state.q));
    renderCatBar();
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
  const MARGIN = 600;

  function nearBottom() {
    if (sentinel) return sentinel.getBoundingClientRect().top <= window.innerHeight + MARGIN;
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - MARGIN;
  }

  function fillViewport() {
    if (window.location.hash) return;   // en la vista de detalle no cargamos más
    let guard = 0;
    while (guard++ < 10 && nearBottom() && loadMore()) { /* seguir llenando */ }
  }

  if (sentinel && window.IntersectionObserver) {
    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((entry) => entry.isIntersecting)) fillViewport(); },
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
    state.q = search.value.trim();
    clearTimeout(debounce);
    debounce = setTimeout(apply, 140);
  });

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      state.q = '';
      search.value = '';
      search.focus();
      apply();
    });
  }

  franchise.addEventListener('change', () => { state.fran = franchise.value; apply(); });
  brand.addEventListener('change', () => { state.brand = brand.value; apply(); });
  sortOrder.addEventListener('change', () => { state.sort = sortOrder.value; apply(); });

  // Atajo: "/" enfoca el buscador, Escape lo limpia.
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement && document.activeElement.tagName;
    const escribiendo = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    if (event.key === '/' && !escribiendo && !window.location.hash) {
      event.preventDefault();
      search.focus();
      search.select();
    } else if (event.key === 'Escape' && document.activeElement === search && state.q) {
      state.q = '';
      search.value = '';
      apply();
    }
  });

  readUrl();
  apply();

  return { apply: () => apply({ resetLimit: false }) };
}

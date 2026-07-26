// js/stats.js
import { loadCollection, formatPrice, formatNumber } from './dataLoader.js';
import { catCorta, catIcono } from './translations.js';
import { inicializarVisor } from './visor3d.js';

const PALETTE = [
  '#5b7cfa', '#38bdf8', '#34d399', '#fbbf24', '#f87171',
  '#c084fc', '#f472b6', '#4ade80', '#fb923c', '#2dd4bf',
  '#60a5fa', '#facc15', '#fb7185', '#a78bfa', '#22d3ee', '#94a3b8'
];

const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TICK_COLOR = '#8891a0';

const charts = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Agrupa y suma: devuelve [{ key, units, value, items }]. */
function group(items, keyFn, fallback) {
  const map = new Map();

  items.forEach((item) => {
    const key = keyFn(item) ?? fallback;
    if (key === null || key === undefined) return;
    const bucket = map.get(key) || { key, units: 0, value: 0, items: 0 };
    bucket.units += item.quantity;
    bucket.value += item.totalValue;
    bucket.items += 1;
    map.set(key, bucket);
  });

  return [...map.values()];
}

function median(numbers) {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function initStatsPage() {
  const view = document.getElementById('statsView');
  if (!view) return;

  view.innerHTML = `
    <div class="loading-block">
      <div class="album__spinner" aria-hidden="true"></div>
      <h2>Calculando estadísticas…</h2>
      <p>Leyendo el inventario completo.</p>
    </div>
  `;

  const items = await loadCollection();

  if (!items.length) {
    view.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📉</div>
        <h3>No se pudo cargar el inventario</h3>
        <p>Revisa que los archivos de <code>data/</code> estén accesibles.</p>
      </div>
    `;
    return;
  }

  // ---------------------------------------------------------------
  // Cálculos
  // ---------------------------------------------------------------
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const withPrice = items.filter((item) => item.priceValue > 0);
  const prices = withPrice.map((item) => item.priceValue);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const medianPrice = median(prices);
  const mostExpensive = items.reduce((best, item) => (item.priceValue > (best?.priceValue ?? -1) ? item : best), null);
  const freeItems = items.length - withPrice.length;
  const duplicated = items.filter((item) => item.quantity > 1);

  const byCategory = group(items, (i) => i.category, 'sin-categoria').sort((a, b) => b.units - a.units);
  const byFranchise = group(items, (i) => i.franchise, 'Sin franquicia');
  const byBrand = group(items, (i) => i.brand, 'Sin marca');
  const byCondition = group(items, (i) => i.condition, 'Sin estado').sort((a, b) => b.units - a.units);
  const byLanguage = group(items, (i) => i.language, 'Sin idioma').sort((a, b) => b.items - a.items);
  const byPlatform = group(items.filter((i) => i.platform), (i) => i.platform, null).sort((a, b) => b.items - a.items);
  const byYear = group(items, (i) => i.yearValue, null).sort((a, b) => a.key - b.key);

  // Décadas
  const byDecade = group(
    items.filter((i) => i.yearValue),
    (i) => `${Math.floor(i.yearValue / 10) * 10}s`,
    null
  ).sort((a, b) => parseInt(a.key, 10) - parseInt(b.key, 10));

  // Tramos de precio
  const RANGES = [
    { label: 'Gratis', min: -1, max: 0.0001 },
    { label: '0-5 €', min: 0.0001, max: 5 },
    { label: '5-15 €', min: 5, max: 15 },
    { label: '15-30 €', min: 15, max: 30 },
    { label: '30-60 €', min: 30, max: 60 },
    { label: '60-100 €', min: 60, max: 100 },
    { label: '+100 €', min: 100, max: Infinity }
  ];
  const priceBuckets = RANGES.map((range) => ({
    label: range.label,
    count: items.filter((item) => item.priceValue > range.min && item.priceValue <= range.max).length
  }));

  // Gasto acumulado por año (solo con año conocido)
  let running = 0;
  const cumulative = byYear.map((bucket) => {
    running += bucket.value;
    return Number(running.toFixed(2));
  });

  const topCategory = byCategory[0];
  const oldest = items.filter((i) => i.yearValue).sort((a, b) => a.yearValue - b.yearValue)[0];
  const franchisesByValue = [...byFranchise].sort((a, b) => b.value - a.value).slice(0, 8);
  const franchisesByUnits = [...byFranchise]
    .filter((bucket) => bucket.key !== 'Sin franquicia')
    .sort((a, b) => b.units - a.units)
    .slice(0, 8);
  const brandsByValue = [...byBrand].sort((a, b) => b.value - a.value).slice(0, 8);
  const brandsByItems = [...byBrand].sort((a, b) => b.items - a.items).slice(0, 8);
  const topItems = [...items].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

  // Tabla resumen por categoría
  const categoryRows = [...byCategory].sort((a, b) => b.value - a.value);

  // ---------------------------------------------------------------
  // Maquetación
  // ---------------------------------------------------------------
  view.innerHTML = `
    <div class="page-head">
      <h2>Estadísticas globales</h2>
      <p>${formatNumber(items.length)} objetos · ${byCategory.length} categorías · ${byFranchise.length} franquicias · ${byBrand.length} marcas</p>
    </div>

    <div class="kpi-grid">
      ${kpi('Total invertido', formatPrice(totalValue), 'Precio × cantidad')}
      ${kpi('Objetos distintos', formatNumber(items.length), `${formatNumber(totalUnits)} uds. con repetidos`)}
      ${kpi('Precio medio', formatPrice(avgPrice), `Mediana ${formatPrice(medianPrice)}`)}
      ${kpi('Objeto más caro', formatPrice(mostExpensive.priceValue), escapeHtml(mostExpensive.name))}
      ${kpi('Categoría líder', `${catIcono(topCategory.key)} ${escapeHtml(catCorta(topCategory.key))}`, `${formatNumber(topCategory.units)} unidades`)}
      ${kpi('Franquicia líder', escapeHtml(franchisesByValue[0].key), `${formatPrice(franchisesByValue[0].value)} invertidos`)}
      ${kpi('Más antiguo', oldest ? String(oldest.yearValue) : '—', oldest ? escapeHtml(oldest.name) : 'Sin año')}
      ${kpi('Sin coste', formatNumber(freeItems), `${formatNumber(duplicated.length)} objetos repetidos`)}
    </div>

    <div class="panel-grid">
      <div class="panel">
        <div class="panel__title">Unidades por categoría</div>
        <div class="chart-box chart-box--donut"><canvas id="chartCategories"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Inversión por categoría</div>
        <div class="chart-box"><canvas id="chartCategoryValue"></canvas></div>
      </div>

      <div class="panel panel--wide">
        <div class="panel__title">Objetos y gasto por año de edición</div>
        <div class="chart-box chart-box--tall"><canvas id="chartYears"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Gasto acumulado por año</div>
        <div class="chart-box"><canvas id="chartCumulative"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Objetos por tramo de precio</div>
        <div class="chart-box"><canvas id="chartPriceRanges"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Objetos por década</div>
        <div class="chart-box"><canvas id="chartDecades"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Estado de conservación</div>
        <div class="chart-box chart-box--donut"><canvas id="chartCondition"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">Idiomas</div>
        <div class="chart-box"><canvas id="chartLanguages"></canvas></div>
      </div>

      ${byPlatform.length ? `
      <div class="panel">
        <div class="panel__title">Plataformas de videojuego</div>
        <div class="chart-box"><canvas id="chartPlatforms"></canvas></div>
      </div>` : ''}

      <div class="panel panel--wide">
        <div class="panel__title">Resumen por categoría</div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Objetos</th>
                <th class="col-opt">Unidades</th>
                <th class="col-opt">Precio medio</th>
                <th class="col-opt">% del gasto</th>
                <th>Invertido</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows.map((row) => `
                <tr>
                  <td class="cell-name">${catIcono(row.key)} ${escapeHtml(catCorta(row.key))}</td>
                  <td class="cell-num">${formatNumber(row.items)}</td>
                  <td class="cell-num col-opt">${formatNumber(row.units)}</td>
                  <td class="cell-num col-opt">${formatPrice(row.units ? row.value / row.units : 0)}</td>
                  <td class="cell-num col-opt">${totalValue ? ((row.value / totalValue) * 100).toFixed(1) : '0'} %</td>
                  <td class="cell-num">${formatPrice(row.value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel__title">Franquicias por inversión</div>
        ${table(['#', 'Franquicia', 'Invertido'], franchisesByValue, (row, max) => [
          escapeHtml(row.key), formatPrice(row.value), row.value / max
        ])}
      </div>

      <div class="panel">
        <div class="panel__title">Franquicias por unidades</div>
        ${table(['#', 'Franquicia', 'Unidades'], franchisesByUnits, (row, max) => [
          escapeHtml(row.key), `${formatNumber(row.units)} uds`, row.units / max
        ], 'units')}
      </div>

      <div class="panel">
        <div class="panel__title">Marcas por inversión</div>
        ${table(['#', 'Marca', 'Invertido'], brandsByValue, (row, max) => [
          escapeHtml(row.key), formatPrice(row.value), row.value / max
        ])}
      </div>

      <div class="panel">
        <div class="panel__title">Marcas por nº de objetos</div>
        ${table(['#', 'Marca', 'Objetos'], brandsByItems, (row, max) => [
          escapeHtml(row.key), formatNumber(row.items), row.items / max
        ], 'items')}
      </div>

      <div class="panel panel--wide">
        <div class="panel__title">Objetos más valiosos</div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th class="cell-rank">#</th>
                <th>Objeto</th>
                <th class="col-opt">Categoría</th>
                <th class="col-opt">Año</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${topItems.map((item, index) => `
                <tr>
                  <td class="cell-rank">${index + 1}</td>
                  <td class="cell-name"><a href="/#${item.id}">${escapeHtml(item.name)}</a></td>
                  <td class="col-opt">${escapeHtml(catCorta(item.category))}</td>
                  <td class="cell-num col-opt">${item.year || '—'}</td>
                  <td class="cell-num">${formatPrice(item.totalValue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  drawCharts({ byCategory, byYear, cumulative, priceBuckets, byDecade, byCondition, byLanguage, byPlatform });
  initViewerWhenVisible();
}

function kpi(label, value, foot) {
  return `
    <div class="kpi">
      <span class="kpi__label">${label}</span>
      <span class="kpi__value">${value}</span>
      <span class="kpi__foot">${foot}</span>
    </div>
  `;
}

/** Tabla con barra proporcional; `mapRow` devuelve [nombre, valor, ratio]. */
function table(headers, rows, mapRow, unit = 'value') {
  if (!rows.length) {
    return '<p class="section__hint" style="margin:0;">No hay datos suficientes.</p>';
  }

  const max = Math.max(...rows.map((row) => row[unit])) || 1;

  return `
    <table class="data-table">
      <thead>
        <tr><th class="cell-rank">${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th></tr>
      </thead>
      <tbody>
        ${rows.map((row, index) => {
          const [name, formatted, ratio] = mapRow(row, max);
          return `
            <tr>
              <td class="cell-rank">${index + 1}</td>
              <td class="cell-name">${name}</td>
              <td class="cell-num bar-cell">
                <span class="bar-cell__fill" style="width: ${Math.max(2, ratio * 100)}%; opacity: ${(0.1 + ratio * 0.28).toFixed(2)};"></span>
                <span style="position: relative;">${formatted}</span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function drawCharts(data) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está disponible: se muestran solo las tablas.');
    return;
  }

  Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, sans-serif";
  Chart.defaults.color = TICK_COLOR;

  charts.forEach((chart) => chart.destroy());
  charts.length = 0;

  const tooltip = {
    backgroundColor: 'rgba(16,19,25,0.97)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 4,
    titleColor: '#fff',
    bodyColor: '#c8d0dc',
    displayColors: true,
    boxPadding: 4
  };

  const donutLegend = {
    position: 'bottom',
    labels: { padding: 11, boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } }
  };

  function add(id, config) {
    const canvas = document.getElementById(id);
    if (canvas) charts.push(new Chart(canvas, config));
  }

  const percentLabel = (ctx) => {
    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
    return ` ${formatNumber(ctx.parsed)} · ${((ctx.parsed / total) * 100).toFixed(1)}%`;
  };

  // --- Unidades por categoría ---
  add('chartCategories', {
    type: 'doughnut',
    data: {
      labels: data.byCategory.map((b) => catCorta(b.key)),
      datasets: [{
        data: data.byCategory.map((b) => b.units),
        backgroundColor: data.byCategory.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderColor: '#151920'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: { legend: donutLegend, tooltip: { ...tooltip, callbacks: { label: percentLabel } } }
    }
  });

  // --- Inversión por categoría ---
  const catValue = [...data.byCategory].sort((a, b) => b.value - a.value);
  add('chartCategoryValue', {
    type: 'bar',
    data: {
      labels: catValue.map((b) => catCorta(b.key)),
      datasets: [{
        data: catValue.map((b) => Number(b.value.toFixed(2))),
        backgroundColor: catValue.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius: 2,
        maxBarThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => ` ${formatPrice(ctx.parsed.x)}` } }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, border: { display: false }, ticks: { callback: (v) => `${v} €`, font: { size: 10.5 } } },
        y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // --- Objetos y gasto por año ---
  add('chartYears', {
    data: {
      labels: data.byYear.map((b) => b.key),
      datasets: [
        {
          type: 'bar',
          label: 'Objetos',
          data: data.byYear.map((b) => b.items),
          backgroundColor: 'rgba(91,124,250,0.75)',
          borderRadius: 2,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Invertido',
          data: data.byYear.map((b) => Number(b.value.toFixed(2))),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12 } },
        tooltip: {
          ...tooltip,
          callbacks: {
            label: (ctx) => (ctx.dataset.yAxisID === 'y1'
              ? ` Invertido: ${formatPrice(ctx.parsed.y)}`
              : ` Objetos: ${formatNumber(ctx.parsed.y)}`)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxRotation: 60 } },
        y: { position: 'left', beginAtZero: true, grid: { color: GRID_COLOR }, border: { display: false }, ticks: { font: { size: 10.5 } } },
        y1: { position: 'right', beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { callback: (v) => `${v} €`, font: { size: 10.5 } } }
      }
    }
  });

  // --- Gasto acumulado ---
  add('chartCumulative', {
    type: 'line',
    data: {
      labels: data.byYear.map((b) => b.key),
      datasets: [{
        label: 'Acumulado',
        data: data.cumulative,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => ` Acumulado: ${formatPrice(ctx.parsed.y)}` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxRotation: 60 } },
        y: { beginAtZero: true, grid: { color: GRID_COLOR }, border: { display: false }, ticks: { callback: (v) => `${v} €`, font: { size: 10.5 } } }
      }
    }
  });

  // --- Tramos de precio ---
  add('chartPriceRanges', {
    type: 'bar',
    data: {
      labels: data.priceBuckets.map((b) => b.label),
      datasets: [{
        data: data.priceBuckets.map((b) => b.count),
        backgroundColor: '#5b7cfa',
        borderRadius: 2,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => ` ${formatNumber(ctx.parsed.y)} objetos` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10.5 } } },
        y: { beginAtZero: true, grid: { color: GRID_COLOR }, border: { display: false }, ticks: { precision: 0, font: { size: 10.5 } } }
      }
    }
  });

  // --- Décadas ---
  add('chartDecades', {
    type: 'bar',
    data: {
      labels: data.byDecade.map((b) => b.key),
      datasets: [{
        data: data.byDecade.map((b) => b.items),
        backgroundColor: '#38bdf8',
        borderRadius: 2,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => ` ${formatNumber(ctx.parsed.y)} objetos` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10.5 } } },
        y: { beginAtZero: true, grid: { color: GRID_COLOR }, border: { display: false }, ticks: { precision: 0, font: { size: 10.5 } } }
      }
    }
  });

  // --- Estado ---
  add('chartCondition', {
    type: 'doughnut',
    data: {
      labels: data.byCondition.map((b) => b.key),
      datasets: [{
        data: data.byCondition.map((b) => b.units),
        backgroundColor: ['#34d399', '#fbbf24', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#151920'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: { legend: donutLegend, tooltip: { ...tooltip, callbacks: { label: percentLabel } } }
    }
  });

  // --- Idiomas ---
  const languages = data.byLanguage.slice(0, 8);
  add('chartLanguages', {
    type: 'bar',
    data: {
      labels: languages.map((b) => b.key),
      datasets: [{
        data: languages.map((b) => b.items),
        backgroundColor: languages.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius: 2,
        maxBarThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => ` ${formatNumber(ctx.parsed.x)} objetos` } }
      },
      scales: {
        x: { grid: { color: GRID_COLOR }, border: { display: false }, ticks: { precision: 0, font: { size: 10.5 } } },
        y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // --- Plataformas ---
  if (data.byPlatform.length) {
    add('chartPlatforms', {
      type: 'bar',
      data: {
        labels: data.byPlatform.map((b) => b.key),
        datasets: [{
          data: data.byPlatform.map((b) => b.items),
          backgroundColor: data.byPlatform.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 2,
          maxBarThickness: 18
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltip, callbacks: { label: (ctx) => ` ${formatNumber(ctx.parsed.x)} juegos` } }
        },
        scales: {
          x: { grid: { color: GRID_COLOR }, border: { display: false }, ticks: { precision: 0, font: { size: 10.5 } } },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10.5 } } }
        }
      }
    });
  }
}

/** El visor 3D solo arranca cuando entra en pantalla (ahorra datos en móvil). */
function initViewerWhenVisible() {
  const target = document.getElementById('visor-3d-container');
  if (!target) return;

  if (!window.IntersectionObserver) {
    inicializarVisor('visor-3d-container', 'modelos/mapParis.glb');
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    inicializarVisor('visor-3d-container', 'modelos/mapParis.glb');
  }, { rootMargin: '200px' });

  observer.observe(target);
}

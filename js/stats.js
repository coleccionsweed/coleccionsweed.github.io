// js/stats.js
import { loadCollection, formatPrice, formatNumber } from './dataLoader.js';
import { catCorta, catIcono } from './translations.js';
import { inicializarVisor } from './visor3d.js';

const PALETTE = [
  '#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#a855f7', '#84cc16', '#f97316', '#14b8a6',
  '#3b82f6', '#eab308', '#f43f5e', '#8b5cf6', '#06b6d4', '#64748b'
];

const GRID_COLOR = 'rgba(255,255,255,0.055)';
const TICK_COLOR = '#8891a0';

const charts = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Agrupa y suma: devuelve [{ key, units, value, items }] ordenado. */
function group(items, keyFn, fallback) {
  const map = new Map();

  items.forEach((item) => {
    const key = keyFn(item) || fallback;
    const bucket = map.get(key) || { key, units: 0, value: 0, items: 0 };
    bucket.units += item.quantity;
    bucket.value += item.totalValue;
    bucket.items += 1;
    map.set(key, bucket);
  });

  return [...map.values()];
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

  // --- Totales ---
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const withPrice = items.filter((item) => item.priceValue > 0);
  const avgPrice = withPrice.length ? withPrice.reduce((s, i) => s + i.priceValue, 0) / withPrice.length : 0;
  const mostExpensive = items.reduce((best, item) => (item.priceValue > (best?.priceValue ?? -1) ? item : best), null);

  const byCategory = group(items, (i) => i.category, 'sin-categoria').sort((a, b) => b.units - a.units);
  const byFranchise = group(items, (i) => i.franchise, 'Sin franquicia');
  const byBrand = group(items, (i) => i.brand, 'Sin marca');
  const byYear = group(items, (i) => i.yearValue, null)
    .filter((bucket) => bucket.key !== null)
    .sort((a, b) => a.key - b.key);

  const topCategory = byCategory[0];
  const franchisesByValue = [...byFranchise].sort((a, b) => b.value - a.value).slice(0, 8);
  const franchisesByUnits = [...byFranchise]
    .filter((bucket) => bucket.key !== 'Sin franquicia')
    .sort((a, b) => b.units - a.units)
    .slice(0, 8);
  const brandsByValue = [...byBrand].sort((a, b) => b.value - a.value).slice(0, 8);
  const topItems = [...items].sort((a, b) => b.totalValue - a.totalValue).slice(0, 8);

  // --- Maquetación ---
  view.innerHTML = `
    <div class="page-head">
      <h2>Estadísticas globales</h2>
      <p>${formatNumber(items.length)} objetos distintos analizados · ${byCategory.length} categorías · ${byFranchise.length} franquicias</p>
    </div>

    <div class="kpi-grid">
      ${kpi('Total invertido', formatPrice(totalValue), '#10b981', 'Suma de precio × cantidad')}
      ${kpi('Objetos distintos', formatNumber(items.length), '#ffffff', `${formatNumber(totalUnits)} unidades contando repetidos`)}
      ${kpi('Precio medio', formatPrice(avgPrice), '#6366f1', `Sobre ${formatNumber(withPrice.length)} objetos con precio`)}
      ${kpi('Categoría líder', `${catIcono(topCategory.key)} ${escapeHtml(catCorta(topCategory.key))}`, '#22d3ee', `${formatNumber(topCategory.units)} unidades`)}
      ${kpi('Objeto más caro', formatPrice(mostExpensive.priceValue), '#f59e0b', escapeHtml(mostExpensive.name))}
      ${kpi('Rango de años', byYear.length ? `${byYear[0].key}–${byYear[byYear.length - 1].key}` : '—', '#a855f7', `${byYear.length} años representados`)}
    </div>

    <div class="panel-grid">
      <div class="panel">
        <div class="panel__title">🍩 Unidades por categoría</div>
        <div class="chart-box chart-box--donut"><canvas id="chartCategories"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">💰 Inversión por categoría</div>
        <div class="chart-box"><canvas id="chartCategoryValue"></canvas></div>
      </div>

      <div class="panel panel--wide">
        <div class="panel__title">📈 Objetos por año de edición</div>
        <div class="chart-box chart-box--tall"><canvas id="chartYears"></canvas></div>
      </div>

      <div class="panel">
        <div class="panel__title">🏆 Franquicias por inversión</div>
        ${table(['#', 'Franquicia', 'Invertido'], franchisesByValue, (row, max) => [
          escapeHtml(row.key),
          formatPrice(row.value),
          row.value / max
        ])}
      </div>

      <div class="panel">
        <div class="panel__title">📦 Franquicias por unidades</div>
        ${table(['#', 'Franquicia', 'Unidades'], franchisesByUnits, (row, max) => [
          escapeHtml(row.key),
          `${formatNumber(row.units)} uds`,
          row.units / max
        ], 'units')}
      </div>

      <div class="panel">
        <div class="panel__title">🏷️ Marcas por inversión</div>
        ${table(['#', 'Marca', 'Invertido'], brandsByValue, (row, max) => [
          escapeHtml(row.key),
          formatPrice(row.value),
          row.value / max
        ])}
      </div>

      <div class="panel">
        <div class="panel__title">💎 Objetos más valiosos</div>
        <table class="data-table">
          <thead><tr><th class="cell-rank">#</th><th>Objeto</th><th>Valor</th></tr></thead>
          <tbody>
            ${topItems.map((item, index) => `
              <tr>
                <td class="cell-rank">${index + 1}</td>
                <td class="cell-name">
                  <a href="/#${item.id}" style="color:inherit;text-decoration:none;">${escapeHtml(item.name)}</a>
                </td>
                <td class="cell-num">${formatPrice(item.totalValue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  drawCharts({ byCategory, byYear });
  initViewerWhenVisible();
}

function kpi(label, value, color, foot) {
  return `
    <div class="kpi" style="--kpi-color: ${color};">
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

  const max = Math.max(...rows.map((row) => (unit === 'units' ? row.units : row.value))) || 1;

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th class="cell-rank">${headers[0]}</th>
          <th>${headers[1]}</th>
          <th>${headers[2]}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, index) => {
          const [name, formatted, ratio] = mapRow(row, max);
          return `
            <tr>
              <td class="cell-rank">${index + 1}</td>
              <td class="cell-name">${name}</td>
              <td class="cell-num bar-cell">
                <span class="bar-cell__fill" style="width: ${Math.max(3, ratio * 100)}%; opacity: ${0.18 + ratio * 0.5};"></span>
                <span style="position: relative;">${formatted}</span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function drawCharts({ byCategory, byYear }) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está disponible: se muestran solo las tablas.');
    return;
  }

  Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, sans-serif";
  Chart.defaults.color = TICK_COLOR;

  charts.forEach((chart) => chart.destroy());
  charts.length = 0;

  const tooltip = {
    backgroundColor: 'rgba(12,14,20,0.95)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    titleColor: '#fff',
    bodyColor: '#cbd3e0',
    displayColors: true,
    boxPadding: 4
  };

  // --- Donut: unidades por categoría ---
  const donut = document.getElementById('chartCategories');
  if (donut) {
    charts.push(new Chart(donut, {
      type: 'doughnut',
      data: {
        labels: byCategory.map((bucket) => catCorta(bucket.key)),
        datasets: [{
          data: byCategory.map((bucket) => bucket.units),
          backgroundColor: byCategory.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 3,
          borderColor: '#12151e',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          tooltip: {
            ...tooltip,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${formatNumber(ctx.parsed)} uds · ${pct}%`;
              }
            }
          },
          legend: {
            position: 'bottom',
            labels: { padding: 12, boxWidth: 9, boxHeight: 9, usePointStyle: true, font: { size: 11.5 } }
          }
        }
      }
    }));
  }

  // --- Barras horizontales: inversión por categoría ---
  const valueCanvas = document.getElementById('chartCategoryValue');
  if (valueCanvas) {
    const sorted = [...byCategory].sort((a, b) => b.value - a.value);
    charts.push(new Chart(valueCanvas, {
      type: 'bar',
      data: {
        labels: sorted.map((bucket) => catCorta(bucket.key)),
        datasets: [{
          data: sorted.map((bucket) => Number(bucket.value.toFixed(2))),
          backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
          borderColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 'flex',
          maxBarThickness: 22
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
          x: {
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: { callback: (value) => `${value} €`, font: { size: 11 } }
          },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11.5 } } }
        }
      }
    }));
  }

  // --- Línea + barras: objetos y gasto por año ---
  const yearsCanvas = document.getElementById('chartYears');
  if (yearsCanvas && byYear.length) {
    charts.push(new Chart(yearsCanvas, {
      data: {
        labels: byYear.map((bucket) => bucket.key),
        datasets: [
          {
            type: 'bar',
            label: 'Objetos',
            data: byYear.map((bucket) => bucket.items),
            backgroundColor: 'rgba(99,102,241,0.55)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 5,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Invertido',
            data: byYear.map((bucket) => Number(bucket.value.toFixed(2))),
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34,211,238,0.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 2.5,
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
          legend: { labels: { usePointStyle: true, boxWidth: 9, boxHeight: 9, padding: 14 } },
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
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10.5 }, maxRotation: 60 } },
          y: {
            position: 'left',
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            border: { display: false },
            title: { display: true, text: 'Objetos', font: { size: 10.5 } }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: { display: false },
            border: { display: false },
            ticks: { callback: (value) => `${value} €`, font: { size: 10.5 } }
          }
        }
      }
    }));
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

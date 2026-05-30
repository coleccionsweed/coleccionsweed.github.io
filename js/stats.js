// js/stats.js

// Almacén para las instancias de Chart.js y evitar duplicados pesados
let charts = { categories: null, condition: null };

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  let clean = priceStr.replace('€', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export function initStatsPage(allItems) {
  // 1. Mostrar/Ocultar los contenedores principales de la SPA
  document.getElementById('galleryView').style.display = 'none';
  document.getElementById('statsView').style.display = 'block';

  // Cambiar estilo activo en los enlaces de navegación de la cabecera
  document.getElementById('navGallery').style.color = '#9ca3af';
  document.getElementById('navStats').style.color = '#fff';

  // 2. Procesamiento de Métricas Avanzadas
  let totalValue = 0;
  let totalItems = allItems.length;
  let totalQuantity = 0;

  const categoriesMap = {};
  const conditionsMap = {};
  const franchisesMap = {};
  const brandsMap = {};

  allItems.forEach(item => {
    const qty = parseInt(item.quantity) || 1;
    const price = parsePrice(item.purchasePrice);
    const itemTotalValue = price * qty;

    totalQuantity += qty;
    totalValue += itemTotalValue;

    // Agrupación por Categoría (Type)
    const cat = item.type || 'Sin Categoría';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + qty;

    // Agrupación por Estado (Condition)
    const cond = item.condition ? item.condition.toUpperCase() : 'DESCONOCIDO';
    conditionsMap[cond] = (conditionsMap[cond] || 0) + qty;

    // Agrupación por Franquicia para valor económico
    const fran = item.franchise || 'Sin Franquicia';
    franchisesMap[fran] = (franchisesMap[fran] || 0) + itemTotalValue;

    // Agrupación por Marcas
    if (item.brand) {
      brandsMap[item.brand] = (brandsMap[item.brand] || 0) + qty;
    }
  });

  // 3. Pintar Tarjetas Numéricas
  document.getElementById('statTotalValue').innerText = totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  document.getElementById('statTotalItems').innerText = totalItems;
  document.getElementById('statTotalQuantity').innerText = totalQuantity;

  // 4. GENERAR GRÁFICO DE ROSCO (Doughnut) - CATEGORÍAS
  if (charts.categories) charts.categories.destroy();
  charts.categories = new Chart(document.getElementById('chartCategories'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoriesMap),
      datasets: [{
        data: Object.values(categoriesMap),
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#a855f7', '#3b82f6'],
        borderWidth: 3,
        borderColor: '#1f2937'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#e5e7eb', font: { size: 12 } } }
      }
    }
  });

  // 5. GENERAR GRÁFICO DE BARRAS - ESTADOS
  if (charts.condition) charts.condition.destroy();
  charts.condition = new Chart(document.getElementById('chartCondition'), {
    type: 'bar',
    data: {
      labels: Object.keys(conditionsMap),
      datasets: [{
        label: 'Unidades',
        data: Object.values(conditionsMap),
        backgroundColor: '#3b82f6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#e5e7eb' }, grid: { display: false } },
        y: { ticks: { color: '#e5e7eb' }, grid: { color: '#374151' } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 6. GENERAR TABLA TOP 5 FRANQUICIAS
  const topFranchises = Object.entries(franchisesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  document.getElementById('topFranchisesTable').innerHTML = createStatsTable(
    ['Franquicia', 'Inversión Est.'],
    topFranchises.map(([name, val]) => [name, val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })])
  );

  // 7. GENERAR TABLA TOP MARCAS
  const topBrands = Object.entries(brandsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  document.getElementById('topBrandsTable').innerHTML = createStatsTable(
    ['Marca / Fabricante', 'Cantidad'],
    topBrands.map(([name, qty]) => [name, `${qty} uds`])
  );
}

// Función auxiliar para construir tablas limpias con inline CSS oscuro
function createStatsTable(headers, rows) {
  if (rows.length === 0) return `<p style="color:#9ca3af; font-style:italic;">No hay datos suficientes.</p>`;
  return `
    <table style="width: 100%; border-collapse: collapse; text-align: left; color: #e5e7eb; font-size: 0.95rem;">
      <thead>
        <tr style="border-b: 2px solid #374151; color: #9ca3af;">
          <th style="padding: 10px 5px;">${headers[0]}</th>
          <th style="padding: 10px 5px; text-align: right;">${headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([col1, col2]) => `
          <tr style="border-b: 1px solid #374151;">
            <td style="padding: 12px 5px; font-weight: 500;">${col1}</td>
            <td style="padding: 12px 5px; text-align: right; font-weight: bold; color: #a5b4fc;">${col2}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
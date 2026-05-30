// js/stats.js

let charts = { categories: null, condition: null };

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  let clean = priceStr.replace('€', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export function initStatsPage(allItems) {
  // Cambiar visualización activa en los textos de navegación premium
  const navG = document.getElementById('navGallery');
  const navS = document.getElementById('navStats');
  if (navG) navG.style.color = '#6b7280';
  if (navS) navS.style.color = '#ffffff';

  // 1. Extracción de métricas
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

    const cat = item.type || 'Sin Categoría';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + qty;

    const cond = item.condition ? item.condition.toUpperCase() : 'DESCONOCIDO';
    conditionsMap[cond] = (conditionsMap[cond] || 0) + qty;

    const fran = item.franchise || 'Sin Franquicia';
    franchisesMap[fran] = (franchisesMap[fran] || 0) + itemTotalValue;

    if (item.brand) {
      brandsMap[item.brand] = (brandsMap[item.brand] || 0) + qty;
    }
  });

  // 2. Renderizar Estructura Maquetada con las Clases de tu main.css
  const statsContainer = document.getElementById('statsView');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = `
    <div class="detail-container">
      <div class="detail-header" style="margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">Estadísticas Globales</h2>
        <p style="color: #6b7280; font-size: 14px;">Métricas calculadas en tiempo real a partir del inventario cargado.</p>
      </div>

      <div class="info-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">VALOR TOTAL ESTIMADO</span>
          <b style="font-size: 28px; color: #10b981; font-weight: 700; margin-top: 8px; display: block;">${totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">MODELOS COMPILADOS</span>
          <b style="font-size: 28px; color: #ffffff; font-weight: 700; margin-top: 8px; display: block;">${totalItems} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">ítems</span></b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">CANTIDAD TOTAL EN STOCK</span>
          <b style="font-size: 28px; color: #f59e0b; font-weight: 700; margin-top: 8px; display: block;">${totalQuantity} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">uds</span></b>
        </div>
      </div>

      <div class="detail" style="gap: 32px; margin-bottom: 32px;">
        <div class="info-card" style="display: flex; flex-direction: column; align-items: center; min-height: 400px; justify-content: center;">
          <h4 style="font-size: 16px; font-weight: 700; color: #fff; width: 100%; text-align: left; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">🍩 Unidades por Categoría</h4>
          <div style="width: 100%; max-width: 280px; height: 280px; position: relative;">
            <canvas id="chartCategories"></canvas>
          </div>
        </div>

        <div class="info-card" style="display: flex; flex-direction: column; align-items: center; min-height: 400px;">
          <h4 style="font-size: 16px; font-weight: 700; color: #fff; width: 100%; text-align: left; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">📊 Conservación de Ejemplares</h4>
          <div style="width: 100%; height: 280px;">
            <canvas id="chartCondition"></canvas>
          </div>
        </div>
      </div>

      <div class="detail" style="gap: 32px;">
        <div class="info-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #10b981; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">🏆 Top 5 Franquicias Líderes (Valor)</h4>
          <div id="topFranchisesTable"></div>
        </div>
        <div class="info-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #f59e0b; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">🏷️ Top Marcas / Fabricantes</h4>
          <div id="topBrandsTable"></div>
        </div>
      </div>
    </div>
  `;

  // 4. Inyección de Gráficos de Chart.js
  const ctxCat = document.getElementById('chartCategories');
  if (ctxCat) {
    if (charts.categories) charts.categories.destroy();
    charts.categories = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoriesMap),
        datasets: [{
          data: Object.values(categoriesMap),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#a855f7'],
          borderWidth: 2,
          borderColor: '#11141c'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9aa3b2', font: { size: 11 } } }
        }
      }
    });
  }

  const ctxCond = document.getElementById('chartCondition');
  if (ctxCond) {
    if (charts.condition) charts.condition.destroy();
    charts.condition = new Chart(ctxCond, {
      type: 'bar',
      data: {
        labels: Object.keys(conditionsMap),
        datasets: [{
          data: Object.values(conditionsMap),
          backgroundColor: 'rgba(99, 102, 241, 0.85)',
          borderRadius: 8,
          hoverBackgroundColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#9aa3b2' }, grid: { display: false } },
          y: { ticks: { color: '#9aa3b2' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 5. Inyección de Tablas Premium
  const topFranchises = Object.entries(franchisesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topFranchisesTable').innerHTML = renderPremiumTable(
    ['Franquicia', 'Valor Acumulado'],
    topFranchises.map(([n, v]) => [n, v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })])
  );

  const topBrands = Object.entries(brandsMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topBrandsTable').innerHTML = renderPremiumTable(
    ['Marca', 'Cantidad'],
    topBrands.map(([n, q]) => [n, `${q} uds`])
  );
}

function renderPremiumTable(headers, rows) {
  if (rows.length === 0) return `<p style="color:#6b7280; font-style:italic; font-size:14px; margin-top:8px;">No hay datos suficientes.</p>`;
  return `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; color: #e2e8f0; margin-top: 8px;">
      <thead>
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #6b7280;">
          <th style="padding: 8px 0; font-weight: 600;">${headers[0]}</th>
          <th style="padding: 8px 0; text-align: right; font-weight: 600;">${headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([c1, c2]) => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
            <td style="padding: 10px 0; color: #fff; font-weight: 500;">${c1}</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #aeb6c4;">${c2}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
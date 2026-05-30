// js/stats.js
import { loadCollection } from './dataLoader.js';
import { t } from './translations.js';

let charts = { categories: null };

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  let clean = priceStr.replace('€', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export async function initStatsPage() {
  const statsContainer = document.getElementById('statsView');
  if (!statsContainer) return;

  // 1. Efecto de carga premium mientras lee los archivos JSON
  statsContainer.innerHTML = `
    <div style="text-align: center; padding: 100px 0;">
      <h2 style="color: #fff; font-size: 22px;">📊 Cargando base de datos global...</h2>
      <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">Procesando el inventario completo de forma independiente.</p>
    </div>
  `;

  // 2. Carga directa de la base de datos (Lee el 100% de los elementos reales)
  const rawItems = await loadCollection();

  let totalValue = 0;
  let totalItems = rawItems.length;
  let totalQuantity = 0;

  const categoriesMap = {};
  const franchisesValueMap = {};    
  const franchisesQuantityMap = {}; 

  rawItems.forEach(item => {
    const qty = parseInt(item.quantity) || 1;
    const price = parsePrice(item.purchasePrice);
    const itemTotalValue = price * qty;

    totalQuantity += qty;
    totalValue += itemTotalValue;

    const cat = item.category || 'Sin Categoría';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + qty;

    const fran = item.franchise || 'Sin Franquicia';
    franchisesValueMap[fran] = (franchisesValueMap[fran] || 0) + itemTotalValue;
    franchisesQuantityMap[fran] = (franchisesQuantityMap[fran] || 0) + qty;
  });

  // 3. Inyección del diseño HTML del Dashboard (Estructura corregida para PC)
  statsContainer.innerHTML = `
    <div class="detail-container">
      <div class="detail-header" style="margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">Estadísticas Globales</h2>
      </div>

      <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">TOTAL GASTADO</span>
          <b style="font-size: 28px; color: #10b981; font-weight: 700; margin-top: 8px; display: block;">${totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">CANTIDAD DIFERENTES</span>
          <b style="font-size: 28px; color: #ffffff; font-weight: 700; margin-top: 8px; display: block;">${totalItems} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">ítems</span></b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">CANTIDAD TOTAL EN STOCK</span>
          <b style="font-size: 28px; color: #f59e0b; font-weight: 700; margin-top: 8px; display: block;">${totalQuantity} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">uds</span></b>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 32px; align-items: start;">
        
        <div class="info-card" style="display: flex; flex-direction: column; align-items: center; background: #141822; padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.02);">
          <h4 style="font-size: 15px; font-weight: 700; color: #fff; width: 100%; text-align: left; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">🍩 Unidades por Categoría</h4>
          <div style="width: 100%; max-width: 360px; height: 360px; position: relative; margin: 0 auto;">
            <canvas id="chartCategories"></canvas>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 32px;">
          <div class="info-card" style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.02);">
            <h4 style="font-size: 15px; font-weight: 700; color: #10b981; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">🏆 Top 5 Franquicias Líderes (Valor)</h4>
            <div id="topFranchisesTable"></div>
          </div>

          <div class="info-card" style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.02);">
            <h4 style="font-size: 15px; font-weight: 700; color: #f59e0b; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">📦 Top 5 Franquicias Líderes (Unidades)</h4>
            <div id="topFranchisesQtyTable"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  // 4. Inicialización segura de los gráficos con Chart.js
  const ctxCat = document.getElementById('chartCategories');
  if (ctxCat) {
    const rawCategories = Object.keys(categoriesMap);
    const translatedLabels = rawCategories.map(catKey => t(catKey));

    if (charts.categories) charts.categories.destroy();
    charts.categories = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: translatedLabels,
        datasets: [{
          data: Object.values(categoriesMap),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#a855f7'],
          borderWidth: 3,
          borderColor: '#141822' // Del mismo color del fondo de la tarjeta para dar efecto "separado"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: 'bottom', 
            labels: { 
              color: '#9aa3b2', 
              padding: 20,
              font: { size: 12, family: 'system-ui' } 
            } 
          } 
        }
      }
    });
  }

  // Generar Tabla de Top Franquicias por Valor
  const topFranchisesValue = Object.entries(franchisesValueMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topFranchisesTable').innerHTML = renderPremiumTable(
    ['Franquicia', 'Valor Acumulado'],
    topFranchisesValue.map(([n, v]) => [n, v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })])
  );

  // Generar Tabla de Top Franquicias por Unidades
  const topFranchisesQty = Object.entries(franchisesQuantityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topFranchisesQtyTable').innerHTML = renderPremiumTable(
    ['Franquicia', 'Total Unidades'],
    topFranchisesQty.map(([n, q]) => [n, `${q.toLocaleString('es-ES')} uds`])
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
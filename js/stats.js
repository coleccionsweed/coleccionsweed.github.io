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

  // Aquí realizamos las operaciones matemáticas directamente sobre el array multidimensional en memoria
  let totalValue = 0;
  let totalItems = allItems.length;
  let totalQuantity = 0;
  
  const franchisesMap = {};

  allItems.forEach(item => {
    const qty = parseInt(item.quantity) || 1;
    const price = parsePrice(item.purchasePrice);
    const itemTotalValue = price * qty;

    totalQuantity += qty;
    totalValue += itemTotalValue;

    const fran = item.franchise || 'Sin Franquicia';
    franchisesMap[fran] = (franchisesMap[fran] || 0) + itemTotalValue;

  });

  const statsContainer = document.getElementById('statsView');
  if (!statsContainer) return;
  
  statsContainer.innerHTML = `
    <div class="detail-container">
      <div class="detail-header" style="margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px;">Estadísticas Globales</h2>
      </div>

      <div class="info-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">VALOR TOTAL</span>
          <b style="font-size: 28px; color: #10b981; font-weight: 700; margin-top: 8px; display: block;">${totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">OBJETOS DIFERENTES</span>
          <b style="font-size: 28px; color: #ffffff; font-weight: 700; margin-top: 8px; display: block;">${totalItems} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">ítems</span></b>
        </div>
        <div style="background: #141822; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <span style="font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 1px;">CANTIDAD TOTAL EN STOCK</span>
          <b style="font-size: 28px; color: #f59e0b; font-weight: 700; margin-top: 8px; display: block;">${totalQuantity} <span style="font-size: 14px; color: #6b7280; font-weight: 400;">uds</span></b>
        </div>
      </div>

      <div class="detail" style="gap: 32px;">
        <div class="info-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #10b981; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">🏆 Top 5 Franquicias Líderes (Valor)</h4>
          <div id="topFranchisesTable"></div>
        </div>
      </div>
    </div>
  `;

  const topFranchises = Object.entries(franchisesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topFranchisesTable').innerHTML = renderPremiumTable(
    ['Franquicia', 'Valor Acumulado'],
    topFranchises.map(([n, v]) => [n, v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })])
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
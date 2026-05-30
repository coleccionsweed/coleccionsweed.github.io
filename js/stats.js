// js/stats.js

let myChart = null; // Guardará la instancia del gráfico para poder destruirlo/recrearlo al filtrar

// Función auxiliar para convertir "25,00€" en un número operable
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // Quita el símbolo de euro, espacios, puntos de miles y cambia la coma por punto
  let clean = priceStr.replace('€', '').replace(/\s/g, '').replace('.', '').replace(',', '.');
  return parseFloat(clean) || 0;
}

export function renderStats(items) {
  const statsContainer = document.getElementById('stats');
  if (!statsContainer) return;

  // 1. Calcular totales basados en los ítems que se están mostrando (reacciona a los filtros)
  let totalValue = 0;
  let totalItems = items.length;
  let totalQuantity = 0;
  const typeCounts = {};

  items.forEach(item => {
    const qty = parseInt(item.quantity) || 1;
    totalQuantity += qty;
    totalValue += (parsePrice(item.purchasePrice) * qty);

    // Agrupar por tipo para la tarta (si no tiene 'type', usamos 'Otros')
    const type = item.type || 'Otros';
    typeCounts[type] = (typeCounts[type] || 0) + qty;
  });

  // 2. Inyectar la estructura de las estadísticas (Contadores + Canvas para el gráfico)
  statsContainer.innerHTML = `
    <div class="stats-dashboard" style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; background: #1f2937; padding: 20px; rounded-width: 12px; border-radius: 12px; color: #fff;">
      
      <div class="stats-cards" style="flex: 1; min-width: 250px; display: flex; flex-col: column; gap: 15px; justify-content: center;">
        <div class="stat-card">
          <p style="color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin: 0;">Valor Total</p>
          <p style="color: #34d399; font-size: 2rem; font-weight: 900; margin: 5px 0 0 0;">${totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div class="stat-card">
          <p style="color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin: 0;">Artículos Distintos</p>
          <p style="color: #818cf8; font-size: 2rem; font-weight: 900; margin: 5px 0 0 0;">${totalItems}</p>
        </div>
        <div class="stat-card">
          <p style="color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; margin: 0;">Cantidad Total Unidades</p>
          <p style="color: #fbbf24; font-size: 2rem; font-weight: 900; margin: 5px 0 0 0;">${totalQuantity}</p>
        </div>
      </div>

      <div class="stats-chart-container" style="flex: 1; min-width: 250px; display: flex; justify-content: center; align-items: center; max-height: 220px;">
        <canvas id="typesChart"></canvas>
      </div>

    </div>
  `;

  // 3. Renderizar el gráfico de tarta con Chart.js
  const ctx = document.getElementById('typesChart');
  if (!ctx) return;

  if (myChart) {
    myChart.destroy(); // Destruimos el gráfico anterior para evitar bugs al pasar el cursor por encima
  }

  const labels = Object.keys(typeCounts);
  const dataValues = Object.values(typeCounts);

  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#a855f7'
        ],
        borderWidth: 2,
        borderColor: '#1f2937'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#f3f4f6',
            font: { size: 12, weight: 'bold' }
          }
        }
      }
    }
  });
}
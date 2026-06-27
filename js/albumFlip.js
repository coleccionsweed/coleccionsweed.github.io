
const albumEscaneadoConfigs = {
  "la-liga-04-05-coleccion-incompleta": 53
};

export async function renderAlbumFlip(containerId, item) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = albumEscaneadoConfigs[item.folder] || 0;
  if (totalPaginas === 0) return;

  // 1. Generamos el HTML necesario para turn.js
  let htmlHojas = '';
  for (let i = 0; i <= totalPaginas; i++) {
    htmlHojas += `
      <div class="page">
        <img src="images/${item.category}/${item.folder}/album/${i}.webp" 
             style="width:100%; height:100%; object-fit:contain;" 
             loading="lazy" 
             alt="Página ${i}">
      </div>`;
  }

  // 2. Insertamos el contenedor del flipbook
  container.innerHTML = `
    <div id="flipbook-wrapper" class="flipbook">
      ${htmlHojas}
    </div>
  `;

  // 3. Inicializamos turn.js 
  // Usamos window.$ para asegurar compatibilidad con jQuery global
  const initFlipbook = () => {
    if (window.$ && window.$.fn.turn) {
      window.$("#flipbook-wrapper").turn({
        width: 800,
        height: 550,
        autoCenter: true,
        display: 'double',
        acceleration: true,
        gradients: true,
        elevation: 50,
        when: {
          turning: function(event, page, view) {}
        }
      });
    } else {
      console.error("turn.js o jQuery no están cargados.");
    }
  };

  // Esperamos a que la librería esté lista
  if (document.readyState === 'complete') {
    initFlipbook();
  } else {
    window.$(document).ready(initFlipbook);
  }
}
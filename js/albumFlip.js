const albumEscaneadoConfigs = {
  "la-liga-04-05-coleccion-incompleta": 53
};
export async function renderAlbumFlip(containerId, item) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = albumEscaneadoConfigs[item.folder];
  if (!totalPaginas || totalPaginas === 0) return;

  const paginas = [];
  for (let i = 0; i <= totalPaginas; i++) {
    paginas.push(`images/${item.category}/${item.folder}/album/${i}.webp`);
  }

  let htmlHojas = '';
  const totalHojas = Math.ceil(paginas.length / 2);

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; 
    const hojaIndex = p / 2;

    htmlHojas += `
      <div class="album-page" data-index="${hojaIndex}">
        <div class="page-front">
          <img src="${imgFrente}" loading="lazy" alt="Página ${p}">
        </div>
        <div class="page-back">
          ${imgDorso ? `<img src="${imgDorso}" loading="lazy" alt="Página ${p + 1}">` : '<div class="page-empty"></div>'}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="album-flip-section">
      <h3 class="album-title-section">Álbum Escaneado</h3>
      <p class="album-hint">Toca el lado derecho para avanzar o el izquierdo para retroceder</p>
      <div class="book-container">
        <div class="book" id="interactiveBook">
          ${htmlHojas}
        </div>
      </div>
    </div>
  `;

  const book = document.getElementById('interactiveBook');
  const hojas = container.querySelectorAll('.album-page');

  // FUNCIÓN MAESTRA DE ORDENACIÓN DE CAPAS REAL
  function actualizarZIndexes() {
    hojas.forEach((hoja, index) => {
      if (hoja.classList.contains('flipped')) {
        // MONTÓN IZQUIERDO: Las hojas ya pasadas se apilan de forma que las más altas en índice queden arriba
        hoja.style.zIndex = index + 1;
      } else {
        // MONTÓN DERECHO: Las hojas pendientes se apilan de forma que las más bajas en índice queden arriba
        hoja.style.zIndex = totalHojas - index;
      }
    });
  }

  // Inicializamos el orden del libro al cargar
  actualizarZIndexes();

  hojas.forEach((hoja) => {
    hoja.addEventListener('click', (e) => {
      const rect = book.getBoundingClientRect();
      const xClick = e.clientX - rect.left; 
      const mitadLibro = rect.width / 2;

      // AVANZAR HOJA (Clic mitad derecha)
      if (xClick > mitadLibro && !hoja.classList.contains('flipped')) {
        hoja.classList.add('flipped');
        actualizarZIndexes();
      } 
      // RETROCEDER HOJA (Clic mitad izquierda)
      else if (xClick <= mitadLibro && hoja.classList.contains('flipped')) {
        hoja.classList.remove('flipped');
        actualizarZIndexes();
      }
    });
  });
}
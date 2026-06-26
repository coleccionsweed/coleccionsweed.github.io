const albumEscaneadoConfigs = {
  "la-liga-04-05-coleccion-incompleta": 53
};

export async function renderAlbumFlip(containerId, item) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = albumEscaneadoConfigs[item.folder];
  if (!totalPaginas || totalPaginas === 0) return;

  const paginas = [];
  for (let i = 0; i < totalPaginas; i++) {
    paginas.push(`images/${item.category}/${item.folder}/album/${i}.webp`);
  }

  let htmlHojas = '';
  const totalHojas = Math.ceil(paginas.length / 2);

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; 
    const hojaIndex = p / 2;
    const zIndexInicial = totalHojas - hojaIndex;

    // PRECARGA INICIAL: Dejamos visibles la portada (0) y la hoja de atrás (1) para que no haya huecos
    const estiloInicial = hojaIndex <= 1 ? '' : 'display: none;';

    htmlHojas += `
      <div class="album-page" style="z-index: ${zIndexInicial}; ${estiloInicial}" data-index="${hojaIndex}">
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

  hojas.forEach((hoja, index) => {
    hoja.addEventListener('click', (e) => {
      const rect = book.getBoundingClientRect();
      const xClick = e.clientX - rect.left; 
      const mitadLibro = rect.width / 2;

      // === AVANZAR HOJA (Clic mitad derecha) ===
      if (xClick > mitadLibro && !hoja.classList.contains('flipped')) {
        
        // TRUCO DE ANTICIPACIÓN: Activamos YA la hoja subsiguiente (2 pasos más adelante)
        // para que esté renderizada en el fondo plano ANTES de que termine el giro actual.
        if (hojas[index + 1]) hojas[index + 1].style.display = '';
        if (hojas[index + 2]) hojas[index + 2].style.display = '';

        hoja.classList.add('flipped');

        setTimeout(() => {
          hoja.style.zIndex = index + 1;
          
          // Limpieza selectiva: Ocultamos lo que ya quedó 2 páginas atrás para salvar la RAM
          if (index - 2 >= 0) {
            hojas[index - 2].style.display = 'none';
          }
        }, 350); 
      } 
      
      // === RETROCEDER HOJA (Clic mitad izquierda) ===
      else if (xClick <= mitadLibro && hoja.classList.contains('flipped')) {
        
        // TRUCO DE ANTICIPACIÓN AL VOLVER: Activamos las hojas hacia atrás
        if (hojas[index - 1]) hojas[index - 1].style.display = '';
        if (hojas[index - 2]) hojas[index - 2].style.display = '';

        hoja.classList.remove('flipped');

        setTimeout(() => {
          hoja.style.zIndex = totalHojas - index;
          
          // Limpieza selectiva: Ocultamos lo que quedó muy a la derecha
          if (hojas[index + 2]) {
            hojas[index + 2].style.display = 'none';
          }
        }, 350);
      }
    });
  });
}
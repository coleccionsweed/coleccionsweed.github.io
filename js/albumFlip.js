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

    const zNormal = totalHojas - hojaIndex;
    const zFlipped = hojaIndex + 1;

    htmlHojas += `
      <div class="album-page" style="--z-normal: ${zNormal}; --z-flipped: ${zFlipped};">
        <div class="page-front">
          <img src="${imgFrente}" loading="lazy" alt="Página ${p}">
        </div>
        <div class="page-back">
          ${imgDorso ? `<img src="${imgDorso}" loading="lazy" alt="Página ${p + 1}">` : '<div class="page-empty"></div>'}
        </div>
      </div>
    `;
  }

  // AQUÍ ESTÁ EL ARREGLO: La caja 3D y la caja 2D están totalmente separadas
  container.innerHTML = `
    <div class="album-flip-section">
      <h3 class="album-title-section">Álbum Escaneado</h3>
      <p class="album-hint">Toca el lado derecho para avanzar o el izquierdo para retroceder</p>
      
      <div class="book-wrapper">
        <div class="book-container">
          <div class="book" id="interactiveBook">
            ${htmlHojas}
          </div>
        </div>
        
        <div id="bookTouchOverlay" class="book-touch-overlay"></div>
      </div>
    </div>
  `;

  // Lógica de paso de página (exactamente igual que antes)
  const overlay = document.getElementById('bookTouchOverlay');
  const hojas = Array.from(container.querySelectorAll('.album-page'));

  overlay.addEventListener('click', (e) => {
    const rect = overlay.getBoundingClientRect();
    const xClick = e.clientX - rect.left; 
    const mitadLibro = rect.width / 2;

    if (xClick > mitadLibro) {
      const hojaAvanzar = hojas.find(h => !h.classList.contains('flipped'));
      if (hojaAvanzar) hojaAvanzar.classList.add('flipped');
    } else {
      const hojasVolteadas = hojas.filter(h => h.classList.contains('flipped'));
      if (hojasVolteadas.length > 0) {
        const hojaRetroceder = hojasVolteadas[hojasVolteadas.length - 1];
        hojaRetroceder.classList.remove('flipped');
      }
    }
  });
}
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

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; 
    const hojaIndex = p / 2;

    // Pasamos el índice directamente al CSS mediante la variable --i
    htmlHojas += `
      <div class="album-page" style="--i: ${hojaIndex};">
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

  hojas.forEach((hoja) => {
    hoja.addEventListener('click', (e) => {
      const rect = book.getBoundingClientRect();
      const xClick = e.clientX - rect.left; 

      // Clic derecha avanza, clic izquierda retrocede. Cero cálculos extra.
      if (xClick > rect.width / 2 && !hoja.classList.contains('flipped')) {
        hoja.classList.add('flipped');
      } else if (xClick <= rect.width / 2 && hoja.classList.contains('flipped')) {
        hoja.classList.remove('flipped');
      }
    });
  });
}
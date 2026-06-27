const albumEscaneadoConfigs = { "la-liga-04-05-coleccion-incompleta": 53 };

export async function renderAlbumFlip(containerId, item) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = albumEscaneadoConfigs[item.folder];
  if (!totalPaginas || totalPaginas === 0) return;

  let htmlHojas = '';
  const totalHojas = Math.ceil((totalPaginas + 1) / 2);

  for (let p = 0; p <= totalPaginas; p += 2) {
    const imgFrente = `images/${item.category}/${item.folder}/album/${p}.webp`;
    const imgDorso = (p + 1 <= totalPaginas) ? `images/${item.category}/${item.folder}/album/${p + 1}.webp` : null;
    const hojaIndex = p / 2;

    const zNormal = totalHojas - hojaIndex;
    const zFlipped = hojaIndex + 1;
    const zDepth = -(hojaIndex * 0.5) + "px"; // Separación física para evitar parpadeo

    htmlHojas += `
      <div class="album-page" style="--z-normal: ${zNormal}; --z-flipped: ${zFlipped}; --z-depth: ${zDepth};" data-index="${hojaIndex}">
        <div class="page-front"><img src="${imgFrente}" loading="lazy" alt="Pág ${p}"></div>
        <div class="page-back">${imgDorso ? `<img src="${imgDorso}" loading="lazy" alt="Pág ${p + 1}">` : '<div class="page-empty"></div>'}</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="album-flip-section">
      <h3 class="album-title-section">Álbum Escaneado</h3>
      <p class="album-hint">Toca derecha para avanzar, izquierda para retroceder</p>
      <div class="book-container"><div class="book" id="interactiveBook">${htmlHojas}</div></div>
    </div>
  `;

  const book = document.getElementById('interactiveBook');
  const hojas = container.querySelectorAll('.album-page');
  let isAnimating = false; // Bloqueo de seguridad para iOS

  hojas.forEach((hoja) => {
    hoja.addEventListener('click', (e) => {
      if (isAnimating) return; // Ignorar clics simultáneos
      
      const rect = book.getBoundingClientRect();
      const xClick = e.clientX - rect.left; 
      const mitadLibro = rect.width / 2;

      if (xClick > mitadLibro && !hoja.classList.contains('flipped')) {
        isAnimating = true;
        hoja.classList.add('flipped');
        setTimeout(() => { isAnimating = false; }, 650);
      } else if (xClick <= mitadLibro && hoja.classList.contains('flipped')) {
        isAnimating = true;
        hoja.classList.remove('flipped');
        setTimeout(() => { isAnimating = false; }, 650);
      }
    });
  });
}
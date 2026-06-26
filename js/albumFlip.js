// js/albumFlip.js

function comprobarSiExisteImagen(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);  
    img.onerror = () => resolve(false); 
    img.src = src;
  });
}

export async function renderAlbumFlip(containerId, item) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const paginas = [];
  let i = 0;
  while (true) {
    const imgUrl = `images/${item.category}/${item.folder}/album/${i}.webp`;
    const existe = await comprobarSiExisteImagen(imgUrl);
    if (!existe) break;
    paginas.push(imgUrl);
    i++;
  }

  if (paginas.length === 0) return;

  let htmlHojas = '';
  // Total de hojas físicas dobles
  const totalHojas = Math.ceil(paginas.length / 2);

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; 
    const hojaIndex = p / 2;
    // Las primeras páginas se quedan arriba (z-index más alto)
    const zIndexInicial = totalHojas - hojaIndex;

    htmlHojas += `
      <div class="album-page" style="z-index: ${zIndexInicial};">
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
      <h3 class="album-title-section">📖 Hojear Álbum Escaneado</h3>
      <p class="album-hint">Haz clic en las páginas para pasar la hoja</p>
      <div class="book-container">
        <div class="book" id="interactiveBook">
          ${htmlHojas}
        </div>
      </div>
    </div>
  `;

  const hojas = container.querySelectorAll('.album-page');
  hojas.forEach((hoja, index) => {
    hoja.addEventListener('click', () => {
      if (!hoja.classList.contains('flipped')) {
        hoja.classList.add('flipped');
        // Al girar a la izquierda, reducimos su z-index para que la siguiente hoja quede encima
        setTimeout(() => {
          hoja.style.zIndex = index + 1;
        }, 250); 
      } else {
        hoja.classList.remove('flipped');
        // Al regresar a la derecha, reestablecemos su z-index original elevado
        setTimeout(() => {
          hoja.style.zIndex = hojas.length - index;
        }, 250);
      }
    });
  });
}
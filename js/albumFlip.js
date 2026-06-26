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
  const totalHojas = Math.ceil(paginas.length / 2);

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; 
    const hojaIndex = p / 2;
    const zIndexInicial = totalHojas - hojaIndex;

    // Aislamiento dinámico: al inicio solo se pinta la portada y la primera hoja para liberar ram
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
      const xClick = e.clientX - rect.left; // Lugar del clic relativo al libro
      const mitadLibro = rect.width / 2;

      // AVANZAR HOJA (Clic en la mitad derecha y la hoja no está volteada)
      if (xClick > mitadLibro && !hoja.classList.contains('flipped')) {
        // Activamos la visibilidad de la siguiente hoja en cola antes de iniciar la animación
        if (hojas[index + 1]) hojas[index + 1].style.display = '';

        hoja.classList.add('flipped');

        setTimeout(() => {
          hoja.style.zIndex = index + 1;
          // Ocultamos las hojas de atrás que ya no se ven para liberar memoria gráfica
          if (index - 1 >= 0) hojas[index - 1].style.display = 'none';
        }, 350); // Sincronizado en el cénit del giro vertical (90 grados)
      } 
      // RETROCEDER HOJA (Clic en la mitad izquierda y la hoja ya fue volteada)
      else if (xClick <= mitadLibro && hoja.classList.contains('flipped')) {
        // Activamos la hoja previa antes de que regrese
        if (hojas[index - 1]) hojas[index - 1].style.display = '';

        hoja.classList.remove('flipped');

        setTimeout(() => {
          hoja.style.zIndex = totalHojas - index;
          // Ocultamos las hojas de la derecha que quedaron ocultas
          if (hojas[index + 1]) hojas[index + 1].style.display = 'none';
        }, 350);
      }
    });
  });
}
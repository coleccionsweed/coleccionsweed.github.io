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

    // Solo la primera hoja (portada) empieza visible por completo para ahorrar memoria
    const estiloVisibilidad = hojaIndex === 0 ? '' : 'visibility: hidden;';

    htmlHojas += `
      <div class="album-page" style="z-index: ${zIndexInicial}; ${estiloVisibilidad}" data-hoja="${hojaIndex}">
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
        
        // Hacemos visible la hoja que viene inmediatamente debajo antes de cambiar el z-index
        if (hojas[index + 1]) {
          hojas[index + 1].style.visibility = 'visible';
        }

        setTimeout(() => {
          hoja.style.zIndex = index + 1;
          // Ocultamos la que ya se pasó a la izquierda para liberar la memoria del móvil
          if (index > 0 && hojas[index - 1]) {
             hojas[index - 1].style.visibility = 'hidden';
          }
        }, 500); 
        
      } else {
        hoja.classList.remove('flipped');
        
        // Al regresar, hacemos visible la hoja anterior del lote izquierdo
        if (hojas[index - 1]) {
          hojas[index - 1].style.visibility = 'visible';
        }

        setTimeout(() => {
          hoja.style.zIndex = totalHojas - index;
          // Ocultamos la que se guardó a la derecha para no saturar al hacer zoom
          if (hojas[index + 1]) {
            hojas[index + 1].style.visibility = 'hidden';
          }
        }, 500);
      }
    });
  });
}
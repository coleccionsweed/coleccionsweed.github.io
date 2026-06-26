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
    const front = hoja.querySelector('.page-front');
    const back = hoja.querySelector('.page-back');

    hoja.addEventListener('click', () => {
      if (!hoja.classList.contains('flipped')) {
        hoja.classList.add('flipped');
        
        // Anti-pestañeo móvil: A mitad del giro ocultamos la parte delantera y mostramos la trasera
        setTimeout(() => {
          if (front) front.style.visibility = 'hidden';
          if (back) back.style.visibility = 'visible';
          hoja.style.zIndex = index + 1;
        }, 300); // 300ms es la mitad exacta de la transición de 0.6s
        
      } else {
        hoja.classList.remove('flipped');
        
        // Anti-pestañeo móvil al volver atrás
        setTimeout(() => {
          if (front) front.style.visibility = 'visible';
          if (back) back.style.visibility = 'hidden';
          hoja.style.zIndex = hojas.length - index;
        }, 300);
      }
    });
    
    // Configuración inicial de visibilidad para que no colisionen al cargar el álbum
    if (back) back.style.visibility = 'hidden';
  });
}
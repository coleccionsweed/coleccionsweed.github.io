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

  // 1. Buscar todas las páginas disponibles (0.webp, 1.webp, etc.)
  const paginas = [];
  let i = 0;
  while (true) {
    const imgUrl = `images/${item.category}/${item.folder}/album/${i}.webp`;
    const existe = await comprobarSiExisteImagen(imgUrl);
    if (!existe) break;
    paginas.push(imgUrl);
    i++;
  }

  // Si no hay páginas escaneadas para este álbum, salimos silenciosamente
  if (paginas.length === 0) return;

  // 2. Construir la estructura del libro en hojas dobles
  // La página 0 es la portada. Agrupamos de 2 en 2 para simular hojas (frente/dorso).
  let htmlHojas = '';
  let zIndexActual = Math.ceil(paginas.length / 2) + 1;

  for (let p = 0; p < paginas.length; p += 2) {
    const imgFrente = paginas[p];
    const imgDorso = paginas[p + 1] || ''; // Por si es impar

    htmlHojas += `
      <div class="album-page" style="z-index: ${zIndexActual};">
        <div class="page-front">
          <img src="${imgFrente}" loading="lazy" alt="Página ${p}">
        </div>
        <div class="page-back">
          ${imgDorso ? `<img src="${imgDorso}" loading="lazy" alt="Página ${p + 1}">` : '<div class="page-empty"></div>'}
        </div>
      </div>
    `;
    zIndexActual--;
  }

  // 3. Inyectar el contenedor interactivo
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

  // 4. Añadir lógica de interacción de volteo
  const hojas = container.querySelectorAll('.album-page');
  hojas.forEach((hoja, index) => {
    hoja.addEventListener('click', (e) => {
      // Si hacemos clic en la parte derecha de la hoja o está al derecho, va hacia adelante
      if (!hoja.classList.contains('flipped')) {
        hoja.classList.add('flipped');
        // Reajuste de z-index dinámico tras la animación para que no solape
        setTimeout(() => {
          hoja.style.zIndex = index + 1;
        }, 600);
      } else {
        // Si ya estaba volteada, vuelve atrás
        hoja.classList.remove('flipped');
        setTimeout(() => {
          hoja.style.zIndex = hojas.length - index + 1;
        }, 600);
      }
    });
  });
}
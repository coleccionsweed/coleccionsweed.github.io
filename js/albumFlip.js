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
  let indiceHoja = 0;

  // Página 0 es la Portada: Se muestra a la derecha, la izquierda se queda vacía
  htmlHojas += `
    <div class="album-page active-page" data-page="${indiceHoja}">
      <div class="page-left"><div class="page-empty"></div></div>
      <div class="page-right">
        <img src="${paginas[0]}" loading="lazy" alt="Portada">
      </div>
    </div>
  `;
  indiceHoja++;

  // Páginas interiores intermedias (Agrupadas de dos en dos de forma natural)
  for (let p = 1; p < paginas.length; p += 2) {
    const imgIzquierda = paginas[p];
    const imgDerecha = paginas[p + 1] || ''; // Por si el número total es impar

    htmlHojas += `
      <div class="album-page" data-page="${indiceHoja}">
        <div class="page-left">
          <img src="${imgIzquierda}" loading="lazy" alt="Página ${p}">
        </div>
        <div class="page-right">
          ${imgDerecha ? `<img src="${imgDerecha}" loading="lazy" alt="Página ${p + 1}">` : '<div class="page-empty"></div>'}
        </div>
      </div>
    `;
    indiceHoja++;
  }

  // Estructura final con botones de apoyo (muy cómodos si el usuario hace Zoom en el móvil)
  container.innerHTML = `
    <div class="album-flip-section">
      <h3 class="album-title-section">Álbum Escaneado</h3>
      <p class="album-hint">Toca el álbum o usa los botones para pasar las páginas</p>
      
      <div class="book-container">
        <div class="book" id="interactiveBook">
          ${htmlHojas}
        </div>
      </div>

      <div class="album-nav-buttons">
        <button class="album-btn" id="albumPrevBtn" disabled>◀ Anterior</button>
        <button class="album-btn" id="albumNextBtn">Siguiente ▶</button>
      </div>
    </div>
  `;

  // Lógica interactiva de cambio de página bidimensional fluida
  const hojas = container.querySelectorAll('.album-page');
  const totalHojas = hojas.length;
  let paginaActual = 0;

  const prevBtn = document.getElementById('albumPrevBtn');
  const nextBtn = document.getElementById('albumNextBtn');
  const bookElement = document.getElementById('interactiveBook');

  function actualizarVisibilidad() {
    hojas.forEach((hoja, idx) => {
      if (idx === paginaActual) {
        hoja.classList.add('active-page');
      } else {
        hoja.classList.remove('active-page');
      }
    });

    // Control de estado de los botones
    prevBtn.disabled = paginaActual === 0;
    nextBtn.disabled = paginaActual === totalHojas - 1;
  }

  function avanzarPagina() {
    if (paginaActual < totalHojas - 1) {
      paginaActual++;
      actualizarVisibilidad();
    }
  }

  function retrocederPagina() {
    if (paginaActual > 0) {
      paginaActual--;
      actualizarVisibilidad();
    }
  }

  // Evento al hacer clic directamente sobre el cuerpo del álbum
  bookElement.addEventListener('click', (e) => {
    const rect = bookElement.getBoundingClientRect();
    const xClick = e.clientX - rect.left; // Posición horizontal del toque

    // Si toca en la mitad derecha avanza, si toca en la izquierda retrocede
    if (xClick > rect.width / 2) {
      avanzarPagina();
    } else {
      retrocederPagina();
    }
  });

  // Eventos de los botones inferiores
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita el conflicto con el clic del libro
    retrocederPagina();
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avanzarPagina();
  });
}
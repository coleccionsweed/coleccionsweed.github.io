// Función auxiliar para verificar si una imagen existe realmente en el servidor
function comprobarSiExisteImagen(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);  // La imagen existe y cargó bien
    img.onerror = () => resolve(false); // La imagen no existe (404)
    img.src = src;
  });
}

export async function renderDetail(item) {
  const grid = document.getElementById('collectionGrid');

  // 1. Buscamos imágenes secuencialmente hasta que una falle
  const images = [];
  let i = 1;
  
  while (true) {
    const imgUrl = `images/${item.category}/${item.folder}/${i}.webp`;
    const existe = await comprobarSiExisteImagen(imgUrl);
    
    if (!existe) {
      break; // 🛑 Se detiene inmediatamente en cuanto una no está
    }
    
    images.push(imgUrl);
    i++;
  }

  // Salvaguarda: Si por algún motivo no encuentra ninguna, dejamos al menos la primera
  if (images.length === 0) {
    images.push(`images/${item.category}/${item.folder}/1.webp`);
  }

  // 2. Renderizar la estructura limpia y profesional con los datos bien separados
  grid.innerHTML = `
    <div class="detail-container">
      <div class="detail-header">
        <button id="backBtn" class="back-btn">← Volver a la galería</button>
      </div>
      
      <div class="detail">
        <div class="slider">
          <button class="nav prev" ${images.length <= 1 ? 'style="display:none;"' : ''}>‹</button>
          
          <div class="slider-window">
            <img id="sliderImage" src="${images[0]}" alt="${item.name}" />
          </div>
          
          <button class="nav next" ${images.length <= 1 ? 'style="display:none;"' : ''}>›</button>
        </div>

        <div class="info-card">
          <h1>${item.name}</h1>
          <p class="subtitle">${item.franchise || ''}</p>

          <div class="info-grid">
            ${item.type ? `<div><span>Tipo</span><b>${item.type}</b></div>` : ''}
            ${item.brand ? `<div><span>Marca</span><b>${item.brand}</b></div>` : ''}
            ${item.condition ? `<div><span>Estado</span><b>${item.condition}</b></div>` : ''}
            ${item.language ? `<div><span>Idioma</span><b>${item.language}</b></div>` : ''}
            ${item.purchasePrice ? `<div><span>Precio</span><b>${item.purchasePrice}</b></div>` : ''}
            ${item.quantity ? `<div><span>Cantidad</span><b>${item.quantity}</b></div>` : ''}
          </div>

          <div class="tags">
            ${(item.tags || []).map(t => `<span>${t}</span>`).join('')}
          </div>

          ${item.notes ? `<div class="notes">${item.notes}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  // 3. Asignar eventos de navegación de la interfaz
  
  // Botón Volver
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = ''; // Borra el hash para regresar a la galería
  });

  // Lógica de movimiento del Slider (solo si tiene varias imágenes)
  if (images.length > 1) {
    let index = 0;
    const imgElement = document.getElementById('sliderImage');
    const prevBtn = grid.querySelector('.prev');
    const nextBtn = grid.querySelector('.next');

    nextBtn.addEventListener('click', () => {
      index = (index + 1) % images.length;
      imgElement.src = images[index];
    });

    prevBtn.addEventListener('click', () => {
      index = (index - 1 + images.length) % images.length;
      imgElement.src = images[index];
    });
  }
}
import { renderStickers } from './stickers.js';

// Función auxiliar para verificar si una imagen existe realmente en el servidor
function comprobarSiExisteImagen(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);  
    img.onerror = () => resolve(false); 
    img.src = src;
  });
}

export async function renderDetail(item) {
  // =======================================================
  // 1. PASO ASÍNCRONO: Buscar imágenes (La galería sigue intacta y bonita en pantalla)
  // =======================================================
  const images = [];
  let i = 1;
  
  while (true) {
    const imgUrl = `images/${item.category}/${item.folder}/${i}.webp`;
    const existe = await comprobarSiExisteImagen(imgUrl);
    
    if (!existe) {
      break; 
    }
    
    images.push(imgUrl);
    i++;
  }

  if (images.length === 0) {
    images.push(`images/${item.category}/${item.folder}/1.webp`);
  }

  // =======================================================
  // 2. PASO DE CÓMPUTO: Procesar JSON y textos (Aún no tocamos la pantalla)
  // =======================================================
  const clavesAIgnorar = ['id', 'name', 'franchise', 'folder', 'category', 'tags', 'notes'];
  const diccionarioEtiquetas = {
    type: 'Tipo', brand: 'Marca', condition: 'Estado', language: 'Idioma', purchasePrice: 'Precio', quantity: 'Cantidad', barcode: 'Cód. Barras', author: 'Autor'
  };

  function obtenerEtiquetaLegible(clave) {
    if (diccionarioEtiquetas[clave]) return diccionarioEtiquetas[clave];
    return clave.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  const bloquesInfoHTML = [];
  Object.keys(item).forEach(key => {
    if (!clavesAIgnorar.includes(key) && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      bloquesInfoHTML.push(`<div><span>${obtenerEtiquetaLegible(key)}</span><b>${item[key]}</b></div>`);
    }
  });

  // =======================================================
  // 3. PASO DOM ATÓMICO: Modificamos todo a la vez en el mismo milisegundo
  // =======================================================
  const grid = document.getElementById('collectionGrid');
  const filters = document.getElementById('filters');

  if (filters) filters.style.display = 'none'; // Ocultamos barra superior
  grid.className = '';                         // Quitamos rejilla de la galería
  
  // Inyectamos el nuevo HTML encima del anterior eliminando las tarjetas al instante
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
            ${bloquesInfoHTML.join('')}
          </div>

          ${item.notes ? `<div class="notes">${item.notes}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  // =======================================================
  // 4. PASO DE EVENTOS: Asignar listeners del slider y botón
  // =======================================================
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = ''; 
  });

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
  
  if (item.category === 'card-collection') {
        const wrapper = document.createElement('div');
        wrapper.id = 'stickers-container';
        document.getElementById('collectionGrid').appendChild(wrapper);
        
        // Pasamos el ID del folder tal como está en tu JSON
        renderStickers('stickers-container', item.folder);
  }
}
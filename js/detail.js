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

  // ==========================================
  // 👉 PROCESAMIENTO DINÁMICO DE DATOS DEL JSON
  // ==========================================
  
  // Claves internas de control que NO queremos meter dentro del info-grid de cuadraditos
  const clavesAIgnorar = ['id', 'name', 'franchise', 'folder', 'category', 'tags', 'notes', 'extraAttributes'];

  // Diccionario de traducciones automáticas para las etiquetas legibles
  const diccionarioEtiquetas = {
    type: 'Tipo',
    brand: 'Marca',
    condition: 'Estado',
    language: 'Idioma',
    purchasePrice: 'Precio',
    quantity: 'Cantidad',
    barcode: 'Cód. Barras',
    author: 'Autor'
  };

  // Función para formatear el nombre si llega una clave nueva que no está en el diccionario
  // Ejemplo: "releaseYear" -> "Release Year" o "paginas" -> "Paginas"
  function obtenerEtiquetaLegible(clave) {
    if (diccionarioEtiquetas[clave]) return diccionarioEtiquetas[clave];
    
    // Separar camelCase (por si acaso) y capitalizar primera letra de forma limpia
    return clave
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Lista temporal donde guardaremos los bloques HTML generados
  const bloquesInfoHTML = [];

  // A) Procesar atributos de la raíz del JSON (excluyendo los ignorados)
  Object.keys(item).forEach(key => {
    if (!clavesAIgnorar.includes(key) && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      bloquesInfoHTML.push(`<div><span>${obtenerEtiquetaLegible(key)}</span><b>${item[key]}</b></div>`);
    }
  });

  // B) Procesar atributos anidados dentro de "extraAttributes" (si existen en este ítem)
  if (item.extraAttributes && typeof item.extraAttributes === 'object') {
    Object.keys(item.extraAttributes).forEach(key => {
      const valor = item.extraAttributes[key];
      if (valor !== undefined && valor !== null && valor !== '') {
        bloquesInfoHTML.push(`<div><span>${obtenerEtiquetaLegible(key)}</span><b>${valor}</b></div>`);
      }
    });
  }

  // 2. Renderizar la estructura limpia y profesional
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
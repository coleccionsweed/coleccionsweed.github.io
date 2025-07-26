// --- DOM Elements ---
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const filterFranchise = document.getElementById('filterFranchise');
const filterType = document.getElementById('filterType');
const orderBy = document.getElementById('orderBy');
const orderDir = document.getElementById('orderDir');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalCarousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const detailsText = document.getElementById('detailsText');
const imgOverlay = document.getElementById('imgOverlay');
const imgOverlayImg = document.getElementById('imgOverlayImg');
const closeImgOverlay = document.getElementById('closeImgOverlay');

// --- State ---
let filtered = collectibles.slice();
let currentItem = null;
let currentImages = [];
let currentImgIndex = 0;

// --- Init ---
function populateFilters() {
  // Franquicias
  const franchises = [...new Set(collectibles.map(c => c.franchise))];
  filterFranchise.innerHTML = '<option value="">Todas</option>' +
    franchises.map(f => `<option value="${f}">${f}</option>`).join('');
  // Tipos
  const types = [...new Set(collectibles.map(c => c.type))];
  filterType.innerHTML = '<option value="">Todos</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');
}

function filterAndRender() {
  const search = searchInput.value.toLowerCase();
  const franchise = filterFranchise.value;
  const type = filterType.value;
  filtered = collectibles.filter(c =>
    (!franchise || c.franchise === franchise) &&
    (!type || c.type === type) &&
    (!search || c.name.toLowerCase().includes(search))
  );
  sortAndRender();
}

function sortAndRender() {
  const field = orderBy.value;
  const dir = orderDir.value === 'desc' ? -1 : 1;
  filtered.sort((a, b) => {
    let va = a[field], vb = b[field];
    // Para precio, quitar € y convertir a número
    if (field === 'purchasePrice') {
      va = parseFloat((va||'').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      vb = parseFloat((vb||'').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    // Para cantidad, convertir a número
    if (field === 'quantity') {
      va = Number(va) || 0;
      vb = Number(vb) || 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  renderGrid();
}

function renderGrid() {
  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#888;">No hay resultados</p>';
    let countParagraph = document.getElementById('elementCount');
    if (countParagraph) {
      countParagraph.innerHTML = '';
    }
    return;
  }
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = getFirstImage(item);
    img.alt = item.name;
    img.onerror = () => img.src = 'https://via.placeholder.com/260x160?text=Sin+imagen';
    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `<h3 title="${item.name}">${item.name}</h3><p title="${item.franchise}">${item.franchise}</p><p title="${item.type}">${item.type}</p>`;
    card.appendChild(img);
    card.appendChild(body);
    card.onclick = () => openModal(item);
    grid.appendChild(card);
  });

  let countParagraph = document.getElementById('elementCount');

  if (!countParagraph) {
    countParagraph = document.createElement('p');
    countParagraph.id = 'elementCount';
    countParagraph.style.textAlign = 'center';
    countParagraph.style.marginTop = '1em';
    grid.insertAdjacentElement('afterend', countParagraph);
  }

  countParagraph.innerHTML = `Mostrando ${grid.children.length} de ${collectibles.length} elementos`;
}

function getFirstImage(item) {
  // Devuelve la ruta de la primera imagen .jpeg (del 1 al 10)
  for (let i = 1; i <= 10; i++) {
    const path = `img/${item.type}/${item.name}/${i}.jpeg`;
    return path;
  }
  return 'https://via.placeholder.com/260x160?text=Sin+imagen';
}

// --- Modal ---
function openModal(item) {
  console.log(item);
  currentItem = item;
  currentImages = [];
  currentImgIndex = 0;
  // Buscar imágenes solo hasta la primera que no exista
  let buscar = true;
  let i = 1;
  function tryNext() {
    if (!buscar || i > 20) {
      if (currentImages.length === 0) {
        currentImages = ['https://via.placeholder.com/800x600?text=Sin+imagen'];
      }
      renderModalCarousel();
      renderModalDetails();
      modal.classList.remove('hidden');
      updateNavBtns();
      return;
    }
    const path = `img/${item.type}/${item.name}/${i}.jpeg`;
    const img = new window.Image();
    img.onload = () => {
      currentImages.push(path);
      i++;
      tryNext();
    };
    img.onerror = () => {
      buscar = false;
      tryNext();
    };
    img.src = path;
  }
  tryNext();
}
function closeModalFn() {
  modal.classList.add('hidden');
  modalCarousel.innerHTML = '';
  detailsText.innerHTML = '';
  currentItem = null;
  currentImages = [];
  currentImgIndex = 0;
}
closeModal.onclick = closeModalFn;
modal.onclick = e => { if (e.target === modal) closeModalFn(); };

function renderModalCarousel() {
  modalCarousel.innerHTML = '';
  const slider = document.createElement('div');
  slider.className = 'carousel';
  const total = currentImages.length;
  currentImages.forEach((src, idx) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = currentItem.name;
    img.onerror = () => img.src = 'https://via.placeholder.com/800x600?text=Sin+imagen';
    if (idx === currentImgIndex) {
      img.className = 'active';
    } else if (idx === currentImgIndex - 1 || idx === currentImgIndex + 1) {
      img.className = 'side';
    } else {
      img.className = 'hidden';
    }
    img.onclick = () => openImgOverlay(src);
    slider.appendChild(img);
  });
  modalCarousel.appendChild(slider);
  updateNavBtns();
}
function updateNavBtns() {
  prevBtn.disabled = currentImgIndex <= 0;
  nextBtn.disabled = currentImgIndex >= currentImages.length - 1;
}
function addSliderDrag(slider, imgEls) {
  let startX = 0;
  let dragging = false;
  let lastTranslate = 0;
  let moved = false;
  let animationFrame;
  function getTranslate() {
    const m = slider.style.transform.match(/-?\d+(?:\.\d+)?/g);
    return m ? parseFloat(m[m.length-1]) : 0;
  }
  slider.onmousedown = dragStart;
  slider.ontouchstart = dragStart;
  function dragStart(e) {
    dragging = true;
    moved = false;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    lastTranslate = getTranslate();
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, {passive:false});
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
    slider.style.transition = 'none';
  }
  function dragMove(e) {
    if (!dragging) return;
    let x = e.touches ? e.touches[0].clientX : e.clientX;
    let dx = x - startX;
    let min = -Array.from(imgEls).slice(0, imgEls.length-1).reduce((a, el) => a + el.offsetWidth, 0) - (imgEls.length-1)*16;
    let max = 0;
    let nextTranslate = lastTranslate + dx;
    if (nextTranslate > max) nextTranslate = max;
    if (nextTranslate < min) nextTranslate = min;
    slider.style.transform = `translateX(${nextTranslate}px)`;
    moved = true;
  }
  function dragEnd(e) {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);
    // Centra la imagen más cercana
    let current = getTranslate();
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < imgEls.length; i++) {
      let w = imgEls[i].offsetWidth + 16;
      if (-current < acc + w/2) {
        idx = i;
        break;
      }
      acc += w;
    }
    currentImgIndex = idx;
    slider.style.transition = '';
    renderModalCarousel();
  }
}
prevBtn.onclick = () => {
  if (currentImgIndex > 0) {
    currentImgIndex--;
    renderModalCarousel();
  }
};
nextBtn.onclick = () => {
  if (currentImgIndex < currentImages.length - 1) {
    currentImgIndex++;
    renderModalCarousel();
  }
};


function renderModalDetails() {
  let html = '<table class="details-table">';
  for (const [key, val] of Object.entries(currentItem)) {
    if (key === 'extraAttributes') continue;
    html += `<tr><th>${traducirCampo(key)}</th><td>${val}</td></tr>`;
  }
  if (currentItem.extraAttributes) {
    html += `<tr><th colspan="2" class="extra-title">Atributos Extra</th></tr>`;
    for (const [k, v] of Object.entries(currentItem.extraAttributes)) {
      html += `<tr><th>${k}</th><td>${v}</td></tr>`;
    }
  }
  html += '</table>';
  detailsText.innerHTML = html;
}
function traducirCampo(campo) {
  const map = {
    name: 'Nombre',
    franchise: 'Franquicia',
    type: 'Tipo',
    brand: 'Marca',
    purchasePrice: 'Precio compra',
    condition: 'Estado',
    quantity: 'Cantidad',
    language: 'Idioma',
    notes: 'Notas',
    barcode: 'Código barras'
  };
  return map[campo] || campo;
}

// --- Overlay Imagen Grande ---
function openImgOverlay(src) {
  // Solo mostrar overlay si la imagen existe
  const img = new window.Image();
  img.onload = () => {
    imgOverlayImg.src = src;
    imgOverlay.classList.remove('hidden');
  };
  img.onerror = () => {
    imgOverlayImg.src = 'https://via.placeholder.com/800x600?text=Sin+imagen';
    imgOverlay.classList.remove('hidden');
  };
  img.src = src;
}
function closeImgOverlayFn() {
  imgOverlay.classList.add('hidden');
  imgOverlayImg.src = '';
}
closeImgOverlay.onclick = closeImgOverlayFn;
imgOverlay.onclick = e => { if (e.target === imgOverlay) closeImgOverlayFn(); };

// --- Filtros y orden ---
searchInput.oninput = filterAndRender;
filterFranchise.onchange = filterAndRender;
filterType.onchange = filterAndRender;
orderBy.onchange = sortAndRender;
orderDir.onchange = sortAndRender;

// --- Start ---
populateFilters();
filterAndRender();

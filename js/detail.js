export function renderDetail(item) {

  const grid = document.getElementById('collectionGrid')

  // 👉 generar imágenes dinámicamente hasta que falle
  const images = []

  for (let i = 1; i <= 20; i++) {
    const img = `images/${item.category}/${item.folder}/${i}.webp`
    images.push(img)
  }

  grid.innerHTML = `
    <div class="detail">

      <!-- SLIDER -->
      <div class="slider">

        <button class="nav prev">‹</button>

        <div class="slider-window">
          <img id="sliderImage" src="${images[0]}" />
        </div>

        <button class="nav next">›</button>

      </div>

      <!-- INFO -->
      <div class="info-card">

        <h1>${item.name}</h1>
        <p class="subtitle">${item.franchise || ''}</p>

        <div class="info-grid">

          <div><span>Tipo</span><b>${item.type}</b></div>
          <div><span>Marca</span><b>${item.brand}</b></div>
          <div><span>Estado</span><b>${item.condition}</b></div>
          <div><span>Idioma</span><b>${item.language}</b></div>
          <div><span>Precio</span><b>${item.purchasePrice}</b></div>
          <div><span>Cantidad</span><b>${item.quantity}</b></div>

        </div>

        <div class="tags">
          ${(item.tags || []).map(t => `<span>${t}</span>`).join('')}
        </div>

        <div class="notes">
          ${item.notes || ''}
        </div>

      </div>

    </div>
  `
  let index = 0
  const img = document.getElementById('sliderImage')

  const prev = grid.querySelector('.prev')
  const next = grid.querySelector('.next')

  function setImage(i) {
    img.src = images[i]
  }

  next.addEventListener('click', () => {
    index++
    if (index >= images.length) index = 0
    setImage(index)
  })

  prev.addEventListener('click', () => {
    index--
    if (index < 0) index = images.length - 1
    setImage(index)
  })

  // 👉 auto-detectar fin real de imágenes
  let validImages = []

  let loaded = 0

  images.forEach((src, i) => {
    const test = new Image()

    test.onload = () => {
      validImages[i] = src
      loaded++
    }

    test.onerror = () => {
      loaded++
    }

    test.src = src
  })

  // después de cargar, filtrar válidas
  setTimeout(() => {
    const realImages = images.filter(src => {
      const img = new Image()
      img.src = src
      return img.complete && img.naturalWidth > 0
    })

    if (realImages.length > 0) {
      index = 0
      images.length = 0
      images.push(...realImages)
      setImage(0)
    }

  }, 300)
}
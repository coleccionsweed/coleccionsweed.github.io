export function renderDetail(item) {

  const grid = document.getElementById('collectionGrid')

  const images = []

  for (let i = 1; i <= 10; i++) {
    images.push(`images/${item.category}/${item.folder}/${i}.webp`)
  }

  grid.innerHTML = `
    <div class="detail">

      <div class="detail-gallery">
        <img id="mainImage" src="${images[0]}" />
      </div>

      <div class="detail-info">

        <h1>${item.name}</h1>
        <h3>${item.franchise || ''}</h3>

        <p><b>Tipo:</b> ${item.type}</p>
        <p><b>Marca:</b> ${item.brand}</p>
        <p><b>Estado:</b> ${item.condition}</p>
        <p><b>Precio:</b> ${item.purchasePrice}</p>
        <p><b>Idioma:</b> ${item.language}</p>

        <div class="tags">
          ${(item.tags || []).map(t => `<span>${t}</span>`).join('')}
        </div>

      </div>

    </div>
  `

  // cambio de imagen simple
  let index = 0
  const img = document.getElementById('mainImage')

  setInterval(() => {
    index++
    if (index >= images.length) return
    img.src = images[index]
  }, 2000)
}
export function renderItems(items) {

  const grid = document.getElementById('collectionGrid')
  grid.innerHTML = ''

  items.forEach(item => {

    const card = document.createElement('div')
    card.className = 'card'

    const image = `images/${item.category}/${item.folder}/1.webp`

    card.innerHTML = `
      <img class="card-image" src="${image}" loading="lazy">

      <div class="card-content">

        <div class="card-title">${item.name}</div>

        <div class="card-subtitle">${item.franchise || ''}</div>

        <div class="tag-list">
          ${(item.tags || []).map(tag => `
            <div class="tag">${tag}</div>
          `).join('')}
        </div>

      </div>
    `

    card.addEventListener('click', () => {
      window.location.hash = item.id
    })

    grid.appendChild(card)
  })
}
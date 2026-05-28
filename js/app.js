import { loadCollection } from './dataLoader.js'
import { renderItems } from './renderer.js'

let allItems = []

async function init() {

  allItems = await loadCollection()

  renderItems(allItems)

  setupSearch()
}

function setupSearch() {

  const input = document.getElementById('searchInput')

  input.addEventListener('input', () => {

    const value = input.value.toLowerCase()

    const filtered = allItems.filter(item => {

      return (
        item.name.toLowerCase().includes(value)
        ||
        (item.franchise || '')
          .toLowerCase()
          .includes(value)
      )
    })

    renderItems(filtered)
  })
}

init()
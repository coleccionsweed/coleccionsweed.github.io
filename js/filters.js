export function setupFilters(items, onChange) {

  const category = document.getElementById('categoryFilter')
  const franchise = document.getElementById('franchiseFilter')
  const search = document.getElementById('search')

  // únicos
  const categories = [...new Set(items.map(i => i.category))]
  const franchises = [...new Set(items.map(i => i.franchise))]

  category.innerHTML = `<option value="">Category</option>` +
    categories.map(c => `<option>${c}</option>`).join('')

  franchise.innerHTML = `<option value="">Franchise</option>` +
    franchises.map(f => `<option>${f}</option>`).join('')

  function apply() {

    const result = items.filter(i => {

      return (
        (!category.value || i.category === category.value) &&
        (!franchise.value || i.franchise === franchise.value) &&
        (!search.value ||
          i.name.toLowerCase().includes(search.value.toLowerCase()))
      )

    })

    onChange(result)
  }

  category.onchange = apply
  franchise.onchange = apply
  search.oninput = apply
}
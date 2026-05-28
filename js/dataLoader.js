export async function loadCollection() {

  const files = [
    'data/books.json'
  ]

  const results = await Promise.all(
    files.map(async file => {
      const response = await fetch(file)
      return await response.json()
    })
  )

  return results.flat()
}
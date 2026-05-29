export async function loadCollection() {

  const files = [
    'data/books.json',
	'data/toys.json',
	'data/card-box.json',
	'data/card-collection.json',
	'data/video-games.json',
	'data/films.json'
  ]

  const results = await Promise.all(
    files.map(async file => {
      const response = await fetch(file)
      return await response.json()
    })
  )

  return results.flat()
}
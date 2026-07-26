export const diccionario = {
  // --- Etiquetas de los selectores ---
  "Category": "Todas las categorías",
  "Franchise": "Todas las franquicias",
  "Brand": "Todas las marcas",
  "Search": "Buscar...",

  // --- Categorías ---
  "books": "Libros",
  "toys": "Juguetes",
  "card-box": "Cajas de cartas/cromos",
  "card-collection": "Colecciones de cartas/cromos",
  "video-games": "Videojuegos",
  "films": "Películas",
  "card-packs": "Sobres de cartas/cromos",
  "decks": "Mazos",
  "board-games": "Juegos de mesa",
  "graded-cards": "Cartas graduadas",
  "consoles": "Consolas",
  "memorabilia": "Memorabilia",
  "calendars": "Calendarios",
  "albums": "Álbumes",
  "cards": "Cartas",
  "stamps": "Sellos"
};

/** Nombre corto de categoría, para etiquetas donde no cabe el largo. */
export const categoriasCortas = {
  "books": "Libros",
  "toys": "Juguetes",
  "card-box": "Cajas",
  "card-collection": "Colecciones",
  "video-games": "Videojuegos",
  "films": "Películas",
  "card-packs": "Sobres",
  "decks": "Mazos",
  "board-games": "Juegos de mesa",
  "graded-cards": "Graduadas",
  "consoles": "Consolas",
  "memorabilia": "Memorabilia",
  "calendars": "Calendarios",
  "albums": "Álbumes",
  "cards": "Cartas",
  "stamps": "Sellos"
};

/** Emoji por categoría, para que la vista se lea de un golpe de vista. */
export const iconosCategoria = {
  "books": "📚",
  "toys": "🧸",
  "card-box": "📦",
  "card-collection": "🃏",
  "video-games": "🎮",
  "films": "🎬",
  "card-packs": "✉️",
  "decks": "🎴",
  "board-games": "🎲",
  "graded-cards": "🏅",
  "consoles": "🕹️",
  "memorabilia": "🏆",
  "calendars": "📅",
  "albums": "📗",
  "cards": "🂡",
  "stamps": "📮"
};

/** Etiquetas legibles de los campos del JSON. */
export const etiquetasCampo = {
  type: 'Tipo',
  brand: 'Marca',
  condition: 'Estado',
  language: 'Idioma',
  purchasePrice: 'Precio',
  quantity: 'Cantidad',
  barcode: 'Cód. de barras',
  author: 'Autor',
  year: 'Año',
  grade: 'Grade',
  platform: 'Plataforma',
  category: 'Categoría',
  franchise: 'Franquicia'
};

/** Traduce de forma segura: si no existe la clave, devuelve el original. */
export function t(palabra) {
  return diccionario[palabra] || palabra;
}

export function catCorta(categoria) {
  return categoriasCortas[categoria] || categoria;
}

export function catIcono(categoria) {
  return iconosCategoria[categoria] || '📦';
}

export function etiquetaCampo(clave) {
  if (etiquetasCampo[clave]) return etiquetasCampo[clave];
  return clave
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

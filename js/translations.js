export const diccionario = {
  // --- Etiquetas de los selectores (Labels) ---
  "Category": "Categoría",
  "Franchise": "Franquicia",
  "Search": "Buscar...",
  "books": "Libros",
  "toys": "Juguetes",
  "card-box": "Cajas de cartas/cromos",
};

// Función helper para traducir de forma segura (si no existe, devuelve la palabra original)
export function t(palabra) {
  return diccionario[palabra] || palabra;
}
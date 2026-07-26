const FILES = [
  'data/books.json',
  'data/toys.json',
  'data/card-box.json',
  'data/card-collection.json',
  'data/video-games.json',
  'data/films.json',
  'data/card-packs.json',
  'data/decks.json',
  'data/board-games.json',
  'data/graded-cards.json',
  'data/consoles.json',
  'data/memorabilia.json',
  'data/calendars.json',
  'data/albums.json',
  'data/cards.json',
  'data/stamps.json'
];

let cache = null;

/**
 * Convierte "71,00€" en 71. Devuelve 0 si no hay precio válido.
 */
export function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Quitamos moneda y espacios; el punto es separador de miles y la coma, decimal.
  const clean = String(value)
    .replace(/[€$\s]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPrice(amount) {
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-ES');
}

/**
 * Normaliza cada objeto para que el resto de la web no tenga que lidiar con
 * variaciones del JSON (mayúsculas distintas, cantidades como texto, etc.)
 * y añade campos derivados listos para ordenar y sumar.
 */
function normalize(item) {
  const normalized = { ...item };

  // Algunos objetos traen "Platform" en vez de "platform".
  if (normalized.Platform && !normalized.platform) {
    normalized.platform = normalized.Platform;
  }
  delete normalized.Platform;

  const quantity = parseInt(normalized.quantity, 10);
  normalized.quantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

  normalized.priceValue = parsePrice(normalized.purchasePrice);
  normalized.totalValue = normalized.priceValue * normalized.quantity;

  const year = parseInt(normalized.year, 10);
  normalized.yearValue = Number.isFinite(year) ? year : null;

  normalized.image = `images/${normalized.category}/${normalized.folder}/1.webp`;

  // Texto plano precalculado: hace la búsqueda instantánea sin recorrer campos.
  normalized.searchText = [
    normalized.name,
    normalized.franchise,
    normalized.brand,
    normalized.platform,
    normalized.author,
    normalized.year,
    normalized.language,
    normalized.condition,
    normalized.barcode
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return normalized;
}

export async function loadCollection() {
  if (cache) return cache;

  const results = await Promise.all(
    FILES.map(async (file) => {
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn(`No se pudo cargar ${file}:`, error.message);
        return [];
      }
    })
  );

  cache = results.flat().map(normalize);
  return cache;
}

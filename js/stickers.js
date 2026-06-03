// stickers.js

const albumConfigs = {
    "la-comunidad-del-anillo-coleccion-completa": { 
        maxNum: 265, 
        extra: ["a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "p"] 
    },
    "las-dos-torres-coleccion-completa": { 
        maxNum: 186, 
        extra: ["a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "p"] 
    },
    "el-retorno-del-rey-coleccion-completa": { 
        maxNum: 226, 
        extra: Array.from({ length: 22 }, (_, i) => `r${i + 1}`)
    },
    "animales-fantasticos-y-donde-encontrarlos-coleccion-completa": { 
        maxNum: 240
    },
	"animales-fantasticos-los-crimenes-de-grindelwald-coleccion-completa": { 
        maxNum: 204
    },
    "animales-fantasticos-los-secretos-de-dumbledore-coleccion-completa": { 
        maxNum: 120, 
		extra: [
			...Array.from({ length: 30 }, (_, i) => `c${i + 1}`),
			"le1"
		]
    },
    "harry-potter-manual-de-cromos-para-magos-y-brujas-coleccion-completa": { 
        maxNum: 180, 
		extra: [
			...Array.from({ length: 12 }, (_, i) => `y${i + 1}`),
			...Array.from({ length: 11 }, (_, i) => `le${i + 1}`),
			...Array.from({ length: 12 }, (_, i) => `xxl-le${i + 1}`)
		]
    }
};

export function renderStickers(containerId, folderId) {
    const config = albumConfigs[folderId];
    if (!config) {
        console.error(`Configuración no encontrada para el ID: ${folderId}`);
        return;
    }

    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    const grid = document.createElement('div');
    grid.className = 'stickers-grid';

    // 1. Generar cromos numéricos (0 a maxNum)
    for (let i = 0; i <= config.maxNum; i++) {
        // La ruta ahora es: images/ID/cromos/N.jpg
        createSticker(grid, `images/card-collection/${folderId}/cromos/${i}.jpg`);
    }

    // 2. Generar cromos extra
    config.extra.forEach(ext => {
        createSticker(grid, `images/card-collection/${folderId}/cromos/${ext}.jpg`);
    });

    container.appendChild(grid);
}

function createSticker(parent, src) {
    const item = document.createElement('div');
    item.className = 'sticker-item';
    
    const img = document.createElement('img');
    img.src = src;
    img.loading = "lazy";
    
    // Si no encuentra el archivo (404), eliminamos el cromo
    img.onerror = () => item.remove(); 
    
    item.onclick = () => openModal(src);
    item.appendChild(img);
    parent.appendChild(item);
}

function openModal(src) {
    const modal = document.createElement('div');
    modal.id = 'stickerModal';
    // El modal de zoom no necesita un contenedor .modal-content extra,
    // simplemente inyecta la imagen para maximizar el tamaño
    modal.innerHTML = `<img src="${src}">`;
    
    // Al hacer clic en cualquier parte, el modal se cierra
    modal.onclick = () => modal.remove();
    
    document.body.appendChild(modal);
}
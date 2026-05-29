// stickers.js

const albumConfigs = {
    "la-comunidad-del-anillo-coleccion-completa": { 
        maxNum: 265, 
        extra: ["a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "p"] 
    },
    "el-retorno-del-rey-coleccion-completa": { 
        maxNum: 226, 
        extra: Array.from({ length: 22 }, (_, i) => `r${i + 1}`) 
    },
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

    // 1. Generar cromos numéricos (1 a maxNum)
    for (let i = 1; i <= config.maxNum; i++) {
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
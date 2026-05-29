const albumConfigs = {
    "la-comunidad-del-anillo-coleccion-completa": { 
        folder: "cromos", 
        maxNum: 265, 
        extra: ["a", "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "p"] 
    },
	"el-retorno-del-rey-coleccion-completa": { 
        folder: "cromos", 
        maxNum: 226, 
        extra: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15", "r16", "r17", "r18", "r19", "r20", "r21", "r22"] 
    },
};

export function renderStickers(containerId, folderId) {
    const config = albumConfigs[folderId];
    if (!config) return;

    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Limpiar antes de renderizar
    
    const grid = document.createElement('div');
    grid.className = 'stickers-grid';

    // 1. Generar cromos numéricos (del 1 al maxNum)
    for (let i = 1; i <= config.maxNum; i++) {
        createSticker(grid, `assets/cromos/${config.folder}/${i}.jpg`);
    }

    // 2. Generar cromos extra (letras/códigos)
    config.extra.forEach(ext => {
        createSticker(grid, `assets/cromos/${config.folder}/${ext}.jpg`);
    });

    container.appendChild(grid);
}

function createSticker(parent, src) {
    const item = document.createElement('div');
    item.className = 'sticker-item';
    
    const img = document.createElement('img');
    img.src = src;
    img.loading = "lazy";
    
    // Si la imagen no existe en la carpeta, simplemente no la mostramos
    img.onerror = () => item.remove(); 
    
    item.onclick = () => openModal(src);
    item.appendChild(img);
    parent.appendChild(item);
}

function openModal(src) {
    const modal = document.createElement('div');
    modal.id = 'stickerModal';
    modal.innerHTML = `<div class="modal-content"><img src="${src}"></div>`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}
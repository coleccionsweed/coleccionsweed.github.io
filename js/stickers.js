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
    },
    "2022-fifa-world-cup-coleccion-completa": { 
        maxNum: 0, 
		extra: [
			"00",
			...Array.from({ length: 18 }, (_, i) => `fwc${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `qat${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `ecu${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `sen${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `ned${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `eng${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `irn${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `usa${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `wal${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `arg${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `ksa${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `mex${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `pol${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `fra${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `aus${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `den${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `tun${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `esp${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `crc${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `ger${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `jpn${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `bel${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `can${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `mar${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `cro${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `bra${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `srb${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `sui${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `cmr${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `por${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `gha${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `uru${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `kor${i + 1}`),
			...Array.from({ length: 11 }, (_, i) => `fwc${i + 19}`),
			...Array.from({ length: 8 }, (_, i) => `esp-j${i + 1}`),
			"qat15x", "ecu6x", "sen5x", "sen9x", "sen10x", "ned4x", "ned12x", "ned15x", "ned17x", "ned20x", "irn11x", "usa4x", "usa7x", "usa17x", "arg12x", "ksa20x", "mex12x", "mex16x", "pol9x", 
			"pol10x", "pol11x", "pol12x", "pol14x", "fra4x", "fra7x", "fra11x", "fra12x", "fra15x", "fra20x", "aus7x", "aus9x", "aus13x", "aus20x", "den9x", "tun4x", "tun9x", "crc4x", "crc5x", 
			"crc13x", "ger6x", "ger18x", "ger20x", "jpn6x", "jpn11x", "jpn16x", "jpn20x", "bel7x", "can4x", "can6x", "mar7x", "mar8x", "mar12x", "mar14x", "mar16x", "mar18x", "mar19x", "mar20x", 
			"cro5x", "cro17x", "bra11x", "sui7x", "sui16x", "cmr8x", "cmr9x", "cmr13x", "cmr17x", "por6x", "por14x", "por15x", "por19x", "por20x", "gha3x", "gha4x", "gha9x", "gha10x", "gha11x", 
			"gha15x", "gha16x", "kor10x", "ls-b"
		]
    },
    "de-las-peliculas-de-harry-potter-coleccion-completa": { 
        maxNum: 216, 
		extra: [
			...Array.from({ length: 50 }, (_, i) => `c${i + 1}`),
			...Array.from({ length: 8 }, (_, i) => `le${i + 1}`)
		]
    },
    "el-magico-mundo-de-harry-potter-coleccion-completa": { 
        maxNum: 204, 
		extra: [
			...Array.from({ length: 12 }, (_, i) => `x${i + 1}`)
		]
    },
    "harry-potter-y-las-reliquias-de-la-muerte-parte-2-coleccion-completa": { 
        maxNum: 194, 
		extra: [
			...Array.from({ length: 34 }, (_, i) => `x${i + 1}`)
		]
    },
    "harry-potter-y-las-reliquias-de-la-muerte-parte-1-coleccion-completa": { 
        maxNum: 228, 
		extra: [
			...Array.from({ length: 12 }, (_, i) => `x${i + 1}`)
		]
    },
    "harry-potter-y-el-misterio-del-principe-coleccion-completa": { 
        maxNum: 360
    },
    "harry-potter-y-la-orden-del-fenix-coleccion-completa": { 
        maxNum: 276,
		extra: [
			...Array.from({ length: 12 }, (_, i) => `s${i + 1}`)
		]
    },
    "harry-potter-y-el-caliz-de-fuego-coleccion-completa": { 
        maxNum: 234,
		extra: [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"
		]
    },
    "harry-potter-y-el-prisionero-de-azkaban-coleccion-completa": { 
        maxNum: 240,
		extra: [
			...Array.from({ length: 12 }, (_, i) => `h${i + 1}`)
		]
    },
    "harry-potter-y-la-camara-secreta-coleccion-completa": { 
        maxNum: 240,
		extra: [
			"a", "b", "c", "d", "e", "f",
			...Array.from({ length: 54 }, (_, i) => `h${i + 1}`)
		]
    },
    "harry-potter-y-la-piedra-filosofal-coleccion-completa": { 
        maxNum: 216
    },
    "harry-potter-y-la-piedra-filosofal-cartoons-coleccion-completa": { 
        maxNum: 144
    },
    "harry-potter-y-la-camara-secreta-cartoons-coleccion-completa-pegada": { 
        maxNum: 144,
		extra: [
			...Array.from({ length: 12 }, (_, i) => `h${i + 1}`)
		]
    },
    "harry-potter-bienvenidos-a-hogwarts-coleccion-completa": { 
        maxNum: 216,
		extra: [
			"el4"
		]
    },
    "monstruos-s-a-coleccion-completa": { 
        maxNum: 180,
		extra: [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r"
		]
    },
    "el-jorobado-de-notre-dame-coleccion-completa": { 
        maxNum: 232
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
    config.extra?.forEach(ext => {
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
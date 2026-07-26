// js/stickers.js
import { openLightbox } from './lightbox.js';

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
    },
    "asterix-album-de-viajes-coleccion-completa": {
        maxNum: 164
    },
    "toy-story-2-coleccion-completa": {
        maxNum: 180,
		extra: [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r"
		]
    },
    "tarzan-coleccion-completa-sin-album": {
        maxNum: 200,
		extra: [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r"
		]
    },
    "mulan-coleccion-incompleta": {
        maxNum: 232
    },
    "mulan-coleccion-completa": {
        maxNum: 232
    },
    "harry-Potter-lego-coleccion-incompleta": {
        maxNum: 225,
		extra: [
			...Array.from({ length: 45 }, (_, i) => `c${i + 1}`),
			...Array.from({ length: 45 }, (_, i) => `c${i + 1}g`)
		]
    },
    "one-piece-25-aniversario-coleccion-incompleta": {
        maxNum: 200,
		extra: [
			...Array.from({ length: 150 }, (_, i) => `${i + 1}p`),
			...Array.from({ length: 10 }, (_, i) => `le${i + 1}`)
		]
    },
    "la-liga-05-06-coleccion-completa": {
        maxNum: 525
    },
    "la-liga-06-07-coleccion-completa": {
        maxNum: 648
    },
    "la-liga-07-08-coleccion-completa": {
        maxNum: 691
    },
    "la-liga-08-09-coleccion-completa": {
        maxNum: 575,
		extra: [
			...Array.from({ length: 36 }, (_, i) => `mi-${i + 1}`)
		]
    },
    "la-liga-09-10-coleccion-completa": {
        maxNum: 780,
		extra: [
			...Array.from({ length: 36 }, (_, i) => `mi-${i + 1}`)
		]
    },
    "la-liga-10-11-coleccion-completa": {
        maxNum: 693
    },
    "la-liga-11-12-coleccion-completa": {
        maxNum: 691
    },
    "la-liga-12-13-coleccion-completa": {
        maxNum: 709,
		extra: [
			...Array.from({ length: 45 }, (_, i) => `${i + 1}tr`)
		]
    },
    "la-liga-13-14-coleccion-completa": {
        maxNum: 833,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `${i + 1}tr`)
		]
    },
    "la-liga-14-15-coleccion-completa": {
        maxNum: 702,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `tr${i + 1}`)
		]
    },
    "la-liga-15-16-coleccion-completa": {
        maxNum: 732
    },
    "la-liga-16-17-coleccion-completa": {
        maxNum: 759
    },
    "la-liga-17-18-coleccion-completa": {
        maxNum: 769,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `t${i + 1}`)
		]
    },
    "la-liga-18-19-coleccion-completa": {
        maxNum: 856,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `m${i + 1}`)
		]
    },
    "la-liga-19-20-coleccion-completa": {
        maxNum: 750,
		extra: [
			...Array.from({ length: 20 }, (_, i) => `b${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `i${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`),
			...Array.from({ length: 42 }, (_, i) => `t${i + 1}`)
		]
    },
    "la-liga-20-21-coleccion-completa": {
        maxNum: 743,
		extra: [
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `p${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `t${i + 1}`),
			...Array.from({ length: 42 }, (_, i) => `tc${i + 1}`)
		]
    },
    "la-liga-21-22-coleccion-completa": {
        maxNum: 760,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `m${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `s${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `f${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`)
		]
    },
    "la-liga-22-23-coleccion-completa": {
        maxNum: 757,
		extra: [
			...Array.from({ length: 20 }, (_, i) => `c${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `t${i + 1}`),
			...Array.from({ length: 42 }, (_, i) => `m${i + 1}`)
		]
    },
    "la-liga-23-24-coleccion-completa": {
        maxNum: 745,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `m${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `mp${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `f${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`)
		]
    },
    "la-liga-24-25-coleccion-completa": {
        maxNum: 773,
		extra: [
			...Array.from({ length: 42 }, (_, i) => `m${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `b${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `c${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`)
		]
    },
    "la-liga-25-26-coleccion-completa": {
        maxNum: 775,
		extra: [
			...Array.from({ length: 2 }, (_, i) => `cc${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `e${i + 1}`),
			...Array.from({ length: 42 }, (_, i) => `mia${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `q${i + 1}`),
			...Array.from({ length: 20 }, (_, i) => `t${i + 1}`)
		]
    },
    "buscando-a-nemo-completa-sin-album": {
        maxNum: 198,
		extra: [
			"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
			...Array.from({ length: 10 }, (_, i) => `m${i + 1}`),
		]
    }
};

export function renderStickers(containerId, folderId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const config = albumConfigs[folderId];
    if (!config) return;   // Esta colección todavía no tiene cromos escaneados.

    // Lista de identificadores: primero los numéricos, luego los especiales.
    const ids = [];
    for (let i = 0; i <= config.maxNum; i++) ids.push(String(i));
    (config.extra || []).forEach((extra) => ids.push(String(extra)));
    if (!ids.length) return;

    container.innerHTML = `
      <div class="section__head">
        <h3 class="section__title">🃏 Cromos escaneados</h3>
        <span class="section__count" id="stickersCount">…</span>
      </div>
      <div class="stickers-toolbar">
        <input id="stickerSearch" type="search" inputmode="search" placeholder="Ir al cromo nº…" aria-label="Buscar cromo por número">
        <span class="section__hint" style="margin:0;" id="stickerSearchInfo"></span>
      </div>
      <div class="stickers-grid" id="stickersGrid"></div>
    `;

    const grid = container.querySelector('#stickersGrid');
    const countEl = container.querySelector('#stickersCount');
    const searchInput = container.querySelector('#stickerSearch');
    const searchInfo = container.querySelector('#stickerSearchInfo');

    const fragment = document.createDocumentFragment();
    let available = 0;
    let countTimer = null;

    function refreshCount() {
        clearTimeout(countTimer);
        countTimer = setTimeout(() => {
            countEl.textContent = `${available.toLocaleString('es-ES')} cromos`;
        }, 120);
    }

    ids.forEach((id) => {
        const src = `images/card-collection/${folderId}/cromos/${id}.jpg`;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'sticker-item is-pending';
        item.dataset.num = id.toLowerCase();
        item.setAttribute('aria-label', `Cromo ${id}`);
        item.innerHTML = `
          <img src="${src}" loading="lazy" decoding="async" alt="Cromo ${id}">
          <span class="sticker-item__num">${id}</span>
        `;

        const img = item.querySelector('img');
        // El JSON no dice qué cromos están escaneados: si da 404, se retira.
        img.addEventListener('error', () => {
            item.remove();
            available--;
            refreshCount();
        }, { once: true });
        img.addEventListener('load', () => item.classList.remove('is-pending'), { once: true });

        available++;
        fragment.appendChild(item);
    });

    grid.appendChild(fragment);
    refreshCount();

    // --- Visor a pantalla completa con anterior/siguiente ---
    grid.addEventListener('click', (event) => {
        const item = event.target.closest('.sticker-item');
        if (!item) return;

        const visibles = Array.from(grid.querySelectorAll('.sticker-item'));
        openLightbox({
            items: visibles.map((node) => ({
                src: node.querySelector('img').src,
                label: `Cromo ${node.dataset.num}`
            })),
            index: visibles.indexOf(item)
        });
    });

    // --- Ir a un cromo concreto ---
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        grid.querySelectorAll('.is-hit').forEach((node) => node.classList.remove('is-hit'));

        if (!term) {
            searchInfo.textContent = '';
            return;
        }

        const hits = Array.from(grid.querySelectorAll('.sticker-item'))
            .filter((node) => node.dataset.num === term || node.dataset.num.startsWith(term));

        if (!hits.length) {
            searchInfo.textContent = 'Sin coincidencias';
            return;
        }

        hits.forEach((node) => node.classList.add('is-hit'));
        searchInfo.textContent = `${hits.length} coincidencia${hits.length > 1 ? 's' : ''}`;
        hits[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
}

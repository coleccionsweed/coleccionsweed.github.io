import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;

// 1. LISTA DE OBJETOS: Añade aquí todas las rutas de tus modelos
const misModelos = [
    { url: 'modelos/entei.glb', pos: { x: 0, y: 0, z: 0 } },
    { url: 'modelos/tarzan.glb', pos: { x: 10, y: 0, z: -20 } }
];

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // CONTROLES TÁCTILES: Funcionan en móvil y PC (OrbitControls)
    controls = new OrbitControls(camera, renderer.domElement);
    
    // ILUMINACIÓN
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    // SUELO
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x224422 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 2. CARGADOR DINÁMICO
    const loader = new GLTFLoader();
    misModelos.forEach(item => {
        loader.load(item.url, (gltf) => {
            const model = gltf.scene;
            model.position.set(item.pos.x, item.pos.y, item.pos.z);
            scene.add(model);
        });
    });

    // OCULTAR EL BLOQUEO AL CARGAR
    document.getElementById('blocker').style.display = 'none';

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Asegúrate de que el div 'blocker' existe en tu HTML
const blocker = document.getElementById('blocker');

// Escuchamos cualquier interacción del usuario (clic o toque)
function iniciarExperiencia() {
    if (blocker) {
        blocker.style.display = 'none'; // Aquí desaparece el texto
        blocker.style.opacity = '0';    // Animación suave
        blocker.style.pointerEvents = 'none'; // Para que el ratón pase a través
    }
    
    // Si estás usando OrbitControls, esto asegura que el usuario tenga el control
    controls.enabled = true;
}

// Vinculamos la función al elemento
blocker.addEventListener('click', iniciarExperiencia);
blocker.addEventListener('touchstart', iniciarExperiencia);
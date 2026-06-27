import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function inicializarVisor(containerId, rutaModelo) {
    const container = document.getElementById(containerId);
    // Si no existe el contenedor en esta página (ej: falta en stats.html), salimos
    if (!container) return;
	
    // Escena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0); // El 0 es la transparencia total
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Luces (para que el modelo se vea bien)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Controles de giro (OrbitControls permite arrastrar y rotar)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Efecto de inercia al soltar el giro
    controls.enablePan = false;    // Desactivamos mover el objeto, solo rotar
    
    camera.position.z = 5;

    // Cargar el modelo .glb
    const loader = new GLTFLoader();
    loader.load(rutaModelo, (gltf) => {
        scene.add(gltf.scene);
        // Centrar y escalar automáticamente
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.x += (gltf.scene.position.x - center.x);
        gltf.scene.position.y += (gltf.scene.position.y - center.y);
        gltf.scene.position.z += (gltf.scene.position.z - center.z);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
// js/visor3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function inicializarVisor(containerId, rutaModelo) {
    const container = document.getElementById(containerId);
    if (!container) return; // Protección si el div no existe
    
    const scene = new THREE.Scene();
    
    // 1. CÁMARA MÁS ALEJADA
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 15); // Aumentamos la distancia Z (estaba en 5, probamos con 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); 
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    // 2. CONTROLES DE GIRO SIN ZOOM NI MOVIMIENTO
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;    // Desactiva arrastrar el objeto lateralmente
    controls.enableZoom = false;   // DESACTIVA EL ZOOM (el usuario ya no puede acercar/alejar)
    
    // 3. CENTRADO FORZADO
    controls.target.set(0, 0, 0); 

    const loader = new GLTFLoader();
    loader.load(rutaModelo, (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Centrado automático preciso
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Mueve el modelo para que su centro esté en 0,0,0
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
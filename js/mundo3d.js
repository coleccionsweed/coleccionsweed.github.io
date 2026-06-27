import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function init() {
    // 1. ESCENA Y CÁMARA
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // 2. ILUMINACIÓN (Esencial para ver texturas)
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1);
    scene.add(light);

    // 3. CONTROLES
    controls = new PointerLockControls(camera, document.body);
    document.getElementById('instructions').addEventListener('click', () => controls.lock());

    // 4. SUELO
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x224422 })
    );
    scene.add(floor);

    // 5. CARGA DE MODELO .GLB
    const loader = new GLTFLoader();
    loader.load('modelos/entei.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        model.position.set(0, 0, -20);
        scene.add(model);
    }, undefined, (err) => console.error('Error cargando GLB:', err));

    // 6. RENDERIZADOR
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // EVENTOS
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyD': moveRight = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked) {
        const delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }
    prevTime = time;
    renderer.render(scene, camera);
}
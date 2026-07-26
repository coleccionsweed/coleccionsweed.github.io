// js/visor3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function inicializarVisor(containerId, rutaModelo) {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.visorListo === '1') return;
  container.dataset.visorListo = '1';

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'pan-y';
  container.appendChild(renderer.domElement);

  // Iluminación: ambiente suave más dos focos para que el volumen se lea.
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(4, 6, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x88bbff, 0.7);
  rimLight.position.set(-6, 2, -5);
  scene.add(rimLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.target.set(0, 0, 0);

  // Al tocar el modelo se detiene el giro automático.
  const stopAutoRotate = () => { controls.autoRotate = false; };
  renderer.domElement.addEventListener('pointerdown', stopAutoRotate, { once: true });

  const loader = new GLTFLoader();
  loader.load(
    rutaModelo,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // Centrado y encuadre automáticos según el tamaño real del modelo.
      const box = new THREE.Box3().setFromObject(model);
      model.position.sub(box.getCenter(new THREE.Vector3()));

      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z) * 0.5;
      if (radius > 0) {
        const fov = (camera.fov * Math.PI) / 180;
        camera.position.setZ((radius / Math.sin(fov / 2)) * 1.35);
        camera.updateProjectionMatrix();
      }
    },
    undefined,
    (error) => {
      console.warn(`No se pudo cargar el modelo ${rutaModelo}:`, error);
      container.closest('.viewer-3d')?.remove();
    }
  );

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
  else window.addEventListener('resize', resize);

  // El bucle se pausa cuando el visor no está a la vista: nada de gastar
  // batería renderizando algo que nadie mira.
  let visible = true;
  if (window.IntersectionObserver) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    }).observe(container);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

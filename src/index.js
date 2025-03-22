// Import necessary modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WorldGenerator } from './world/WorldGenerator.js';
import { PlayerController } from './entities/PlayerController.js';
import { SystemManager } from './systems/SystemManager.js';

// Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('scene-container').appendChild(renderer.domElement);

// Add orbit controls for development
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2.1; // Limit camera angle to not go below the horizon

// Add directional light (sun)
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Create world generator
const worldGenerator = new WorldGenerator(scene);

// Create system manager
const systemManager = new SystemManager(scene, worldGenerator);

// Find a suitable spawn point on land
const spawnPoint = worldGenerator.findSpawnPoint();

// Create player
const player = new PlayerController(scene, camera, controls);
player.position.copy(spawnPoint);
// Adjust the y position to account for player height
player.position.y -= 0.75; // Half of the player capsule height

// Update camera and controls to follow player at spawn point
camera.position.set(
  spawnPoint.x, 
  spawnPoint.y + 15, 
  spawnPoint.z + 15
);
camera.lookAt(spawnPoint.x, spawnPoint.y, spawnPoint.z);
controls.target.copy(spawnPoint);

// Handle window resize
window.addEventListener('resize', () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Add controls UI overlay
function createControlsOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'controls-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '10px';
  overlay.style.left = '10px';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.color = 'white';
  overlay.style.padding = '10px';
  overlay.style.borderRadius = '5px';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.zIndex = '1000';
  overlay.style.pointerEvents = 'none'; // Allow clicking through the overlay
  overlay.style.userSelect = 'none'; // Prevent text selection
  overlay.style.maxWidth = '250px';

  overlay.innerHTML = `
    <h3 style="margin: 0 0 5px 0; font-size: 16px;">Game Controls</h3>
    <p style="margin: 3px 0;">W-A-S-D Keys: Move</p>
    <p style="margin: 3px 0;">Mouse Drag: Look around</p>
  `;

  document.body.appendChild(overlay);
}

// Call this after your renderer is initialized and appended to the document
// For example, after:
// document.body.appendChild(renderer.domElement);
createControlsOverlay();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update world generator
  worldGenerator.update(player.position);
  
  // First update systems (collision, etc.)
  systemManager.update(player);
  
  // Then update player with collision-adjusted position
  player.update();
  
  // Update controls
  controls.update();
  
  // Render
  renderer.render(scene, camera);
}

animate(); 
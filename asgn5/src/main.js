// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer;
let loader, loadManager;
let buildingProto, carProto, baseProto, coinProto;
let cars = [], coins = [], buildings = [];
let playerLane = 0; // 0 = left, 1 = right
const laneX = [ -2, 2 ]; // x positions for the two lanes
let score = 0;
let gameOver = false;
let lastSpawnTime = 0;
let lastTime = 0;

// Controls for left/right arrow keys
const keys = { ArrowLeft: false, ArrowRight: false };

// Timing settings
const spawnInterval = 1.5;     // seconds between car/coin spawns
const carSpeed = 20;           // units per second (car forward speed)
const coinSpeedMultiplier = 0.8; // coins move at 0.8 * carSpeed

function initScene() {
  // 1) Renderer + Canvas
  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 2) Camera
  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // 3) Scene
  scene = new THREE.Scene();

  // 4) Lights: directional + ambient
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0.5, 1, 0.3);
  scene.add(dirLight);

  const ambLight = new THREE.AmbientLight(0x404040, 0.7);
  scene.add(ambLight);

  // 5) Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function loadModels() {
  // LoadingManager ensures startGame() only fires after all models load
  loadManager = new THREE.LoadingManager(startGame);
  loader = new GLTFLoader(loadManager);

  // 1) Building.glb
  loader.load(
    '../resources/Building1.glb',
    (gltf) => { buildingProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Building.glb:', err)
  );

  // 2) Car.glb
  loader.load(
    '../resources/Car.glb',
    (gltf) => { carProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Car.glb:', err)
  );

  // 3) Base.glb (road)
  loader.load(
    '../resources/Base.glb',
    (gltf) => { baseProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Base.glb:', err)
  );

  // 4) Coin.glb
  loader.load(
    '../resources/Coin.glb',
    (gltf) => { coinProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Coin.glb:', err)
  );
}

function startGame() {
  // Called once all four GLB files finish loading
  initRoadAndBuildings();
  lastSpawnTime = performance.now() * 0.001; // in seconds
  requestAnimationFrame(animate);
}

function initRoadAndBuildings() {
  // 1) Add Base (two‐lane road) at ground level
  const base = baseProto.clone();
  base.position.set(0, 0, 0);
  scene.add(base);

  // 2) Place buildings on each side of the road
  const spacing = 10;
  const countPerSide = 6;
  for (let i = 0; i < countPerSide; i++) {
    const zPos = -20 + i * spacing;

    // Left side at x = -10
    const leftBld = buildingProto.clone();
    leftBld.position.set(-10, 0, zPos);
    leftBld.scale.set(2, 2, 2);
    scene.add(leftBld);
    buildings.push(leftBld);

    // Right side at x = +10
    const rightBld = buildingProto.clone();
    rightBld.position.set(10, 0, zPos);
    rightBld.scale.set(2, 2, 2);
    scene.add(rightBld);
    buildings.push(rightBld);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  if (gameOver && e.key === 'r') {
    // Restart by reloading
    location.reload();
    return;
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = true;
  }
}

function onKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = false;
  }
}

function movePlayer(delta) {
  // Only two lanes: playerLane = 0 (left) or 1 (right)
  if (keys.ArrowLeft && playerLane > 0) {
    playerLane = 0;
  } else if (keys.ArrowRight && playerLane < 1) {
    playerLane = 1;
  }

  // Smoothly interpolate camera.x toward laneX[playerLane]
  const targetX = laneX[playerLane];
  const dx = targetX - camera.position.x;
  camera.position.x += dx * (delta * 5);
}

function spawnCar() {
  if (!carProto) return;
  // Choose random lane (0 or 1)
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = 80; // far ahead

  const car = carProto.clone();
  car.position.set(x, 0, z);
  car.scale.set(1.5, 1.5, 1.5);
  scene.add(car);
  cars.push({ mesh: car, lane: laneIndex });
}

function spawnCoin() {
  if (!coinProto) return;
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = 80;

  const coin = coinProto.clone();
  coin.position.set(x, 1.5, z);
  coin.scale.set(1, 1, 1);
  scene.add(coin);
  coins.push({ mesh: coin, lane: laneIndex });
}

function animate(timeMs) {
  if (gameOver) return;
  const time = timeMs * 0.001; // seconds
  const delta = lastTime ? time - lastTime : 0;
  lastTime = time;

  // 1) Move player (camera) left/right
  movePlayer(delta);

  // 2) Spawn cars/coins at intervals
  if (time - lastSpawnTime > spawnInterval) {
    spawnCar();
    spawnCoin();
    lastSpawnTime = time;
  }

  // 3) Move cars toward camera
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    c.mesh.position.z -= carSpeed * delta;

    // Remove if past camera
    if (c.mesh.position.z < -10) {
      scene.remove(c.mesh);
      cars.splice(i, 1);
      continue;
    }

    // Collision: if car is within z<5 and same lane
    if (c.mesh.position.z < 5 && Math.abs(camera.position.x - c.mesh.position.x) < 1) {
      endGame();
      return;
    }
  }

  // 4) Move coins and collect
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.mesh.position.z -= carSpeed * coinSpeedMultiplier * delta;

    // Remove if past camera
    if (c.mesh.position.z < -5) {
      scene.remove(c.mesh);
      coins.splice(i, 1);
      continue;
    }

    // Collect if within range
    if (c.mesh.position.z < 5 && Math.abs(camera.position.x - c.mesh.position.x) < 1) {
      scene.remove(c.mesh);
      coins.splice(i, 1);
      score += 1;
      document.getElementById('score').innerText = `Score: ${score}`;
    }
  }

  // 5) Render
  renderer.render(scene, camera);

  // 6) Next frame
  requestAnimationFrame(animate);
}

function endGame() {
  gameOver = true;
  document.getElementById('gameOver').style.display = 'block';
}

function main() {
  initScene();
  loadModels();
}

main();

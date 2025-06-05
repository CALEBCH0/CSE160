// main.js
// “City runner” scene using Building1.glb, Car.glb, Base.glb, Coin.glb.
// Camera at eye level (y=1.6), cars larger (scale=carSize).
// Buildings face the road. 
// Press X to toggle Debug/Creative mode (FirstPersonControls).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

let scene, camera, renderer;
let loader, loadManager;
let buildingProto, carProto, baseProto, coinProto;

let cars = [], coins = [], buildings = [];
let playerLane = 0;            // 0 = left lane, 1 = right lane
const laneX = [ -2, 2 ];       // x positions for the two lanes
let score = 0;
let gameOver = false;
let lastSpawnTime = 0;
let lastTime = 0;

let carSize = 5;               // scale factor for cars
let buildingSize = 5;          // scale factor for buildings

// Debug mode flag and controls
let debugMode = false;
let fpControls;

// arrow‐key state
const keys = { ArrowLeft: false, ArrowRight: false };

// timing settings
const spawnInterval = 1.5;      // seconds between car/coin spawns
const carSpeed = 20;            // units/sec that cars move toward camera
const coinSpeedMultiplier = 0.8; // coins move at 0.8 * carSpeed

function initScene() {
  // 1) Renderer + Canvas
  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 2) Camera at eye level (y=1.6) and z=10
  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  camera.position.set(0, 1.6, 10);
  camera.lookAt(0, 0, 0);

  // 3) Scene
  scene = new THREE.Scene();

  // ─── SKYBOX VIA SINGLE EQUIRECTANGULAR IMAGE ───
  const loaderSky = new THREE.TextureLoader();
  const skyTex = loaderSky.load('../resources/nightsky2.jpg');
  skyTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = skyTex;
  // ───────────────────────────────────────────────

  // 4) Lights
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(0.5, 1, 0.3);
  scene.add(dirLight);

  const ambLight = new THREE.AmbientLight(0x404040, 0.7);
  scene.add(ambLight);

  // 5) FirstPersonControls (initially disabled)
  fpControls = new FirstPersonControls(camera, renderer.domElement);
  fpControls.movementSpeed = 10;
  fpControls.lookSpeed = 0.1;
  fpControls.enabled = false;

  // 6) Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function loadModels() {
  // Use a LoadingManager so we only start the game after all 4 models load
  loadManager = new THREE.LoadingManager(startGame);
  loader = new GLTFLoader(loadManager);

  // 1) Building1.glb
  loader.load(
    '../resources/Building1.glb',
    (gltf) => { buildingProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Building1.glb:', err)
  );

  // 2) Car.glb
  loader.load(
    '../resources/Car.glb',
    (gltf) => { carProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Car.glb:', err)
  );

  // 3) Base.glb (the road)
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
  // Called once all four GLTF models finish loading
  initRoadAndBuildings();
  lastSpawnTime = performance.now() * 0.001; // in seconds
  requestAnimationFrame(animate);
}

function initRoadAndBuildings() {
  // 1) Add Base (road) at ground level, scaled up
  const base = baseProto.clone();
  base.position.set(0, 0, 0);
  base.scale.set(5, 1, 100);
  scene.add(base);

  // 2) Place rows of buildings on either side, rotated to face the road.
  //    We want rows at z = 10, 0, -10, -20, -30, ... with no gaps.

  const spacing = 10;        // gap between consecutive rows (in Z)
  const numRows = 10;        // total number of rows to generate
  const startZ = 10;         // topmost row at z = 10
  const roadToBuildingDist = 10; // horizontal distance from road center to building

  for (let i = 0; i < numRows; i++) {
    const zPos = startZ - i * spacing;
    // i=0 → zPos=10, i=1 → 0, i=2 → -10, etc.

    // Left side at x = –roadToBuildingDist; rotate so front faces +X
    const leftBld = buildingProto.clone();
    leftBld.position.set(-roadToBuildingDist, 0, zPos);
    leftBld.scale.set(buildingSize, buildingSize, buildingSize);
    leftBld.rotation.y = Math.PI / 2; // face +X
    scene.add(leftBld);
    buildings.push(leftBld);

    // Right side at x = +roadToBuildingDist; rotate so front faces –X
    const rightBld = buildingProto.clone();
    rightBld.position.set(roadToBuildingDist, 0, zPos);
    rightBld.scale.set(buildingSize, buildingSize, buildingSize);
    rightBld.rotation.y = -Math.PI / 2; // face –X
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
  if (e.key === 'x' || e.key === 'X') {
    // Toggle Debug Mode
    const wasDebug = debugMode;
    debugMode = !debugMode;

    // Enable/disable FirstPersonControls
    fpControls.enabled = debugMode;

    if (debugMode) {
      console.log('Entered DEBUG MODE (use WASD + mouse to fly around). Press X again to exit.');
    } else {
      console.log('Exited DEBUG MODE, restarting game...');
      // Reload the page to start fresh
      location.reload();
    }
    return;
  }

  if (!debugMode) {
    // Only handle these keys when NOT in debug mode
    if (gameOver && e.key === 'r') {
      location.reload();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key] = true;
    }
  }
}

function onKeyUp(e) {
  if (!debugMode) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key] = false;
    }
  }
}

function movePlayer(delta) {
  // Only in normal mode: lanes 0 (left) or 1 (right)
  if (keys.ArrowLeft && playerLane > 0) {
    playerLane = 0;
  } else if (keys.ArrowRight && playerLane < 1) {
    playerLane = 1;
  }

  // Interpolate camera.x toward laneX[playerLane]
  const targetX = laneX[playerLane];
  const dx = targetX - camera.position.x;
  camera.position.x += dx * (delta * 5);
}

function spawnCar() {
  if (!carProto) return;
  // Choose a random lane (0 or 1)
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = -80; // spawn far in front

  const car = carProto.clone();
  car.position.set(x, 0.5, z);
  car.scale.set(carSize, carSize, carSize);
  scene.add(car);
  cars.push({ mesh: car, lane: laneIndex });
}

function spawnCoin() {
  if (!coinProto) return;
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = -80; // spawn in front

  const coin = coinProto.clone();
  coin.position.set(x, 1.5, z);
  coin.scale.set(1, 1, 1);
  scene.add(coin);
  coins.push({ mesh: coin, lane: laneIndex });
}

function animate(timeMs) {
  const time = timeMs * 0.001;      // seconds
  const delta = lastTime ? time - lastTime : 0;
  lastTime = time;

  if (debugMode) {
    // In debug mode, use FirstPersonControls and skip all game logic
    fpControls.update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    return;
  }

  if (gameOver) return;

  // 1) Move player (camera) left/right along lanes
  movePlayer(delta);

  // 2) Spawn cars/coins every spawnInterval seconds
  if (time - lastSpawnTime > spawnInterval) {
    spawnCar();
    spawnCoin();
    lastSpawnTime = time;
  }

  // 3) Move cars toward camera and check collisions
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    // Cars move from negative z → positive z
    c.mesh.position.z += carSpeed * delta;

    // Remove if it has passed well beyond the camera
    if (c.mesh.position.z > camera.position.z + 10) {
      scene.remove(c.mesh);
      cars.splice(i, 1);
      continue;
    }

    // Collision: if car z > (camera.z - 1) AND same lane (x difference < 1)
    if (
      c.mesh.position.z > camera.position.z - 1 &&
      Math.abs(camera.position.x - c.mesh.position.x) < 1
    ) {
      endGame();
      return;
    }
  }

  // 4) Move coins and check for collection
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.mesh.position.z += carSpeed * coinSpeedMultiplier * delta;

    // Remove if it passes beyond camera
    if (c.mesh.position.z > camera.position.z + 5) {
      scene.remove(c.mesh);
      coins.splice(i, 1);
      continue;
    }

    // Collect if coin z > (camera.z - 1) AND same lane
    if (
      c.mesh.position.z > camera.position.z - 1 &&
      Math.abs(camera.position.x - c.mesh.position.x) < 1
    ) {
      scene.remove(c.mesh);
      coins.splice(i, 1);
      score += 1;
      document.getElementById('score').innerText = `Score: ${score}`;
    }
  }

  // 5) Render the scene
  renderer.render(scene, camera);

  // 6) Schedule next frame
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

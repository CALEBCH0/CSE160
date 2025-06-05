// main.js
// “City runner” with a 400-unit road. Camera fixed at (0, 1.6, 0), looking straight –Z.
// Road and buildings scroll at ROAD_SPEED; cars/obstacles scroll at CAR_SPEED.
// Cars and obstacles preplaced between z = –400 and z = –50; wrap when passing z > 0.
// Pickups (coins, life, boost) spawn dynamically at z = –400.
// Score increases by 10 every second alive, and +100 for each coin collected.
// Press X to toggle Debug/Creative mode (pauses/resumes).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
// import { VertexShader, FragmentShader } from './CloudShaders.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const ROAD_LENGTH = 400;
const ROAD_HALF = ROAD_LENGTH / 2;

const NUM_BUILDING_ROWS = Math.floor(ROAD_LENGTH / 10) + 1; // 41
const BUILDING_SPACING = 10;
const ROAD_TO_BUILDING_DIST = 10;

const MIN_START_Z = -ROAD_LENGTH; // -400
const MAX_START_Z = -50;

const SPAWN_Z = -ROAD_LENGTH; // -400

const NUM_CARS = 10;
const NUM_OBSTACLES = 5;

const NUM_STARS = 20;
const STAR_MIN_HEIGHT = 50;
const STAR_MAX_HEIGHT = 100;
const STAR_SPREAD_X = 100;
const STAR_SPREAD_Z = 20;

const SPAWN_INTERVAL = 1.5;

// Speeds (units/sec)
const BASE_SPEED = 20;
const BOOST_MUL = 2;
const BOOST_DURATION = 5;
// ───────────────────────────────────────────────────────────────────────────────

let scene, camera, renderer;
let loader, loadManager;

// Model prototypes
let buildingProto1, buildingProto2, buildingProto3;
let carProto, baseProto, coinProto, lifeProto, boostProto;

let baseMesh;
let cars = [];         // { mesh, lane }
let obstacles = [];    // { mesh, lane }
let coins = [];        // { mesh, lane, type }
let buildings = [];
let stars = [];

let playerLane = 0;
const laneX = [-2, 2];

let score = 0;
let gameOver = false;
let lastSpawnTime = 0;
let lastTime = 0;

// Accumulate for per-second score
let timeSinceLastScore = 0;

let immunityCount = 0;
let boostActive = false;
let boostEndTime = 0;

let carSize = 5;
let buildingSize = 5;
let starSize = 2;
let moonMesh, cloudMesh, cloudMaterial;

let debugMode = false;
let fpControls;

const keys = { ArrowLeft: false, ArrowRight: false };

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('instructionOverlay');
    const startBtn = document.getElementById('startButton');
  
    startBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      // Once hidden, your existing LoadingManager → startGame() → animate() flow will run.
    });
  });

function initScene() {
  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 500);
  camera.position.set(0, 1.6, -10);
  camera.lookAt(0, 1.6, -20);

  scene = new THREE.Scene();

  const loaderSky = new THREE.TextureLoader();
  const skyTex = loaderSky.load('../resources/nightsky2.jpg');
  skyTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = skyTex;

  // (1) Very dim ambient light (barely fills in the shadows)
    const ambLight = new THREE.AmbientLight(0x404040, 0.2); 
    scene.add(ambLight);

    // (2) Weaker directional “sun” / fill light 
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(0.5, 1, 0.3);
    scene.add(dirLight);

    // (3) PointLight from the moon – stronger so it “pops”
    const pointLight = new THREE.PointLight(0xffffff, 60.0, 500);
    pointLight.position.set(0, 50, -150);
    scene.add(pointLight);

  fpControls = new FirstPersonControls(camera, renderer.domElement);
  fpControls.movementSpeed = 10;
  fpControls.lookSpeed = 0.1;
  fpControls.enabled = false;

  const starGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < NUM_STARS; i++) {
    const star = new THREE.Mesh(starGeo, starMat);
    const x = (Math.random() - 0.5) * STAR_SPREAD_X;
    const y = STAR_MIN_HEIGHT + Math.random() * (STAR_MAX_HEIGHT - STAR_MIN_HEIGHT);
    // const z = -Math.random() * STAR_SPREAD_Z;
    // const z = - (STAR_SPREAD_Z + Math.random() * STAR_SPREAD_Z);
    const z = -ROAD_LENGTH + 100;
    star.position.set(x, y, z);
    star.scale.set(starSize, starSize, starSize);
    scene.add(star);
    stars.push(star);
  }

  // create the moon
  const moonTex = new THREE.TextureLoader().load('../resources/Moon.jpg');
  const moonGeo = new THREE.SphereGeometry(20, 32, 32);
  const moonMat = new THREE.MeshBasicMaterial({ map: moonTex });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(0, 50, -200);
  scene.add(moonMesh);

  // create a “cloud layer” around the moon using our shaders
//   const cloudGeo = new THREE.SphereGeometry(22, 32, 32);
//   cloudMaterial = new THREE.ShaderMaterial({
//     vertexShader: VertexShader,
//     fragmentShader: FragmentShader,
//     uniforms: {
//       uTime: { value: 0 },
//     },
//     transparent: true
//   });
//   cloudMesh = new THREE.Mesh(cloudGeo, cloudMaterial);
//   cloudMesh.position.copy(moonMesh.position);
//   scene.add(cloudMesh);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function loadModels() {
  loadManager = new THREE.LoadingManager(startGame);
  loader = new GLTFLoader(loadManager);

  loader.load('../resources/Building1.glb',
    (gltf) => { buildingProto1 = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Building1.glb:', err)
  );

  loader.load('../resources/Building2.glb',
    (gltf) => { buildingProto2 = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Building2.glb:', err)
  );

  loader.load('../resources/Building3.glb',
    (gltf) => { buildingProto3 = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Building3.glb:', err)
  );

  loader.load('../resources/Car.glb',
    (gltf) => { carProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Car.glb:', err)
  );

  loader.load('../resources/Base.glb',
    (gltf) => { baseProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Base.glb:', err)
  );

  loader.load('../resources/Coin.glb',
    (gltf) => { coinProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Coin.glb:', err)
  );

  loader.load('../resources/Life.glb',
    (gltf) => { lifeProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Life.glb:', err)
  );

  loader.load('../resources/Boost.glb',
    (gltf) => { boostProto = gltf.scene.clone(); },
    undefined,
    (err) => console.error('Error loading Boost.glb:', err)
  );
}

function startGame() {
  initRoadAndBuildings();
  prespawnObjects();
  lastSpawnTime = performance.now() * 0.001;
  requestAnimationFrame(animate);
}

function initRoadAndBuildings() {
  baseMesh = baseProto.clone();
  baseMesh.position.set(0, 0, -ROAD_HALF);
  baseMesh.scale.set(5, 1, ROAD_LENGTH);
  scene.add(baseMesh);

  for (let i = 0; i < NUM_BUILDING_ROWS; i++) {
    const zPos = 0 - i * BUILDING_SPACING;
    const allProtos = [buildingProto1, buildingProto2, buildingProto3];

    const leftProto = allProtos[Math.floor(Math.random() * allProtos.length)];
    const leftBld = leftProto.clone();
    leftBld.position.set(-ROAD_TO_BUILDING_DIST, 0, zPos);
    leftBld.scale.set(buildingSize, buildingSize, buildingSize);
    leftBld.rotation.y = Math.PI / 2;
    scene.add(leftBld);
    buildings.push(leftBld);

    const rightProto = allProtos[Math.floor(Math.random() * allProtos.length)];
    const rightBld = rightProto.clone();
    rightBld.position.set(ROAD_TO_BUILDING_DIST, 0, zPos);
    rightBld.scale.set(buildingSize, buildingSize, buildingSize);
    rightBld.rotation.y = -Math.PI / 2;
    scene.add(rightBld);
    buildings.push(rightBld);
  }
}

function prespawnObjects() {
  // prespawn cars
    for (let i = 0; i < NUM_CARS; i++) {
    const laneIndex = Math.round(Math.random());
    const x = laneX[laneIndex];
    const z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);

    const car = carProto.clone();
    car.position.set(x, 0.5, z);
    car.scale.set(carSize, carSize, carSize);
    scene.add(car);
    cars.push({ mesh: car, lane: laneIndex });
  }

  // prespawn coins
  const NUM_COINS = 10;
  for (let i = 0; i < NUM_COINS; i++) {
    const laneIndex = Math.round(Math.random());
    const x = laneX[laneIndex];
    const z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);

    const coin = coinProto.clone();
    coin.position.set(x, 1.5, z);
    coin.scale.set(1, 1, 1);
    scene.add(coin);
    coins.push({ mesh: coin, lane: laneIndex, type: 'coin' });
}

    // prespawn obstacles
  for (let i = 0; i < NUM_OBSTACLES; i++) {
    const laneIndex = Math.round(Math.random());
    const x = laneX[laneIndex];
    const z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);
  
    let obsMesh;
    if (i % 2 === 0) {
      // even index → cylinder obstacle
      const drumTex = new THREE.TextureLoader().load('../resources/Drum.jpg');
      const cylGeo = new THREE.CylinderGeometry(0.7, 0.7, 2, 16);

      const cylMat = new THREE.MeshPhongMaterial({ map: drumTex });
      obsMesh = new THREE.Mesh(cylGeo, cylMat);
      obsMesh.position.set(x, 1, z);
    } else {
      // odd index → rectangular box obstacle
      const rectGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
      const rockTex = new THREE.TextureLoader().load('../resources/Rock.jpg');
      const rectMat = new THREE.MeshPhongMaterial({ map: rockTex });
      obsMesh = new THREE.Mesh(rectGeo, rectMat);
      obsMesh.position.set(x, 0.5, z);
    }
  
    scene.add(obsMesh);
    obstacles.push({ mesh: obsMesh, lane: laneIndex });
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
    if (e.key === 'x' || e.key === 'X') {
        // flip debugMode and enable controls
        debugMode = !debugMode;
        fpControls.enabled = debugMode;
    
        if (debugMode) {
          // If we're entering debug mode—even if gameOver is true—restart animate()
          lastTime = performance.now() * 0.001;
          requestAnimationFrame(animate);
          console.log('Entered DEBUG MODE. You can now fly around even after Game Over.');
        } else {
          console.log('Exited DEBUG MODE.');
        }
        return;
      }

  if (!debugMode) {
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
  if (keys.ArrowLeft && playerLane > 0) playerLane = 0;
  else if (keys.ArrowRight && playerLane < 1) playerLane = 1;

  const speedMult = boostActive ? 2 : 1;
  const targetX = laneX[playerLane];
  const dx = targetX - camera.position.x;
  camera.position.x += dx * delta * 5 * speedMult;
}

function spawnCoin() {
  if (!coinProto) return;
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = SPAWN_Z;

  const coin = coinProto.clone();
  coin.position.set(x, 1.5, z);
  coin.scale.set(1, 1, 1);
  scene.add(coin);
  coins.push({ mesh: coin, lane: laneIndex, type: 'coin' });
}

function spawnLife() {
  if (!lifeProto) return;
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = SPAWN_Z;

  const life = lifeProto.clone();
  life.position.set(x, 1.5, z);
  life.scale.set(1, 1, 1);
  scene.add(life);
  coins.push({ mesh: life, lane: laneIndex, type: 'life' });
}

function spawnBoost() {
  if (!boostProto) return;
  const laneIndex = Math.round(Math.random());
  const x = laneX[laneIndex];
  const z = SPAWN_Z;

  const boost = boostProto.clone();
  boost.position.set(x, 1.5, z);
  boost.scale.set(1, 1, 1);
  scene.add(boost);
  coins.push({ mesh: boost, lane: laneIndex, type: 'boost' });
}

function animate(timeMs) {
  const time = timeMs * 0.001;
  let delta = lastTime ? time - lastTime : 0;
  lastTime = time;

  // allow Debug mode unconditionally:
  if (debugMode) {
    fpControls.update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    return;
  }

  // rotate the moon itself
  if (moonMesh) {
    moonMesh.rotation.y += delta * 0.05;
  }

  // update our cloud shader’s time uniform
  if (cloudMaterial) {
    cloudMaterial.uniforms.uTime.value = time;
  }

  const GAME_SPEED = boostActive ? BASE_SPEED * BOOST_MUL : BASE_SPEED;

  if (gameOver) return;

  // 1) Increment “alive” score 10 points per second
  timeSinceLastScore += delta;
  if (timeSinceLastScore >= 1) {
    const count = Math.floor(timeSinceLastScore);
    score += 10 * count;
    timeSinceLastScore -= count;
    document.getElementById('score').innerText = `Score: ${score}`;
  }

  // 2) Move player (x only)
  movePlayer(delta);

  // 3) Dynamic spawn (coins/life/boost) at z = –400
  if (time - lastSpawnTime > SPAWN_INTERVAL) {
    const r = Math.random();
    if (r < 0.05) spawnLife();
    else if (r < 0.15) spawnBoost();
    else spawnCoin();
    lastSpawnTime = time;
  }

  // 4) Scroll road forward
  baseMesh.position.z += GAME_SPEED * delta;
  if (baseMesh.position.z > 0) {
    baseMesh.position.z = -ROAD_HALF;
  }

  // 5) Scroll buildings + recycle
  buildings.forEach((bld) => {
    bld.position.z += GAME_SPEED * delta;
    if (bld.position.z > 0) {
      bld.position.z = MIN_START_Z;
    }
  });

  // 6) Move cars + recycle + collision
  cars.forEach((cobj, idx) => {
    const c = cobj.mesh;
    c.position.z += GAME_SPEED * delta;
    if (c.position.z > 0) {
      c.position.z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);
    }
    if (
      c.position.z > -1 &&
      Math.abs(camera.position.x - c.position.x) < 1
    ) {
        console.log(
            `DEBUG: car[${idx}] collided → pos (${c.position.x.toFixed(2)}, ${c.position.y.toFixed(2)}, ${c.position.z.toFixed(2)}), camera at (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`
        );
      if (immunityCount > 0) {
        immunityCount--;
        document.getElementById('lives').innerText = `Lives: ${immunityCount}`;
        c.position.z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);
      } else {
        console.log('Collision with car!');
        endGame();
      }
    }
  });

  // 7) Move obstacles + recycle + collision
obstacles.forEach((oobj, idx) => {
    const o = oobj.mesh;
    o.position.z += GAME_SPEED * delta;
  
    if (o.position.z > 0) {
      // recycle it
      o.position.z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);
    }
  
    // collision test:
    if (
      o.position.z > -1 &&
      Math.abs(camera.position.x - o.position.x) < 1
    ) {
      console.log(
        `DEBUG: obstacle[${idx}] collided → pos (${o.position.x.toFixed(2)}, ${o.position.y.toFixed(2)}, ${o.position.z.toFixed(2)}), camera at (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`
      );
      if (immunityCount > 0) {
        immunityCount--;
        document.getElementById('lives').innerText = `Lives: ${immunityCount}`;
        o.position.z = MIN_START_Z + Math.random() * (MAX_START_Z - MIN_START_Z);
      } else {
        console.log('Collision with obstacle!');
        endGame();
      }
    }
  });

  // 8) Move coins/life/boost + collection
  for (let i = coins.length - 1; i >= 0; i--) {
    const cobj = coins[i];
    const c = cobj.mesh;
    c.position.z += GAME_SPEED * delta;
    if (c.position.z > 0) {
      scene.remove(c);
      coins.splice(i, 1);
      continue;
    }
    if (
      c.position.z > -1 &&
      Math.abs(camera.position.x - c.position.x) < 1
    ) {
      if (cobj.type === 'life') {
        immunityCount++;
        document.getElementById('lives').innerText = `Lives: ${immunityCount}`;
      } else if (cobj.type === 'boost') {
        boostActive = true;
        boostEndTime = time + BOOST_DURATION;
      } else {
        score += 100;  // +100 points per coin
        document.getElementById('score').innerText = `Score: ${score}`;
      }
      scene.remove(c);
      coins.splice(i, 1);
    }
  }

  // 9) Handle boost timeout
  if (boostActive && time > boostEndTime) {
    boostActive = false;
  }

  // 10) Render
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function endGame() {
  gameOver = true;
  document.getElementById('gameOver').style.display = 'block';
}

// function main() {
//   initScene();
//   loadModels();
// }

// main();

document.getElementById('startButton').addEventListener('click', () => {
    // Hide the overlay
    document.getElementById('instructionOverlay').style.display = 'none';
    // initialize lives
    document.getElementById('lives').innerText = `Immunity: ${immunityCount}`;
    // Kick off the Three.js initialization + loading
    initScene();
    loadModels();
  });
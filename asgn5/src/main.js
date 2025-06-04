import * as THREE from 'three';

let scene, camera, renderer, loader, loadManager;
let cubes = [];

function initScene() {
    // Create renderer + attach to <canvas>
    const canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  
    // Create camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight; // use real aspect
    const near = 0.1;
    const far = 5;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
  
    // Create scene
    scene = new THREE.Scene();

    // set texture loader
    loader = new THREE.TextureLoader();
    loadManager = new THREE.LoadingManager();

    // create world
    initLights();
    initWorldObjects();
  
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function resizeRendererToDisplaySize( renderer ) {

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if ( needResize ) {

        renderer.setSize( width, height, false );

    }

    return needResize;

}

function render(time) {
    time *= 0.001; // convert ms → seconds

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    cubes.forEach((cube, index) => {
        const speed = 0.2 + index * 0.1; // Different speed for each cube
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function onWindowResize() {
    // Update camera + renderer when the window size changes
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.x = x;

    return cube;
}

function initLights() {
    // Add a directional light
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-1, 2, 4);
    scene.add(light);
}

function initWorldObjects() {
    // set geometry for cubes
    const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );

    // populate the scene with cubes
    cubes = [
        // makeInstance(geometry, 0x44aa88, 0),
        // makeInstance(geometry, 0x8844aa, -2),
        // makeInstance(geometry, 0xaa8844, 2),
    ]

    
    const materials = [
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-1.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-2.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-3.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-4.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-5.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('../resources/flower-6.jpg')}),
    ];
    
    const loadingElem = document.querySelector( '#loading' );
	const progressBarElem = loadingElem.querySelector( '.progressbar' );

    loadManager.onLoad = () => {
		loadingElem.style.display = 'none';
		const cube = new THREE.Mesh( geometry, materials );
		scene.add( cube );
		cubes.push( cube ); // add to our list of cubes to rotate
	};

    loadManager.onProgress = ( urlOfLastItemLoaded, itemsLoaded, itemsTotal ) => {
		const progress = itemsLoaded / itemsTotal;
		progressBarElem.style.transform = `scaleX(${progress})`;
	};
}

function loadColorTexture(path) {
    const texture = loader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace; // Ensure color space is correct

    return texture;
}

function main() {
    // Initialize the scene
    initScene();
    // Set up the animation loop
    requestAnimationFrame(render);
}



// call main to load
main();

// main.js
var VSHADER_SOURCE = `
    attribute vec4 a_Position; // Vertex position
    uniform mat4 u_ModelMatrix; // Model matrix
    uniform mat4 u_GlobalRotationMatrix; // Global rotation
    uniform mat4 u_ProjectionMatrix; // Projection matrix
    uniform mat4 u_ViewMatrix; // View matrix
    attribute vec2 a_UV; // Texture coordinates
    varying vec2 v_UV; // Varying variable to pass UV coordinates to fragment shader
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotationMatrix * u_ModelMatrix * a_Position; // Apply model matrix to vertex position
        v_UV = a_UV; // Pass UV coordinates to fragment shader
    }
`
var FSHADER_SOURCE = `
    precision mediump float; // Set default precision to medium
    varying vec2 v_UV; // Varying variable to receive UV coordinates from vertex shader
    uniform vec4 u_FragColor; // Fragment color
    uniform sampler2D u_Sampler0; // Texture sampler
    uniform int u_whichTexture; // Texture unit
    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor; // Use fragment color
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV coordinates as color
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV); // Sample texture color
        } else {
            gl_FragColor = vec4(1.0, .2, .2, 1.0); // reddish for error
        }
    }
`

let canvas, gl, camera;
let a_Position, a_UV;
let u_ModelMatrix, 
    u_FragColor,
    u_GlobalRotationMatrix, 
    u_ProjectionMatrix, 
    u_ViewMatrix,
    u_whichTexture,
    u_Sampler0;
let g_cubeColor = [1, 1, 1, 1]; // Default color white
let g_textureNum = -2; // Default texture number
let g_globalAngle = 0.0; // Global rotation angle
let g_meteorY = 50;         // Starting Y position
let g_meteorSpeed = 0.05;   // Falling speed
let meteorFalling = true;

let map = [];
let walls = [];
let visibleWalls = [];
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const SPWAN_POS = [16, 1, 16];
const RENDER_DIST = 1000; // Render distance
const FOV_ANGLE = 60; // Field of view angle
const REACH_DISTANCE = 3; // Distance to reach for block placement/removal

let numTextures = 3;
let skyTexture = null;
let dirtTexture = null;
let meteorTexture = null;

function main() {
    setupWebGL();
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black background
    connectVariablesToGLSL();
    camera = new Camera();
    addActionsForHtmlUI();
    generateBlocks(); // Generate blocks with random heights
    updateVisibleWalls(); // Update visible walls based on camera position
    initTextures(); // Initialize textures 
    console.log("WebGL context initialized");
    document.onkeydown = handleKeydown; // Register keydown event handler
    // document.body.addEventListener('mousemove', () => {
    //     const bg = document.getElementById("bgm");
    //     if (bg) {
    //         bg.volume = 0.3;
    //         bg.play().catch((e) => {
    //             console.warn("Background music blocked:", e);
    //         });
    //     }
    // }, { once: true });
    canvas.addEventListener('mousedown', () => {
        const bg = document.getElementById("bgm");
        if (bg && bg.paused) {
          bg.volume = 0.3;
          bg.play().catch(() => {});
        }
      }, { once: true });
    handleMouse(); // Register mouse event handlers
    tick();
    
}

function tick() {
    if (meteorFalling) meteorFall(); // Update meteor position if falling
    updateVisibleWalls();
    renderScene();
    requestAnimationFrame(tick);
  }
  

function setCubeColor(rgba) {
    g_cubeColor = rgba; // Set cube color
}

function setWhichTexture(num) {
    g_textureNum = num; // Set texture number
}

function generateBlocks(rows = 32, cols = 32, numBlocks = 100, maxHeight = 4) {
    map = Array.from({ length: rows }, () => Array(cols).fill(0));
    walls = [];
  
    // 1️⃣ Add perimeter wall of height 4
    for (let x = 0; x < rows; x++) {
      for (let z of [0, cols - 1]) {
        for (let y = 0; y < 4; y++) {
          let m = new Matrix4().setTranslate(x, y - 1, z).scale(1, 1, 1);
          walls.push({ matrix: m, color: [0.6, 0.4, 0.3, 1.0], texture: 0 });
          map[x][z] = Math.max(map[x][z], 4);
        }
      }
    }
    for (let z = 1; z < cols - 1; z++) {
      for (let x of [0, rows - 1]) {
        for (let y = 0; y < 4; y++) {
          let m = new Matrix4().setTranslate(x, y - 1, z).scale(1, 1, 1);
          walls.push({ matrix: m, color: [0.6, 0.4, 0.3, 1.0], texture: 0 });
          map[x][z] = Math.max(map[x][z], 4);
        }
      }
    }
  
    // 2️⃣ Random blocks inside
    for (let i = 0; i < numBlocks; i++) {
      let x = Math.floor(Math.random() * (rows - 2)) + 1;  // avoid edges
      let z = Math.floor(Math.random() * (cols - 2)) + 1;

      if (x === SPWAN_POS[0] && z === SPWAN_POS[2]) {
        i--; // try again
        continue;
      }

      let height = Math.floor(Math.random() * maxHeight) + 1;
  
      map[x][z] = height;
  
      for (let y = 0; y < height; y++) {
        let m = new Matrix4().setTranslate(x, y - 1, z).scale(1, 1, 1);
        walls.push({ matrix: m, color: [0.6, 0.4, 0.3, 1.0], texture: 0 });
      }
    }
}

function getFOVDotCutoff(fovDegrees, paddingDegrees = 20) {
    const verticalFOV = (fovDegrees + paddingDegrees) * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV / 2) * aspect);
    return Math.cos(horizontalFOV / 2);
  }

function updateVisibleWalls() {
    const [camX, camY, camZ] = camera.eye.elements;
    visibleWalls = [];
  
    const viewDir = new Vector3().set(camera.at).sub(camera.eye).normalize().elements;
  
    // Compute the **canvas aspect ratio**
    const aspectRatio = canvas.width / canvas.height;

    const padding = 30; // degrees
  
    // Convert vertical FOV (in degrees) to radians and calculate horizontal FOV
    const verticalFOV = camera.fov * Math.PI / 180;
    const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV / 2) * aspectRatio);
  
    // Add optional padding for preloading off-screen cubes
    const paddedHFOV = horizontalFOV + (padding * Math.PI / 180); // pad 20 degrees in radians
    const fovDotCutoff = getFOVDotCutoff(camera.fov, padding);
  
    const maxDistSq = RENDER_DIST * RENDER_DIST;
  
    for (let w of walls) {
      const m = w.matrix.elements;
      const cubeX = m[12];
      const cubeY = m[13];
      const cubeZ = m[14];
  
      const dx = cubeX - camX;
      const dy = cubeY - camY;
      const dz = cubeZ - camZ;
      const distSq = dx * dx + dy * dy + dz * dz;
  
      if (distSq > maxDistSq) continue;
  
      const blockDir = new Vector3([dx, dy, dz]).normalize().elements;
      const dot = viewDir[0] * blockDir[0] +
                  viewDir[1] * blockDir[1] +
                  viewDir[2] * blockDir[2];
  
      if (dot > fovDotCutoff) {
        visibleWalls.push(w);
      }
    }
  }

function renderScene() {
    // Start time for performance measurement
    var startTime = performance.now(); 

    // Update camera matrices
    camera.projectionMatrix.setPerspective(camera.fov, canvas.width / canvas.height, 1, RENDER_DIST);
    camera.updateViewMatrix();

    // Set projection and view matrices
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    
    // Create a new matrix for global rotation
    var globalRotM = new Matrix4().rotate(g_globalAngle, 0, 1, 0); 
    gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, globalRotM.elements); // Set global rotation matrix

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

    // <---------- draw world ----------->

    // 1) Sky
    gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, skyTexture); // Bind sky texture
    gl.uniform1i(u_Sampler0, 0); // Set texture unit to 0
    gl.uniform1i(u_whichTexture, 0); // Set which texture to use
    const skyM = new Matrix4()
    .setTranslate(0, 0, 0)
    .scale(1000, 1000, 1000); // Scale to create a large sky
    drawCubeUV(skyM, null, 0); // Draw sky

    // 2) Ground
    const groundM = new Matrix4()
    .setTranslate(15.5, -0.5, 15.5) // Move down
    .scale(32, 0.1, 32); // Scale to create a large flat surface
    drawCubeUV(groundM, [0.2, 0.8, 0.2, 1.0], -2); // Draw ground with green color

    // 3) Walls
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, dirtTexture);
    gl.uniform1i(u_Sampler0, 1);
    gl.uniform1i(u_whichTexture, 0);

    for (let w of visibleWalls) {
        drawCubeUV(w.matrix, null, 0);
    }

    // 4) Meteor
    drawMeteor(); // Draw meteor if it exists

    // <---------- end of world ----------->

    var duration = performance.now() - startTime;
    const fps = Math.floor(10000 / duration);
    const camPos = `(
        ${camera.eye.elements[0].toFixed(2)}, 
        ${camera.eye.elements[1].toFixed(2)}, 
        ${camera.eye.elements[2].toFixed(2)}
        )`;

    sendTextToHTML(`ms: ${Math.floor(duration)}  fps: ${fps}  cam: ${camPos}`, 'numdot');
}

function meteorFall() {
    if (!meteorFalling) return;

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, meteorTexture);
    gl.uniform1i(u_Sampler0, 2);
    gl.uniform1i(u_whichTexture, 0);
    const meteorM = new Matrix4().setTranslate(16, g_meteorY, 16).scale(2, 2, 2);
    drawCubeUV(meteorM, [0.8, 0.2, 0.2, 1.0], 0);
    g_meteorY -= 0.05;

    if (g_meteorY <= 0.5) {
        g_meteorY = 0.5;
        meteorFalling = false;
        drawMeteor();

        const impact = document.getElementById("meteorSound");
        if (impact) {
            impact.currentTime = 0;
            impact.volume = 1.0;
            impact.play().catch(() => {});
        }

        console.log("Meteor has landed!");
    }
}

  function drawMeteor() {
    if (g_meteorY === null) return;  // not initialized or hidden
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, meteorTexture);
    gl.uniform1i(u_Sampler0, 2);
    gl.uniform1i(u_whichTexture, 0);
    const meteorSize = 5;
    const flameScale = 1.2;
    const meteorM = new Matrix4().setTranslate(16, g_meteorY, 16).scale(meteorSize, meteorSize, meteorSize);
    var flameM = new Matrix4(meteorM).translate(0, flameScale / 2, 0).scale(flameScale, flameScale * 2, flameScale);
    if (!meteorFalling) {
        flameM = new Matrix4(meteorM).translate(0, flameScale / 2, 0).scale(flameScale * 20, flameScale * 20, flameScale * 20);
    }
    drawCubeUV(meteorM, [0.8, 0.2, 0.2, 1.0], 0);
    drawCubeUV(flameM, [1, 0.2, 0.2, 0.4], -2);
  }

function sendTextToHTML(text, htmlID) {
    var htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("HTML element with ID " + htmlID + " not found.");
        return;
    }
    htmlElement.innerHTML = text;
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST); // Enable depth test
    gl.disable(gl.CULL_FACE); // Disable face culling
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    canvas.width = 800;
    canvas.height = 600;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initShaders(gl, vShaderSrc, fShaderSrc) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER); // Create vertex shader object
    gl.shaderSource(vertexShader, vShaderSrc); // Set the source code of the vertex shader
    gl.compileShader(vertexShader); // Compile the vertex shader
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) { // Check for compilation errors
        console.log('Failed to compile vertex shader: ' + gl.getShaderInfoLog(vertexShader));
        return false;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); // Create fragment shader object
    gl.shaderSource(fragmentShader, fShaderSrc); // Set the source code of the fragment shader
    gl.compileShader(fragmentShader); // Compile the fragment shader
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { // Check for compilation errors
        console.log('Failed to compile fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
        return false;
    }

    var program = gl.createProgram(); // Create a program object
    gl.attachShader(program, vertexShader); // Attach vertex shader to program
    gl.attachShader(program, fragmentShader); // Attach fragment shader to program
    gl.linkProgram(program); // Link program
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { // Check for linking errors
        console.log('Failed to link program: ' + gl.getProgramInfoLog(program));
        return false;
    }

    gl.useProgram(program); // Use the program object
    gl.program = program; // Store program object in gl for later use

    return true; // Return true if successful
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    u_GlobalRotationMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotationMatrix');
    if (!u_GlobalRotationMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotationMatrix');
        return;
    }
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0'); // Get the storage location of u_Sampler0
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return false;
    }
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture'); // Get the storage location of u_whichTexture
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return false;
    }

    var identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements); // Set model matrix to identity
}

function addActionsForHtmlUI() {
    document.getElementById('angleSlide').addEventListener('mousemove', function() {
        g_globalAngle = -this.value;
        renderScene();
    });
}

function initTextures() {
    let texturesLoaded = 0;

    function tryRender() {
        texturesLoaded++;
        if (texturesLoaded === numTextures) {
            console.log(numTextures, "textures loaded. Rendering...");
            renderScene();
        }
    }

    loadTexture('../resources/sky.jpg', 0, function(tex) {
        skyTexture = tex;
        tryRender();
    });

    loadTexture('../resources/dirt.jpg', 1, function(tex) {
        dirtTexture = tex;
        tryRender();
    });
    loadTexture('../resources/meteor.jpg', 1, function(tex) {
        meteorTexture = tex;
        tryRender();
    });
}

function sendTextureToTEXTURE0(image) {
    var texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y-axis
    gl.activeTexture(gl.TEXTURE0); // Activate texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture parameters
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Specify the 2D texture image
    gl.uniform1i(u_Sampler0, 0); // Set the texture unit to 0

    renderScene();

    console.log("Texture loaded");
}

function loadTexture(imagePath, textureUnit, onLoadCallback) {
    const texture = gl.createTexture();
    const image = new Image();
    image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        onLoadCallback(texture);
    };
    image.src = imagePath;
}

function handleKeydown(e) {
    switch (e.key) {
        case 'w':
        case 'W':
            camera.moveForward();
            break;
        case 's':
        case 'S':
            camera.moveBackwards();
            break;
        case 'a':
        case 'A':
            camera.moveLeft();
            break;
        case 'd':
        case 'D':
            camera.moveRight();
            break;
        case 'q':
        case 'Q':
            camera.panLeft();
            break;
        case 'e':
        case 'E':
            camera.panRight();
            break;
        case 'm':
        case 'M':
            startMeteorFall();
            break;
    }
    updateVisibleWalls();
    renderScene();
}

function handleMouse() {
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Prevent the context menu from appearing
    });
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            console.log("Mouse events registered", e.button);
            toggleBlock();
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 2) {
            const dx = e.movementX;
            const dy = e.movementY;
            if (dx !== 0) camera.panBy(dx * 0.2);  // horizontal
            if (dy !== 0) camera.tiltBy(-dy * 0.2); // vertical (inverted so drag up = look up)
            updateVisibleWalls();
            renderScene();
        }
    });
}

function toggleBlock() {
    // Direction from eye to at
    const dir = new Vector3().set(camera.at).sub(camera.eye);
    if (dir.magnitude() === 0) return;
    dir.normalize();

    // Project forward by REACH_DISTANCE units
    const target = new Vector3().set(camera.eye).add(dir.mul(REACH_DISTANCE));

    // Round to nearest block grid coordinate
    const x = Math.floor(target.elements[0] + 0.5);
    const y = Math.floor(target.elements[1] + 0.5);
    const z = Math.floor(target.elements[2] + 0.5);

    // Bounds check
    if (
      x < 0 || x >= map.length ||
      z < 0 || z >= map[0].length ||
      y < 0 || y >= 32
    ) return;

    // Find block at target
    const idx = walls.findIndex(w => {
        const m = w.matrix.elements;
        return Math.floor(m[12] + 0.5) === x &&
               Math.floor(m[13] + 0.5) === y &&
               Math.floor(m[14] + 0.5) === z;
    });

    if (idx !== -1) {
        // Block exists → remove
        walls.splice(idx, 1);
        if (map[x][z] > 0) map[x][z]--;
    } else {
        // Block does not exist → add
        const m = new Matrix4().setTranslate(x, y, z).scale(1, 1, 1);
        walls.push({ matrix: m, color: [0.6, 0.4, 0.3, 1.0], texture: 0 });
        if (map[x][z] < y + 1) map[x][z] = y + 1;
    }

    updateVisibleWalls();
    renderScene();
}

function startMeteorFall() {
    g_meteorY = 50; // Reset Y position
    meteorFalling = true; // Start falling
    console.log("Meteor started falling!");
}

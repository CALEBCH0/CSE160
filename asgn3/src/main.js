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
let map = [];
let walls = [];
let visibleWalls = [];

const SPWAN_POS = [16, 1, 16];
const RENDER_DIST = 100; // Render distance
const FOV_ANGLE = 60; // Field of view angle
const FOV_DOT_CUTOFF = Math.cos(FOV_ANGLE * Math.PI / 180 / 2); // precompute cosine of half-FOV


let skyTexture = null;
let dirtTexture = null;

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

function updateVisibleWalls() {
    const [camX, camY, camZ] = camera.eye;
    visibleWalls = [];

    // View direction vector (normalized)
    const camDir = [
        camera.at[0] - camX,
        camera.at[1] - camY,
        camera.at[2] - camZ,
    ];
    const dirLength = Math.hypot(...camDir);
    const viewDir = camDir.map(c => c / dirLength);

    const paddedFOV = FOV_ANGLE + 20; // Pad FOV by 20 degrees
    const fovDotCutoff = Math.cos((paddedFOV * 0.5) * Math.PI / 180); // Use padded FOV

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

        const blockLen = Math.sqrt(distSq);
        const blockDir = [dx / blockLen, dy / blockLen, dz / blockLen];
        const dot = viewDir[0] * blockDir[0] + viewDir[1] * blockDir[1] + viewDir[2] * blockDir[2];

        if (dot > fovDotCutoff) {
            visibleWalls.push(w);
        }
    }
}

function renderScene() {
    // Start time for performance measurement
    var startTime = performance.now(); 

    // Set projection and view matrices
    var projM = new Matrix4().setPerspective(FOV_ANGLE, canvas.width / canvas.height, 1, RENDER_DIST);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projM.elements); // Set projection matrix

    var viewM = new Matrix4().setLookAt(
        camera.eye[0], camera.eye[1], camera.eye[2], 
        camera.at[0], camera.at[1], camera.at[2], 
        camera.up[0], camera.up[1], camera.up[2]); // Set view matrix
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewM.elements); // Set view matrix
    
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
    .scale(100, 100, 100); // Scale to create a large sky
    drawCubeUV(skyM, null, 0); // Draw sky

    // const skyM = new Matrix4()
    // .translate(camera.eye[0], camera.eye[1], camera.eye[2])
    // .scale(100, 100, 100);
    // drawCubeUV(skyM, null, 0);

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

    // <---------- end of world ----------->

    var duration = performance.now() - startTime;
    const fps = Math.floor(10000 / duration);
    const eye = camera.eye.map(v => v.toFixed(2));
    const camPos = `(${eye[0]}, ${eye[1]}, ${eye[2]})`;

    sendTextToHTML(`ms: ${Math.floor(duration)}  fps: ${fps}  cam: ${camPos}`, 'numdot');
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

// function initTextures() {
//     var image = new Image(); // Create an image object
//     if (!image) {
//         console.log('Failed to create the image object');
//         return false;
//     }
//     image.onload = function() { sendTextureToTEXTURE0(image); }; // Register the event handler
//     image.src = '../resources/sky.jpg'; // Set the source of the image
//     image.onerror = function() {
//         console.log('Failed to load the image at ' + image.src);
//     }
//     // add more textures here
//     return true; // Return true if successful
// }

function initTextures() {
    let texturesLoaded = 0;

    function tryRender() {
        texturesLoaded++;
        if (texturesLoaded === 2) {
            console.log("Both textures loaded. Rendering...");
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
    }
    updateVisibleWalls();
    renderScene();
}

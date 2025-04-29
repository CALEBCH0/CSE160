// main.js
var VSHADER_SOURCE = `
    attribute vec4 a_Position; // Vertex position
    uniform mat4 u_ModelMatrix; // Model matrix
    uniform mat4 u_GlobalRotationMatrix; // Global rotation
    void main() {
        gl_Position = u_GlobalRotationMatrix * u_ModelMatrix * a_Position; // Apply model matrix to vertex position
    }
`
var FSHADER_SOURCE = `
    precision mediump float; // Set default precision to medium
    uniform vec4 u_FragColor; // Fragment color
    void main() {
        gl_FragColor = u_FragColor; // Set fragment color
    }
`

let canvas, gl;
let a_Position, u_ModelMatrix, u_FragColor, u_GlobalRotationMatrix;
let g_cubeColor = [1, 1, 1, 1]; // Default color white
let g_globalAngle = 0.0; // Global rotation angle
let g_joint1Angle = 0.0; // Joint 1 rotation angle
let g_headAngle               = 0,
    g_frontRightLegAngle      = 0,
    g_frontRightCalfAngle     = 0,
    g_frontLeftLegAngle       = 0,
    g_frontLeftCalfAngle      = 0,
    g_rearRightLegAngle       = 0,
    g_rearRightCalfAngle      = 0,
    g_rearLeftLegAngle        = 0,
    g_rearLeftCalfAngle       = 0;

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black background
    renderScene();
}

function setCubeColor(rgba) {
    g_cubeColor = rgba; // Set cube color
}

function renderScene() {
    // Start time for performance measurement
    var startTime = performance.now(); 
    
    // Create a new matrix for global rotation
    var globalRotM = new Matrix4().rotate(g_globalAngle, 0, 1, 0); 
    gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, globalRotM.elements); // Set global rotation matrix

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

    // <---------- draw animal ----------->
    // // body
    // const bodyM = new Matrix4().translate(0, 0, 0).scale(0.5, 0.5, 0.5); // Create a model matrix for the body
    // setCubeColor([0.0, 0.0, 1.0, 1.0]); // Set body color to blue
    // drawCube(bodyM); // Draw the body

    // //
    // const joint1M = new Matrix4(bodyM).translate(-0.25, -0.5, 0.0).rotate(-g_joint1Angle, 0, 0, 1).scale(0.5, 1, 0.5); // Create a model matrix for the cube
    // setCubeColor([1.0, 0.0, 0.0, 1.0]); // Set cube color
    // drawCube(joint1M); // Draw the joint 1

    // const joint2M = new Matrix4(joint1M).translate(1, 0, 0).rotate(45, 0, 0, 1).scale(0.5, 0.5, 0.5); // Create a model matrix for the joint 2
    // setCubeColor([0.0, 1.0, 0.0, 1.0]); // Set color to green
    // drawCube(joint2M); // Draw the joint 2

    // 1) Body (centered unit cube scaled into a “shell”)
    const bodyM = new Matrix4()
    .translate(0, 0, 0)
    .scale(0.5, 0.3, 0.7);
    setCubeColor([0.35, 0.7, 0.35, 1.0]); // shell green
    drawCube(bodyM);

    // 2) Head (on top‐front of shell)
    const headM = new Matrix4(bodyM)
    .translate(    0,   0.833,  0.643 )
    .rotate(      g_headAngle, 0,1,0 )
    .scale(      0.2,   0.2,   0.2  );
    setCubeColor([0.8, 0.6, 0.4, 1.0]);    // tan head
    drawCube(headM);

    // 3) Front‐Right Leg: thigh → calf
    const frThighM = new Matrix4(bodyM)
    .translate(  0.6,  -0.833,  0.5   )
    .rotate(     g_frontRightLegAngle, 1,0,0 )
    .scale(     0.1,   0.2,    0.1   );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);     // dark grey
    drawCube(frThighM);

    const frCalfM = new Matrix4(frThighM)
    .translate(  0,   -0.75,   0    )
    .rotate(     g_frontRightCalfAngle, 1,0,0 )
    .scale(     1.0,  0.5,    1.0  );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(frCalfM);

    // 4) Front‐Left Leg
    const flThighM = new Matrix4(bodyM)
    .translate( -0.6,  -0.833,  0.5   )
    .rotate(     g_frontLeftLegAngle, 1,0,0 )
    .scale(     0.1,   0.2,    0.1   );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(flThighM);

    const flCalfM = new Matrix4(flThighM)
    .translate(  0,   -0.75,   0    )
    .rotate(     g_frontLeftCalfAngle, 1,0,0 )
    .scale(     1.0,  0.5,    1.0  );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(flCalfM);

    // 5) Rear‐Right Leg
    const rrThighM = new Matrix4(bodyM)
    .translate(  0.6,  -0.833, -0.5   )
    .rotate(     g_rearRightLegAngle, 1,0,0 )
    .scale(     0.1,   0.2,    0.1   );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(rrThighM);

    const rrCalfM = new Matrix4(rrThighM)
    .translate(  0,   -0.75,   0    )
    .rotate(     g_rearRightCalfAngle, 1,0,0 )
    .scale(     1.0,  0.5,    1.0  );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(rrCalfM);

    // 6) Rear‐Left Leg
    const rlThighM = new Matrix4(bodyM)
    .translate( -0.6,  -0.833, -0.5   )
    .rotate(     g_rearLeftLegAngle, 1,0,0 )
    .scale(     0.1,   0.2,    0.1   );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(rlThighM);

    const rlCalfM = new Matrix4(rlThighM)
    .translate(  0,   -0.75,   0    )
    .rotate(     g_rearLeftCalfAngle, 1,0,0 )
    .scale(     1.0,  0.5,    1.0  );
    setCubeColor([0.2, 0.2, 0.2, 1.0]);
    drawCube(rlCalfM);

    // <---------- end of drawing ----------->

    var duration = performance.now() - startTime; // Calculate duration
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), 'numdot'); // Send duration to HTML
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); // Enable depth test
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

    var identityMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements); // Set model matrix to identity
}

function addActionsForHtmlUI() {
    document.getElementById('angleSlide').addEventListener('mousemove', function() {
        g_globalAngle = this.value;
        renderScene();
    });
    // Head
  document.getElementById('headSlide').addEventListener('input', function(e) {
    g_headAngle = Number(e.target.value);
    renderScene();
  });

  // Front Right Leg
  document.getElementById('frontRightLegSlide').addEventListener('input', function(e) {
    g_frontRightLegAngle = Number(e.target.value);
    renderScene();
  });
  document.getElementById('frontRightCalfSlide').addEventListener('input', function(e) {
    g_frontRightCalfAngle = Number(e.target.value);
    renderScene();
  });

  // Front Left Leg
  document.getElementById('frontLeftLegSlide').addEventListener('input', function(e) {
    g_frontLeftLegAngle = Number(e.target.value);
    renderScene();
  });
  document.getElementById('frontLeftCalfSlide').addEventListener('input', function(e) {
    g_frontLeftCalfAngle = Number(e.target.value);
    renderScene();
  });

  // Rear Right Leg
  document.getElementById('rearRightLegSlide').addEventListener('input', function(e) {
    g_rearRightLegAngle = Number(e.target.value);
    renderScene();
  });
  document.getElementById('rearRightCalfSlide').addEventListener('input', function(e) {
    g_rearRightCalfAngle = Number(e.target.value);
    renderScene();
  });

  // Rear Left Leg
  document.getElementById('rearLeftLegSlide').addEventListener('input', function(e) {
    g_rearLeftLegAngle = Number(e.target.value);
    renderScene();
  });
  document.getElementById('rearLeftCalfSlide').addEventListener('input', function(e) {
    g_rearLeftCalfAngle = Number(e.target.value);
    renderScene();
  });
}

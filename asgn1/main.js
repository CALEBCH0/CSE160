let canvas, gl;
let a_Position, u_FragColor, u_Size;
let glBuffer;

let shapesList = [];
let currentShapeType = 'point';

let g_red = 1.0, g_green = 0.0, g_blue = 0.0;
let g_size = 10;
let g_segments = 20;

let rainbowMode = false;
let spoitMode = false;

window.onload = function() {
  setupWebGL();
  connectVariablesToGLSL();
  setupUI();

  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
};

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function connectVariablesToGLSL() {
  const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
      gl_Position = a_Position;
      gl_PointSize = u_Size;
    }
  `;

  const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
      gl_FragColor = u_FragColor;
    }
  `;

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');

  glBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function initShaders(gl, vshader, fshader) {
  let program = createProgram(gl, vshader, fshader);
  gl.useProgram(program);
  gl.program = program;
  return true;
}

function createProgram(gl, vshader, fshader) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function setupUI() {
  document.getElementById('redSlider').oninput = () => {
    g_red = document.getElementById('redSlider').value / 100;
  };
  document.getElementById('greenSlider').oninput = () => {
    g_green = document.getElementById('greenSlider').value / 100;
  };
  document.getElementById('blueSlider').oninput = () => {
    g_blue = document.getElementById('blueSlider').value / 100;
  };
  document.getElementById('sizeSlider').oninput = () => {
    g_size = document.getElementById('sizeSlider').value;
  };
  document.getElementById('segmentSlider').oninput = () => {
    g_segments = document.getElementById('segmentSlider').value;
  };
  document.getElementById('rainbowToggle').onchange = (e) => {
    rainbowMode = e.target.checked;
  };
}

function handleMouseDown(ev) {
  click(ev);
}

function handleMouseMove(ev) {
  if (ev.buttons === 1) click(ev);
}

function click(ev) {
  const [x, y] = convertCoordinatesEventToGL(ev);
  let color = [g_red, g_green, g_blue];
  if (rainbowMode) color = getRainbowColor();
  if (spoitMode) {
    alert("Spoit picked color: red=" + g_red + ", green=" + g_green + ", blue=" + g_blue);
    spoitMode = false;
    return;
  }
  let shape;

  if (currentShapeType === 'point') {
    shape = new Point(x, y, color, g_size);
  } else if (currentShapeType === 'triangle') {
    shape = new Triangle(x, y, color, g_size);
  } else if (currentShapeType === 'circle') {
    shape = new Circle(x, y, color, g_size, g_segments);
  }

  shapesList.push(shape);
  renderAllShapes();
}

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);  // Ensure buffer is bound before drawing
    for (let shape of shapesList) {
      shape.render();
    }
}

function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  const rect = canvas.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function clearCanvas() {
  shapesList = [];
  requestAnimationFrame(() => renderAllShapes()); // FIX
}

// function drawCustomPicture() {
//     shapesList = [];

//     // Helmet Crest (center red)
//     shapesList.push(new Triangle(0.0, 0.6, [1.0, 0.0, 0.0], 12));
//     shapesList.push(new Triangle(0.0, 0.45, [1.0, 0.0, 0.0], 12));

//     // V-Fin (left & right)
//     shapesList.push(new Triangle(-0.3, 0.5, [1.0, 1.0, 0.0], 18));
//     shapesList.push(new Triangle(0.3, 0.5, [1.0, 1.0, 0.0], 18));

//     // Eyes (greenish)
//     shapesList.push(new Triangle(-0.1, 0.2, [0.5, 1.0, 0.5], 8));
//     shapesList.push(new Triangle(0.1, 0.2, [0.5, 1.0, 0.5], 8));

//     // Faceplate (white area)
//     shapesList.push(new Triangle(0.0, 0.0, [1.0, 1.0, 1.0], 20));
//     shapesList.push(new Triangle(-0.15, -0.1, [1.0, 1.0, 1.0], 20));
//     shapesList.push(new Triangle(0.15, -0.1, [1.0, 1.0, 1.0], 20));

//     // Jaw/Chin (gray)
//     shapesList.push(new Triangle(0.0, -0.3, [0.7, 0.7, 0.7], 12));

//     // Helmet sides (gray-blue)
//     shapesList.push(new Triangle(-0.4, 0.2, [0.5, 0.5, 0.8], 18));
//     shapesList.push(new Triangle(0.4, 0.2, [0.5, 0.5, 0.8], 18));

//     requestAnimationFrame(() => renderAllShapes());
// }

function drawCustomPicture() {
    shapesList = [];

    const offsetY = 0.2; // move everything up by 0.2

    // Main helmet center line
    shapesList.push(new Triangle(0, 0.434375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0, 0.059375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0, -0.300625 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0, -0.610625 + offsetY, [1, 1, 1], 50));

    // Sides and cheek vents
    shapesList.push(new Triangle(0.2125, 0.049375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0.2725, -0.310625 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(-0.2925, 0.009375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(-0.3225, -0.420625 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(-0.1425, -0.305625 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0.1375, -0.245625 + offsetY, [1, 1, 1], 50));

    // Eyes
    shapesList.push(new Triangle(0.0875, 0.129375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(0.0875, 0.134375 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(-0.1725, 0.114375 + offsetY, [1, 1, 1], 50));

    // Chin + vent panels
    shapesList.push(new Triangle(0.2225, -0.615625 + offsetY, [1, 1, 1], 50));
    shapesList.push(new Triangle(-0.2325, -0.650625 + offsetY, [1, 1, 1], 50));

    // V-Fin / Crest (yellow triangles)
    shapesList.push(new Triangle(0.1425, 0.049375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(0.2875, 0.069375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(0.4275, 0.119375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(0.5725, 0.154375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(-0.1525, 0.024375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(-0.2575, 0.044375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(-0.4175, 0.094375 + offsetY, [1, 1, 0], 26));
    shapesList.push(new Triangle(-0.5625, 0.144375 + offsetY, [1, 1, 0], 26));

    // Face slit (mouth)
    shapesList.push(new Triangle(-0.0025, -0.065625 + offsetY, [1, 0, 0], 26));

    // Face panel vents (black triangles)
    shapesList.push(new Triangle(0, -0.650625 + offsetY, [0, 0, 0], 10));
    shapesList.push(new Triangle(0., -0.53625 + offsetY, [0, 0, 0], 10));

    // V-fin center (yellow)
    shapesList.push(new Triangle(-0.1725, -0.355625 + offsetY, [1, 1, 0], 17));
    shapesList.push(new Triangle(0.2125, -0.380625 + offsetY, [1, 1, 0], 17));

    shapesList.push(new Triangle(-0.01, -0.9 + offsetY, [1, 0, 0], 37));  // Red
    shapesList.push(new Triangle(0.0075, -0.345625 + offsetY, [0, 0, 0], 1));    // Black

    renderAllShapes();
}

function getRainbowColor() {
  const hue = Math.random();
  const rgb = HSVtoRGB(hue, 1, 1);
  return [rgb.r, rgb.g, rgb.b];
}

function HSVtoRGB(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return { r, g, b };
}

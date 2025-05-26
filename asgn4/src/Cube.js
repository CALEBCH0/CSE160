// Cube.js
let cubeVertexBuffer = null;
let cubeUVBuffer = null;
let cubeNormalBuffer = null;

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1, 1, 1, 1]; // default color white
    this.matrix = new Matrix4(); // default identity matrix
    this.textureNum = -1; // default texture number
  }

  render() {
    var rgba = this.color;
    // helper to set shaded color
    const setShade = (factor) => {
      gl.uniform4f(u_FragColor, rgba[0]*factor, rgba[1]*factor, rgba[2]*factor, rgba[3]);
    };

    // pass the texture number to the fragment shader
    gl.uniform1i(u_whichTexture, this.textureNum);

    // pass the model matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    setShade(1.0);
    drawCubeFaces();
    // // 1) Front face
    // setShade(1.0);
    // drawTriangle3DUV(
    //   [-0.5,-0.5,-0.5,  0.5,0.5,-0.5,  0.5,-0.5,-0.5],
    //   [0,0, 1,1, 1,0]
    // );
    // drawTriangle3DUV(
    //   [-0.5,-0.5,-0.5, -0.5,0.5,-0.5,  0.5,0.5,-0.5],
    //   [0,0, 0,1, 1,1]
    // );

    // // 2) Top face
    // setShade(0.9);
    // drawTriangle3DUV(
    //   [-0.5,0.5,-0.5, -0.5,0.5, 0.5, 0.5,0.5, 0.5],
    //   [0,0, 0,1, 1,1]
    // );
    // drawTriangle3DUV(
    //   [-0.5,0.5,-0.5, 0.5,0.5, 0.5, 0.5,0.5,-0.5],
    //   [0,0, 1,1, 1,0]
    // );

    // // 3) Right face
    // setShade(0.8);
    // drawTriangle3DUV(
    //   [0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5, 0.5],
    //   [0,0, 0,1, 1,1]
    // );
    // drawTriangle3DUV(
    //   [0.5,-0.5,-0.5, 0.5,0.5, 0.5, 0.5,-0.5, 0.5],
    //   [0,0, 1,1, 1,0]
    // );

    // // 4) Back face
    // setShade(0.7);
    // drawTriangle3DUV(
    //   [0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5],
    //   [1,0, 0,1, 0,0]
    // );
    // drawTriangle3DUV(
    //   [0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5],
    //   [1,0, 1,1, 0,1]
    // );

    // // 5) Left face
    // setShade(0.8);
    // drawTriangle3DUV(
    //   [-0.5,-0.5, 0.5, -0.5,0.5, 0.5, -0.5,0.5,-0.5],
    //   [1,0, 1,1, 0,1]
    // );
    // drawTriangle3DUV(
    //   [-0.5,-0.5, 0.5, -0.5,0.5,-0.5, -0.5,-0.5,-0.5],
    //   [1,0, 0,1, 0,0]
    // );

    // // 6) Bottom face
    // setShade(0.6);
    // drawTriangle3DUV(
    //   [-0.5,-0.5, 0.5,  0.5,-0.5,-0.5, -0.5,-0.5,-0.5],
    //   [0,1, 1,0, 0,0]
    // );
    // drawTriangle3DUV(
    //   [-0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5,-0.5,-0.5],
    //   [0,1, 1,1, 1,0]
    // );
  }
}

function drawCubeUV(M, color, textureNum = -2) {
  if (!color) color = [1.0, 1.0, 1.0, 1.0];
  var cube = new Cube();
  cube.matrix = M;
  cube.color = color;
  cube.textureNum = textureNum;
  cube.render();
}

function drawCubeUVN(vertices, uvs, normals) {
  const n = vertices.length / 3;

  if (!cubeVertexBuffer) cubeVertexBuffer = gl.createBuffer();
  if (!cubeUVBuffer) cubeUVBuffer = gl.createBuffer();
  if (!cubeNormalBuffer) cubeNormalBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
function drawCubeFaces() {
  const vertices = [
    // Front face
    -0.5,-0.5,-0.5,  0.5,0.5,-0.5,  0.5,-0.5,-0.5,
    -0.5,-0.5,-0.5, -0.5,0.5,-0.5,  0.5,0.5,-0.5,
    // Top face
    -0.5,0.5,-0.5, -0.5,0.5, 0.5, 0.5,0.5, 0.5,
    -0.5,0.5,-0.5, 0.5,0.5, 0.5, 0.5,0.5,-0.5,
    // Right face
    0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5, 0.5,
    0.5,-0.5,-0.5, 0.5,0.5, 0.5, 0.5,-0.5, 0.5,
    // Back face
    0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5,
    0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,
    // Left face
    -0.5,-0.5, 0.5, -0.5,0.5, 0.5, -0.5,0.5,-0.5,
    -0.5,-0.5, 0.5, -0.5,0.5,-0.5, -0.5,-0.5,-0.5,
    // Bottom face
    -0.5,-0.5, 0.5,  0.5,-0.5,-0.5, -0.5,-0.5,-0.5,
    -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5,-0.5,-0.5
  ];

  const uvs = [
    0,0, 1,1, 1,0, 0,0, 0,1, 1,1,
    0,0, 0,1, 1,1, 0,0, 1,1, 1,0,
    0,0, 0,1, 1,1, 0,0, 1,1, 1,0,
    1,0, 0,1, 0,0, 1,0, 1,1, 0,1,
    1,0, 1,1, 0,1, 1,0, 0,1, 0,0,
    0,1, 1,0, 0,0, 0,1, 1,1, 1,0
  ];

  const normals = [
    // Front
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    // Top
    0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0,
    // Right
    1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,
    // Back
    0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1,
    // Left
    -1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    // Bottom
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0
  ];

  drawCubeUVN(vertices, uvs, normals);
}
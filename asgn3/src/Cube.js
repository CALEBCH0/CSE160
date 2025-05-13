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
    
    // 1) Front face
    setShade(1.0);
    drawTriangle3DUV(
      [-0.5,-0.5,-0.5,  0.5,0.5,-0.5,  0.5,-0.5,-0.5],
      [0,0, 1,1, 1,0]
    );
    drawTriangle3DUV(
      [-0.5,-0.5,-0.5, -0.5,0.5,-0.5,  0.5,0.5,-0.5],
      [0,0, 0,1, 1,1]
    );

    // 2) Top face
    setShade(0.9);
    drawTriangle3DUV(
      [-0.5,0.5,-0.5, -0.5,0.5, 0.5, 0.5,0.5, 0.5],
      [0,0, 0,1, 1,1]
    );
    drawTriangle3DUV(
      [-0.5,0.5,-0.5, 0.5,0.5, 0.5, 0.5,0.5,-0.5],
      [0,0, 1,1, 1,0]
    );

    // 3) Right face
    setShade(0.8);
    drawTriangle3DUV(
      [0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5, 0.5],
      [0,0, 0,1, 1,1]
    );
    drawTriangle3DUV(
      [0.5,-0.5,-0.5, 0.5,0.5, 0.5, 0.5,-0.5, 0.5],
      [0,0, 1,1, 1,0]
    );

    // 4) Back face
    setShade(0.7);
    drawTriangle3DUV(
      [0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5],
      [1,0, 0,1, 0,0]
    );
    drawTriangle3DUV(
      [0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5],
      [1,0, 1,1, 0,1]
    );

    // 5) Left face
    setShade(0.8);
    drawTriangle3DUV(
      [-0.5,-0.5, 0.5, -0.5,0.5, 0.5, -0.5,0.5,-0.5],
      [1,0, 1,1, 0,1]
    );
    drawTriangle3DUV(
      [-0.5,-0.5, 0.5, -0.5,0.5,-0.5, -0.5,-0.5,-0.5],
      [1,0, 0,1, 0,0]
    );

    // 6) Bottom face
    setShade(0.6);
    drawTriangle3DUV(
      [-0.5,-0.5, 0.5,  0.5,-0.5,-0.5, -0.5,-0.5,-0.5],
      [0,1, 1,0, 0,0]
    );
    drawTriangle3DUV(
      [-0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5,-0.5,-0.5],
      [0,1, 1,1, 1,0]
    );
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

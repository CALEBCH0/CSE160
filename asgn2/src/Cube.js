class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1, 1, 1, 1]; // default color white
        this.matrix = new Matrix4(); // default identity matrix
    }

    render() {
        var rgba = this.color;
        // helper to set shaded color
    const setShade = (factor) => {
        gl.uniform4f(u_FragColor, rgba[0]*factor, rgba[1]*factor, rgba[2]*factor, rgba[3]);
      };
  
      // upload model → GPU
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // 1) Front face (brightest)
      setShade(1.0);
      drawTriangle3DUV( [ 0,0,0,   1,1,0,   1,0,0 ], [ 1,0, 0,1,  1,1 ]);
    //   drawTriangle3D([ 0,0,0,   1,1,0,   1,0,0 ]);
      drawTriangle3D([ 0,0,0,   0,1,0,   1,1,0 ]);
  
      // 2) Top face
      setShade(0.9);
      drawTriangle3D([ 0,1,0,   0,1,1,   1,1,1 ]);
      drawTriangle3D([ 0,1,0,   1,1,1,   1,1,0 ]);
  
      // 3) Right face
      setShade(0.8);
      drawTriangle3D([ 1,0,0,   1,1,0,   1,1,1 ]);
      drawTriangle3D([ 1,0,0,   1,1,1,   1,0,1 ]);
  
      // 4) Back face
      setShade(0.7);
      drawTriangle3D([ 1,0,1,   0,1,1,   0,0,1 ]);
      drawTriangle3D([ 1,0,1,   1,1,1,   0,1,1 ]);
  
      // 5) Left face
      setShade(0.8);
      drawTriangle3D([ 0,0,1,   0,1,1,   0,1,0 ]);
      drawTriangle3D([ 0,0,1,   0,1,0,   0,0,0 ]);
  
      // 6) Bottom face (darkest)
      setShade(0.6);
      drawTriangle3D([ 0,0,1,   1,0,0,   0,0,0 ]);
      drawTriangle3D([ 0,0,1,   1,0,1,   1,0,0 ]);
    }
}

function drawCube(M) {
    // send the model matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements); // Set model matrix

    // use a single base color for the cube
    const rgba = g_cubeColor;

    // help to shade 
    const setShade = factor => {
        gl.uniform4f(u_FragColor,
          rgba[0]*factor,
          rgba[1]*factor,
          rgba[2]*factor,
          rgba[3]
        );
    };

    // // 1) front (z=0)
    // setShade(1.0);
    // drawTriangle3D([ 0,0,0,   1,1,0,   1,0,0 ]);
    // drawTriangle3D([ 0,0,0,   0,1,0,   1,1,0 ]);

    // // 2) top (y=1)
    // setShade(0.9);
    // drawTriangle3D([ 0,1,0,   0,1,1,   1,1,1 ]);
    // drawTriangle3D([ 0,1,0,   1,1,1,   1,1,0 ]);

    // // 3) right (x=1)
    // setShade(0.8);
    // drawTriangle3D([ 1,0,0,   1,1,0,   1,1,1 ]);
    // drawTriangle3D([ 1,0,0,   1,1,1,   1,0,1 ]);

    // // 4) back (z=1)
    // setShade(0.7);
    // drawTriangle3D([ 1,0,1,   0,1,1,   0,0,1 ]);
    // drawTriangle3D([ 1,0,1,   1,1,1,   0,1,1 ]);

    // // 5) left (x=0)
    // setShade(0.8);
    // drawTriangle3D([ 0,0,1,   0,1,1,   0,1,0 ]);
    // drawTriangle3D([ 0,0,1,   0,1,0,   0,0,0 ]);

    // // 6) bottom (y=0)
    // setShade(0.6);
    // drawTriangle3D([ 0,0,1,   1,0,0,   0,0,0 ]);
    // drawTriangle3D([ 0,0,1,   1,0,1,   1,0,0 ]);
    // 1) Front face (z = –0.5)
    setShade(1.0);
    drawTriangle3D([
    -0.5, -0.5, -0.5,
    0.5,  0.5, -0.5,
    0.5, -0.5, -0.5
    ]);
    drawTriangle3D([
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
    0.5,  0.5, -0.5
    ]);

    // 2) Top face (y = +0.5)
    setShade(0.9);
    drawTriangle3D([
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
    0.5,  0.5,  0.5
    ]);
    drawTriangle3D([
    -0.5,  0.5, -0.5,
    0.5,  0.5,  0.5,
    0.5,  0.5, -0.5
    ]);

    // 3) Right face (x = +0.5)
    setShade(0.8);
    drawTriangle3D([
    0.5, -0.5, -0.5,
    0.5,  0.5, -0.5,
    0.5,  0.5,  0.5
    ]);
    drawTriangle3D([
    0.5, -0.5, -0.5,
    0.5,  0.5,  0.5,
    0.5, -0.5,  0.5
    ]);

    // 4) Back face (z = +0.5)
    setShade(0.7);
    drawTriangle3D([
    0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5
    ]);
    drawTriangle3D([
    0.5, -0.5,  0.5,
    0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5
    ]);

    // 5) Left face (x = –0.5)
    setShade(0.8);
    drawTriangle3D([
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5
    ]);
    drawTriangle3D([
    -0.5, -0.5,  0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5
    ]);

    // 6) Bottom face (y = –0.5)
    setShade(0.6);
    drawTriangle3D([
    -0.5, -0.5,  0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5
    ]);
    drawTriangle3D([
    -0.5, -0.5,  0.5,
    0.5, -0.5,  0.5,
    0.5, -0.5, -0.5
    ]);
    }
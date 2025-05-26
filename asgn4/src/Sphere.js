// Sphere.js
class Sphere {
  constructor(radius = 0.5, widthSegments = 12, heightSegments = 8) {
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.uvBuffer = null;
    this.normalBuffer = null;

    this.vertices = null;
    this.indices = null;
    this.uvs = null;
    this.normals = null;

    this.position = new Vector3([0, 0, 0]);
    this.rotation = new Vector3([0, 0, 0]);
    this.scale = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    this.generateSphere(radius, widthSegments, heightSegments);
  }

  generateSphere(radius, widthSegments, heightSegments) {
    let index = 0;
    const grid = [];

    const vertex = new Vector3();
    const normal = new Vector3();

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let j = 0; j <= heightSegments; j++) {
      const row = [];
      const v = j / heightSegments;

      for (let i = 0; i <= widthSegments; i++) {
        const u = i / widthSegments;

        vertex.elements[0] = -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
        vertex.elements[1] = radius * Math.cos(v * Math.PI);
        vertex.elements[2] = radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
        vertices.push(...vertex.elements);

        normal.set(vertex).normalize();
        normals.push(...normal.elements);

        uvs.push(u, 1 - v);

        row.push(index++);
      }
      grid.push(row);
    }

    for (let j = 0; j < heightSegments; j++) {
      for (let i = 0; i < widthSegments; i++) {
        const a = grid[j][i + 1];
        const b = grid[j][i];
        const c = grid[j + 1][i];
        const d = grid[j + 1][i + 1];
        if (j !== 0) indices.push(a, b, d);
        if (j !== heightSegments - 1) indices.push(b, c, d);
      }
    }

    this.vertices = new Float32Array(vertices);
    this.indices = new Uint16Array(indices);
    this.uvs = new Float32Array(uvs);
    this.normals = new Float32Array(normals);
  }

  calculateMatrix() {
    const [x, y, z] = this.position.elements;
    const [rx, ry, rz] = this.rotation.elements;
    const [sx, sy, sz] = this.scale.elements;

    this.modelMatrix
      .setTranslate(x, y, z)
      .rotate(rx, 1, 0, 0)
      .rotate(ry, 0, 1, 0)
      .rotate(rz, 0, 0, 1)
      .scale(sx, sy, sz);

    this.normalMatrix.set(this.modelMatrix).invert().transpose();
  }

  render(gl, camera) {
    if (!this.vertexBuffer) this.vertexBuffer = gl.createBuffer();
    if (!this.indexBuffer) this.indexBuffer = gl.createBuffer();
    if (!this.uvBuffer) this.uvBuffer = gl.createBuffer();
    if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();

    this.calculateMatrix();
    camera.updateViewMatrix();

    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    const a_UV = gl.getAttribLocation(gl.program, "a_UV");
    const a_Normal = gl.getAttribLocation(gl.program, "a_Normal");

    const u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    const u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    const u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    const u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

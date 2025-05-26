// Model.js
class Model {
    constructor(filePath) {
      this.filePath = filePath;
      this.color = [1, 0, 0.5, 1];
      this.matrix = new Matrix4().rotate(240, 0, 1, 0);
      this.vertexBuffer = null;
      this.normalBuffer = null;
      this.modelData = null;
  
      this.loader = new OBJLoader(this.filePath);
      this.loader.parseModel().then(() => {
        this.modelData = this.loader.getModelData();
      });
    }
  
    render() {
      if (!this.modelData || !this.loader.isFullyLoaded) return;
  
      if (!this.vertexBuffer) {
        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
      }
  
      // vertices
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.modelData.vertices),
        gl.STATIC_DRAW
      );
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      // normals
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.modelData.normals),
        gl.STATIC_DRAW
      );
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Normal);
  
      // set uniforms
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      gl.uniform4fv(u_FragColor, this.color);
  
      let normalMatrix = new Matrix4().setInverseOf(this.matrix).transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
      gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
    }
}
  
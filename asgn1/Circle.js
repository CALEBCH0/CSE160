class Circle {
    constructor(x, y, color, size, segments) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.segments = segments;
    }
  
    render() {
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
  
      let angleStep = 360 / this.segments;
      let radius = this.size / 200; // convert to clip space
  
      let vertices = [];
      for (let i = 0; i <= this.segments; i++) {
        let angle = angleStep * i * Math.PI / 180;
        let x = this.x + radius * Math.cos(angle);
        let y = this.y + radius * Math.sin(angle);
        vertices.push(x, y);
      }
  
      // Fan from center
      let vertexData = [];
      for (let i = 0; i < this.segments; i++) {
        vertexData.push(this.x, this.y);
        vertexData.push(vertices[i * 2], vertices[i * 2 + 1]);
        vertexData.push(vertices[(i + 1) * 2], vertices[(i + 1) * 2 + 1]);
      }
  
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 2);
    }
  }
  
class Point {
    constructor(x, y, color, size) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
    }
  
    render() {
      // Set color
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
  
      // Set size
      gl.uniform1f(u_Size, this.size);
  
      // Set position
      let xy = new Float32Array([this.x, this.y]);
      gl.bufferData(gl.ARRAY_BUFFER, xy, gl.DYNAMIC_DRAW);
  
      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);
    }
  }
  
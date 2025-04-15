class Triangle {
    constructor(x, y, color, pixelSize) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = pixelSize;
    }
  
    render() {
      console.log("Rendering triangle at", this.x, this.y, "color:", this.color, "size:", this.size);
  
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], 1.0);
      gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
  
      const half = this.size / 200;
  
      const vertices = new Float32Array([
        this.x, this.y + half,
        this.x - half, this.y - half,
        this.x + half, this.y - half,
      ]);
  
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  
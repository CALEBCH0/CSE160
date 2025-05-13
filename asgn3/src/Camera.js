class Camera {
    constructor() {
      this.eye = SPWAN_POS;
      this.at = [SPWAN_POS[0], SPWAN_POS[1], SPWAN_POS[2] - 2];
      this.up = [0, 1, 0];
      this.speed = 0.25;
      this.angleStep = 3; // degrees
      this.fov = FOV_ANGLE;

      this.viewMatrix = new Matrix4();
      this.viewMatrix.setLookAt(
        this.eye[0], this.eye[1], this.eye[2],
        this.at[0], this.at[1], this.at[2],
        this.up[0], this.up[1], this.up[2]
      );

      this.projectionMatrix = new Matrix4();
      this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, RENDER_DIST);
    }

    updateViewMatrix() {
      this.viewMatrix.setLookAt(
        this.eye[0], this.eye[1], this.eye[2],
        this.at[0], this.at[1], this.at[2],
        this.up[0], this.up[1], this.up[2]
      );
    }
  
    getDirection() {
      return [
        this.at[0] - this.eye[0],
        this.at[1] - this.eye[1],
        this.at[2] - this.eye[2],
      ];
    }
  
    normalize(v) {
      const len = Math.hypot(...v);
      return v.map(val => val / len);
    }
  
    moveForward() {
      const d = this.normalize(this.getDirection());
      for (let i = 0; i < 3; i++) {
        this.eye[i] += d[i] * this.speed;
        this.at[i] += d[i] * this.speed;
      }
    }
  
    moveBackwards() {
      const d = this.normalize(this.getDirection());
      for (let i = 0; i < 3; i++) {
        this.eye[i] -= d[i] * this.speed;
        this.at[i] -= d[i] * this.speed;
      }
    }
  
    moveRight() {
      const d = this.normalize(this.getDirection());
      const left = [
        -d[2], // cross product of direction and up: right = [dz, 0, -dx]
        0,
        d[0]
      ];
      const len = Math.hypot(...left);
      for (let i = 0; i < 3; i++) {
        const step = (left[i] / len) * this.speed;
        this.eye[i] += step;
        this.at[i] += step;
      }
    }
  
    moveLeft() {
      const d = this.normalize(this.getDirection());
      const right = [
        d[2], // reversed cross product of direction and up
        0,
        -d[0]
      ];
      const len = Math.hypot(...right);
      for (let i = 0; i < 3; i++) {
        const step = (right[i] / len) * this.speed;
        this.eye[i] += step;
        this.at[i] += step;
      }
    }
  
    panRight() {
      const d = this.getDirection();
      const r = Math.hypot(d[0], d[2]);
      let theta = Math.atan2(d[2], d[0]); // Z as Y (XZ plane)
      theta += this.angleStep * Math.PI / 180; // rotate CCW
  
      const newDir = [
        Math.cos(theta) * r,
        0,
        Math.sin(theta) * r
      ];
      for (let i = 0; i < 3; i++) {
        this.at[i] = this.eye[i] + newDir[i];
      }
    }
  
    panLeft() {
      const d = this.getDirection();
      const r = Math.hypot(d[0], d[2]);
      let theta = Math.atan2(d[2], d[0]);
      theta -= this.angleStep * Math.PI / 180; // rotate CW
  
      const newDir = [
        Math.cos(theta) * r,
        0,
        Math.sin(theta) * r
      ];
      for (let i = 0; i < 3; i++) {
        this.at[i] = this.eye[i] + newDir[i];
      }
    }
  }
  
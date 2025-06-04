// class Camera {
//   constructor() {
//     this.fov = FOV_ANGLE;

//     this.eye = new Vector3(SPAWN_POS);
//     this.at  = new Vector3([SPAWN_POS[0], SPAWN_POS[1], SPAWN_POS[2] - 2]);
//     this.up  = new Vector3([0, 1, 0]);

//     this.viewMatrix = new Matrix4().setLookAt(
//       ...this.eye.elements,
//       ...this.at.elements,
//       ...this.up.elements
//     );

//     this.projectionMatrix = new Matrix4().setPerspective(
//       this.fov,
//       canvas.width / canvas.height,
//       0.1,
//       RENDER_DIST
//     );

//     this.speed = 0.25;
//     this.angleStep = 3; // degrees
//     this.pitch = 0;
//   }

//   updateViewMatrix() {
//     this.viewMatrix.setLookAt(
//       ...this.eye.elements,
//       ...this.at.elements,
//       ...this.up.elements
//     );
//   }

//   moveForward() {
//     const f = new Vector3().set(this.at);
//     f.sub(this.eye).normalize().mul(this.speed);
//     this.eye.add(f);
//     this.at.add(f);
//     this.updateViewMatrix();
//   }

//   moveBackwards() {
//     const f = new Vector3().set(this.eye);
//     f.sub(this.at).normalize().mul(this.speed);
//     this.eye.add(f);
//     this.at.add(f);
//     this.updateViewMatrix();
//   }

//   moveLeft() {
//     const f = new Vector3().set(this.at).sub(this.eye).normalize();
//     const s = Vector3.cross(this.up, f).normalize().mul(this.speed);
//     this.eye.add(s);
//     this.at.add(s);
//     this.updateViewMatrix();
//   }

//   moveRight() {
//     const f = new Vector3().set(this.at).sub(this.eye).normalize();
//     const s = Vector3.cross(f, this.up).normalize().mul(this.speed);
//     this.eye.add(s);
//     this.at.add(s);
//     this.updateViewMatrix();
//   }

//   panLeft() {
//     const f = new Vector3().set(this.at).sub(this.eye);
//     const rot = new Matrix4().setRotate(this.angleStep, ...this.up.elements);
//     const f_prime = rot.multiplyVector3(f);
//     this.at = new Vector3().set(this.eye).add(f_prime);
//     this.updateViewMatrix();
//   }

//   panRight() {
//     const f = new Vector3().set(this.at).sub(this.eye);
//     const rot = new Matrix4().setRotate(-this.angleStep, ...this.up.elements);
//     const f_prime = rot.multiplyVector3(f);
//     this.at = new Vector3().set(this.eye).add(f_prime);
//     this.updateViewMatrix();
//   }

//   panBy(degrees) {
//     const f = new Vector3().set(this.at).sub(this.eye);
//     const rot = new Matrix4().setRotate(-degrees, ...this.up.elements);
//     const f_prime = rot.multiplyVector3(f);
//     this.at = new Vector3().set(this.eye).add(f_prime);
//     this.updateViewMatrix();
//   }

//   tiltBy(angle) {
//     const newPitch = this.pitch + angle;
//     if (newPitch > 89) angle = 89 - this.pitch;
//     if (newPitch < -89) angle = -89 - this.pitch;
//     this.pitch += angle;

//     const f = new Vector3().set(this.at).sub(this.eye);  // get forward direction
//     const right = Vector3.cross(f, this.up).normalize(); // right vector

//     const rot = new Matrix4().setRotate(angle, ...right.elements); // rotate around right
//     const f_prime = rot.multiplyVector3(f);
//     this.at = new Vector3().set(this.eye).add(f_prime);
//     this.updateViewMatrix();
//   }
// }

class Camera {
  constructor() {
    this.fov = FOV_ANGLE;

    this.eye = new Vector3(SPAWN_POS);
    this.at  = new Vector3([SPAWN_POS[0], SPAWN_POS[1], SPAWN_POS[2] - 2]);
    this.up  = new Vector3([0, 1, 0]);
    this.radius = 0.3;

    this.viewMatrix = new Matrix4().setLookAt(
      ...this.eye.elements,
      ...this.at.elements,
      ...this.up.elements
    );

    this.projectionMatrix = new Matrix4().setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      RENDER_DIST
    );

    this.speed = 0.25;
    this.angleStep = 3; // degrees
    this.pitch = 0;
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      ...this.eye.elements,
      ...this.at.elements,
      ...this.up.elements
    );
  }

  isBlocked(pos) {
    const r = this.radius;
    const px = pos.elements[0];
    const py = pos.elements[1];
    const pz = pos.elements[2];
  
    const minY = Math.floor(py);
    const maxY = Math.floor(py + 0.9); // check height range (if you want to support tall blocks later)
  
    for (let y = minY; y <= maxY; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bx = Math.floor(px) + dx;
          const bz = Math.floor(pz) + dz;
  
          if (bx < 0 || bx >= map.length || bz < 0 || bz >= map[0].length || y < 0 || y >= 32) continue;
          if (map[bx][bz] <= y) continue;
  
          const cx = bx + 0.5;
          const cy = y + 0.5;
          const cz = bz + 0.5;
  
          // AABB check using clamping
          const clampedX = Math.max(cx - 0.5, Math.min(px, cx + 0.5));
          const clampedY = Math.max(cy - 0.5, Math.min(py, cy + 0.5));
          const clampedZ = Math.max(cz - 0.5, Math.min(pz, cz + 0.5));
  
          const distSq = (px - clampedX) ** 2 + (py - clampedY) ** 2 + (pz - clampedZ) ** 2;
          if (distSq < r * r) return true;
        }
      }
    }
  
    return false;
  }  

  tryMove(dir) {
    const newEye = new Vector3().set(this.eye).add(dir);
    if (!this.isBlocked(newEye)) {
      this.eye = newEye;
      this.at.add(dir);
      this.updateViewMatrix();
    }
  }

  moveForward() {
    const f = new Vector3().set(this.at).sub(this.eye).normalize().mul(this.speed);
    this.tryMove(f);
  }

  moveBackwards() {
    const f = new Vector3().set(this.eye).sub(this.at).normalize().mul(this.speed);
    this.tryMove(f);
  }

  moveLeft() {
    const f = new Vector3().set(this.at).sub(this.eye).normalize();
    const s = Vector3.cross(this.up, f).normalize().mul(this.speed);
    this.tryMove(s);
  }

  moveRight() {
    const f = new Vector3().set(this.at).sub(this.eye).normalize();
    const s = Vector3.cross(f, this.up).normalize().mul(this.speed);
    this.tryMove(s);
  }

  panLeft() {
    const f = new Vector3().set(this.at).sub(this.eye);
    const rot = new Matrix4().setRotate(this.angleStep, ...this.up.elements);
    const f_prime = rot.multiplyVector3(f);
    this.at = new Vector3().set(this.eye).add(f_prime);
    this.updateViewMatrix();
  }

  panRight() {
    const f = new Vector3().set(this.at).sub(this.eye);
    const rot = new Matrix4().setRotate(-this.angleStep, ...this.up.elements);
    const f_prime = rot.multiplyVector3(f);
    this.at = new Vector3().set(this.eye).add(f_prime);
    this.updateViewMatrix();
  }

  panBy(degrees) {
    const f = new Vector3().set(this.at).sub(this.eye);
    const rot = new Matrix4().setRotate(-degrees, ...this.up.elements);
    const f_prime = rot.multiplyVector3(f);
    this.at = new Vector3().set(this.eye).add(f_prime);
    this.updateViewMatrix();
  }

  tiltBy(angle) {
    const newPitch = this.pitch + angle;
    if (newPitch > 89) angle = 89 - this.pitch;
    if (newPitch < -89) angle = -89 - this.pitch;
    this.pitch += angle;

    const f = new Vector3().set(this.at).sub(this.eye);
    const right = Vector3.cross(f, this.up).normalize();
    const rot = new Matrix4().setRotate(angle, ...right.elements);
    const f_prime = rot.multiplyVector3(f);
    this.at = new Vector3().set(this.eye).add(f_prime);
    this.updateViewMatrix();
  }
}

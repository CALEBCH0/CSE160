class Camera {
  constructor() {
    this.fov = FOV_ANGLE;

    this.eye = new Vector3(SPWAN_POS);
    this.at  = new Vector3([SPWAN_POS[0], SPWAN_POS[1], SPWAN_POS[2] - 2]);
    this.up  = new Vector3([0, 1, 0]);

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

  moveForward() {
    const f = new Vector3().set(this.at);
    f.sub(this.eye).normalize().mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateViewMatrix();
  }

  moveBackwards() {
    const f = new Vector3().set(this.eye);
    f.sub(this.at).normalize().mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateViewMatrix();
  }

  moveLeft() {
    const f = new Vector3().set(this.at).sub(this.eye).normalize();
    const s = Vector3.cross(this.up, f).normalize().mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
  }

  moveRight() {
    const f = new Vector3().set(this.at).sub(this.eye).normalize();
    const s = Vector3.cross(f, this.up).normalize().mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateViewMatrix();
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

    const f = new Vector3().set(this.at).sub(this.eye);  // get forward direction
    const right = Vector3.cross(f, this.up).normalize(); // right vector

    const rot = new Matrix4().setRotate(angle, ...right.elements); // rotate around right
    const f_prime = rot.multiplyVector3(f);
    this.at = new Vector3().set(this.eye).add(f_prime);
    this.updateViewMatrix();
  }
}

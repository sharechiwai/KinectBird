const EASING = 0.1;
const ONE_MINUS_EASING = 1.0 - EASING;
const SCALING = 0.2;

export const DEAD = 'DEAD';
export const PREPARING = 'PREPARING';
export const PLAYING = 'PLAYING';

export class Player {
  constructor (data, position, size) {
    this.halfSize = size / 2.0;
    this.id = data.bodyId;
    this.velocity = { x: 0.0, y: 0.0 };
    this.lastDataPosition = { x: data.joint.position.x, y: data.joint.position.y };
    this.lastDiff = { x: 0.0, y: 0.0 };
    this.position = _.clone(position);
    this.updateDataWith(data, 0.0);

    this.state = PREPARING;
    this.age = 0;
  }

  updateDataWith(data) {
    let point = data.joint.position,
        dx = SCALING * (point.x - this.lastDataPosition.x),
        dy = Math.max(SCALING * (point.y - this.lastDataPosition.y), 0.0);
    this.lastDiff.x = ONE_MINUS_EASING * this.lastDiff.x + EASING * dx;
    this.lastDiff.y = ONE_MINUS_EASING * this.lastDiff.y + EASING * dy;

    this.lastDataPosition.x = point.x;
    this.lastDataPosition.y = point.y;
    this.age = 0;
  }


  stepTime(gravity) {
    this.age += 1;
    this.velocity.x += this.lastDiff.x;
    this.velocity.y += this.lastDiff.y - gravity;

    if (this.velocity.y > 0.0) {
      this.velocity.y = ONE_MINUS_EASING * this.velocity.y;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

const EASING = 0.1;
const ONE_MINUS_EASING = 1.0 - EASING;

export const DEAD = 0;
export const PREPARING = 1;
export const PLAYING = 2;

export class Player {
  constructor (data, position) {
    this.halfSize = 5.0;
    this.id = data.bodyId;
    this.velocity = { x: 0.0, y: 0.0 };
    this.lastDataPosition = _.clone(data.point);
    this.lastDiff = { x: 0.0, y: 0.0 };
    this.position = _.clone(position);
    this.updateDataWith(data, 0.0);

    this.state = PREPARING;
  }

  updateDataWith(data, gravity) {
    let dx = data.point.x - this.lastDataPosition.x,
        dy = Math.max(data.point.y - this.lastDataPosition.y, 0.0);
    this.lastDiff.x = ONE_MINUS_EASING * this.lastDiff.x + EASING * dx;
    this.lastDiff.y = ONE_MINUS_EASING * this.lastDiff.y + EASING * dy;

    this.velocity.x += this.lastDiff.x;
    this.velocity.y += this.lastDiff.y - gravity;

    if (this.velocity.y > 0.0) {
      this.velocity.y = ONE_MINUS_EASING * this.velocity.y;
    }

    this.lastDataPosition.x = data.point.x;
    this.lastDataPosition.y = data.point.y;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

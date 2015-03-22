const EASING = 0.1;
const ONE_MINUS_EASING = 1.0 - EASING;
const SCALING = 0.2;

export const DEAD = 'DEAD';
export const PREPARING = 'PREPARING';
export const PLAYING = 'PLAYING';

export class Player {
  constructor (data, position, size, color) {
    this.halfSize = size / 2.0;
    this.id = data.bodyId;
    this.velocityY = 0.0;
    this.lastDiffY = 0.0;
    this.lastDataPositionY = data.joint.position.y;
    this.position = _.clone(position);
    this.updateDataWith(data, 0.0);
    this.color = color;

    this.state = PREPARING;
    this.age = 0;
  }

  updateDataWith(data) {
    let point = data.joint.position,
        dy = Math.max(SCALING * (point.y - this.lastDataPositionY), 0.0);

    this.lastDiffY = ONE_MINUS_EASING * this.lastDiffY + EASING * dy;
    this.lastDataPositionY = point.y;

    this.age = 0;
  }


  stepTime(gravity) {
    this.age += 1;
    this.velocityY += this.lastDiffY - gravity;

    if (this.velocityY > 0.0) {
      this.velocityY = ONE_MINUS_EASING * this.velocityY;
    }

    this.position.y += this.velocityY;
  }
}

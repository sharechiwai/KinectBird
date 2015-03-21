export class Box {
  constructor(position, width, height) {
    this.position = position;
    this.halfHeight = height / 2.0;
    this.halfWidth = width / 2.0;
  }

  didCollideWith(player) {
    return (Math.abs(player.position.x - this.position.x) < this.halfWidth + player.halfSize) &&
      (Math.abs(player.position.y - this.position.y) < this.halfHeight + player.halfSize);
  }
}

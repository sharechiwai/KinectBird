import { DEAD, PREPARING, PLAYING } from './player.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }


  render(gameState) {
    var context = this.context;

    context.save();
    this.clear();

    context.scale(this.canvas.width, -this.canvas.height);
    context.translate(0.5, -0.5);
    this.renderBoxes(gameState.boxes);
    this.renderPlayers(gameState.players);
    context.restore();
  }


  clear() {
    let context = this.context;

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = '#B3FFFF';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }


  renderBoxes(boxes) {
    var context = this.context;

    _.forEach(boxes, function (box) {
      context.fillStyle = '#333333';
      context.fillRect(
        box.position.x - box.halfWidth,
        box.position.y - box.halfHeight,
        box.halfWidth * 2,
        box.halfHeight * 2
      );
    });
  }


  renderPlayers(players) {
    var context = this.context;

    _.forEach(players, function (player) {
      switch (player.state) {
        case DEAD:
          return;

        case PREPARING:
          context.fillStyle = '#333388';
          break;

        case PLAYING:
          context.fillStyle = '#FF8888';
          break;

        default:
          throw 'Invalid state!';
      }

      context.fillRect(
        player.position.x - player.halfSize,
        player.position.y - player.halfSize,
        2.0 * player.halfSize,
        2.0 * player.halfSize
      );
    });
  }
}

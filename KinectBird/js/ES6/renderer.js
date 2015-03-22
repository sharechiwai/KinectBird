import { DEAD, PREPARING, PLAYING } from './player.js';

const BACKGROUND_COLOR = '#555555';
const PIPE_COLOR = '#333333';
const COLORS = [
  [255, 255, 255],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [255, 0, 255],
  [0, 255, 255]
];

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
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }


  renderBoxes(boxes) {
    var context = this.context;

    _.forEach(boxes, function (box) {
      context.fillStyle = PIPE_COLOR;
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
      let color = COLORS[player.color];
      console.log(player.color);

      switch (player.state) {
        case DEAD:
          return;

        case PREPARING:
          context.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.5)';
          break;

        case PLAYING:
          context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
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

import { DEAD, CHECKING, READY, PLAYING } from './player.js';

const FOREGROUND_COLOR = '#FFFFFF';
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

const INTERFACE_TEXT_SCALING = 0.03;
const INTERFACE_FONT = '1px Tahoma, Verdana, Segoe, sans-serif';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }


  render(gameState) {
    var context = this.context;

    context.save();
    this.clear();

    context.font = INTERFACE_FONT;
    context.scale(this.canvas.width, -this.canvas.height);
    context.translate(0.5, -0.5);
    this.renderBoxes(gameState.boxes);
    this.renderPlayers(gameState.players);
    this.renderInterface();
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

      switch (player.state) {
        case DEAD:
          break;

        case CHECKING:
          context.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',0.5)';
          break;

        case PLAYING:
        case READY:
          context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
          break;

        default:
          throw 'Invalid state!';
      }

      if (player.state !== DEAD) {
        context.fillRect(
          player.position.x - player.halfSize,
          player.position.y - player.halfSize,
          2.0 * player.halfSize,
          2.0 * player.halfSize
        );

        if (player.overheadText) {
          context.save();
          context.translate(player.position.x, player.position.y);
          context.scale(0.1, -0.1);
          let width = context.measureText(player.overheadText).width;
          context.fillText(player.overheadText, -width / 2.0, -0.7);
          context.restore();
        }
      }

      context.save();
      context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
      context.translate(player.position.x, -0.4);

      context.save();
      context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
      let width = context.measureText(player.highScore).width;
      context.fillText(player.highScore, -width / 2.0, 0.0);
      context.restore();

      context.translate(0.0, -0.05);
      context.save();
      context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
      width = context.measureText(player.currentScore).width;
      context.fillText(player.currentScore, -width / 2.0, 0.0);
      context.restore();
      context.restore();
    });
  }


  renderInterface() {
    let context = this.context;
    context.fillStyle = FOREGROUND_COLOR;

    context.save();
    context.translate(-0.45, -0.4);

    context.save();
    context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
    let width = context.measureText('High Score').width;
    context.fillText('High Score', 0.0, 0.0);
    context.restore();

    context.translate(0.0, -0.05);
    context.save();
    context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
    width = context.measureText('Score').width;
    context.fillText('Score', 0.0, 0.0);
    context.restore();
    context.restore();
  }
}

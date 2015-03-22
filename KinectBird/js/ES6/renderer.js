import { DEAD, CHECKING, READY, PLAYING } from './player.js';
import { KinectBodyRenderer } from './kinect-body-renderer.js';

const FOREGROUND_COLOR = '#FFFFFF';
const BACKGROUND_COLOR = '#111111';
const PIPE_COLOR = 'rgb(170, 168, 57)';
const COLORS = [
  [45, 136, 45],
  [57, 50, 118],
  [170, 145, 57],
  [170, 57, 57],
  [85, 43, 114],
  [38, 114, 87],
  [170, 94, 57]
];

const INTERFACE_TEXT_SCALING = 0.03;
const INTERFACE_FONT = '1px Tahoma, Verdana, Segoe, sans-serif';

export class Renderer {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    if (options.kinect) {
      this.kinectBodyRenderer = new KinectBodyRenderer(this.context, options.kinect);
    }
  }


  render(gameState) {
    var context = this.context;

    context.save();
    this.clear();

    context.font = INTERFACE_FONT;
    context.translate(0.5 * this.canvas.width, 0.575 * this.canvas.height);
    context.scale(this.canvas.width, -0.85*this.canvas.height);
    this.renderStars(gameState.stars);
    this.renderBoxes(gameState.boxes);
    this.renderPlayers(gameState.players);
    this.renderInterface(gameState);
    context.restore();

    if (this.kinectBodyRenderer) {
      context.save();
      context.scale(1.0, 0.15);
      context.rect(0, 0, this.canvas.width, this.canvas.height);
      context.clip();
      this.kinectBodyRenderer.clear(this.canvas.width, this.canvas.height);
      this.kinectBodyRenderer.renderBodiesFromPlayers(gameState.players);
      context.restore();
    }
  }


  clear() {
    let context = this.context;

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }


  renderStars(stars) {
    var context = this.context;

    context.fillStyle = '#FFFFFF';
    _.forEach(stars, function (star) {
      context.beginPath();
      context.arc(star.x, star.y, 0.3 * star.speed, 0, 2*Math.PI);
      context.fill();
    });
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

    _.forEach(players, function (player, index) {
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
      context.translate(player.position.x, -0.45);
      context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
      let width = context.measureText(player.currentScore).width;
      context.fillText(player.currentScore, -width / 2.0, 0.0);
      context.restore();

      context.save();
      context.fillStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
      context.translate(-0.48, 0.45 - (index + 2) * 0.05);
      context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
      let text = player.name + ': ' + player.highScore;
      context.fillText(text, 0.0, 0.0);
      context.restore();
    });
  }


  renderInterface(gameState) {
    let context = this.context;
    context.fillStyle = FOREGROUND_COLOR;

    context.save();
    context.translate(-0.45, -0.45);
    context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
    context.fillText('Score', 0.0, 0.0);
    context.restore();

    context.save();
    context.fillStyle = '#FFFFFF';
    context.translate(-0.48, 0.47);

    context.save();
    context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
    if (gameState.highestScore.name) {
      context.fillText('Champion: ' + gameState.highestScore.score + ' [' + gameState.highestScore.name + ']', 0.0, 0.0);
    } else {
      context.fillText('Champion: [to be claimed]', 0.0, 0.0);
    }
    context.restore();

    context.translate(0.0, -0.07);
    context.scale(INTERFACE_TEXT_SCALING, -INTERFACE_TEXT_SCALING);
    context.fillText('High Scores', 0.0, 0.0);
    context.restore();
  }
}

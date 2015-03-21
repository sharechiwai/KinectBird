import { DEAD, PREPARING, PLAYING, Player  } from './player.js';
import { Renderer } from './renderer.js';
import { Box } from './box.js';

export class Game {
  constructor(canvas, width, height) {
    this.state = {
      tick: 0,
      timeToNextBlock: 50,
      width: width,
      height: height,
      gravity: width * 0.0004,
      players: [],
      boxes: []
    };

    this.players = {};
    this.renderer = new Renderer(canvas);
  }


  init() {
  }


  update(frameData) {
    this.updatePlayers(frameData);
    this.updateState();

    this.renderScene();
  }


  updatePlayers(frameData) {
    let self = this;

    _.forEach(frameData, function (data) {
      if (data.bodyId === 0 || !data.active) {
        return;
      }

      let player = self.players[data.bodyId];

      if (!player) {
        player = self.createPlayer(data);
      }

      if (player.state === PREPARING || player.state === PLAYING) {
        player.updateDataWith(data, self.state.gravity);
      }
    });
  }


  createPlayer(data) {
    let player = new Player(data, {
      x: this.state.width / 2.0,
      y: this.state.height / 2.0
    });
    this.prepareGameFor(player);

    this.state.players.push(player);
    this.players[player.id] = player;

    return player;
  }


  updateState() {
    var self = this;
    let state = self.state;
    state.tick = state.tick + 1;

    if (this.shouldMakeANewObstacle()) {
      this.generateNewObstacle();
    }

    let toRemoveList = [];
    for (let i = 0; i < state.boxes.length; i++) {
      let box = state.boxes[i];
      box.position.x = box.position.x - state.width * 0.004;

      if (box.position.x + box.halfWidth < 0) {
        toRemoveList.push(i);
      }
    }

    let toRemove = toRemoveList.pop();
    while (toRemove) {
      state.boxes.splice(toRemove, 1);
      toRemove = toRemoveList.pop();
    }

    _.forEach(state.players, function (player) {
      if (player.state !== DEAD && (player.position.y < player.halfSize || player.position.y > self.state.height - player.halfSize)) {
        self.killPlayer(player);
        return;
      }

      if (player.state === PLAYING) {
        _.any(state.boxes, function (box) {
          if (box.didCollideWith(player)) {
            self.killPlayer(player);
            return true;
          }

          return false;
        });
      }
    });
  }


  killPlayer(player) {
    var self = this;

    player.state = DEAD;
    setTimeout(function () {
      self.prepareGameFor(player);
    }, 3000);
  }


  prepareGameFor(player) {
    player.state = PREPARING;
    player.position.x = this.state.width / 2.0;
    player.position.y = this.state.height / 2.0;
    player.velocity.x = 0.0;
    player.velocity.y = 0.0;

    setTimeout(function () {
      player.state = PLAYING;
    }, 3000);
  }


  shouldMakeANewObstacle() {
    return this.state.tick % this.state.timeToNextBlock === 0;
  }


  generateNewObstacle() {
    var state = this.state;

    state.tick = 0;
    state.timeToNextBlock = Math.round(20 * Math.random() + 90);

    let height = state.height * (0.4 * Math.random() + 0.3),
        width = state.width / 15,
        position = {
          x: state.width + width,
          y: height/2
        };

    if (Math.random() > 0.5) {
      position.y = state.height - position.y;
    }
    state.boxes.push(new Box(position, width, height));
  }


  renderScene() {
    this.renderer.render(this.state);
  }
}

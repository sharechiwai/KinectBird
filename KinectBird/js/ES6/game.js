import { DEAD, PREPARING, PLAYING, Player  } from './player.js';
import { Renderer } from './renderer.js';
import { Box } from './box.js';

export class Game {
  constructor(canvas) {
    this.state = {
      tick: 0,
      timeToNextBlock: 50,
      gravity: 0.0004,
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
      x: 0.0,
      y: 0.0
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
      if (box.position.x + box.halfWidth < -0.5) {
        toRemoveList.push(i);
      }

      box.position.x = box.position.x - 10.0 * state.gravity;
    }

    let toRemove = toRemoveList.pop();
    while (toRemove) {
      state.boxes.splice(toRemove - 1, 1);
      toRemove = toRemoveList.pop();
    }

    _.forEach(state.players, function (player) {
      if (player.state !== DEAD && (player.position.y < player.halfSize - 0.5 || player.position.y > 0.5 - player.halfSize)) {
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
    player.position.x = 0.0;
    player.position.y = 0.0;
    player.velocity.x = 0.0;
    player.velocity.y = 0.0;

    setTimeout(function () {
      if (player.state !== DEAD) {
        player.state = PLAYING;
      }
    }, 3000);
  }


  shouldMakeANewObstacle() {
    return this.state.tick % this.state.timeToNextBlock === 0;
  }


  generateNewObstacle() {
    var state = this.state;

    state.tick = 0;
    state.timeToNextBlock = Math.round(20 * Math.random() + 90);

    let height = 0.4 * Math.random() + 0.3,
        width = 1.0 / 15.0,
        position = {
          x: 0.5 + width,
          y: height/2 - 0.5
        };

    if (Math.random() > 0.5) {
      position.y = -position.y;
    }
    state.boxes.push(new Box(position, width, height));
  }


  renderScene() {
    this.renderer.render(this.state);
  }
}

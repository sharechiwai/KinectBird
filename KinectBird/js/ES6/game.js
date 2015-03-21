import { Player, DEAD, INACTIVE, PREPARING, PLAYING  } from './player.js';
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


  init(frameData) {
    let self = this;

    _.forEach(frameData, function (data) {
      let player = new Player(data, {
        x: self.state.width / 2.0,
        y: self.state.height / 2.0
      });
      if (data.active) {
        self.prepareGameFor(player);
      } else {
        player.state = INACTIVE;
      }

      self.state.players.push(player);
      self.players[player.id] = player;
    });
  }


  update(frameData) {
    this.updatePlayers(frameData);
    this.updateState();

    this.renderScene();
  }


  updatePlayers(frameData) {
    let self = this;

    _.forEach(frameData, function (data) {
      let player = self.players[data.bodyId];

      if (data.active && player.state === INACTIVE) {
        self.prepareGameFor(player);
      }

      if (player.state === PREPARING || player.state === PLAYING) {
        player.updateDataWith(data, self.state.gravity);
      }
    });
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
      box.position.x = box.position.x - 1.0;

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
    }, 5000);
  }


  prepareGameFor(player) {
    player.state = PREPARING;
    player.position.x = this.state.width / 2.0;
    player.position.y = this.state.height / 2.0;

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

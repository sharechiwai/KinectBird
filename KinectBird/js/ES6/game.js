import { DEAD, PREPARING, PLAYING, Player  } from './player.js';
import { Renderer } from './renderer.js';
import { Box } from './box.js';

const SPEED = 0.005;
const GRAVITY = 0.0003;
const PIPE_WIDTH = 1.0 / 15.0;
const MAX_HOLE_SIZE = 0.5;
const MIN_HOLE_SIZE = 0.35
const TIME_TO_NEXT_PIPE = 90;

export class Game {
  constructor(canvas) {
    this.state = {
      tick: 0,
      timeToNextBlock: 50,
      gravity: GRAVITY,
      speed: SPEED,
      players: [],
      boxes: []
    };

    this.players = {};
    this.renderer = new Renderer(canvas);

    this.availableSlots = [-0.3, 0.3, -0.2, 0.2, -0.1, 0.1, 0.0];
    this.availableColors = [0, 1, 2, 3, 4, 5, 6];
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
        player.updateDataWith(data);
      }
    });

    var i = self.state.players.length;
    while (i--) {
      let player = self.state.players[i];

      if (player.state === PREPARING || player.state === PLAYING) {
        player.stepTime(self.state.gravity);

        if (player.age > 10) {
          self.removePlayer(player);
        }
      }
    }
  }


  createPlayer(data) {
    let position = this.availableSlots.pop(),
        player = new Player(data, {
          x: position,
          y: 0.0
        }, 0.05, this.availableColors.pop());
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

      box.position.x = box.position.x - state.speed;
    }

    let toRemove = toRemoveList.pop();
    while (toRemove) {
      state.boxes.splice(toRemove - 1, 1);
      toRemove = toRemoveList.pop();
    }

    _.forEach(state.players, function (player) {
      if (player.state !== DEAD && (player.position.y < player.halfSize - 0.5 ||
            player.position.y > 0.5 - player.halfSize ||
            player.position.x < player.halfSize - 0.5 ||
            player.position.x > 0.5 - player.halfSize)) {
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


  removePlayer(player) {
    this.state.players.splice(this.state.players.indexOf(player), 1);
    delete this.players[player.id];

    this.availableSlots.push(player.position.x);
    this.availableColors.push(player.color);
  }


  prepareGameFor(player) {
    player.state = PREPARING;
    player.position.y = 0.0;
    player.velocityY = 0.0;
    player.lastDiffY = 0.0;

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
    state.timeToNextBlock = Math.round(TIME_TO_NEXT_PIPE * Math.random() / 3.3 + TIME_TO_NEXT_PIPE);

    let size = (MAX_HOLE_SIZE - MIN_HOLE_SIZE) * Math.random() + MIN_HOLE_SIZE,
        pos = {
          x: 0.5 + PIPE_WIDTH,
          y: (1.0 - size) * Math.random() + size/2.0
        },
        heights = [
          Math.max(1.0 - size/2.0 - pos.y, 0.0),
          pos.y - size/2.0
        ];

    state.boxes.push(
      new Box({ x: pos.x, y: pos.y - 0.5 + size/2.0 + heights[0]/2.0 }, PIPE_WIDTH, heights[0])
    );
    state.boxes.push(
      new Box({ x: pos.x, y: pos.y - 0.5 - size/2.0 - heights[1]/2.0 }, PIPE_WIDTH, heights[1])
    );
  }


  renderScene() {
    this.renderer.render(this.state);
  }
}

import { DEAD, CHECKING, READY, PLAYING, Player  } from './player.js';
import { Renderer } from './renderer.js';
import { AudioEngine, JUMP, DEATH } from './audio-engine.js';
import { Box } from './box.js';

const SPEED = 0.005;
const GRAVITY = 0.00035;
const PIPE_WIDTH = 1.0 / 15.0;
const MAX_HOLE_SIZE = 0.5;
const MIN_HOLE_SIZE = 0.35;
const TICKS_TO_NEXT_PIPE = 90;
const TIME_TO_WAIT_FOR_PLAYER_TO_BE_READY = 5000;
const SECONDS_TO_START = 3;
const SECONDS_TO_REST = 2;
const SECONDS_TO_RESPAWN = 3;
const TICKS_TO_EXPIRE_PLAYER = 60;

export class Game {
  constructor(canvas, options) {
    options = options || {};
    this.state = {
      tick: 0,
      timeToNextBlock: 50,
      gravity: GRAVITY,
      speed: SPEED,
      players: [],
      boxes: [],
      stars: []
    };

    this.players = {};
    this.renderer = new Renderer(canvas, {
      kinect: options.kinect
    });
    this.audioEngine = new AudioEngine();

    this.availableSlots = [-0.3, 0.3, -0.2, 0.2, -0.1, 0.1, 0.0];
    this.availableColors = [0, 1, 2, 3, 4, 5, 6];

    this.state.stars = [];

    for (let i = 0; i < 20; i++) {
      this.state.stars.push({
        x: Math.random() - 0.5,
        y: Math.random() - 0.5,
        speed: (0.4 + i * 0.05) * this.state.speed
      });
    }

    this.events = {};
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

      if (player.state !== DEAD) {
        player.updateDataWith(data);
      }
    });

    var i = self.state.players.length;
    while (i--) {
      let player = self.state.players[i];

      if (player.state !== DEAD) {
        player.age += 1;

        if (player.state !== CHECKING) {
          let oldVel = player.velocityY;

          player.stepTime(self.state.gravity);

          if (player.state === PLAYING) {
            player.livingPeriod += 1;
            player.currentScore = Math.floor(player.livingPeriod / 30);
          }

          if (oldVel < 0.0 && player.velocityY > 0.0) {
            self.audioEngine.play(JUMP);
          }
        }

        if (player.age > TICKS_TO_EXPIRE_PLAYER) {
          self.removePlayer(player);
        }
      }
    }
  }


  createPlayer(data) {
    let self = this,
        position = this.availableSlots.pop(),
        player = new Player(data, {
          x: position,
          y: 0.0
        }, 0.05, this.availableColors.pop());

    player.state = CHECKING;
    player.overheadText = '?';

    this.state.players.push(player);
    this.players[player.id] = player;

    this.scheduleEventForPlayer(player, function () {
      if (self.players[player.id]) {
        self.prepareGameFor(player);
      }
    }, TIME_TO_WAIT_FOR_PLAYER_TO_BE_READY);

    return player;
  }


  updateState() {
    let self = this,
        state = self.state;
    state.tick = state.tick + 1;

    if (self.shouldMakeANewObstacle()) {
      self.generateNewObstacle();
    }

    let toRemoveList = [];
    for (let i = 0; i < state.boxes.length; i++) {
      let box = state.boxes[i];
      if (box.position.x + box.halfWidth < -0.5) {
        toRemoveList.push(i);
      }

      box.position.x = box.position.x - state.speed;
    }

    _.forEach(state.stars, function (star, index) {
      star.x -= star.speed;

      if (star.x < -0.5) {
        star.x = 0.5;
        star.y = Math.random() - 0.5;
        star.speed = (0.4 + index * 0.05) * self.state.speed;
      }
    });

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
    self.audioEngine.play(DEATH);
    if (player.currentScore > player.highScore) {
      player.highScore = player.currentScore;
    }

    var callback = function () {
      player.overheadText -= 1;

      if (player.overheadText > SECONDS_TO_START) {
        self.scheduleEventForPlayer(player, callback, 1000);
      } else {
        self.prepareGameFor(player);
      }
    };

    self.scheduleEventForPlayer(player, function () {
      player.reset();
      player.state = CHECKING;
      player.overheadText = SECONDS_TO_REST + SECONDS_TO_START;
      self.scheduleEventForPlayer(player, callback, 1000);
    }, 1000 * SECONDS_TO_RESPAWN);
  }


  removePlayer(player) {
    this.state.players.splice(this.state.players.indexOf(player), 1);
    delete this.players[player.id];

    this.availableSlots.push(player.position.x);
    this.availableColors.push(player.color);
  }


  prepareGameFor(player) {
    let self = this;
    player.state = READY;
    player.overheadText = SECONDS_TO_START;
    player.reset();

    var callback = function () {
      if (self.players[player.id] && player.state !== DEAD) {
        if (--player.overheadText) {
          self.scheduleEventForPlayer(player, callback, 1000);
        } else {
          player.state = PLAYING;
          player.overheadText = 'GO';

          self.scheduleEventForPlayer(player, function () {
            player.overheadText = null;
          }, 1000);
        }
      }
    };

    self.scheduleEventForPlayer(player, callback, 1000);
  }


  shouldMakeANewObstacle() {
    return this.state.tick % this.state.timeToNextBlock === 0;
  }


  generateNewObstacle() {
    var state = this.state;

    state.tick = 0;
    state.timeToNextBlock = Math.round(TICKS_TO_NEXT_PIPE * Math.random() / 3.3 + TICKS_TO_NEXT_PIPE);

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


  scheduleEventForPlayer(player, callback, time) {
    var self = this,
        event = this.events[player.id];
    if (event) {
      clearTimeout(event);
    }

    self.events[player.id] = setTimeout(function () {
      delete self.events[player.id];
      callback(player);
    }, time);
  }
}

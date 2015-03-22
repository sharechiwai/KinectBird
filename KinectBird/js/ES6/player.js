const EASING = 0.1;
const ONE_MINUS_EASING = 1.0 - EASING;
// lower jump harder
const SCALING = 0.19;

// Lower the quicker
const REST_PERIOD = 340;
export const DEAD = 'DEAD';
export const CHECKING = 'CHECKING';
export const READY = 'READY';
export const PLAYING = 'PLAYING';

const PREFIXES = [
  'seething',
  'angry',
  'wild',
  'peaceful',
  'zodiac',
  'winter',
  'spring',
  'summer',
  'autumn',
  'glowing',
  'wispy'
];

const ANIMALS = [
  'tiger',
  'lion',
  'bird',
  'rat',
  'cat',
  'dog',
  'fish',
  'eagle',
  'bug',
  'ant',
  'monkey',
  'turtle',
  'clam',
  'spider',
  'butterfly',
  'bee'
];

var usedNames = [],
    generateName = function () {
      'use strict';

      return [
        PREFIXES[Math.round(Math.random() * PREFIXES.length) % PREFIXES.length],
        ANIMALS[Math.round(Math.random() * ANIMALS.length) % ANIMALS.length]
      ].join('-');
    },
    generateUniqueName = function () {
      'use strict';

      var name = generateName();
      while (usedNames.indexOf(name) !== -1) {
        name = generateName();
      }

      return name;
    };

export class Player {
  constructor (data, position, size, color) {
    this.halfSize = size / 2.0;
    this.id = data.bodyId;
    this.velocityY = 0.0;
    this.lastDiffY = 0.0;
    this.lastDataPositionY = data.joint.position.y;
    this.position = _.clone(position);
    this.updateDataWith(data, 0.0);

    this.state = CHECKING;
    this.age = 0;
    this.livingPeriod = 0;
    this.restingPeriod = 0;

    this.color = color;
    this.overheadText = null;

    this.currentScore = 0;
    this.highScore = 0;

    this.name = generateUniqueName();
  }

  updateDataWith(data) {
    let point = data.joint.position,
        dy = Math.max(SCALING * (point.y - this.lastDataPositionY), 0.0);

    this.rawObject = data.object;
    this.lastDiffY = ONE_MINUS_EASING * this.lastDiffY + EASING * dy;
    this.lastDataPositionY = point.y;

    this.age = 0;
  }


  stepTime(gravity) {
    let scaledGravity = (this.restingPeriod > REST_PERIOD) ? gravity : Math.pow(this.restingPeriod / REST_PERIOD, 2) * gravity;
    this.velocityY += this.lastDiffY - scaledGravity;

    if (this.velocityY > 0.0) {
      this.velocityY = ONE_MINUS_EASING * this.velocityY;
    }

    this.position.y += this.velocityY;
  }


  reset() {
    this.position.y = 0.0;
    this.velocityY = 0.0;
    this.lastDiffY = 0.0;
    this.currentScore = 0;
    this.livingPeriod = 0;
    this.restingPeriod = 0;
  }
}

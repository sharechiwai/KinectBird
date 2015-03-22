export const BACKGROUND_MUSIC = './audio/flappy-background.wav';
export const JUMP = [
  './audio/jump.wav',
  './audio/jump.wav',
  './audio/jump.wav',
  './audio/jump.wav',
  './audio/jump.wav',
  './audio/jump.wav'
];
export const DEATH = [
  './audio/smb_mariodie.wav',
  './audio/smb_mariodie.wav',
  './audio/smb_mariodie.wav',
  './audio/smb_mariodie.wav',
  './audio/smb_mariodie.wav',
  './audio/smb_mariodie.wav'
];

export class AudioEngine {
  constructor() {
    let self = this,
        audioObjects = [
          { src: BACKGROUND_MUSIC, bg: true },
          { src: JUMP[0] },
          { src: JUMP[1] },
          { src: JUMP[2] },
          { src: JUMP[3] },
          { src: JUMP[4] },
          { src: JUMP[5] },
          { src: DEATH[0] },
          { src: DEATH[1] },
          { src: DEATH[2] },
          { src: DEATH[3] },
          { src: DEATH[4] },
          { src: DEATH[5] }
        ];

    self.htmlElement = document.createElement('div');
    self.audioElements = {};

    self.htmlElement.setAttribute('id', 'audio-engine');
    _.forEach(audioObjects, function (object) {
      let poolSize = object.poolSize || 1,
          elements = [];

      for (let i = 0; i < poolSize; i++) {
        let audio = document.createElement('audio');
        if (object.bg) {
          audio.setAttribute('loop', 'true');
        }
        audio.setAttribute('src', object.src);

        elements.push(audio);
        self.htmlElement.appendChild(audio);
      }

      self.audioElements[object.src] = elements;
    });

    document.body.appendChild(this.htmlElement);

    self.play(BACKGROUND_MUSIC);
  }

  play(src) {
    let elements = this.audioElements[src],
        i = elements.length;
    while (i--) {
      let audio = elements[i];
      if (audio.paused) {
        audio.play();
        return;
      }
    }
  }
}


export const BACKGROUND_MUSIC = './audio/mario.wav';
export const JUMP = './audio/jump.wav';
export const DEATH = './audio/smb_mariodie.wav';

export class AudioEngine {
  constructor() {
    let self = this,
        audioObjects = [
          { src: BACKGROUND_MUSIC, bg: true },
          { src: JUMP, poolSize: 4 },
          { src: DEATH, poolSize: 4 }
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

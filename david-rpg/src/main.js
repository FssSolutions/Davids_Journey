import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import BethlehemScene from './scenes/BethlehemScene.js';
import ValleyScene from './scenes/ValleyScene.js';
import SaulCourtScene from './scenes/SaulCourtScene.js';
import EnGediScene from './scenes/EnGediScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import CombatScene from './scenes/CombatScene.js';
import ScriptureScene from './scenes/ScriptureScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#0a0705',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // top-down, no gravity
      debug: false
    }
  },
  scene: [
    BootScene,
    TitleScene,
    BethlehemScene,
    ValleyScene,
    SaulCourtScene,
    EnGediScene,
    DialogueScene,
    CombatScene,
    ScriptureScene,
    UIScene,
  ]
};

const game = new Phaser.Game(config);
export default game;

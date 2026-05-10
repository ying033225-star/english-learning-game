// Game configuration and bootstrap
const GAME_WIDTH = 800;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;

// Color palette - cute & soft for young girls
const COLORS = {
    sky: 0x87ceeb,
    pink: 0xffb6c1,
    purple: 0xdda0dd,
    yellow: 0xffd700,
    green: 0x90ee90,
    brown: 0x8b4513,
    white: 0xffffff,
    red: 0xff6b6b,
    skin: 0xffdab9,
    hair: 0x4a3728,
    dress: 0xff69b4,
    grass: 0x7ec850,
    ground: 0xc8845c,
    coin: 0xffd700,
    block: 0xffa500,
    dark: 0x333333,
};

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#87ceeb',
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },
    scene: [
        BootScene,
        MenuScene,
        WorldSelectScene,
        GameScene,
        ResultScene
    ]
};

const game = new Phaser.Game(config);
window.game = game;

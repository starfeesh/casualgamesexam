class TrackObject {
    constructor(game, x, y, data, sprite) {

    }
}
class Player extends Phaser.Sprite {
    constructor(game, x, y) {
        super(game, x, y, 'player');

        this.anchor.set(0.5, 1);
        this.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 16, true);
        this.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 12, true);
        this.animations.add('jump', Phaser.Animation.generateFrameNames('jump_', 0, 0, '', 3), 8, true);
        this.animations.add('fall', Phaser.Animation.generateFrameNames('fall_', 1, 1, '', 3), 8, true);
        this.animations.add('slide', Phaser.Animation.generateFrameNames('slide_', 0, 0, '', 3), 8, true);
        this.animations.play('run');

        this.y = this.game.canvas.height;
        this.game.physics.arcade.enableBody(this);
        this.body.collideWorldBounds = true;

    }
    move() {
        if (this.isFrozen) { return; }

        var speed = 200;
        this.body.velocity.x = speed;
    }
    jump() {
        var jumpSpeed = 600;

        var canJump = this.body.touching.down;

        if (canJump) {
            this.body.velocity.y = -jumpSpeed;
        }
        return canJump;
    }
}
class RouteManager extends Phaser.Group {
    constructor(game, player, data) {
        super(game);
        this.player = player;
        var spawnDistanceAheadOfPlayer = 832;
        var activationDistanceAheadOfPlayer = 624;
        this.spawnedChunks = [];

        this.jsonChunks = {0: null, 1: "slide.png", 2: "pickup.png", 3: "jump.png"};
        this.upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    }
    update() {

        if (this.upKey.isDown){
            this.initChunks();
        }
    }
    initChunks() {

        var chunk = game.add.tilemap('data');
        chunk.addTilesetImage('Chunks','level');

        chunk.createLayer('Layer1');
        this.spawnedChunks.push(chunk);
    }
}
class RouteChunk extends Phaser.Group {
    constructor(game, x) {
        super(game);



    }
}
// Game
class GameState {
    preload () {
        game.load.atlasJSONHash('player', 'assets/img/player.png', 'assets/json/player.json'); // Load image with atlasJSONHash (from TexturePacker)
        game.load.image('background', 'assets/img/level01/back.png');
        game.load.image('midground', 'assets/img/level01/mid.png');
        game.load.image('midforeground', 'assets/img/level01/midfore.png');
        game.load.image('grass', 'assets/img/level01/grass.png');
        game.load.image('level', 'assets/img/tiles.png');
        game.load.image('moon', 'assets/img/level01/moon.png');

        game.load.tilemap('data', 'assets/json/chunks.json', null, Phaser.Tilemap.TILED_JSON);
    }
    create () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.renderer.renderSession.roundPixels = true;
        this.game.world.worldWidth = 2496;
        this.loadLevel(this.game.world.worldWidth);

        game.world.setBounds(0, 0, this.game.world.worldWidth, 480);
        game.stage.disableVisibilityChange = true;

    }
    loadLevel () {
        this.moon = this.game.add.image(0,0,'moon');
        this.moon.fixedToCamera = true;
        this.background = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'background');
        this.midground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midground');
        this.midforeground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midforeground');

        this.spawnPlayer();
        game.camera.follow(this.player);
        this.grass = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'grass');

        this.routeManager = new RouteManager(this.game, this.player);

    }
    update () {
        this.player.move();
        this.midforeground.tilePosition.x -= 2;
        this.grass.tilePosition.x -= 2;
        this.midground.tilePosition.x -= 1;
        this.background.tilePosition.x -= 0.5;

        this.game.world.wrap(this.player, -(this.game.width/2), false, true, false);

    }
    spawnPlayer () {
        this.player = new Player(this.game, 0, 0);
        this.game.add.existing(this.player);
        game.physics.arcade.enable(this.player);

    }
    render() {
        game.debug.cameraInfo(game.camera, 32, 32);

        game.debug.spriteCoords(this.player, 32, 500);
    }

}
var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('GameState', GameState);
    game.state.start('GameState');
};

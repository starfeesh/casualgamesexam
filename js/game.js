class Player extends Phaser.Sprite {
    constructor(game, x, y) {
        super(game, x, y, 'player');

        this.playerPosition = this.x;

        this.anchor.set(0.5, 1);
        this.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 16, true);
        this.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 12, true);
        this.animations.add('jump', Phaser.Animation.generateFrameNames('jump_', 0, 0, '', 3), 8, true);
        this.animations.add('fall', Phaser.Animation.generateFrameNames('fall_', 1, 1, '', 3), 8, true);
        this.animations.add('slide', Phaser.Animation.generateFrameNames('slide_', 0, 0, '', 3), 8, true);
        this.animations.play('run');

        this.y = this.game.canvas.height;
        this.game.physics.enable(this);
        this.body.collideWorldBounds = true;
    }
    move() {
        if (this.isFrozen) { return; }
        
        let speed = 5;
        this.body.velocity.x += speed;
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
    constructor(game, player) {
        super(game);
        this.player = player;
        var spawnDistanceAheadOfPlayer = 832;
        var activationDistanceAheadOfPlayer = 624;
        var spawnedChunks = [];
    }
    update() {
        console.log(this.player.x);
    }

}
// Game
class GameState {
    preload () {
        this.game.load.atlasJSONHash('player', 'assets/img/player.png', 'assets/json/player.json'); // Load image with atlasJSONHash (from TexturePacker)
        this.game.load.image('background', 'assets/img/level01/back.png');
        this.game.load.image('midground', 'assets/img/level01/mid.png');
        this.game.load.image('midforeground', 'assets/img/level01/midfore.png');
        this.game.load.image('grass', 'assets/img/level01/grass.png');
        this.game.load.image('moon', 'assets/img/level01/moon.png');
    }
    create () {
        this.game.world.worldWidth = 1664;
        this.loadLevel(this.game.cache.getJSON('level:1'), this.game.world.worldWidth);
        this.game.camera.follow(this.player);
        game.world.setBounds(0, 0, this.game.world.worldWidth, 480);
    }
    loadLevel () {
        this.background = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'background');
        this.moon = this.game.add.tileSprite(0, 0, this.game.canvas.width, this.game.canvas.width, 'moon');
        this.midground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midground');
        this.midforeground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midforeground');

        this.spawnPlayer();

        this.grass = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'grass');

        this.routeManager = new RouteManager(this.game, this.player);

    }
    update () {
        this.player.move();
        this.midforeground.tilePosition.x -= 2;
        this.grass.tilePosition.x -= 2;
        this.midground.tilePosition.x -= 1;
        this.background.tilePosition.x -= 0.5;
        this.moon.tilePosition.x -= 0;
    }
    spawnPlayer () {
        this.player = new Player(this.game, 0, 0);
        this.game.add.existing(this.player);

    }

}
var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('GameState', GameState);
    game.state.start('GameState');
};
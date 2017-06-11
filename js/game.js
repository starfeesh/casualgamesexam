var debugmode = true;
function debuglog(message) {
  if (debugmode) {
    console.log(new Date().toISOString() + ' · '  + message);
  }
}
class Player extends Phaser.Sprite {
    constructor(game, x, y) {
        super(game, x, y, 'player');

        this.anchor.set(0.5, 1);
        this.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 16, true);
        this.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 8, true);
        this.animations.add('jump', Phaser.Animation.generateFrameNames('jump_', 0, 0, '', 3), 8, true);
        this.animations.add('fall', Phaser.Animation.generateFrameNames('jump_', 1, 1, '', 3), 8, true);
        this.animations.add('slide', Phaser.Animation.generateFrameNames('slide_', 0, 0, '', 3), 8, true);
        this.animations.play('run');

        this.game.physics.enable(this);
        this.y = game.canvas.height;
        this.body.allowGravity = true;
        this.body.setSize(60, 170, 115, 100);
        this.body.collideWorldBounds = true;
    }
    move() {
        this.isRunning = true;
        if (this.isFrozen) { return; }

        if (!this.isSliding) {
            this.body.setSize(60, 170, 115, 100);
        }
        var speed = 200;
        this.body.velocity.x = speed;

    }
    jump() {
        var jumpSpeed = 630;

        var canJump = this.body.blocked.down;

        if (canJump && !this.isSliding) {
            this.isJumping = true;
            this.body.setSize(60, 170, 115, 100);
            this.body.velocity.y = -jumpSpeed;
        }
        return canJump;
    }
    slide() {
        var canSlide = this.body.blocked.down;

        if (canSlide && !this.isJumping) {
            this.isSliding = true;
            this.body.setSize(133, 116, 75, 145)
        }
        return canSlide;
    }
    die() {
        console.log("You died!")
    }
    getAnimName() {
        let name = "idle";

        if (this.isSliding) {
            name = "slide";
        }
        else if (this.body.velocity.y < 0) {
            name = "jump";
        }
        else if (this.body.velocity.y >= 0 && !this.body.blocked.down) {
            name = "fall";
        }
        else if (this.body.velocity !== 0 && this.body.blocked.down) {
            name = "run";
        }

        return name;
    }
    update() {
        let animName = this.getAnimName();
        if (this.animations.name !== animName) {
            this.animations.play(animName);
        }

    }
}
class RouteManager extends Phaser.Group {
    constructor(game, player) {
        super(game);
        this.player = player;
        this.spawnedChunks = [];
        this.tileSize = 32;
        this.objectGroup = game.add.physicsGroup();
        this.chunkHandled = false;
    }
    update() {
        var width = this.game.cache.getJSON('data').layers[0].data[0][0].length;
        var chunksTotal = game.world.worldWidth / (width * this.tileSize);
        var playerPosInWorld = this.player.x / game.world.worldWidth * chunksTotal;
        this.playerCurrentChunk = Math.floor(playerPosInWorld);
        var currentPosInChunk = playerPosInWorld - this.playerCurrentChunk;
        var chunkToSpawn;
        var chunkToDespawn;

        if (currentPosInChunk > 0.5) {
            if (!this.chunkHandled)
            {
                if (this.playerCurrentChunk == chunksTotal - 1) {
                    chunkToDespawn = playerCurrentChunk - 1;
                    chunkToSpawn = 0;
                } else {
                    if (this.playerCurrentChunk === 0) {
                        chunkToDespawn = chunksTotal - 1;
                        chunkToSpawn = this.playerCurrentChunk + 1;
                    } else {
                        chunkToDespawn = this.playerCurrentChunk - 1;
                        chunkToSpawn = this.playerCurrentChunk + 1;
                    }
                }
                this.spawnChunk(chunkToSpawn);
                this.despawnChunk(chunkToDespawn);
                this.chunkHandled = true;
            }
        } else {
            this.chunkHandled = false;
        }

    }

    spawnChunk(chunkToSpawn) {
        debuglog('Spawn: numchunks is ' + this.spawnedChunks.length + ', spawning to chunkpos ' + chunkToSpawn);

        var chunkJson = this.game.cache.getJSON('data');
        var layers = chunkJson.layers;
        var width = layers[0].width;
        var height = layers[0].height;

        var lookup = {
            0: "",
            1: "slide",
            2: "",
            3: "pickup",
            4: "jump"
        };

        var chunkToBuild = layers[0].data[Math.floor(Math.random() * layers[0].data.length)];
        var randomChunk = new RouteChunk(game, "chunk", width, height, 0, 0);


        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                var tileValue = chunkToBuild[y][x];
                var imageName = lookup[tileValue];
                var xPos = (width * this.tileSize * chunkToSpawn) + (x * this.tileSize);
                var yPos = y * this.tileSize;

                switch (imageName) {
                    case "":
                        break;
                    case "slide":
                        this.obstacle = new Obstacle(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.obstacle);
                        break;
                    case "pickup":
                        this.pickup = new Pickup(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.pickup);
                        break;
                    case "jump":
                        this.obstacle = new Obstacle(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.obstacle);
                }
            }
        }

        for (var j = 0; j < randomChunk.childTrackObjects.length; j++) {
            game.add.existing(randomChunk.childTrackObjects[j]);
            this.objectGroup.add(randomChunk.childTrackObjects[j]);
        }

        this.spawnedChunks.push([chunkToSpawn, randomChunk]);

    }
    despawnChunk(chunkToDespawn) {
        debuglog('Despawn: numchunks is ' + this.spawnedChunks.length + ', despawning from chunkpos ' + chunkToDespawn);
        for (var i = this.spawnedChunks.length - 1; i >= 0; i--) {
            if (typeof this.spawnedChunks[i][1] != "undefined") {
                if (this.spawnedChunks[i][0] == chunkToDespawn) {
                    var chunkToDestroy = this.spawnedChunks.splice(i, 1);

                    for (var j = chunkToDestroy[0][1].childTrackObjects.length - 1; j >= 0; j--) {
                      var trackToDestroy = chunkToDestroy[0][1].childTrackObjects[j];

                      trackToDestroy.destroy();
                    }

                    chunkToDestroy[0][1].destroy();
                }
            }
        }
    }
}
class RouteChunk extends Phaser.Group {
    constructor(game, name, width, height, x ,y) {
        super(game);
        this.childTrackObjects = [];
        this.name = name;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
}
class TrackObject extends Phaser.Sprite {
    constructor(game, name, x, y, parent, player) {
        super(game, x, y, name);
        this.parent = parent;
        this.game = game;
    }
}
class Pickup extends TrackObject {
    constructor(game, name, x, y, parent, player) {
        super(game, name, x, y, parent, player);
        this.game = game;
        this.pickedUp = false;

        this.game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
        this.body.collideWorldBounds = true;
        this.body.setSize(32,32);
    }
    pickUp() { // TODO something here
        this.destroy();
    }
}
class Obstacle extends TrackObject {
    constructor(game, name, x, y, parent, player) {
        super (game, name, x, y, parent, player);
        this.game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
        this.body.collideWorldBounds = true;
        this.body.setSize(32,32);
    }

}
class CollisionManager extends Phaser.Group{
    constructor(game, player, routeManager) {
        super(game);
        this.game = game;
        this.player = player;
        this.routeManager = routeManager;

    }
    getCollisions() {
        this.game.physics.arcade.overlap(this.player, this.routeManager.objectGroup, this.handleCollisions, null, this);

        this.game.physics.arcade.collide(this.player, this.routeManager.objectGroup, this.handleCollisions, null, this);
    }
    update() {
        this.getCollisions();
    }
    handleCollisions(player, collidedObject) {
        if (collidedObject.key == "pickup"){
            collidedObject.pickUp();
        }
        if (collidedObject.key !== "pickup") {
            player.die();
        }
    }
}
class GameState {
    preload () {
        game.load.atlasJSONHash('player', 'assets/img/player.png', 'assets/json/player.json');
        game.load.image('background', 'assets/img/level01/back.png');
        game.load.image('midground', 'assets/img/level01/mid.png');
        game.load.image('midforeground', 'assets/img/level01/midfore.png');
        game.load.image('grass', 'assets/img/level01/grass.png');
        game.load.image('moon', 'assets/img/level01/moon.png');

        game.load.image('slide', 'assets/img/slide.png');
        game.load.image('jump', 'assets/img/jump.png');
        game.load.image('pickup', 'assets/img/pickup.png');

        game.load.audio('running', 'assets/audio/mix.mp3');
        game.load.audio('crickets', 'assets/audio/crickets.mp3');
        game.load.audio('sliding', 'assets/audio/slide.mp3');

        game.load.json('data', 'assets/json/chunks.json');
        game.load.image('level', 'assets/img/tiles.png');
    }
    init () {

    }
    create () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.renderer.renderSession.roundPixels = true;
        game.world.worldWidth = 851968;
        this.loadLevel();

        game.world.setBounds(0, 0, this.game.world.worldWidth, 480);
        game.stage.disableVisibilityChange = true;

        this.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.mute = game.input.keyboard.addKey(Phaser.Keyboard.M);

        this.soundEffects = {
            running: this.game.add.audio('running'),
            crickets: this.game.add.audio('crickets'),
            sliding: this.game.add.audio('sliding')
        };

//      this.soundEffects.running.loopFull(1);
        this.soundEffects.running.volume = 8;
//      this.soundEffects.crickets.loopFull(1);
        this.soundEffects.crickets.volume = 5;
    }
    loadLevel () {
        this.moon = this.game.add.image(0,0,'moon');
        this.moon.fixedToCamera = true;
        this.background = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'background');
        this.midground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midground');
        this.midforeground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'midforeground');

        this.spawnPlayer();
        game.camera.follow(this.player);
        this.spawnFloor();

        this.routeManager = new RouteManager(this.game, this.player);
        this.collisionManager = new CollisionManager(this.game, this.player, this.routeManager);
        this.game.physics.arcade.gravity.y = 1200;

    }
    update () {
        this.player.move();
        this.midforeground.tilePosition.x -= 2;
        this.grass.tilePosition.x -= 2;
        this.midground.tilePosition.x -= 1;
        this.background.tilePosition.x -= 0.5;

        this.handleInput();
    }
    spawnPlayer () {
        this.player = new Player(this.game, 416, 0);
        this.game.add.existing(this.player);
        game.physics.arcade.enable(this.player);

    }
    spawnFloor () {
        this.grass = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'grass');
        game.physics.enable(this.grass);
        this.grass.body.allowGravity = false;
        this.grass.body.immovable = true;
    }
    handleInput () {
        this.up.onDown.add(function () {
            let jumped = this.player.jump();
            if (jumped && !this.player.isJumping) {
                this.player.isJumping = true;
                this.player.isSliding = false;
            }
        }, this);
        if (this.down.isDown) {
            let slid = this.player.slide();
            if (slid && !this.player.isSliding) {
                this.soundEffects.running.stop();
                this.player.isSliding = true;
                this.player.isJumping = false;
            }
        }else {
            this.player.isSliding = false;
        }
    }
}
/*
class TrackObjectFactory {
    constructor() {
        this.instances = [];
    }
    create(game, name, x, y, parent, player) {
        var newTrackObject;

        if (name.length > 0) {
            switch (name) {
                case "slide":
                    newTrackObject = new TrackObject(game, name, x, y, parent, player);
                    break;
                case "jump":
                    newTrackObject = new TrackObject(game, name, x, y, parent, player);
                    break;
                case "pickup":
                    newTrackObject = new Pickup(game, name, x, y, parent, player);
                    break;
            }
            this.instances.push(newTrackObject);
            return newTrackObject;
        }
    }
}
var trackObjectFactory = new TrackObjectFactory();*/
var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('GameState', GameState);
    game.state.start('GameState');
};

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

        this.y = game.canvas.height;
        this.game.physics.enable(this);
        this.body.allowGravity = true;
        this.body.collideWorldBounds = true;

    }
    move() {
        this.isRunning = true;
        if (this.isFrozen) { return; }

        var speed = 200;
        this.body.velocity.x = speed;
    }
    jump() {
        var jumpSpeed = 700;

        var canJump = this.body.blocked.down;

        if (canJump && !this.isSliding) {
            this.isJumping = true;
            this.body.velocity.y = -jumpSpeed;
        }
        return canJump;
    }
    slide() {
        var canSlide = this.body.blocked.down;

        if (canSlide && !this.isJumping) {
            this.isSliding = true;
        }
        return canSlide;
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
        else if (this.body.velocity != 0 && this.body.blocked.down) {
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

        this.playerCurrentChunk = 0;
        this.playerNextChunk = 1;

        this.loops = 0;
        this.wasLastLoopEnd = false;

    }
    update() {
        var width = this.game.cache.getJSON('data').layers[0].data[0][0].length;
        var chunksTotal = game.world.worldWidth / (width * this.tileSize);
        var playerPosInWorld = this.player.x / game.world.worldWidth * chunksTotal;


        if(this.spawnedChunks.length == 0)
        {
            this.spawnChunk(0);

            this.updateChunkIndex();
            return;
        }

        var currentChunkPosX = this.getLoopedDistance(this.playerCurrentChunk * width * this.tileSize);
        var nextChunkPosX = this.getLoopedDistance(this.playerNextChunk * width * this.tileSize);

        var playerPosX = this.getLoopedDistance(this.player.x);

        //if(currentChunkPosX < nextChunkPosX)
        //{
        //
        //}
        //else if(currentChunkPosX > nextChunkPosX)
        //{
        //    var dist = nextChunkPosX - playerPosX;
        //
        //    if(dist < 0.5 * width * this.tileSize)
        //    {
        //        this.updateChunkIndex();
        //        // this.despawnChunk(this.playerCurrentChunk);
        //        this.spawnChunk(this.playerCurrentChunk);
        //    }
        //}

        var dist = nextChunkPosX - playerPosX;

        if(dist < 0.5 * width * this.tileSize){
            this.updateChunkIndex();
            // this.despawnChunk(this.playerCurrentChunk);
            this.spawnChunk(this.playerCurrentChunk);
        }

     /*   if(this.playerCurrentChunk == 0)
        {
            distanceFromLastChunk = game.world.worldWidth - playerPosInWorld;
            if(distanceFromLastChunk < width*this.tileSize*0.5)
            {
                return;
            }
        }

        if (distanceFromLastChunk > 0) {

            this.updateChunkIndex();
            this.despawnChunk(this.playerCurrentChunk);
            this.spawnChunk(this.playerCurrentChunk);
        }*/

    }

    updateChunkIndex() {
        this.playerCurrentChunk++;

        if(this.playerCurrentChunk > 3) {
            this.playerCurrentChunk = 0;
        }
        this.playerNextChunk = this.playerCurrentChunk + 1;

        if(this.playerNextChunk > 3) {
            this.playerNextChunk = 0;
        }
    }

    getLoopedDistance(x) {
        return this.loops * this.game.world.worldWidth + x;
    }

    spawnChunk(chunkToSpawn) {
        var chunkJson = this.game.cache.getJSON('data');
        var layers = chunkJson.layers;
        var width = layers[0].width;
        var height = layers[0].height;

        var lookup = {
            0: "",
            1: "slide",
            3: "pickup",
            4: "jump"
        };

        var chunkPosX = width * this.tileSize * chunkToSpawn;
        var chunkToBuild = layers[0].data[Math.floor(Math.random() * layers[0].data.length)];
        var randomChunk = new RouteChunk(game, "chunk", width, height, chunkPosX, 0);

        console.log("placing chunk at "+ chunkPosX);

        if(!randomChunk.hasSpawned)
        {
            randomChunk.chunkNumber = chunkToSpawn;

            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    var tileValue = chunkToBuild[y][x];
                    var imageName = lookup[tileValue];
                    var xPos = chunkPosX + (x * this.tileSize);
                    var yPos = y * this.tileSize;

                    if (imageName.length !== 0) {
                        this.trackObject = new TrackObject(this.game, imageName, xPos, yPos, randomChunk);
                        randomChunk.childTrackObjects.push(this.trackObject);
                    }
                }
            }
            randomChunk.spawn();
            console.log("adding chunk "+ randomChunk.chunkNumber);
            this.spawnedChunks.push(randomChunk);
        }

        this.activateChunk(randomChunk, chunkPosX);
    }

    activateChunk(chunk, xPos) {

        chunk.x = xPos;
        chunk.activate();
    }

    despawnChunk(chunkToDespawn) {
        console.log('Despawn: numchunks is ' + this.spawnedChunks.length + ', despawning from chunkpos ' + chunkToDespawn);
        for (var i = 0; i < this.spawnedChunks.length; i++) {
            if (this.spawnedChunks[i].chunkNumber == chunkToDespawn) {
                this.spawnedChunks[i].deactivate();
                console.log(chunkToDespawn);
                break;
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

        this.chunkNumber = -1;
        this.visible = true;
    }

    spawn(){
        this.childTrackObjects.forEach(function(c){
            c.spawn();
        });
        this.hasSpawned = true;
    }

    activate(xPos) {
        this.childTrackObjects.forEach(function(c){
            c.activate(xPos, 0);
        });
    }

    deactivate() {
        this.childTrackObjects.forEach(function(c){
            c.deactivate();
        });

        this.chunkNumber = -1;
    }
}
class TrackObject extends Phaser.Sprite {
    constructor(game, name, x, y, parent) {
        super(game, x, y, name);
        this.parent = parent;
        this.originalX = x;
        this.originalY = y;
        parent.addChild(this);
    }
    activate() {
        //this.position.x = this.parent.x +  this.originalX;
        //this.position.y = this.originalY;

        this.visible = true;
    }
    spawn() {
        this.visible = false;
    }

    deactivate() {
        this.visible = false;
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
        game.world.worldWidth = 2496;
        this.loadLevel();

        game.world.setBounds(0, 0, this.game.world.worldWidth, 480);
        //game.stage.disableVisibilityChange = true;

        this.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.mute = game.input.keyboard.addKey(Phaser.Keyboard.M);

        this.soundEffects = {
            running: this.game.add.audio('running'),
            crickets: this.game.add.audio('crickets'),
            sliding: this.game.add.audio('sliding')
        };
        //this.soundEffects.running.loopFull(1);
        this.soundEffects.running.volume = 8;
        //this.soundEffects.crickets.loopFull(1);
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
        this.game.physics.arcade.gravity.y = 1200;

    }
    update () {
        this.player.move();
        this.midforeground.tilePosition.x -= 2;
        this.grass.tilePosition.x -= 2;
        this.midground.tilePosition.x -= 1;
        this.background.tilePosition.x -= 0.5;


        game.world.wrap(this.player, -416, false, true, false);

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
                console.log("Jumped");
                this.player.isJumping = true;

            }
        }, this);
        if (this.down.isDown) {
            let slid = this.player.slide();
            if (slid && !this.player.isSliding) {
                console.log(this.soundEffects);

                this.soundEffects.running.stop();
                this.player.isSliding = true;
            }
        } else {
            this.player.isSliding = false;
        }
    }

}
var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('GameState', GameState);
    game.state.start('GameState');
};

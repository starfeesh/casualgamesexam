class Player extends Phaser.Sprite {
    constructor(game, x, y) {
        super(game, x, y, 'player');

        this.anchor.set(0.5, 1);
        this.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 16, true);
        this.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 8, true);
        this.animations.add('jump', Phaser.Animation.generateFrameNames('jump_', 0, 0, '', 3), 8, true);
        this.animations.add('fall', Phaser.Animation.generateFrameNames('jump_', 1, 1, '', 3), 8, true);
        this.animations.add('slide', Phaser.Animation.generateFrameNames('slide_', 0, 0, '', 3), 8, true);
        this.animations.add('die', Phaser.Animation.generateFrameNames('die_', 0, 11, '', 3), 8, false);
        this.game = game;
        this.game.physics.enable(this);
        this.y = game.canvas.height;
        this.body.allowGravity = true;
        this.body.setSize(60, 170, 115, 100);
        this.body.collideWorldBounds = true;

        this.pickupCount = 0;
        this.distance = 0;
        this.isAlive = true;
        this.stopped = false;
    }
    move() {
        if (this.isFrozen) { return; }
        this.isRunning = true;

        if (!this.isSliding) {
            this.body.setSize(60, 170, 115, 100);
        }
        this.body.velocity.x = 200;

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
            this.body.setSize(60, 116, 75, 145)
        }
        return canSlide;
    }
    freeze() {
        this.isFrozen = true;
        //this.body.enable = false;
        this.body.velocity.x = 0;
    }
    die() {
        this.isAlive = false;
        this.freeze();
    }
    getAnimName() {
        var name = "idle";

        if (!this.isAlive) {
            name = "die";
        }
        else if (this.body.velocity.x === 0 && this.isAlive && this.stopped) {
            name = "idle";
        }
        else if (this.isSliding) {
            name = "slide";
        }
        else if (this.body.velocity.y < 0) {
            name = "jump";
        }
        else if (this.body.velocity.y >= 0 && !this.body.blocked.down) {
            name = "fall";
        }
        else if (this.body.velocity !== 0 && this.body.blocked.down && this.isAlive) {
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
        this.playerPosInWorld = this.player.x / game.world.worldWidth * chunksTotal;
        this.playerCurrentChunk = Math.floor(this.playerPosInWorld);
        var currentPosInChunk = this.playerPosInWorld - this.playerCurrentChunk;
        var chunkToSpawn;
        var chunkToDespawn;

        if (currentPosInChunk > 0.5) {
            if (!this.chunkHandled)
            {
                if (this.playerCurrentChunk == chunksTotal - 1) {
                    chunkToDespawn = this.playerCurrentChunk - 1;
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
        var chunkJson = this.game.cache.getJSON('data');
        var layers = chunkJson.layers;
        var width = layers[0].width;
        var height = layers[0].height;

        var lookup = {
            0: "",
            1: "slide",
            2: "",
            3: "pickup",
            4: "jumpbottom",
            5: "jumptop",
            6: "jumpmid",
            7: "slide1",
            8: "slide2",
            9: "slide3",
            10: "slide4",
            11: "slide5",
            12: "slide6",
            13: "slide7",
            14: "slide8"
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
                    case "slide1":
                    case "slide2":
                    case "slide3":
                    case "slide4":
                    case "slide5":
                    case "slide6":
                    case "slide7":
                    case "slide8":
                        this.obstacle = new Obstacle(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.obstacle);
                        break;
                    case "pickup":
                        this.pickup = new Pickup(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.pickup);
                        break;
                    case "jumpbottom":
                    case "jumpmid":
                    case "jumptop":
                        this.obstacle = new Obstacle(this.game, imageName, xPos, yPos, randomChunk, this.player);
                        randomChunk.childTrackObjects.push(this.obstacle);
                        break;
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
        this.player = player;

        this.game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
        this.body.collideWorldBounds = true;
        this.body.setSize(32,32);
    }
    pickUp() { // TODO something here
        this.player.pickupCount++;
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
class Level {
    constructor(game, level, player, currentState) {
        this.game = game;
        this.levelNumber = level;
        this.player = player;
        this.state = currentState;
    }
    getLevelSounds() {
        this.soundEffects = {
            running: this.game.add.audio('running'),
            sliding: this.game.add.audio('sliding'),
            oomph: this.game.add.audio('oomph')
        };

        switch (this.levelNumber) {
            case 1:
                this.soundEffects.running.loopFull(5);

                break;
            case 2:
                this.soundEffects.running.loopFull(5);
                break;
        }
    }
    getLevelSpeed() {
        switch (this.levelNumber){
            case 1:
                this.player.body.velocity.x = 200;
                break;
            case 2:
                this.player.body.velocity.x = 300;
                break;
        }
    }
    getLevelDeco() { // TODO: Figure out how to return the values rather than setting them
        switch (this.levelNumber) {
            case 1:
                this.background = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl2bg');
                this.midground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl2mg');
                this.midforeground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl2mfg');
                break;
            case 2:
                this.background = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl1bg');
                this.midground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl1mg');
                this.midforeground = this.game.add.tileSprite(0, 0, this.game.world.worldWidth, this.game.canvas.width, 'lvl1mfg');
                break;
        }
    }
    getLevelBackgroundColor() {
        switch (this.levelNumber) { // Attempted to draw gradient on rect but solid bitmap seems more efficient?
            case 1:
                this.color = this.game.add.image(0,0, 'moon2');
                break;
            case 2:
                this.color = this.game.add.image(0,0,'moon1');
                break;
        }
    }
    getLevelLength() {
        switch (this.levelNumber) {
            case 1:
                this.distance = 2500;
                break;
            case 2:
                this.distance = 5000;
                break;
        }
        return this.distance;
    }
    getLevelComplete() {
        switch (this.levelNumber) {
            case 1:
                var nextLevel = this.levelNumber + 1;
                this.txt = this.game.add.text(this.game.canvas.width / 2, this.game.canvas.height / 2 - 80, "Level " + nextLevel, {font: "70px YozakuraLight", fill: "#ffffff", align: "center"});
                this.txt.fixedToCamera = true;
                this.txt.anchor.set(0.5);
                this.game.add.tween(this.txt)
                    .to({alpha: 1}, 1500, null, true, 1500)
                    .onComplete.addOnce(function () {
                    this.state.nextLevel();
                }, this);
                break;
            case 2:
                console.log("You win!")
                break;
        }
    }
}
class GameState {
    preload () {
    }
    init () {
        this.levelNumber = 0;
        this.deathHappened = false;
    }
    create () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.renderer.renderSession.roundPixels = true;
        game.world.worldWidth = 851968;

        game.world.setBounds(0, 0, this.game.world.worldWidth, 480);
        game.stage.disableVisibilityChange = true;

        this.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.mute = game.input.keyboard.addKey(Phaser.Keyboard.M);

        this.loadLevel();
    }
    loadLevel () {
        this.levelNumber++;
        this.levelComplete = false;

        this.level = new Level(this.game, this.levelNumber, this.player, this);
        this.levelDistance = this.level.getLevelLength();
        this.level.getLevelBackgroundColor();
        this.level.color.fixedToCamera = true;
        this.level.getLevelDeco(this.levelNumber);

        this.spawnPlayer();
        game.camera.follow(this.player);
        this.spawnFloor();

        this.routeManager = new RouteManager(this.game, this.player);
        this.collisionManager = new CollisionManager(this.game, this.player, this.routeManager);

        this.game.physics.arcade.gravity.y = 1200;
        this.level.getLevelSounds(this.levelNumber);
        this.createHUD();
    }
    update () {
        if (this.player.isAlive && !this.player.stopped) {
            this.player.move();
            this.level.midforeground.tilePosition.x -= 2;
            this.grass.tilePosition.x -= 2;
            this.level.midground.tilePosition.x -= 1;
            this.level.background.tilePosition.x -= 0.5;

            this.player.distance = Math.floor((this.levelDistance - this.player.x) / 100) + 5;

            this.pickupFont.text = `x${this.player.pickupCount}`; // Phaser guide
            this.distanceFont.text = `${this.player.distance}m`;

            this.handleInput();
        }
        else if (!this.player.isAlive && !this.deathHappened) {
            this.onDeath();
            this.deathHappened = true;
        }
        if (this.player.distance <= 0 && this.player.isAlive && this.levelNumber == 1 && !this.levelComplete && !this.player.stopped) {
            this.handleSuccess();
        }

    }
    createHUD() { // Used Phaser guide on bitmap text
        var numbers_str =   '0123456789XM';
        this.pickupFont = this.game.add.retroFont('font', 21, 34, numbers_str, 6);
        this.distanceFont = this.game.add.retroFont('font', 21, 34, numbers_str, 6);

        var pickupIcon = this.game.make.image(0, 4, 'pickup');
        var pickupScore = this.game.make.image(pickupIcon.x + pickupIcon.width, 8, this.pickupFont);

        var distanceCounter = this.game.make.image(0, 8, this.distanceFont);

        this.hud = this.game.add.group();

        var hudLeft = this.game.add.group();
        hudLeft.add(pickupIcon);
        hudLeft.add(pickupScore);
        hudLeft.position.set(10,10);

        var hudRight = this.game.add.group();
        hudRight.add(distanceCounter);
        hudRight.position.set(game.canvas.width - distanceCounter.width,10);

        this.hud.add(hudRight);
        this.hud.add(hudLeft);
        this.hud.fixedToCamera = true;
    }
    spawnPlayer () {
        this.player = new Player(this.game, 416, 0);
        this.game.add.existing(this.player);
        game.physics.arcade.enable(this.player);
        this.player.stopped = false;

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
                this.level.soundEffects.running.stop();
                this.player.isSliding = true;
                this.player.isJumping = false;
            }
        }else {
            this.player.isSliding = false;
        }
    }
    onDeath() {
        this.level.soundEffects.running.stop();
        this.level.soundEffects.oomph.play();
        this.game.add.tween(this.player)
            .to({x: '-50'}, 500, null, true)
            .onComplete.addOnce(this.fadeOut, this);
    }
    fadeOut() {
        game.camera.fade("#000000", 1500);
        game.camera.onFadeComplete.addOnce(this.gameOver, this);
    }
    handleSuccess() {
        this.levelComplete = true;
        this.player.freeze();
        this.player.stopped = true;
        this.level.soundEffects.running.pause();

        this.black = this.game.add.image(0,0,'fakefade');
        this.black.fixedToCamera = true;
        this.black.width = game.canvas.width;
        this.black.height = game.canvas.height;
        this.black.alpha = 0;

        this.game.add.tween(this.black)
            .to({alpha:1}, 1500, null, true, 500).start()
            .onComplete.addOnce(function () {
            this.level.getLevelComplete(this.levelNumber);
        },this);
    }
    nextLevel() {
        this.level.txt.destroy();
        this.black.destroy();
        this.loadLevel();
    }
    gameOver() {
        game.state.start("GameOver")
    }
}
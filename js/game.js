// Construct the Player from Phaser Sprite in order to get at Sprite's methods.
class Player extends Phaser.Sprite {
    constructor(game, x, y, level) {
        super(game, x, y, 'player');
        this.game = game;
        this.level = level;

        this.anchor.set(0.5, 1);

        //Followed guide on loading texture atlas from JSON and generating frame names based on string fragments
        this.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 16, true);
        this.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 8, true);
        this.animations.add('jump', Phaser.Animation.generateFrameNames('jump_', 0, 0, '', 3), 8, true);
        this.animations.add('fall', Phaser.Animation.generateFrameNames('jump_', 1, 1, '', 3), 8, true);
        this.animations.add('slide', Phaser.Animation.generateFrameNames('slide_', 0, 0, '', 3), 8, true);
        this.animations.add('die', Phaser.Animation.generateFrameNames('die_', 0, 11, '', 3), 8, false);

        this.game.physics.enable(this);
        this.y = game.canvas.height;
        this.body.allowGravity = true;
        this.body.setSize(60, 170, 115, 100); // Set the player's default hitbox size.
        this.body.collideWorldBounds = true;

        // Custom Player properties
        this.pickupCount = 0;
        this.distance = 0;
        this.isAlive = true;
        this.stopped = false;
    }
    move() {
        if (this.isFrozen) {
            return;
        }
        this.isRunning = true;

        if (!this.isSliding) {
            this.body.setSize(60, 170, 115, 100);  // Make sure player's hitbox is reset when running
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
            this.body.setSize(60, 116, 75, 145); // Resize hitbox for slide
        }
        return canSlide;
    }
    freeze() {
        this.isFrozen = true;
        this.body.velocity.x = 0;
        this.body.enable = false;
    }
    die() {
        this.isAlive = false;
        this.freeze();
    }
    getAnimName() { // Get the anim name based on player state
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
    update() { // Set anim name based on player state
        let animName = this.getAnimName();
        if (this.animations.name !== animName) {
            this.animations.play(animName);
        }

    }
}
class RouteManager extends Phaser.Group {
    constructor(game, player, level) {
        super(game);
        this.player = player;
        this.spawnedChunks = [];
        this.tileSize = 32;
        this.objectGroup = game.add.physicsGroup();
        this.chunkHandled = false;
        this.level = level;
    }
    update() {
        // First, determine width of the chunk pieces. Next, divide the width of the world by the width of the world in tiles to
        // get total number of chunks. Then, find the player's position in the world and the current chunk the player is on.
        // Finally, find the current position of the player in the current chunk to determine whether to handle chunks.
        var width = this.game.cache.getJSON('data').layers[0].data[0][0].length;
        var chunksTotal = game.world.worldWidth / (width * this.tileSize);
        this.playerPosInWorld = this.player.x / game.world.worldWidth * chunksTotal;
        this.playerCurrentChunk = Math.floor(this.playerPosInWorld);
        var currentPosInChunk = this.playerPosInWorld - this.playerCurrentChunk;
        var chunkToSpawn;
        var chunkToDespawn;

        // Use values above to determine which chunk needs spawning and despawning.
        // Player's current chunk -1 = chunk to despawn, +1 = chunk to spawn.
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
                this.spawnChunk(chunkToSpawn);  // Call spawnChunk with the chunkToSpawn passed in.
                this.despawnChunk(chunkToDespawn); // Same as above with chunkToDespawn.
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

        // Image name lookup
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
        var chunkToBuild = layers[0].data[Math.floor(Math.random() * layers[0].data.length)]; // Get a random chunk from JSON
        var randomChunk = new RouteChunk(game, "chunk", width, height, 0, 0); // Instantiate the random chunk

        // Loop over width, then height, to create the grid.
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                var tileValue = chunkToBuild[y][x]; // TODO: Why is this [y][x]?
                var imageName = lookup[tileValue];
                var xPos = (width * this.tileSize * chunkToSpawn) + (x * this.tileSize);
                var yPos = y * this.tileSize;

                // Switch on imageName to instantiate either obstacles or pickups,
                // then push them to childTrackObjects on randomChunk.
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
                        this.pickup = new Pickup(this.game, imageName, xPos, yPos, randomChunk, this.player, this.level);
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
        // Add objects to the world
        for (var j = 0; j < randomChunk.childTrackObjects.length; j++) {
            game.add.existing(randomChunk.childTrackObjects[j]);
            this.objectGroup.add(randomChunk.childTrackObjects[j]);
        }

        // Push a value along with the chunk into the spawnedChunks array so I know which chunk is which when despawning
        this.spawnedChunks.push([chunkToSpawn, randomChunk]);

    }
    despawnChunk(chunkToDespawn) {
        for (var i = this.spawnedChunks.length - 1; i >= 0; i--) { // Loop over the currently spawned chunks
            if (typeof this.spawnedChunks[i][1] != "undefined") { // Check if chunk is undefined (for when game starts)
                if (this.spawnedChunks[i][0] == chunkToDespawn) { // Check if the chunkToSpawn from the spawnedChunks array is the chunkToDespawn
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
// RouteChunk has some custom properties and some it inherits from Phaser Group
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
// TrackObject extends Phaser Sprite as that is its main functionality
class TrackObject extends Phaser.Sprite {
    constructor(game, name, x, y, parent, player) {
        super(game, x, y, name);
        this.parent = parent;
        this.game = game;
    }
}
// Pickup extends TrackObject with physics and a method for the pickup functionality.
class Pickup extends TrackObject {
    constructor(game, name, x, y, parent, player, level) {
        super(game, name, x, y, parent, player);
        this.game = game;
        this.player = player;
        this.level = level;

        this.game.physics.enable(this);
        this.body.immovable = true;
        this.body.allowGravity = false;
        this.body.collideWorldBounds = true;
        this.body.setSize(32,32);
    }
    pickUp() {
        this.level.soundEffects.gem.play();
        this.player.pickupCount++;
        this.destroy();
    }
}
// Obstacle extends trackObject with only physics added
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
// Collision Manager handles the collisions in the game be first getting, then
// handle the collisions by calling methods on Player and the Pickup.
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
// Level is a standalone class that handles the differences between the two levels.
class Level {
    constructor(game, level, player, currentState) {
        this.game = game;
        this.levelNumber = level;
        this.player = player;
        this.state = currentState;
    }
    getLevelSounds() {
        this.soundEffects = {
            running: this.game.add.audio('running'), // TODO: Find less annoying sounds and implement them
            sliding: this.game.add.audio('sliding'), // TODO: See above
            oomph: this.game.add.audio('oomph'),
            gem: this.game.add.audio('gem')
        };
        this.soundEffects.gem.volume = 0.1;
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
        switch (this.levelNumber) { // Attempted to draw gradient on rect but couldn't get it to work.
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
                this.game.state.start("Win");
                break;
        }
    }
}
// Primary GameState is instantiated by Phaser.
class GameState {
    // Set some states
    init () {
        this.levelNumber = 0;
        this.deathHappened = false;
        this.resurrected = false;
    }
    // Set up world, input and physics.
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
        // Instantiates Level, RouteManager and CollisionManager, calls methods on Level and creates the HUD.
        this.levelNumber++;
        this.levelComplete = false;
        this.level = new Level(this.game, this.levelNumber, this.player, this);

        this.level.getLevelBackgroundColor(this.levelNumber);
        this.level.color.fixedToCamera = true;
        this.level.getLevelDeco(this.levelNumber);

        this.spawnPlayer();
        if (this.resurrected)
        {
            this.levelDistance = this.level.getLevelLength(this.levelNumber) - this.resDistance;
            this.player.pickupCount = this.resPickups;
        } else {
            this.levelDistance = this.level.getLevelLength(this.levelNumber);
            this.player.pickupCount = 0;
        }
        this.player.isAlive = true;
        this.deathHappened = false;
        game.camera.follow(this.player);
        this.spawnFloor();

        this.routeManager = new RouteManager(this.game, this.player, this.level);
        this.collisionManager = new CollisionManager(this.game, this.player, this.routeManager);

        this.game.physics.arcade.gravity.y = 1200;
        this.level.getLevelSounds(this.levelNumber);
        this.createHUD();
    }
    // Update function is called on every tick.
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
        if (this.player.distance <= 0 && this.player.isAlive && !this.levelComplete && !this.player.stopped) {
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
        this.player = new Player(this.game, 416, 0, this.level);
        this.game.add.existing(this.player);
        game.physics.arcade.enable(this.player);
        this.player.stopped = false;

    }
    // Spawn the floor (grass) after the player so it renders in front
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
                this.player.isSliding = true;
                this.player.isJumping = false;
            }
        }else {
            this.player.isSliding = false;
        }
    }
    onDeath() {
        this.level.soundEffects.oomph.play();
        this.game.add.tween(this.player)
            .to({x: '-50'}, 500, null, true)
            .onComplete.addOnce(this.fadeOut, this);
    }
    fadeOut() {
        var black = this.game.add.image(0,0,'fakefade');
        black.fixedToCamera = true;
        black.width = game.canvas.width;
        black.height = game.canvas.height;
        black.alpha = 0;

        this.game.add.tween(black)
            .to({alpha:1}, 1500, null, true, 500).start()
            .onComplete.addOnce(function () {

            if (this.player.pickupCount >= 10 && !this.resurrected) {
                this.resurrectScreen();
            } else {
                this.gameOver();
            }

        },this);
    }
    resurrectScreen() { // Make a bunch of text for the resurrect screen
        this.textGroup = this.game.add.group();
        var youDiedText = game.add.text(game.canvas.width / 2, game.canvas.height / 2 - 80, "You died with " + this.player.pickupCount + " gems",
            {font: "50px YozakuraLight", fill: "#ffffff", align: "center"}, this.textGroup);
        youDiedText.anchor.set(0.5);
        var useGemsText = game.add.text(game.canvas.width / 2, game.canvas.height / 2 + 20, "Would you like to use 10 to resurrect once?",
            {font: "30px YozakuraLight", fill: "#ffffff", align: "center"}, this.textGroup);
        useGemsText.anchor.set(0.5);

        var resurrectText = game.add.text(game.canvas.width / 2 - 50, game.canvas.height / 2 + 200, "Resurrect",
            {font: "50px YozakuraLight", fill: "#ffffff", align: "right"}, this.textGroup);
        resurrectText.anchor.set(1);
        resurrectText.inputEnabled = true;

        resurrectText.events.onInputUp.add(function () {
            this.resurrect();
        }, this);
        resurrectText.events.onInputOver.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#C1A1FF", align: "right"});
        });
        resurrectText.events.onInputOut.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#ffffff", align: "right"})
        });


        var restartText = game.add.text(game.canvas.width / 2 + 50, game.canvas.height / 2 + 200, "Restart",
            {font: "50px YozakuraLight", fill: "#ffffff", align: "left"}, this.textGroup);
        restartText.anchor.set(0, 1);
        restartText.inputEnabled = true;

        restartText.events.onInputUp.add(function () {
            game.state.start("GameState");
        }, this);
        restartText.events.onInputOver.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#C1A1FF", align: "right"});
        });
        restartText.events.onInputOut.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#ffffff", align: "right"})
        });


        this.textGroup.fixedToCamera = true;

    }
    // Get ready for resurrect and then reload level
    resurrect() {
        this.resurrected = true;
        this.resDistance = this.player.distance;
        this.levelNumber = this.levelNumber - 1;
        this.resPickups = this.player.pickupCount - 10;

        this.loadLevel();
    }
    handleSuccess() {
        this.levelComplete = true;
        this.player.freeze();
        this.player.stopped = true;

        this.black = this.game.add.image(0,0,'fakefade');
        this.black.fixedToCamera = true;
        this.black.width = game.canvas.width;
        this.black.height = game.canvas.height;
        this.black.alpha = 0;

        this.game.add.tween(this.black)
            .to({alpha:1}, 1500, null, true, 500).start()
            .onComplete.addOnce(function () {
            this.level.getLevelComplete(this.levelNumber); // Get end of level behavior
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


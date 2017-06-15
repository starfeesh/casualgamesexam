
class Load{
    constructor() {
        this.ready = false;
        this.music = {};
    }
    addGameStates () {

        game.state.add("Load", Load);
        game.state.add("Menu", Menu);
        game.state.add("GameState", GameState);
        game.state.add("GameOver", GameOver);
        game.state.add("Win", Win);
    }
    loadScripts () {
        game.load.script('game', 'js/game.js');
        game.load.script('gameover', 'js/gameover.js');
        game.load.script('mainmenu', 'js/menu.js');
        game.load.script('winscreen', 'js/win.js');
    }
    preload () {
        this.loadScripts();
        this.preloader = this.add.sprite((game.canvas.width / 2) - 128, game.world.centerY, 'preloader');
        this.load.setPreloadSprite(this.preloader);

        // Load everything!
        game.load.image('menubg', 'assets/img/menu.png');
        game.load.image('menufg', 'assets/img/menufg.png');
        game.load.image('fakefade', 'assets/img/fakefade.png');
        game.load.atlasJSONHash('player', 'assets/img/player.png', 'assets/json/player.json');
        game.load.image('lvl1bg', 'assets/img/level01/back.png');
        game.load.image('lvl1mg', 'assets/img/level01/mid.png');
        game.load.image('lvl1mfg', 'assets/img/level01/midfore.png');
        game.load.image('lvl2bg', 'assets/img/level02/bg.png');
        game.load.image('lvl2mg', 'assets/img/level02/mg.png');
        game.load.image('lvl2mfg', 'assets/img/level02/mfg.png');
        game.load.image('grass', 'assets/img/level01/grass.png');
        game.load.image('moon1', 'assets/img/level01/moon.png');
        game.load.image('moon2', 'assets/img/level02/moon.png');
        game.load.image('winbg', 'assets/img/win.png');

        game.load.image('slide1', 'assets/img/slide1.png');
        game.load.image('slide2', 'assets/img/slide2.png');
        game.load.image('slide3', 'assets/img/slide3.png');
        game.load.image('slide4', 'assets/img/slide4.png');
        game.load.image('slide5', 'assets/img/slide5.png');
        game.load.image('slide6', 'assets/img/slide6.png');
        game.load.image('slide7', 'assets/img/slide7.png');
        game.load.image('slide8', 'assets/img/slide8.png');
        game.load.image('jumpbottom', 'assets/img/jumpbottom.png');
        game.load.image('jumptop', 'assets/img/jumptop.png');
        game.load.image('jumpmid', 'assets/img/jumpmid.png');
        game.load.image('pickup', 'assets/img/pickup.png');

        game.load.audio('running', 'assets/audio/mix.mp3'); // Freesound.org
        game.load.audio('gem', 'assets/audio/gem-ping.wav'); // Freesound.org
        game.load.audio('sliding', 'assets/audio/slide.mp3'); // Youtube audio library
        game.load.audio('oomph', 'assets/audio/foomph08.wav'); // Ultima Online sound
        game.load.audio('bgmusic', 'assets/audio/bgmusic.mp3'); // Youtube Zen Music

        game.load.json('data', 'assets/json/chunks.json');

        game.load.image('font', 'assets/img/hudtext.png');
    }
    loadingText() {
        var txt = game.add.text(game.world.centerX, game.world.centerY - 50, "Loading", {font: "50px YozakuraLight", fill: "#5D4A93", align: "center"});
        txt.anchor.set(0.5);
        txt.alpha = 1;

        this.game.add.tween(txt)
            .to({alpha: 0.1}, 1000, null, true)
            .onComplete.addOnce(function () {
            this.state.start('Menu');
        }, this);
    }
    create () {
        this.addGameStates();
        this.loadingText();
        this.addBackgroundMusic();
    }
    update() {
        if (this.cache.isSoundDecoded('bgmusic') && !this.ready)
        {
            this.ready = true;
            //this.state.start('GameState');
        }
    }
    addBackgroundMusic() {
        this.music = game.add.audio('bgmusic');
        this.music.loop = true;
        this.music.volume = 0.2;
        this.music.play();

    }
}

game.state.add('Load', Load);
game.state.start('Load');
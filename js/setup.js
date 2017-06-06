var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game'), Setup = function () {};

Setup.prototype = {
    addGameStates: function () {

        game.state.add("Setup", Setup);
        game.state.add("GameState", GameState);
    },
    loadScripts: function () {
        game.load.script('game', 'js/game.js');
    },
    preload: function () {
        this.loadScripts();
    },
    create: function () {
        this.addGameStates();
        game.state.start('GameState');
    }
};

game.state.add('Setup', Setup);
game.state.start('Setup');
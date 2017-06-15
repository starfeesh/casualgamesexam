// Hi Jonas or Peter (or other teacher), my code is all wound
// up in Phaser states, but the majority of the game is in:
// http://kea.starfeesh.com/casualgames/twilightescape/js/game.js


class Boot {
    preload() {
        this.load.image('preloader', 'assets/img/preloader.png');
        game.load.script('Load',  'js/load.js');
    }

    create() {
        game.state.add('Load', Load);
        game.state.start('Load');
    }
}

var game = new Phaser.Game(832, 480, Phaser.AUTO, 'game');
window.onload = function () {
    game.state.add('BootState', Boot);
    game.state.start('BootState');
};
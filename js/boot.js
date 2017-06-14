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
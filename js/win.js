class Win {
    create() {
        this.createVisuals();
    }
    createVisuals() {
        this.game.add.image(0,0,'winbg');
        this.winPlayer = game.add.sprite(-100,game.canvas.height - 10, 'player');
        this.game.add.image(0,0,'grass');
        this.winPlayer.anchor.set(0.5,1);
        this.game.add.existing(this.winPlayer);
        this.winPlayer.animations.add('run', Phaser.Animation.generateFrameNames('run_', 0, 7, '', 3), 8, true);
        this.winPlayer.animations.play('run');

        this.game.add.tween(this.winPlayer)
            .to({x: game.canvas.width + 100}, 6000, null, true)
            .onComplete.addOnce(function () {
            this.game.camera.fade("#000000", 1500);
            this.game.camera.onFadeComplete.addOnce(function () {
                game.state.start("Menu")
            })
        }, this)
    }
}
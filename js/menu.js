class Menu {
    create() {
        this.createVisuals();
        this.createMenu();
    }
    createVisuals() {
        this.game.add.image(0,0,'menubg');
        this.staticPlayer = game.add.sprite(50,game.canvas.height - 10, 'player');
        this.game.add.image(0,0,'menufg');
        this.staticPlayer.anchor.set(0.5,1);
        this.game.add.existing(this.staticPlayer);
        this.staticPlayer.animations.add('idle', Phaser.Animation.generateFrameNames('idle_', 0, 11, '', 3), 4, true);
        this.staticPlayer.animations.play('idle');
    }
    createMenu(){
        var txt = game.add.text(200, 350, "Play", {font: "60px YozakuraLight", fill: "#C1A1FF", align: "center"});
        txt.inputEnabled = true;
        txt.events.onInputUp.add(function () {
            game.state.start('GameState');
        });
        txt.events.onInputOver.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "60px YozakuraLight", fill: "#FFFFFF", align: "center"});
        });
        txt.events.onInputOut.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "60px YozakuraLight", fill: "#C1A1FF", align: "center"})
        });
    }
}
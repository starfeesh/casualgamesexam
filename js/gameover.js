// Half-followed guide on Phaser states to produce different game states and text
class GameOver {
    gameOverText() {
        var txt = game.add.text(game.canvas.width / 2, game.canvas.height / 2 - 80, "Game Over", {font: "70px YozakuraLight", fill: "#ffffff", align: "center"});
        txt.anchor.set(0.5);
    }
    restartText(text, functionToCall) {
        var txt = game.add.text(game.canvas.width / 2, game.canvas.height / 2 + 50, text, {font: "50px YozakuraLight", fill: "#ffffff", align: "center"});
        txt.anchor.set(0.5);
        txt.inputEnabled = true;

        txt.events.onInputUp.add(functionToCall);
        txt.events.onInputOver.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#C1A1FF", align: "center"});
        });
        txt.events.onInputOut.add(function (hoverTarget) {
            hoverTarget.setStyle({font: "50px YozakuraLight", fill: "#ffffff", align: "center"})
        });
    }
    create() {
        this.gameOverText();
        this.restartText('Restart', function () {
            game.state.start("GameState");
        })
    }
}
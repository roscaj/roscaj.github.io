/// <reference path="../typescript/phaser.comments.d.ts" />
var Game = /** @class */ (function () {
    function Game() {
        var conf = {
            enableDebug: true,
            transparent: false,
            antialias: true,
            preload: this.preload,
            create: this.create
        };
        this.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'content', conf, false, true, null);
    }
    Game.prototype.preload = function () {
        this.game.load.image('logo', 'phaser2.png');
    };
    Game.prototype.create = function () {
        var logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 0.5);
    };
    Game.prototype.update = function () {
    };
    Game.prototype.render = function () {
    };
    return Game;
}());
window.onload = function () {
    var game = new Game();
};

var Sokolike;
(function (Sokolike) {
    function assert(expr) {
        if (!expr) {
            throw "assertion failed:" + String(expr);
        }
    }
    Sokolike.assert = assert;
})(Sokolike || (Sokolike = {}));
/// <reference path="util.ts" />
var Sokolike;
(function (Sokolike) {
    let TileType;
    (function (TileType) {
        TileType[TileType["EMPTY"] = 0] = "EMPTY";
        TileType[TileType["OBSTACLE"] = 1] = "OBSTACLE";
        TileType[TileType["FLOOR_LIGHT_BLUE"] = 2] = "FLOOR_LIGHT_BLUE";
        TileType[TileType["FLOOR_SOLID_BLUE"] = 3] = "FLOOR_SOLID_BLUE";
        TileType[TileType["FLOOR_LIGHT_RED"] = 4] = "FLOOR_LIGHT_RED";
        TileType[TileType["FLOOR_SOLID_RED"] = 5] = "FLOOR_SOLID_RED";
        TileType[TileType["INVALID"] = 6] = "INVALID";
    })(TileType = Sokolike.TileType || (Sokolike.TileType = {}));
    ;
    class Level {
        constructor(mapString) {
            var lines = mapString.split(/\n|\r\n|\r/);
            var width = 0;
            var split = lines.map(line => {
                var xs = line.split(/\s+/).filter(Boolean); //prevent empty
                width = Math.max(width, xs.length);
                return xs;
            });
            this.size = new Phaser.Point(width, lines.length);
            this.tileTypes = new Array(this.size.x * this.size.y);
            for (var i = 0; i < lines.length; i++) {
                if (split[i].length < width) {
                    throw "line " + i + " has fewer lines than the width of the map";
                }
                for (var j = 0; j < split[i].length; j++) {
                    var ov = split[i][j];
                    var v = ov.toUpperCase();
                    var t = TileType.INVALID;
                    var err;
                    if (v.length == 1) {
                        if (v === '0')
                            t = TileType.EMPTY;
                        else if (v === 'W')
                            t = TileType.OBSTACLE;
                        else if (v === 'B')
                            t = TileType.FLOOR_LIGHT_BLUE;
                        else if (v === 'R')
                            t = TileType.FLOOR_LIGHT_RED;
                    }
                    else if (v.length == 2) {
                        if (v === "BS") {
                            if (this.blueStart)
                                throw "duplicate blue start";
                            else
                                this.blueStart = new Phaser.Point(j, i);
                            t = TileType.FLOOR_SOLID_BLUE;
                        }
                        else if (v === "RS") {
                            if (this.redStart)
                                throw "duplicate red start";
                            else
                                this.redStart = new Phaser.Point(j, i);
                            t = TileType.FLOOR_SOLID_RED;
                        }
                        else if (v === "BE") {
                            if (this.blueEnd)
                                throw "duplicate blue end";
                            else
                                this.blueEnd = new Phaser.Point(j, i);
                            t = TileType.FLOOR_LIGHT_BLUE;
                        }
                        else if (v === "RE") {
                            if (this.redEnd)
                                throw "duplicate red end";
                            else
                                this.redEnd = new Phaser.Point(j, i);
                            t = TileType.FLOOR_LIGHT_RED;
                        }
                    }
                    if (t == TileType.INVALID)
                        throw "line " + i + "invalid symbol: " + ov;
                    else
                        this.setTileTypeAt(j, i, t);
                }
            }
        }
        getTileTypeAt(x, y) {
            Sokolike.assert(x >= 0 && x < this.size.x);
            Sokolike.assert(y >= 0 && y < this.size.y);
            return this.tileTypes[y * this.size.x + x];
        }
        setTileTypeAt(x, y, t) {
            Sokolike.assert(x >= 0 && x < this.size.x);
            Sokolike.assert(y >= 0 && y < this.size.y);
            this.tileTypes[y * this.size.x + x] = t;
        }
    }
    Sokolike.Level = Level;
})(Sokolike || (Sokolike = {}));
/// <reference path="../typescript/phaser.comments.d.ts" />
/// <reference path="../typescript/phaser.plugin.isometric.d.ts" />
/// <reference path="util.ts" />
/// <reference path="level.ts" />
var Sokolike;
(function (Sokolike) {
    const HALF_TILE = 178 * 0.5;
    class InGameState extends Phaser.State {
        constructor() {
            super();
            this.level = null;
            this.cubes = null;
            this.error = null;
        }
        /**
        * init is the very first function called when your State starts up. It's called before preload, create or anything else.
        * If you need to route the game away to another State you could do so here, or if you need to prepare a set of variables
        * or objects before the preloading starts.
        */
        init(...args) {
            this.iso = this.game.plugins.add(Phaser.Plugin.Isometric, this.game);
        }
        /**
        * preload is called first. Normally you'd use this to load your game assets (or those needed for the current State)
        * You shouldn't create any objects in this method that require assets that you're also loading in this method, as
        * they won't yet be available.
        */
        preload() {
            //this.game.load.image('logo', 'phaser2.png');
            this.game.world.setBounds(0, 0, 1024, 1024);
            this.iso.projector.anchor.setTo(0.4, 0.1);
            this.iso.projector.projectionAngle = Math.atan(1 / 1.75); //resets transform
            //load images to cache
            this.game.load.image("tile-light-blue", "images/tile_light_blue.png");
            this.game.load.image("tile-solid-blue", "images/tile_solid_blue.png");
            this.game.load.image("tile-light-red", "images/tile_light_red.png");
            this.game.load.image("tile-solid-red", "images/tile_solid_red.png");
            this.game.load.image("tile-pillar", "images/tile_gray_pillar.png");
            this.game.load.image("cube-red", "images/tile_cube_red.png");
            this.game.load.image("cube-blue", "images/tile_cube_blue.png");
            this.game.load.text("level_src", "map/example_map.txt", null);
        }
        /**
        * loadRender is called during the Loader process. This only happens if you've set one or more assets to load in the preload method.
        * The difference between loadRender and render is that any objects you render in this method you must be sure their assets exist.
        */
        loadRender() {
            this.game.debug.text("loading data", this.game.width / 2, this.game.width / 2, "#AAA");
        }
        /**
        * loadUpdate is called during the Loader process. This only happens if you've set one or more assets to load in the preload method.
        */
        loadUpdate() {
        }
        /**
        * create is called once preload has completed, this includes the loading of any assets from the Loader.
        * If you don't have a preload method then create is the first method called in your State.
        */
        create() {
            this.floorGroup = this.game.add.group(this.game.world, "floors", false, false);
            this.obstacleGroup = this.game.add.group(this.game.world, "obstacles", false, false);
            this.cubeGroup = this.game.add.group(this.game.world, "cubes", false, false);
            try {
                this.level = new Sokolike.Level(this.cache.getText("level_src"));
                const sx = HALF_TILE * 1.3;
                const sy = HALF_TILE * 1.3;
                const ax = 0.5;
                const ay = 0.5;
                var blueCubeSprite = this.iso.addIsoSprite(this.level.blueStart.x * sx, this.level.blueStart.y * sy, 0, "cube-blue", 0, this.cubeGroup);
                blueCubeSprite.anchor.setTo(ax, ay);
                var redCubeSprite = this.iso.addIsoSprite(this.level.redStart.x * sx, this.level.redStart.y * sy, 0, "cube-red", 0, this.cubeGroup);
                redCubeSprite.anchor.setTo(ax, ay);
                //Phaser.Plugin.Isometric.Body.renderBodyInfo(this.game.debug, blueCubeSprite.body);
                //blueCubeSprite.
                //var bod: Phaser.Plugin.Isometric.Body = blueCubeSprite.body;
                //bod.
                this.cubes = [blueCubeSprite, redCubeSprite];
                var tile = null;
                for (var i = 0; i < this.level.size.y; i++) {
                    for (var j = 0; j < this.level.size.x; j++) {
                        switch (this.level.getTileTypeAt(j, i)) {
                            case Sokolike.TileType.EMPTY:
                                break;
                            case Sokolike.TileType.OBSTACLE:
                                tile = this.iso.addIsoSprite(j * sx, i * sy, 0, "tile-pillar", 0, this.obstacleGroup);
                                tile.anchor.set(ax, ay);
                                break;
                            case Sokolike.TileType.FLOOR_LIGHT_BLUE:
                                tile = this.iso.addIsoSprite(j * sx, i * sy, 0, "tile-light-blue", 0, this.obstacleGroup);
                                tile.anchor.set(ax, ay);
                                break;
                            case Sokolike.TileType.FLOOR_SOLID_BLUE:
                                tile = this.iso.addIsoSprite(j * sx, i * sy, 0, "tile-solid-blue", 0, this.obstacleGroup);
                                tile.anchor.set(ax, ay);
                                break;
                            case Sokolike.TileType.FLOOR_LIGHT_RED:
                                tile = this.iso.addIsoSprite(j * sx, i * sy, 0, "tile-light-red", 0, this.obstacleGroup);
                                tile.anchor.set(ax, ay);
                                break;
                            case Sokolike.TileType.FLOOR_SOLID_RED:
                                tile = this.iso.addIsoSprite(j * sx, i * sy, 0, "tile-solid-red", 0, this.obstacleGroup);
                                tile.anchor.set(ax, ay);
                                break;
                        }
                    }
                }
            }
            catch (e) {
                this.error = "failed to load level: " + String(e);
            }
        }
        /**
        * This method will be called if the core game loop is paused.
        */
        paused() {
            this.game.debug.text("paused", this.game.width / 2, this.game.width / 2, "#AAA");
        }
        /**
        * pauseUpdate is called while the game is paused instead of preUpdate, update and postUpdate.
        */
        pauseUpdate() {
        }
        /**
        * The preRender method is called after all Game Objects have been updated, but before any rendering takes place.
        */
        preRender() {
        }
        /**
        * Nearly all display objects in Phaser render automatically, you don't need to tell them to render.
        * However the render method is called AFTER the game renderer and plugins have rendered, so you're able to do any
        * final post-processing style effects here. Note that this happens before plugins postRender takes place.
        */
        render() {
            if (this.error) {
                this.game.debug.text(this.error, 10, this.game.width / 2, "#AAA");
            }
            /*var context = this.game.debug.context;
            var proj = this.iso.projector;
            var P3 = Phaser.Plugin.Isometric.Point3;
    
            var p0 = proj.project(new P3(  0,   0,   0));
            var p1 = proj.project(new P3(100,   0,   0));
            var p2 = proj.project(new P3(100, 100,   0));
            var p3 = proj.project(new P3(0,   100,   0));
    
            context.moveTo(p0.x, p0.y);
            context.beginPath();
            context.strokeStyle = "#CCC";
    
            context.lineTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.lineTo(p3.x, p3.y);
            context.stroke();
            context.closePath();*/
        }
        /**
        * If your game is set to Scalemode RESIZE then each time the browser resizes it will call this function, passing in the new width and height.
        */
        resize() {
        }
        /**
        * This method will be called when the core game loop resumes from a paused state.
        */
        resumed() {
        }
        /**
        * This method will be called when the State is shutdown (i.e. you switch to another state from this one).
        */
        shutdown() {
        }
        /**
        * The update method is left empty for your own use.
        * It is called during the core game loop AFTER debug, physics, plugins and the Stage have had their preUpdate methods called.
        * It is called BEFORE Stage, Tweens, Sounds, Input, Physics, Particles and Plugins have had their postUpdate methods called.
        */
        update() {
        }
    }
    Sokolike.InGameState = InGameState;
})(Sokolike || (Sokolike = {}));
window.onload = () => {
    var inGame = new Sokolike.InGameState();
    //uses HTML5 Canvas as opposed to WebGL
    //appends itself to DOM element 'content'
    this.game = new Phaser.Game(800, 600, Phaser.CANVAS, 'canvas-ontent', inGame, false, true, null);
};
//# sourceMappingURL=/home/jr/sokolike/src/main.js.map
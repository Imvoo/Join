var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.AUTO, '', { preload: preload, create:create, update:update });

var t;

function preload() {
    
}

function create() {
    game.stage.disableVisibilityChange = true;
    
    var text = "Hello world!";
    var style = { font: "60px   Arial", fill:"White" };
    
    t = game.add.text(game.world.centerX, screenHeight/2, text, style);
    t.moveLeft = true;
}

function update() {
    if (t.x > 0 && t.moveLeft) {
        t.x -= 5
    }
    else {
        t.moveLeft = false;
    }
    
    if (t.moveLeft == false) {
        t.x += 5
        if (t.x + t.width > 800) {
            t.moveLeft = true;
        }
    }
}
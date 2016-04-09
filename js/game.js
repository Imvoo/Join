var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.CANVAS, '', { preload: preload, create:create, update:update });

var t;
var character;
var keyInput;

function preload() {
	game.load.image("char", "../img/circle.png");
	game.load.image("background", "../img/background.png");
}

function create() {
	game.stage.disableVisibilityChange = true;
	game.stage.backgroundColor = "#ffffff";
	game.add.image(0, 0, "background");
		
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.defaultRestitution = 0;
	game.physics.p2.gravity.y = 980;
		
	var text = "Hello world!";
	var style = { font: "60px   Arial", fill:"Black" };
	
	t = game.add.text(game.world.centerX, screenHeight/2, text, style);
	t.moveLeft = true;
	
	character = game.add.sprite(200, 200, "char");
	game.physics.p2.enable(character);
	character.body.fixedRotation = true;
	
	keyInput = game.input.keyboard.createCursorKeys();
	
}

function update() {
	MoveText();
	
	if (keyInput.up.isDown) {
		Jump(character);
	}
}

function Jump(object) {
	object.body.velocity.y = -400;
}

function MoveText() {
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
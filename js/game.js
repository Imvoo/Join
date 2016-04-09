var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.CANVAS, '', { preload: preload, create:create, update:update });

var textJoin;
var character;
var keyInput;

var walls = [];
var wallsGap = 150;
var wallSpeed = 5;

function preload() {
	game.load.image("char", "../img/circle.png");
	game.load.image("background", "../img/background.png");
	game.load.image("wall", "../img/wall.png");
}

function create() {
	game.stage.disableVisibilityChange = true;
	game.stage.backgroundColor = "#ffffff";
	game.add.image(0, 0, "background");
		
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.defaultRestitution = 0;
	game.physics.p2.gravity.y = 980;
	
	game.input.addPointer();
		
	var text = "// Join | Click up arrow to jump!";
	var style = { font: "20px Arial", fill:"Black" };
	
	textJoin = game.add.text(game.world.width - 10, 10, text, style);
	textJoin.x -= textJoin.width;
	
	character = game.add.sprite(200, 200, "char");
	game.physics.p2.enable(character);
	character.body.fixedRotation = true;
	character.body.gravity.y = 960;
	
	keyInput = game.input.keyboard.createCursorKeys();
	
	// Collision groups!
	var playerCollisionGroup = game.physics.p2.createCollisionGroup();
	var wallsCollisionGroup = game.physics.p2.createCollisionGroup();
	
	
	wall1 = game.add.sprite(700, 50, "wall");
	wall2 = game.add.sprite(700, 50, "wall");
	
	walls.push(wall1, wall2);
	
	walls.forEach(function (item) {
		item.width = 50;
		// item.physicsBodyType = Phaser.Physics.P2JS;
		// game.physics.p2.enable(item, false);
		// item.body.setCollisionGroup(wallsCollisionGroup);
		// item.body.motionState = 2;
		// item.body.data.gravityScale = 0;
		// item.body.fixedRotation = true;
		// item.body.static = true;
		// item.body.setCollisionGroup(wallsCollisionGroup);
		// item.body
	});
	
	PositionWalls(walls);

	
	
	// game.physics.p2.updateBoundsCollisionGroup();
}

function update() {	
	if (keyInput.up.isDown || game.input.pointer1.isDown) {
		Jump(character);
	}
	
	MoveWalls(walls);
}

function Jump(object) {
	object.body.velocity.y = -400;
}

function MoveWalls(walls) {
	walls.forEach(function (item) {
		item.x -= wallSpeed;
	});
	
	if (walls[0].x + walls[0].width < 0) {
		PositionWalls(walls);
	}
}

function PositionWalls(walls) {
	var randAmount = Math.floor((screenHeight - 200) * Math.random());
	walls[0].y = 50 + randAmount - walls[0].height;
	walls[1].y = randAmount + wallsGap;
	
	walls[0].x = screenWidth + 50;
	walls[1].x = screenWidth + 50;
}

// function MoveText() {
// 	if (t.x > 0 && t.moveLeft) {
// 		t.x -= 5
// 	}
// 	else {
// 		t.moveLeft = false;
// 	}
	
// 	if (t.moveLeft == false) {
// 		t.x += 5
// 		if (t.x + t.width > 800) {
// 			t.moveLeft = true;
// 		}
// 	}    
// }
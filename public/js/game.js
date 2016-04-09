var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.CANVAS, '', { preload: preload, create:create, update:update });

var textJoin;
var character;
var keyInput;

var style = { font: "20px Arial", fill:"Black" };

var deathText;

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
	});
	
	PositionWalls(walls);
}

function update() {	
	if (keyInput.up.isDown || game.input.pointer1.isDown) {
		Jump(character);
	}
	
	MoveWalls(walls);
	
	var collided = CheckCollision();
	if (collided == true) {  
		var style = { font: "20px Arial", fill:"Black" };
		deathText = game.add.text(0,0,"You have died!",style);
		character.kill();
	}
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

function CheckCollision() {
	var corners = GetCorners(character);
	var finished = false;

	walls.forEach(function(item) {
		var boxCorners = GetNormalCorners(item);
		
		for (var i = 0; i < 4; i++) {
			if (finished == false) {
				if (corners[i][0] > boxCorners[0] &&
				corners[i][0] < boxCorners[1] && 
				corners[i][1] > boxCorners[2] && 
				corners[i][1] < boxCorners[3]) {
							finished = true;
						}
			}
		}
	});
	
	return finished;
}

function GetCorners(item) {
	var corners = [[item.x, item.y], [item.x + item.width, item.y], [item.x, item.y + item.height], [item.x + item.width, item.y + item.height]]; 
	return corners
}

function GetNormalCorners(item) {
	return [item.x, item.x + item.width, item.y, item.y + item.height]
}
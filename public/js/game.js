var socket;

var id = Math.floor(Math.random() * 1000000);

var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.CANVAS, '', { preload: preload, create:create, update:update });
var background;

var textJoin;
var character;
var keyInput;

var style = { font: "20px Arial", fill:"White" };

var deathText;

var walls = [];
var wallsGap = 150;
var wallSpeed = 5;

var randAmount;

var deadList = [];

var playerCollisionGroup;

var allPlayers = [];

var startGameNow;

function preload() {
	game.load.image("char", "../img/turkey_small.png");
	game.load.image("background", "../img/background_real2x.png");
	game.load.image("wall", "../img/wall.png");
}

function create() {
	randAmount = 200;

    socket = io.connect("http://167.160.162.247:2345");

	game.stage.disableVisibilityChange = true;
	game.stage.backgroundColor = "#ffffff";
	// game.add.image(0, 0, "background");
	background = game.add.tileSprite(0,0,800,600,'background');

	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.defaultRestitution = 0;
	game.physics.p2.gravity.y = 980;

	game.input.addPointer();

	var text = "// Join | Click up arrow to jump!";

	textJoin = game.add.text(game.world.width - 10, 10, text, style);
	textJoin.x -= textJoin.width;

	var shift = Math.floor(Math.random() * 170);

	character = game.add.sprite(30 + shift, 200, "char");
	game.physics.p2.enable(character);
	character.body.fixedRotation = true;
	character.body.setRectangle(0,0);

	keyInput = game.input.keyboard.createCursorKeys();

	// Collision groups!
	playerCollisionGroup = game.physics.p2.createCollisionGroup();
	var wallsCollisionGroup = game.physics.p2.createCollisionGroup();
    game.physics.p2.updateBoundsCollisionGroup();


	wall1 = game.add.sprite(900, 50, "wall");
	wall2 = game.add.sprite(900, 50, "wall");

	walls.push(wall1, wall2);

	walls.forEach(function (item) {
		item.width = 50;
	});

	PositionWalls(walls);

    allPlayers.push([id, character, shift+30]);
    character.body.setCollisionGroup(playerCollisionGroup);
	character.isJumping = false;

	socket.emit('new player', [id, 30+shift]);

	startGameNow = false;

    SetupIOConnections();
}

var SetupIOConnections = function() {
    socket.on('players', CreatePlayer);
    socket.on('delete player', DeletePlayer);
    socket.on('jump', JumpPlayer);
	socket.on('player death', KillPlayer);
	socket.on('start', StartGame);
	socket.on('deadList', UpdateDeadlist);
	socket.on('gap update', UpdateGap);

	// Netcode is really bad atm...
	// socket.on('player positions', UpdatePositions);
}

function UpdateGap(gapRange) {
	randAmount = gapRange;
	console.log("updated gap");
}

function UpdateDeadlist(newID) {
	deadList = newID;
}

function StartGame(arg) {
	console.log("startin");
	startGameNow = true;
}

function UpdatePositions(data) {
	data.forEach(function(row) {
		allPlayers.forEach(function(player) {
			if (row[0] == player[0] && row[0] != id) {
				player[1].body.x = row[1];
				player[1].body.y = row[2];
			}
		});
	});
}

function KillPlayer(newID) {
    for (var i = 0; i < allPlayers.length; i++) {
		if (allPlayers[i][0] == newID) {
            allPlayers[i][1].kill();
            break;
        }
    }
}

function JumpPlayer(newID) {
    for (var i = 0; i < allPlayers.length; i++) {
        if (allPlayers[i][0] == newID) {
            Jump(allPlayers[i][1]);
            break;
        }
    }
}

function CreatePlayer(newID) {
    newID.forEach(function(singleID) {
        var hasDone = false;
		var isDead = false;
        allPlayers.forEach(function(oldID) {
           if (singleID[0] == oldID[0]) {
               hasDone = true;
           }
		   if (deadList.indexOf(singleID[0]) != -1) {
			   isDead = true;
		   }
        });
        if (hasDone == false) {
            var newChar = game.add.sprite(singleID[1], 200, "char");
            game.physics.p2.enable(newChar);
            allPlayers.push([singleID[0], newChar, singleID[1]]);
            newChar.body.setRectangle(0,0);
            newChar.body.setCollisionGroup(playerCollisionGroup);
			newChar.body.fixedRotation = true;
			newChar.alpha = 0.4;

			if (isDead) {
				newChar.kill();
			}
        }
    });

    UpdateHeaderText();
}

function UpdateHeaderText() {
    textJoin.text = "// Join | Click up arrow to jump! | Connected: " + allPlayers.length.toString();
    textJoin.x = screenWidth - 10 - textJoin.width;
}

function DeletePlayer(newID) {
    for (var i = 0; i < allPlayers.length; i++) {
		console.log(newID[0], id, allPlayers[i][0]);
		if (allPlayers[i][0] == newID[0]) {
            allPlayers[i][1].kill();
            allPlayers.pop(i);
            break;
        }
    }

    UpdateHeaderText();
}

function update() {
	background.tilePosition.x -= 2;

	if ((keyInput.up.isDown || game.input.pointer1.isDown) && character.isJumping == false) {
		Jump(character);
		character.isJumping = true;
        socket.emit('jump', id);
	}

	if (keyInput.up.isUp && game.input.pointer1.isUp) {
		character.isJumping = false;
	}

	if (startGameNow == true) {
		MoveWalls(walls);
	}

	var collided = CheckCollision();
	if (collided == true && character.alive == true) {
		var style = { font: "20px Arial", fill:"White" };
		deathText = game.add.text(0,0,"You have died!",style);
		character.kill();
		socket.emit('player death', id);
	}

    // socket.emit('position', [id, character.x, character.y]);
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
	// var randAmount = Math.floor((screenHeight - 200) * Math.random());
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
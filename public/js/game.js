var socket;

var id = Math.floor(Math.random() * 1000000);

var screenWidth = 800;
var screenHeight = 600;

var game = new Phaser.Game(screenWidth, screenHeight, Phaser.CANVAS, '', { preload: preload, create:create, update:update });
var background;

var shift;

var textJoin;
var character;
var keyInput;

var style = { font: "20px Arial", fill:"White" };
var nameStyle;

var deathText;
var userName;

var emitted;

var walls = [];
var wallsGap = 150;
var wallSpeed = 200;

var randAmount;

var deadList = [];

var playerCollisionGroup;

var allPlayers = [];

var startGameNow;

var urlID;

function preload() {
	game.load.image("char", "../img/turkey_small.png");
	game.load.image("background", "../img/background_real2x.png");
	game.load.image("wall", "../img/wall.png");
}

function create() {
    emitted = false;
    nameStyle = {font: "12px Arial", fill:"White"};
    
    socket = io.connect("http://167.160.162.247:2345", {'multiplex': false});
    socket.emit('identify me');

	startGameNow = false;

    SetupIOConnections();
    
	randAmount = 200;

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

	shift = Math.floor(Math.random() * 170);

	character = game.add.sprite(30 + shift, 200, "char");
	game.physics.p2.enable(character);
	character.body.fixedRotation = true;
	character.body.setRectangle(0,0);
    character.userName = game.add.text(character.x + character.width / 2, character.y - 20, "", nameStyle);
    
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
    
    setInterval(function() {
        socket.emit('position', [id, character.x, character.y]);
    }, 1000/60);
}

var SetupIOConnections = function() {
    socket.on('players', CreatePlayer);
    socket.on('delete player', DeletePlayer);
    socket.on('jump', JumpPlayer);
	socket.on('player death', KillPlayer);
	socket.on('start', StartGame);
	socket.on('deadList', UpdateDeadlist);
	socket.on('gap update', UpdateGap);
	socket.on('identify', Identify);
    socket.on('reset', ResetGame);
    socket.on('position walls', PositionMe);

	// Netcode is really bad atm...
	socket.on('player positions', UpdatePositions);
}

function PositionMe() {
    PositionWalls(walls);
    emitted = false;
}

function ResetGame() {
    startGameNow = false;
    PositionWalls(walls);
    allPlayers.forEach(function(player) {
        player[1].reset(player[2], 200);
    });``
}

function Identify(inUrlID) {
    var nameStyle = {font: "10px Arial", fill:"White"};
    console.log(inUrlID);
    urlID = inUrlID[0];
    userName = inUrlID[1];
    
    character.userName.text = userName;
    socket.emit('new player', [id, 30+shift, userName]);
}

function UpdateGap(gapRange) {
	randAmount = gapRange;
}

function UpdateDeadlist(newID) {
	deadList = newID;
}

function StartGame(arg) {
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
		singleID = singleID[1];
        var hasDone = false;
		var isDead = false;
        allPlayers.forEach(function(oldID) {
		   console.log(singleID, oldID);
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
            newChar.body.setRectangle(0,0);
            newChar.body.setCollisionGroup(playerCollisionGroup);
			newChar.body.fixedRotation = true;
			newChar.alpha = 0.4;

            newChar.userName = game.add.text(0, 0, singleID[2], nameStyle);
            
            allPlayers.push([singleID[0], newChar, singleID[1]]);

			if (isDead == true) {
				newChar.kill();
			}
        }
    });

	console.log("---------");
	console.log(allPlayers);

    UpdateHeaderText();
}

function UpdateHeaderText() {
    textJoin.text = "// Join | Click up arrow to jump! | Connected: " + allPlayers.length.toString();
    textJoin.x = screenWidth - 10 - textJoin.width;
}

function DeletePlayer(newID) {
	console.log("delete under")
	console.log(newID);
    for (var i = 0; i < allPlayers.length; i++) {
		if (allPlayers[i][0] == newID[1][0]) {
            allPlayers[i][1].userName.destroy();
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
    
    UpdateUsernames();
}

function UpdateUsernames() {
    allPlayers.forEach(function(player) {
       if (player[1].alive) {
        player[1].userName.x = player[1].x + (player[1].width / 2) - (player[1].userName.width / 2) - 15;
        player[1].userName.y = player[1].y - 30;
       }
       else {
           player[1].userName.x = -900;
       } 
    });
}

function Jump(object) {
	object.body.velocity.y = -400;
}

function MoveWalls(walls) {
	walls.forEach(function (item) {
		item.x -= wallSpeed * game.time.physicsElapsed;
	});

	if (walls[0].x + walls[0].width < 0 && emitted == false) {
		socket.emit('wall finished');
        emitted = true;
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
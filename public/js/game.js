var socket;

var id = Math.floor(Math.random() * 1000000);

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

var playerCollisionGroup;

var allPlayers = [];

function preload() {
	game.load.image("char", "../img/circle.png");
	game.load.image("background", "../img/background.png");
	game.load.image("wall", "../img/wall.png");
}

function create() {
    socket = io.connect("http://167.160.162.247:2345");
    socket.emit('new player', id);
    
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
	character.body.setRectangle(0,0);
    
	keyInput = game.input.keyboard.createCursorKeys();
	
	// Collision groups!
	playerCollisionGroup = game.physics.p2.createCollisionGroup();
	var wallsCollisionGroup = game.physics.p2.createCollisionGroup();
    game.physics.p2.updateBoundsCollisionGroup();
	
	
	wall1 = game.add.sprite(700, 50, "wall");
	wall2 = game.add.sprite(700, 50, "wall");
	
	walls.push(wall1, wall2);
	
	walls.forEach(function (item) {
		item.width = 50;
	});
	
	PositionWalls(walls);
    
    allPlayers.push([id, character]);
    character.body.setCollisionGroup(playerCollisionGroup);
    
    SetupIOConnections();
}

var SetupIOConnections = function() {
    socket.on('players', CreatePlayer);
    socket.on('kill player', DeletePlayer);
    socket.on('jump', JumpPlayer);
}

function JumpPlayer(id) {
    for (var i = 0; i < allPlayers.length; i++) {
        if (allPlayers[i][0] == id) {
            Jump(allPlayers[i][1]);
            break;
        }
    }    
}

function CreatePlayer(newID) {
    newID.forEach(function(singleID) {
        var hasDone = false;
        allPlayers.forEach(function(oldID) {
            console.log("aP " + oldID);
           if (singleID == oldID[0]) {
               hasDone = true;
           } 
        });
        if (hasDone == false) {
            var newChar = game.add.sprite(200, 200, "char");
            game.physics.p2.enable(newChar);
            // newChar.body.fixedRotation(true);
            allPlayers.push([singleID, newChar]);
            newChar.body.setRectangle(0,0);
            newChar.body.setCollisionGroup(playerCollisionGroup);
        }
    });

    UpdateHeaderText();
}

function UpdateHeaderText() {
    textJoin.text = "// Join | Click up arrow to jump! | Connected: " + allPlayers.length.toString();
    textJoin.x = screenWidth - 10 - textJoin.width;
}

function DeletePlayer(id) {
    console.log(id);
    console.log(allPlayers);
    for (var i = 0; i < allPlayers.length; i++) {
        console.log(allPlayers[i][0], id);
        if (allPlayers[i][0] == id) {
            allPlayers[i][1].kill();
            allPlayers.pop(i);
            break;
        }
    }

    UpdateHeaderText();
}

function update() {	
	if (keyInput.up.isDown || game.input.pointer1.isDown) {
		Jump(character);
        socket.emit('jump', id);
	}
	
	MoveWalls(walls);
	
	var collided = CheckCollision();
	if (collided == true) {  
		var style = { font: "20px Arial", fill:"Black" };
		deathText = game.add.text(0,0,"You have died!",style);
		character.kill();
	}
    
    socket.emit('position', { id: id, x: character.x, y: character.y});
}

function Jump(object) {
	object.body.velocity.y = -400;
}

function MoveWalls(walls) {
	walls.forEach(function (item) {
		// item.x -= wallSpeed;
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
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var allSockets = [];
var players = [];
var positions = [];
var deadList = [];

var count = 0

var startDelay = 10;
var startSeconds = startDelay;

var started = false;
var startedAlive = 0;

var adjectives = [];
var fruits = [];

var inactiveTimer = 60;

var stdin = process.openStdin();
var listener = function() {
	stdin.addListener("data", function(d) {
		d = d.toString().trim()
		if (d == "start") {
			io.emit("start");
			deadList = []
		}
        else if (d == "reset") {
            io.emit("reset");
        }
		// players.push(d);
		// io.emit("players", players)
	});
};

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var value = Math.floor((600 - 200) * Math.random());
io.emit('gap update', value);

setInterval(function() {
	var value = Math.floor((600 - 200) * Math.random());
	io.emit('gap update', value);
}, 5000);

setInterval(function() {
	if (startSeconds <= 0 && started == false) {
		io.emit('start', value);
		startedAlive = players.length;
		startSeconds = startDelay;
		started = true;
		deadList = []
	}
	else if (started == true) {
		io.emit('timer', -1);
	}
	else {
		startSeconds -= 1;
		io.emit('timer', startSeconds)
	}

	if (started == true && startedAlive <= 0) {
			started = false;
			startSeconds = startDelay;
			io.emit('reset')
	}

	players.forEach(function(player) {
		player[2] = player[2] - 1;

		if (player[2] <= 0) {
			io.emit('logout', player[1][0]);
		}
	});
}, 1000);

function CheckInstable(id) {
	setTimeout(function() {
		positions.forEach(function (player) {
			if (player[0] == id) {
				if (player[2] == 200) {
					io.emit('logout', player[0]);
				}
			}
		});
	}, 10000);
}

function determineUsername() {
    var random1 = Math.floor(Math.random() * adjectives.length - 1);
    var random2 = Math.floor(Math.random() * fruits.length - 1);
    var userName = adjectives[random1] + fruits[random2];

    return userName;
}

io.on('connection', function(socket) {
    console.log("Connection: " + socket.id);

    socket.on('wall finished', function() {
        count = count + 1;

        if (count >= startedAlive) {
            io.emit('position walls');
            count = 0;
        }
    });

    socket.on('identify me', function() {
        var random1 = Math.floor(Math.random() * adjectives.length);
        var random2 = Math.floor(Math.random() * fruits.length);
        var userName = adjectives[random1] + fruits[random2];
       	socket.emit('identify', [socket.id, userName, started]);
        socket.emit('deadList', deadList);
	    socket.emit('players', players);
    });

	socket.on('new player', function(id) {
		players.push([socket.id, id, inactiveTimer]);
		socket.broadcast.emit('players', players);
		CheckInstable(id[0]);
	});

	socket.on('jump', function(id) {
		socket.broadcast.emit('jump', id);
	});

	// Data = id, x, y
	socket.on('position', function(data) {
		var stored = false;
		var id = data[0];

		positions.forEach(function(item) {
			if (item[0] == data[0]) {
				item[1] = data[1];
                item[2] = data[2];
				stored = true;
			}
		});

		if (stored == false) {
			positions.push(data);
		}

		players.forEach(function(player) {
			if (player[1][0] == id) {
				player[2] = inactiveTimer;
			}
		})
	});

	socket.on('player death', function(id) {
		deadList.push(id);
		socket.broadcast.emit('player death', id);
		startedAlive -= 1;

		if (startedAlive <= 0 && started == true) {
			started = false;
			startSeconds = startDelay;
			io.emit('reset')
		}
	});

	socket.on('disconnect', function() {
        console.log("Disconnection: " + socket.id)

		var result = null;
		for (var i = 0; i < players.length; i++) {
			if (socket.id == players[i][0]) {
				result = i;
			}
		}

		if (result != null) {
            var index = result;
			result = players[result];
            players.splice(index, 1);

			if (deadList.indexOf(players[1]) == -1) {
				startedAlive -= 1;
			}
		}
		socket.broadcast.emit("delete player", result);

		if (startedAlive <= 0 && started == true) {
			started = false;
			startSeconds = startDelay;
			io.emit('reset');
		}
	});
});

http.listen(2345, function() {
	console.log("Listening on :2345.");
	listener();

    fs.readFile('./adjectives.txt', 'utf8', function(err, data) {
        if (err != null) {
            console.log(err);
        }
        var array = data.toString().split("\n");
        array.forEach(function(line) {
            adjectives.push(line);
        });
    });

    fs.readFile('./fruits.txt', 'utf8', function(err, data) {
        if (err != null) {
            console.log(err);
        }
        var array = data.toString().split("\n");
        array.forEach(function(line) {
            fruits.push(line);
        });
    });

    // NETCODE TOO HARD FOR ME :'(
	setInterval(function() {
		io.emit("player positions", positions)
	}, 1000/5);
});
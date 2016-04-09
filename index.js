var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allSockets = [];
var players = [];
var positions = [];

var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	if (d == "start") {
		io.emit("start");
	}
    // players.push(d);
    // io.emit("players", players)
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function(socket) {
    allSockets.push(socket);
    socket.emit('players', players);

    socket.on('new player', function(id) {
       players.push(id);
       io.emit('players', players);
    });

    socket.on('jump', function(id) {
       socket.broadcast.emit('jump', id);
    });

	// Data = id, x, y
	socket.on('position', function(data) {
		var stored = false;

		positions.forEach(function(item) {
			if (item[0] == data[0]) {
				item = data;
				stored = true;
			}
		});

		if (stored == false) {
			positions.push(data);
		}
	});

	socket.on('player death', function(id) {
		socket.emit("player death", id);
	});

    socket.on('disconnect', function() {
        var i = 0;
        var result;
        allSockets.forEach(function(newSocket) {
           if (socket == newSocket) {
               result = i;
           }
           i += 1;
        });
        allSockets.pop(i);
        var playerID = players.pop(i);
        io.emit("kill player", playerID);
    });

	// NETCODE TOO HARD FOR ME :'(
	// setInterval(function() {
	// 	socket.emit("player positions", positions)
	// }, 1000);
});

http.listen(2345, function() {
   console.log("Listening on :2345.");
});
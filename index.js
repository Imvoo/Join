var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allSockets = [];
var players = [];
var positions = [];
var deadList = [];

var stdin = process.openStdin();
var listener = function() {
	stdin.addListener("data", function(d) {
		d = d.toString().trim()
		if (d == "start") {
			io.emit("start");
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

io.on('connection', function(socket) {
    console.log("Connection: " + socket.id)
	socket.emit('identify', socket.id);
	socket.emit('deadList', deadList);
	socket.emit('players', players);

	socket.on('new player', function(id) {
		players.push([socket.id, id]);
		socket.broadcast.emit('players', players);
	});

	socket.on('jump', function(id) {
		socket.broadcast.emit('jump', id);
	});

	// Data = id, x, y
	// socket.on('position', function(data) {
	// 	var stored = false;

	// 	positions.forEach(function(item) {
	// 		if (item[0] == data[0]) {
	// 			item = data;
	// 			stored = true;
	// 		}
	// 	});

	// 	if (stored == false) {
	// 		positions.push(data);
	// 	}
	// });

	socket.on('player death', function(id) {
		deadList.push(id);
		socket.broadcast.emit('player death', id);
	});
    
    socket.on('identify myself', function(inID) {
        socket.id = inID;
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
			result = players.pop(result);
		}
		socket.broadcast.emit("delete player", result);
		console.log("dcd: " + result);
		console.log(players);
	});

	// NETCODE TOO HARD FOR ME :'(
	// setInterval(function() {
	// 	io.emit("player positions", positions)
	// }, 250);
});

http.listen(2345, function() {
	console.log("Listening on :2345.");
	listener();
});
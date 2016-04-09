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
	allSockets.push(socket);

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
		deadList.push(id);
		socket.broadcast.emit('player death', id);
	});

	socket.on('disconnect', function() {
		var i = 0;
		var result;

		allSockets.forEach(function(newSocket) {
			if (socket.id == newSocket.id) {
				result = i;
			}
			i += 1;
		});

		var tmp = allSockets.pop(result);
		var playerID = players.pop(result);

		for (var j = 0; j < players.length; j++) {
			// console.log(players[j][0], tmp);
			if (players[j][0] == socket.id) {
				playerID = players.pop(j);
			}
		};
		socket.broadcast.emit("delete player", playerID);
		console.log("dcd: " + playerID);
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
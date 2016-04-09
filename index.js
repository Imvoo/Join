var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allSockets = [];
var players = [];

var stdin = process.openStdin();
stdin.addListener("data", function(d) {
    players.push(d);
    io.emit("players", players)
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); 
});

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log("user conn");
    console.log("users:");
    allSockets.push(socket);
    console.log(players);
    socket.emit('players', players);
    
    socket.on('new player', function(id) {
       console.log("player id " + id);
       players.push(id);
       io.emit('players', players);
    });
    
    socket.on('disconnect', function() {
        console.log("disconnect");
        var i = 0;
        var result;
        allSockets.forEach(function(newSocket) {
           if (socket == newSocket) {
               result = i;
           }
           i += 1;
        });
        console.log(result);
        allSockets.pop(i);
        var playerID = players.pop(i);
        io.emit("kill player", playerID);
    });
});

http.listen(2345, function() {
   console.log("Listening on :2345."); 
});
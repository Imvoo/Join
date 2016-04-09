var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allSockets = [];
var players = [];

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); 
});

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log("user conn");
    allSockets.push(socket);
    socket.broadcast.emit('players', players);
    
    socket.on('new player', function(id) {
       console.log("player id " + id);
       players.push(id);
    });
    
    socket.on('disconnect', function() {
        console.log("disconnect");
        var i = allSockets.indexOf(socket);
        var playerID = players.pop(i);
        io.emit("kill player", playerID);
    });
});

http.listen(2345, function() {
   console.log("Listening on :2345."); 
});
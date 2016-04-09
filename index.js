var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); 
});

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log("user conn");
});

http.listen(2345, function() {
   console.log("Listening on :2345."); 
});
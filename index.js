var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendfile('index.html'); 
});

app.use(express.static('public'));

http.listen(2345, function() {
   console.log("Listening on :2345."); 
});
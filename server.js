var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  gm = require('./js/game_manager.js');

// creating the server ( localhost:8000 )
app.listen(1337);

// game manager
var game = new gm.GameManager(4);

// on server started we can load our client.html page
function handler(req, res) {
  res.writeHead(200, {'Content-Type': 'text-plain'});
  res.end("Hello World\n");
}

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
  // push test event
  fs.watch(__dirname + '/example.xml', function(curr, prev) {
    // adding the time of the last update
    var json = {
      'time': new Date(),
      'state': game,
      'metadata': game.actuate_metadata(),
    };
    // send the new data to the client
    socket.volatile.emit('notification', json);
  });

  // receiving input from client
  socket.on('key', function (data) {
    var key = data.key;
    console.log('client key: '+ key);
    game.votes[key]++;
    io.sockets.emit('votes', game.votes);
  });
});

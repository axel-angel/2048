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

function generate_state() {
  return {
    'time': new Date(),
    'state': game,
    'metadata': game.actuate_metadata(),
  };
};

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
  // send state
  socket.emit('update', generate_state());

  // receiving input from client
  socket.on('key', function (data) {
    var key = data.key;
    if ([ 'u', 'l', 'd', 'r', 'reset' ].indexOf(key) == -1) { return; }
    console.log('client key: '+ key);
    game.votes[key]++;
    io.sockets.emit('votes', game.votes);
    if (game.votes[key] >= 3) {
      console.log(['move to:', key]);
      game.move(key);
      // send the new data to the client
      socket.volatile.emit('update', generate_state());
    }
  });
});

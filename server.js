var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  gm = require('./js/game_manager.js');

// creating the server ( localhost:8000 )
app.listen(1337);

// game manager
var game = new gm.GameManager(4);
game.players = 0;

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

function test_votes() {
  var max_key = 'u';
  var max_count = 0;

  for (var key in game.votes) {
    if (game.votes[key] > max_count) {
      max_count = game.votes[key];
      max_key = key;
    }
  }

  if (max_count >= 0.5 * game.players) { // majority
    console.log(['move to:', max_key]);
    game.move(max_key);
    // send the new data to the client
    io.sockets.emit('update', generate_state());
  }
}

// count sockets
io.sockets.on('connect', function () {
  game.players++;
});
io.sockets.on('disconnect', function () {
  game.players--;
});

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
  // send state
  socket.emit('update', generate_state());

  // receiving input from client
  socket.on('key', function (data) {
    socket.get('round', function (err, value) {
      var key = data.key;
      if ([ 'u', 'l', 'd', 'r', 'reset' ].indexOf(key) == -1)
        return; // invalid vote

      if (value != null && value >= game.round)
        return; // already played

      // count the vote
      console.log('client key: '+ key);
      game.votes[key]++;
      this.vote_count++;
      socket.set('round', game.round);
      io.sockets.emit('votes', game.votes);

      // test if vote is sufficient
      test_votes();
    });
  });
});

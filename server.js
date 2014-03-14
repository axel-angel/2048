var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  gm = require('./js/game_manager.js');

// creating the server ( localhost:8000 )
app.listen(1337);

// game manager
var game = new gm.GameManager(4);
function game_players() { return io.sockets.clients().length; }

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
    'connected': game_players(),
    'voted': game.vote_count,
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

  var majority = max_count >= 0.5 * game_players();
  var key = null;
  console.log(['test_vote', max_count, game_players(), game.vote_count, majority]);
  if (game.vote_count >= game_players() && !majority) { // stuck
    console.log('stuck');
    key = 'u';
  }
  else if (majority) { // majority
    key = max_key;
  }

  if (key != null) {
    console.log(['move to:', max_key]);
    game.move(max_key);
    // send the new data to the client
    io.sockets.emit('update', generate_state());
  }
}


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

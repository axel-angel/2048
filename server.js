var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  gm = require('./js/game_manager.js');

// creating the server ( localhost:8000 )
app.listen(1337);
io.set('log level', 1); // reduce logging

// game manager
var game = new gm.GameManager(4);
function game_players() { return io.sockets.clients().length; }

var timeout = 30000;
var game_timer = null;
var game_setTimeout = function () {
  clearTimeout(game_timer);

  game_timer = setTimeout(function () {
    io.sockets.emit('timeout', { 'time': false });
    if (game_players() <= 1) return;

    var most = most_voted();
    var key = null;
    if (most.count == 0) { // play at random
      var dirs = ['u', 'l', 'd', 'r'];
      key = dirs[Math.floor(Math.random()*dirs.length)]; // random
      console.log(['random: ', key]);
    }
    else {
      key = most.key;
      console.log('timeout reached, most: '+ key);
    }

    game.move(key);
    io.sockets.emit('update', generate_state());
    game_setTimeout();
  }, timeout);
  io.sockets.emit('timeout', { 'time': timeout });
};
game_setTimeout();

// on server started we can load our client.html page
function handler(req, res) {
  res.writeHead(200, {'Content-Type': 'text-plain'});
  res.end("Hello World\n");
}

function generate_state() {
  return {
    'state': game,
    'metadata': game.actuate_metadata(),
    'connected': game_players(),
    'round': game.round,
  };
};

function most_voted() {
  var max_key = 'u';
  var max_count = 0;

  for (var key in game.votes) {
    if (game.votes[key] > max_count) {
      max_count = game.votes[key];
      max_key = key;
    }
  }

  return { 'count': max_count, 'key': max_key };
}

function test_votes() {

  var most = most_voted();
  var players_count = game_players();
  var players_novote = players_count - game.vote_count;
  var stuck = (players_count > 2) && (most.count > players_novote);
  var majority = most.count >= (0.5 * players_count);
  var key = null;
  console.log(['test_vote', most.count, players_count, game.vote_count, majority, stuck]);

  if (majority || stuck) { // majority or stuck plays most voted
    key = most.key;
  }

  if (key != null) {
    console.log(['move to:', key]);
    game_setTimeout();
    game.move(key);
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
    var key = data.key;
    if (game.isGameTerminated()) {
      console.log('game restart!');
      game.restart();
      io.sockets.clients().forEach(function (s) {
        s.set('round', null);
      });
      io.sockets.emit('update', generate_state());
    }

    socket.get('round', function (err, value) {
      if ([ 'u', 'l', 'd', 'r', 'reset' ].indexOf(key) == -1)
        return; // invalid vote

      if (value != null && value >= game.round)
        return; // already played

      // count the vote
      console.log('client key: '+ key);
      game.votes[key]++;
      game.vote_count++;
      socket.set('round', game.round);
      io.sockets.emit('votes', game.actuate_metadata());

      // test if vote is sufficient
      test_votes();
    });
  });
});

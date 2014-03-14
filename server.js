var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  gm = require('./js/game_manager.js'),
  ls = require('./js/local_score_manager.js');

// creating the server ( localhost:8000 )
app.listen(1337);

// game manager
var game = new gm.GameManager(4, ls.LocalScoreManager);

// on server started we can load our client.html page
function handler(req, res) {
  res.writeHead(200, {'Content-Type': 'text-plain'});
  res.end("Hello World\n");
}

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
  console.log(__dirname);
  // watching the xml file
  fs.watch(__dirname + '/example.xml', function(curr, prev) {
    // on file change we can read the new xml
    fs.readFile(__dirname + '/example.xml', function(err, data) {
      if (err) throw err;
      // adding the time of the last update
      var json = { 'time': new Date() };
      // send the new data to the client
      socket.volatile.emit('notification', json);
    });
  });
});

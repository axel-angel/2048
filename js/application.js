// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    var actuator = new HTMLActuator();

    // creating a new websocket
    var socket = io.connect('http://localhost:1337');
    var kb = new KeyboardInputManager(socket);

    // on every message recived we print the new datas inside the #container div
    var display_metadata = function (data) {
        console.log(['metadata', data]);
        $('#vote-up').html(data.votes.u);
        $('#vote-right').html(data.votes.r);
        $('#vote-down').html(data.votes.d);
        $('#vote-left').html(data.votes.l);
        $('#vote-reset').html(data.votes.reset);
        $('#vote-count').html(data.voted);
    };
    socket.on('update', function (data) {
        // convert the json string into a valid javascript object
        console.log(['data', data]);
        $('#vote-players').html(data.connected);
        $('#game-round').html(data.round);
        display_metadata(data.metadata);

        actuator.actuate(data.state.grid, data.metadata);
    });
    socket.on('votes', function (data) {
        display_metadata(data);
    });
});

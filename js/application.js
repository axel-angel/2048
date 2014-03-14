// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    var actuator = new HTMLActuator();

    // creating a new websocket
    var socket = io.connect('http://localhost:1337');
    var kb = new KeyboardInputManager(socket);

    // on every message recived we print the new datas inside the #container div
    socket.on('update', function (data) {
        // convert the json string into a valid javascript object
        console.log(['data', data]);
        $('#cdate').html(data.time);
        $('#vote-up').html(data.u);
        $('#vote-right').html(data.r);
        $('#vote-down').html(data.d);
        $('#vote-left').html(data.l);
        $('#vote-reset').html(data.reset);
        $('#vote-players').html(data.connected);
        $('#vote-count').html(data.voted);

        actuator.actuate(data.state.grid, data.metadata);
    });
    socket.on('votes', function (data) {
    });
});

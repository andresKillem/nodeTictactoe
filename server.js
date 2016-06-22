// Require HTTP module (to start server) and Socket.IO
var http = require('http');
var io = require('socket.io');
var querystring = require('querystring');
var gameMod = require('./game');

var port = 8080;
var hostname = '';

//start http
var server = http.createServer(function(req, res){ 

}).listen(port);

//server.listen(port);
console.log('Server listening on port ' + port);

// -------------------------------------------------
// Integration with PHP - Send HTTP Request --------
// -------------------------------------------------

var HttpCallback = function(response) {
  var str = '';
  response.on('data', function (chunk) {
    str += chunk;
  });
  response.on('end', function () {
    console.log('SAVED ON DB');
    var res = JSON.parse(str);
    if (res)
        console.log("PHP Server has saved game status on MySQL");
    else
        console.log("PHP Server has NOT saved game status on MySQL");
    });
};

//logIfEnded
var notifyIfEndGame= function(game, gameId){
    if (game.gameStatus > 10) {
        var form = {
        	'gameId': gameId,
            'gameStatus': game.gameStatus,
            'user1': game.userID1,
            'user2': game.userID2,
        };
        var formData = querystring.stringify(form);
        var contentLength = formData.length;
        var options = {
          headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
            },
          'host': hostname, 
          path: '/endGame',
          method: 'POST'
        };    
        var req = http.request(options, HttpCallback);
        req.write(formData);
        req.end();
        return true;
    }
    return false;
};

var sendMessageForSender = function(socket, tipo, msg){
	var msg = {
		'tipo': tipo,
		'text': msg,
		 };
	socket.emit('gameMessage', msg);
};   

var sendMessageForAll = function(io, gameId, tipo, msg){
	var msg = {
		'tipo': tipo,
		'text': msg,
		 };
	io.in(gameId).emit('gameMessage', msg);
};   

var getEndGameMessage = function (game){
    if (game.gameStatus === undefined)
        return "";
    if (game.gameStatus <= 2)
        return "";
    if (game.gameStatus == 11)
        return "Player with crosses has won!";
    else
        if (game.gameStatus == 12)
            return "Player with circles has won!";
        else
            return "There was a tie!";
};


// -------------------------------------------------
// Web Socket --------------------------------------
// -------------------------------------------------

var games= [];


var io = io.listen(server, {
        log: false,
        agent: false,
        origins: '*:*'
        // 'transports': ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
    });

io.on('connection', function(socket){ 
    if (hostname=="")
        hostname = socket.handshake.headers.host.split(":").shift();
    console.log('\n----------------------------------------------------\n');
    console.log('Connection to client established, on hostname =' + hostname + ' and port = '+port);

    // Success!  Now listen to messages to be received

    // joinGame is invoked with the gameId defined on input field on the client
    socket.on('joinGame',function(gameId, userID){ 
        if (gameMod.hasGameEnded(games[gameId])){
                sendMessageForSender(socket, 'alreadyEnded', 'Game ' + gameId + ' has already ended. It is not possible to join that game');
            }
        else    
            if (gameMod.playerNumberOfUser(games[gameId],userID) < 0){
                if (gameMod.isGameFull(games[gameId])){
                	sendMessageForSender(socket, 'full', 'Game ' + gameId + ' is full. It is not possible to join that game');
        	    	return;
            	}
                games[gameId] = gameMod.joinGame(games[gameId], userID);
            }
        socket.join(gameId);
        io.in(gameId).emit('refreshGame', games[gameId]);
    });

    socket.on('getGame',function(gameId){ 
        if (gameMod.hasGameEnded(games[gameId])){
                sendMessageForSender(socket, 'alreadyEnded', 'Game ' + gameId + ' has already ended.');
        }
        io.in(gameId).emit('refreshGame', games[gameId]);
    });

    // Messages have information about the room (id)
    socket.on('playMove',function(gameId, move){ 
        //console.log('\n----------------------------------------------------\n');
    	//console.log('Client requested "playMove" - gameId = ' + gameId + ' move= ', move);

        if (gameMod.hasGameEnded(games[gameId])){
                sendMessageForSender(socket, 'alreadyEnded', 'Game ' + gameId + ' has already ended.');
                io.in(gameId).emit('refreshGame', games[gameId]);
                return;
        }

        if (!gameMod.isGameFull(games[gameId])){
            sendMessageForSender(socket, 'notComplete', 'Game ' + gameId + ' is not yet full. Wait for more players to join');
            return;
        }

    	var numPlayer = gameMod.playerNumberOfUser(games[gameId], move.userID);

        if (numPlayer<0){
            sendMessageForSender(socket, 'invalidPlayer', 'You are an invalid player of Game ' + gameId +'. You cannot play this game');
            return;
        }

        if (games[gameId].gameStatus != numPlayer){
            sendMessageForSender(socket, 'invalidMove', 'It\'s not your turn to play on game ' + gameId +'.');
            return;
        }

        var res = gameMod.playMove(games[gameId], numPlayer, move.position);

        if (res === false){
        	sendMessageForSender(socket, 'invalidMove', 'This move on Game ' + gameId +' is invalid!');
    	}
        io.in(gameId).emit('refreshGame', games[gameId]);

        if (notifyIfEndGame(games[gameId], gameId))
            sendMessageForAll(io, gameId, 'endGame', 'Game has ended. ' + getEndGameMessage(games[gameId]));
    });
    
    socket.on('disconnect',function(){
        console.log('\n----------------------------------------------------\n');
        console.log('Disconnect');
    });
      
});


function hasRow(v, a){
	return  ((a[0]==v) && (a[1]==v) && (a[2]==v)) || 
			((a[3]==v) && (a[4]==v) && (a[5]==v)) || 
			((a[6]==v) && (a[7]==v) && (a[8]==v)) || 
			((a[0]==v) && (a[3]==v) && (a[6]==v)) || 
			((a[1]==v) && (a[4]==v) && (a[7]==v)) || 
			((a[2]==v) && (a[5]==v) && (a[8]==v)) || 
			((a[0]==v) && (a[4]==v) && (a[8]==v)) || 
			((a[2]==v) && (a[4]==v) && (a[6]==v));
}

function isBoardComplete(a){
	for (i=0; i<9; i++)
		if (a[i] === 0)
			return false;
	return true;	
}

function gameEnd(game){
	if (hasRow(1, game.board))
		return 11;
	if (hasRow(2, game.board))
		return 12;
	if (isBoardComplete(game.board))
		return 13;
	return 0;
}

function createGame(){
	var game= {
			board: [0,0,0,0,0,0,0,0,0],
			gameStatus: 1,
			userID1: -1,
			userID2: -1
		};			
	return game;	
}

function gameExists(game){
    if (typeof(game) == "undefined")
    	return false;
    if (game === null)
    	return false;
    return true;
}

function playerExists(game, playerNumber) {
    if (!gameExists(game))
    	game = createGame();
    if (playerNumber==1){
        if (typeof(game.userID1) == "undefined")
            return false;
        if (typeof(game.userID1) == "number")
	        if (game.userID1 > 0)
            	return true;
    }
    if (playerNumber==2){
        if (typeof(game.userID2) == "undefined")
            return false;
        if (typeof(game.userID2) == "number")
	        if (game.userID2 > 0)
            	return true;
    }
    return false;
}


module.exports = {
    hasGameEnded: function(game){
	    if (!gameExists(game))
    		game = createGame();
    	return game.gameStatus >= 10;
    },
    isGameFull: function(game){
	    if (!gameExists(game))
    		game = createGame();
    	if (playerExists(game, 1) && playerExists(game, 2))
    		return true;
    	return false;
    },
    playerNumberOfUser: function(game, userID){
	    if (!gameExists(game))
	    	game = createGame();
	    if (game.userID1 == userID)
	    	return 1;
	    if (game.userID2 == userID)
	    	return 2;
	    return -1;    
    },
	joinGame: function(game, userID){
	    if (!gameExists(game))
    		game = createGame();
    	if (playerExists(game, 1) && playerExists(game, 2))
    		return null;
    	var playerNumber = this.playerNumberOfUser(game, userID);
    	if (playerNumber < 0){
	    	if (playerExists(game, 1))
	    		game.userID2 = userID;
	    	else
	    		game.userID1 = userID;
	    }
    	return game;
	},
	playMove: function(game, playerNumber, position){
		if ((game.gameStatus!=1) && (game.gameStatus!=2))
			return false;		
		if ((position<0) || (position>9))
			return false;
		if ((playerNumber!=1) && (playerNumber!=2))
			return false;
		if (game.gameStatus != playerNumber)
			return false;
		if (game.board[position] === 0){
			game.board[position] = playerNumber;	
			var endStatus = gameEnd(game);			
			if (endStatus === 0)
				game.gameStatus = (playerNumber == 1) ? 2 : 1;
			else
				game.gameStatus = endStatus;
			return true;
		}			
		return false;
	}
};
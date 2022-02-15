//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;
var roundTimer;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    //console.log("init game ran!")

    gameSocket.on('storePlayerInfo', storePlayerInfo);
    
    //host functions
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomStart', hostPrepareGame);
    gameSocket.on('hostNextRound', hostNextRound);

    //player functions
    //gameSocket.on('checkGremStatus', hostCheckGremStatus);
    //gameSocket.on('stolenLetters', player);
    //gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerJoinGame', playerJoinGame);


}


//** create game button is clicked, create game room and join*/
function hostCreateNewGame() {
    //create unique game room ID
    var thisGameID = (Math.random() * 100000) | 0;
    
    //return game room ID and socket ID to browser client
    this.emit('newGameCreated', {gameID: thisGameID, mySocketID: this.id});

    //join the room, wait for players
    this.join(thisGameID.toString());
}

//host prepare game emits the beginNewGame function in app.js, which begins the countdown. 
// we dont want a countdown so we need to figure that out
function hostPrepareGame(gameID) {
    var sock = this;
    var data = {
        mySocketID : sock.id,
        gameID : gameID
    };
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

function playerJoinGame(data) {
    var sock = this;
    var room = gameSocket.manager.rooms["/" + data.gameId];
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

function hostStartGame(gameId) {
    console.log('Game Started.');
    roundTimer = performance.now();
    sendWord(0,gameId);
};


function hostNextRound() {

}

var playerInfo = {};

/**
 * 
 * 
 * 
 * 
 * @param data hopefully player name and ID
 * 
 * 
 */


function storePlayerInfo(data) {
    playerInfo.append(data);
    console.log(playerInfo[0]);
}

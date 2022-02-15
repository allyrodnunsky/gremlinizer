//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    console.log(gameSocket);
    gameSocket.emit('connected', { message: "You are connected!" });
    console.log("init game ran!")


    
    //host functions
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomStart', hostPrepareGame);
    gameSocket.on('hostNextRound', hostNextRound);

    //player functions
    gameSocket.on('playerJoinGame', playerJoinGame); //playerJoinGameRoom
    //gameSocket.on('checkGremStatus', hostCheckGremStatus);
    //gameSocket.on('stolenLetters', player);
    //gameSocket.on('playerAnswer', playerAnswer);
    


}


//** create game button is clicked, create game room and join*/
function hostCreateNewGame() {
    // console.log("thisGameID");
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
    console.log('host prepare game called');
    
    //game starting
    io.sockets.in(data.gameID).emit('beginNewGame', data);
}


function hostNextRound() {


}


function playerJoinGame(data) {
    var sock = this;
    console.log(data);
    // var room = gameSocket.rooms["/" + data.gameID];
    var room = data.gameID;

    if(room != undefined) {
        data.mySocketID = sock.id;
        sock.join(data.gameID);
        console.log("playerjoin game func");

        io.sockets.in(data.gameID).emit('playerJoinedRoom', data);

    } else {
        this.emit('error',{message: "This room does not exist."} ); //error message
    }

}
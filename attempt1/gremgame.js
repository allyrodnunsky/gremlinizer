//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    console.log("init game ran!")


    
    //host functions
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomStart', hostPrepareGame);
    gameSocket.on('hostNextRound', hostNextRound);

    //player functions
    //gameSocket.on('checkGremStatus', hostCheckGremStatus);
    //gameSocket.on('stolenLetters', player);
    //gameSocket.on('playerAnswer', playerAnswer);
    //gameSocket.on('playerJoinGame', playerJoinGame);


}


//** create game button is clicked, create game room and join*/
function hostCreateNewGame() {
    console.log("thisGameID");
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


function hostNextRound() {

}

var songs = [
                     [   "She's a ______ girl",
                        "loves her ______ ",
                        "Loves Jesus and ______ , too",
                        "She's a good ______" ,
                        "crazy 'bout ______ ",
                        "Loves ______" , 
                        "and her ______ , too", 
                        "And it's a ______ day",
                        " livin' in ______ ",
                        "There's a ______  runnin' through the yard"
                    ],
                    [
                        "She's a ______ girl",
                        "loves her ______ ",
                        "Loves Jesus and ______ , too",
                        "She's a good ______" ,
                        "crazy 'bout ______ ",
                        "Loves ______" , 
                        "and her ______ , too", 
                        "And it's a ______ day",
                        " livin' in ______ ",
                        "There's a ______  runnin' through the yard"
                    ],
                    [
                        "She's a ______ girl",
                        "loves her ______ ",
                        "Loves Jesus and ______ , too",
                        "She's a good ______" ,
                        "crazy 'bout ______ ",
                        "Loves ______" , 
                        "and her ______ , too", 
                        "And it's a ______ day",
                        " livin' in ______ ",
                        "There's a ______  runnin' through the yard"
                    ]
]
    
    
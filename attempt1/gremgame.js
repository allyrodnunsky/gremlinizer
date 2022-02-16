//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;
var roundTimer;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    //console.log(gameSocket);
    gameSocket.emit('connected', { message: "You are connected!" });
    //console.log("init game ran!")

    //gameSocket.on('storePlayerInfo', storePlayerInfo);
    
    //host functions
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomStart', hostPrepareGame);
    gameSocket.on('hostStartGame', hostStartGame);
    gameSocket.on('allAnswered', allAnswered);
    gameSocket.on('playerVote', votingMachine);
    gameSocket.on('allVoted', hostNextRound);


    //player functions
    gameSocket.on('playerJoinGame', playerJoinGame); //playerJoinGameRoom
    //gameSocket.on('checkGremStatus', hostCheckGremStatus);
    //gameSocket.on('stolenLetters', player);
    gameSocket.on('playerAnswer', playerAnswer);


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

function hostStartGame(gameID) {
    //console.log('Game Started.');
    roundTimer = performance.now();
    //sendWord(0,gameId);
}

function hostNextRound(data) {
    
    if(data.round < 10 ){
        // new phrase to host, players get submit screen
        roundTimer = performance.now();
        //sendWord(data.round, data.gameId);
    } else {
        // If the current round exceeds the number of words, send the 'gameOver' event.
        io.sockets.in(data.gameID).emit('gameOver',data);
    }
}

function allAnswered (gameID) {
    gameSocket.in(gameID).emit('loadVote');
}

function playerAnswer(data) {
    console.log('Player ID: ' + data.playerID + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    //TODO: STORE PLAYER ANSWER 
    //TODO: STORE PLAYER ANSWER
    //TODO: STORE PLAYER ANSWER 
    //TODO: STORE PLAYER ANSWER 
    //Saturday Morning 
    var answerTimer = performance.now();
    //console.log(answerTimer);

    data.timeSub = answerTimer - roundTimer;
    console.log('submission time: '+ data.timeSub);

    io.sockets.to(data.gameID).emit('storePlayerAnswer', data);
}

//host prepare game emits the beginNewGame function in app.js, which begins the countdown. 
// we dont want a countdown so we need to figure that out
function hostPrepareGame(gameID) {
    var sock = this;
    var data = {
        mySocketID : sock.id,
        gameID : gameID
    };
    //console.log('host prepare game called');
    
    //game starting
    io.sockets.in(data.gameID).emit('beginNewGame', data);
}


function votingMachine(data) {
    io.sockets.in(data.gameID).emit('storeVote', data);
}

function playerJoinGame(data) {
    var sock = this;
    //console.log(data);
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

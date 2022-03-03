//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;
var roundTimer;
var songChoice = 3;

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

    var gremlins = [];
    var gremlinData = {
        gameID: gameID,
        round: 0,
        gremlins: gremlins
    }
    //console.log('Game Started.');
    roundTimer = performance.now();
    sendWord(gremlinData);
}

function hostNextRound(data) {
    console.log('hostNextRound!');
    if(data.round < songs[songChoice].length){
        // console.log(data.gremlins[0]);
        // new phrase to host, players get submit screen
        roundTimer = performance.now();//starts the round timer to track how long each player takes to answer
        sendWord(data);
    } else {
        // If the current round exceeds the number of phrases, send the 'gameOver' event.
        endGame(data);
    }
}

function endGame(data) {
    var endData = {
        gameID: data.gameID,
        round: 5,
        gremlins: data.gremlins,
        phrases: songs[songChoice]
    }
    io.sockets.in(data.gameID).emit('gameOver',endData);
}

function allAnswered (data) {
    console.log(data.roundAnswers);
    io.sockets.in(data.gameID).emit('loadVote', data);
}

function playerAnswer(data) {
    console.log('Player ID: ' + data.playerID + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    var answerTimer = performance.now();//tracks when any particular answer is submitted
    //console.log(answerTimer);

    data.timeSub = answerTimer - roundTimer;//tracks the time it took for that player to submit
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
    console.log('player html input: ', data.playerName);

    if(room != undefined) {
        data.mySocketID = sock.id;
        sock.join(data.gameID);
        console.log("playerjoin game func");

        io.sockets.in(data.gameID).emit('playerJoinedRoom', data);

    } else {
        this.emit('error',{message: "This room does not exist."} ); //error message
    }

}

function sendWord (gremlinData) {
    //add a game counter to iterate through songs array
    //also mayve have buttons for a thing
    var newPhrase = songs[songChoice][gremlinData.round];
    var data = {
        gameID: gremlinData.gameID,
        round: gremlinData.round,
        gremlins: gremlinData.gremlins,
        phrase: newPhrase
    }
    console.log(gremlinData.gremlins +': should be gremlinized')
    io.sockets.in(gremlinData.gameID).emit('nextRoundInit', data);
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
       "Take ______ Me",
       "We're ______ away",
       "I don't ______ what I'm to say",
       "I'll ______ it anyway" ,
       "Today's another day to ______ you",
       "______ away" , 
       "______ on me (Take on me)", 
       "______ me on (Take on me)",
       "I'll be coming for your ______, okay?",
       "I'll be ______"
       
   ],
   [
       "Just a small town ______",
       "Living in a ______",
       "She took the ______",
       "Going ______" ,
       "Just a ______ boy",
       "Born and raised in ______" , 
       "He took the ______", 
       "Going ______",
       "A ______ in a smokey room",
       "The smell of ______ and cheap perfume",
       "and cheap ______"
   ],
   [
        "Goose ______ under sauce:",
        "Wash ______ giblets",
        "place them in a pan and pour with ______",
        "Bring water to a ______ a few times" ,
        "______ off the foam",
        "Transfer the giblets on a plate and ______" , 
        "Filter the ______ and add chopped carrot", 
        "______ the prunes separately.",
        "Combine the emerged ______ with the meat broth.",
        "Next add ______ vinegar",
        "______ your meal!"
    ],
    [
        "Five little ______ jumping on the bed,",
        "One fell down and bumped his ______,",
        "Mama called the ______ and the ______ said,",
        "No more ______ jumping on the bed!" ,
        "Four little ______ jumping on the bed,",
        "One fell down and ______ his head," , 
        "Mama called the ______ and the ______ said,", 
        "No more ______ jumping on the bed!"
    ],
    [
        "We're goin' on a ______ hunt,",
        "We're going to catch a ______ one,",
        "I'm not ______",
        "What a beautiful ______!" ,
        "Oh look! It's some long, wavy ______!",
        "Can't go ______ it," , 
        "Can't go ______ it,", 
        "Can't go ______ it,",
        "Got to go ______ it!",
        "We're goin' on a ______ hunt,",
        "We're going to ______ a big one,",
        "I'm not ______",
        "What a ______ day!"
    ],


]

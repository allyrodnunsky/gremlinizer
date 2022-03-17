//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;
var roundTimer;
var songChoice = 0;

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
    
    //create unique game room ID
    var thisGameID = (Math.random() * 100000) | 0;
    
    //return game room ID and socket ID to browser client
    this.emit('newGameCreated', {gameID: thisGameID, mySocketID: this.id});

    //join the room, wait for players
    this.join(thisGameID);
    console.log("thus many players are in the room after host joins"+io.sockets.adapter.rooms.get(thisGameID).size);
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
    console.log('round answers: '+ data.roundAnswers);
    io.sockets.in(data.gameID).emit('loadVote', data);
}

function playerAnswer(data) {
    console.log('Player ID: ' + data.playerID + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    var answerTimer = performance.now();//tracks when any particular answer is submitted
    //console.log(answerTimer);

    data.timeSub = answerTimer - roundTimer;//tracks the time it took for that player to submit
    console.log('submission time: '+ data.timeSub);

    io.sockets.in(data.gameID).emit('storePlayerAnswer', data);
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
    console.log(data);
    // var room = gameSocket.rooms["/" + data.gameID];
    var room = data.gameID;
    console.log('player html input: ', data.gameID);
    console.log('io.sockets.adapter.rooms[room]: ', io.sockets.adapter.rooms[room]);

    if(io.sockets.adapter.rooms.get(room)) {
        data.mySocketID = sock.id;
        sock.join(data.gameID);
        console.log("playerjoin game func");
        console.log("thus many players are in the room after player joins"+io.sockets.adapter.rooms.get(room).size);

        io.sockets.in(data.gameID).emit('playerJoinedRoom', data);
        
        } else {
            console.log("should throw error in client");
            this.emit('error',{message: "This room does not exist."} ); //error message
    }

}

function sendWord (gremlinData) {
    //add a game counter to iterate through songs array
    //also mayve have buttons for a thing
    songChoice++;
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
    [
        "Today is a great day for ______",
        "I woke up and ______ my friends",
        "Maybe we'll go to the ______",
        "But first, gotta go to the ______",
        "Cause what would we do without ______",
        "And some ______",
        "For this ______ day"
    ],
    [
        "You just gotta ______ the night",
        "And let it ______",
        "Just close your ______",
        "Like it's the ______",
        "Cause baby you're a ______",
        "Come on show 'em ______",
        "Make 'em go ______",
        "As you shoot ______",
        "Baby, you're a ______"
    ],
    [
        "Use of ______ notes or study aids;",
        "Allowing another party to do one's work/exam and ______ in that work/exam as one's own;",
        "Copying coursework from another student or from a ______ source;",
        "______ on course work when prohibited;" ,
        "Failing to ______ by the specific written course instructions, including, but not limited to, exams, homework assignments, and syllabi;",
        "Use of electronic devices when not ______ permitted;" , 
        "Clicker Fraud. Using, or ______ someone else use, clicker technology improperly in an effort to receive academic credit.", 
    ],

    [
        "Tonight's the night, let's ______ it up",
        "I got my money, let's ______ it up (I feel-)",
        "Go out and ______ it like oh my God",
        "Jump off that sofa, let's ______ it off (I feel-)",
        "I know that we'll have a ______" , 
        "If we get down and go out and just ______ it all", 
        "I feel ______ out, I wanna let it go",
        "Let's go way out, ______ out, and losin' all control",
    ],

    [
        "If love and peace is so ______",
        "Why are there ______ of love that don't belong?",
        "Nations ______' bombs",
        "Chemical gases ______ lungs of little ones" ,
        "With ongoing sufferin' as the youth ______ young" , 
        "With this world that we livin' in? People keep on ______' in", 
        "So I can ______ myself, really, what is going wrong",
        "Makin' wrong ______, only visions of them dividends",
        "Not respectin' each other, ______ thy brother",
        "A war is goin' on, but the reason's ______",
    ],


]

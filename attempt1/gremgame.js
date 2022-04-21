//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

/**
 * Pass Phrase to voting screen
 * handle disconnect after voting/voter fraud
 * selecting what type of game/single prompt
 * countdown?
 * 
 * 
 */

var io;
var gameSocket;
var roundTimer;
var indexChoice = 0;
var activeRooms = [];
var promptArr = [];

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
    gameSocket.on('restartGame', restartGame)


    //player functions
    gameSocket.on('playerJoinGame', playerJoinGame); //playerJoinGameRoom
    //gameSocket.on('checkGremStatus', hostCheckGremStatus);
    //gameSocket.on('stolenLetters', player);
    gameSocket.on('playerAnswer', playerAnswer);

    gameSocket.on('disconnect', function() {
        //console.log('Got disconnect!');
        
        for (let i = 0; i < activeRooms.length; i++) {
            if (io.sockets.adapter.rooms.get(activeRooms[i])) {
                io.sockets.in(activeRooms[i]).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(activeRooms[i]).size} );
            }
        }
    });


}


//** create game button is clicked, create game room and join*/
function hostCreateNewGame() {
    
    //create unique game room ID
    var thisGameID = (Math.random() * 100000) | 0;


    activeRooms.push(thisGameID);
    
    //return game room ID and socket ID to browser client
    this.emit('newGameCreated', {gameID: thisGameID, mySocketID: this.id});

    //join the room, wait for players
    this.join(thisGameID);
    //console.log("thus many players are in the room after host joins"+io.sockets.adapter.rooms.get(thisGameID).size);
}

function restartGame(gameID) {
    console.log("restarting game");
    io.sockets.in(gameID).emit('restartClientGames');
    io.sockets.in(gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(data.gameID).size} );
}

function hostStartGame(gameID) {

    var gremlins = [];
    var gremlinData = {
        gameID: gameID,
        round: 0,
        gremlins: gremlins
    }

    //if(promptChoice == song) etc
    //promptArr = songs;
    //console.log('Game Started.');
    roundTimer = performance.now();
    sendWord(gremlinData);
}

function hostNextRound(data) {
    //console.log('hostNextRound!');
    if(data.round < promptArr[indexChoice].length){
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
        phrases: promptArr[indexChoice]
    }
    io.sockets.in(data.gameID).emit('gameOver',endData);
}

function allAnswered (data) {
    //console.log('round answers: '+ data);
    io.sockets.in(data.gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(data.gameID).size} );
    io.sockets.in(data.gameID).emit('loadVote', data);
}

function playerAnswer(data) {
    //console.log('pleyers answers: '+ JSON.stringify(data));
    //console.log('Player ID: ' + data.playerID + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    var answerTimer = performance.now();//tracks when any particular answer is submitted
    //console.log(answerTimer);

    data.timeSub = answerTimer - roundTimer;//tracks the time it took for that player to submit
    //console.log('submission time: '+ data.timeSub);

    io.sockets.in(data.gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(data.gameID).size} );
    io.sockets.in(data.gameID).emit('storePlayerAnswer', data);
}

//host prepare game emits the beginNewGame function in app.js, which begins the countdown. 
// we dont want a countdown so we need to figure that out
function hostPrepareGame(gameID,promptChoice) {//promptChoice
    var sock = this;
    var data = {
        mySocketID : sock.id,
        gameID : gameID
    };
    //console.log('prompt chpoice is: ' + promptChoice);
 
    if (promptChoice == 'Song') {
        promptArr = songs;
    }
    if (promptChoice == 'Story') {
        promptArr = story;
    }
    if (promptChoice == 'Recipe') {
        promptArr = recipe;
    }
    
    indexChoice = Math.floor(Math.random() * promptArr.length);
    //console.log('Index choice is: '+ indexChoice);
    //console.log('first prompt arr choice is: '+ promptArr[0][1]);
    
    //game starting
    io.sockets.in(data.gameID).emit('beginNewGame', data);
}


function votingMachine(data) {
    //console.log("storing Votes With a machine");
    io.sockets.in(data.gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(data.gameID).size} );
    io.sockets.in(data.gameID).emit('storeVote', data);
}

function playerJoinGame(data) {
    var sock = this;
    //console.log(data);
    // var room = gameSocket.rooms["/" + data.gameID];
    var room = data.gameID;
    //console.log('player html input: ', data.gameID);
    //console.log('io.sockets.adapter.rooms[room]: ', io.sockets.adapter.rooms[room]);

    if(io.sockets.adapter.rooms.get(room)) {
        data.mySocketID = sock.id;
        sock.join(data.gameID);
        //console.log("playerjoin game func");
        //console.log("thus many players are in the room after player joins"+io.sockets.adapter.rooms.get(room).size);

        io.sockets.in(data.gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(data.gameID).size} );
        io.sockets.in(data.gameID).emit('playerJoinedRoom', data);
        
        
        } else {
            //console.log("should throw error in client");
            this.emit('error',{message: "This room does not exist."} ); //error message
    }

}

function sendWord (gremlinData) {
    //add a game counter to iterate through songs array
    //also mayve have buttons for a thing
    //indexChoice++;
    //promptArray[]
    var newPhrase = promptArr[indexChoice][gremlinData.round];
    var data = {
        gameID: gremlinData.gameID,
        round: gremlinData.round,
        gremlins: gremlinData.gremlins,
        phrase: newPhrase
    }
    //console.log(gremlinData.gremlins +': should be gremlinized')
    io.sockets.in(gremlinData.gameID).emit('numPlayerUpdate', {numPlayer: io.sockets.adapter.rooms.get(gremlinData.gameID).size} );
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
    [
        "I threw a ______ in the well",
        "Don't ask me, I'll never ______",
        "I ______ to you as it fell",
        "And now you're in my ______",
        "I trade my ______ for a wish",
        "Pennies and dimes for a ______",
        "I wasn't looking for ______",
        "But now you're in my ______",
        "Your stare was ______",
        "Ripped jeans, skin was ______'",
        "Hot night, ______ was blowin'",
        "Where you think you're ______, baby?",
    ],
    [
        "Like the legend of the ______",
        "All ends with ______",
        "What keeps the planet ______",
        "The force from ______",
        "We've come ______",
        "To give up ______",
        "So let's ______",
        "And our cups to ______",
        "She's up all ______",
        "I'm up all night to ______",
        "She's up all night for ______",
        "I'm up all night to ______",
    ],
    [
        "But every song's like",
        "Gold teeth, Grey Goose, trippin' in the bathroom",
        "Bloodstains, ball gowns, trashin' the hotel room",
        "We don't care, we're driving Cadillacs in our dreams",
        "But everybody's like",
        "Cristal, Maybach, diamonds on your timepiece",
        "Jet planes, islands, tigers on a gold leash",
        "We don't care, we aren't caught up in your love affair",
    ],


]

var story = [ [
    "Goose ______ under sauce:",
    "Wash ______ giblets",
    "place them in a pan and pour with ______",
]

]

var recipe = [
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
]
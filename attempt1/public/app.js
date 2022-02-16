//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

;
jQuery(function($){    
    'use strict';
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        }, 

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );//cache
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('loadVote', IO.loadVote );
            IO.socket.on('storeVote', IO.storePlayerVote );

            //IO.socket.on('beginNewGame', IO.beginNewGame );
            //IO.socket.on('newPhraseData', IO.onNewPhraseData);

            IO.socket.on('storePlayerAnswer', IO.storePlayerAnswer);
            //IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function() {
            console.log("IO");
            App.mySocketID = IO.socket.id;
            //console.log(App.mySocketID);
            
        },

        onNewGameCreated : function(data) {
            console.log('onNewGame Create calls game init');
            //console.log(data);
            App.Host.gameInit(data);
        },


        playerJoinedRoom : function(data) {
            console.log('player joined room called');
            App[App.myRole].updateWaitingScreen(data);
        },

        beginNewGame : function(data) {

            App[App.myRole].gameCountdown(data);
        },


        storePlayerAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.storeAnswer(data);
            }
        },

        storePlayerVote : function(data) {
            if(App.myRole === 'Host') {
                App.Host.storeVote(data);
            }
        },

        loadVote : function() {
            App.Player.triggerVote();
        },


        error : function(data) {
            alert(data.message);
        }

    };

    var App = {
        gameID: 0,
        myRole: '', //differentiates between player or host browsers
        mySocketID: '', //the socket.io object identifier. unique for each player and host. generated when broswer initially connects
        currentRound: 0,

        /**** SETUP ****/ 
        //this runs when page initially loads
        init: function () {
            App.cacheElements(); //refernece to on-screen html elements
            App.bindEvents();
            App.showInitScreen();
        },

        //display html elements
        cacheElements: function () {
             App.$doc = $(document);

            //templates
            App.$gameArea = $('#gameArea');
            App.$templateTitleScreen = $('#title-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$templateWaitingRoom = $('#waiting-room-template').html();
            App.$templatePlayerScreen = $('#round-response-template').html();
            App.$templateHostScreen = $('#round-x-template').html();
        },

        //bind events - events triggered by button clicks
        bindEvents: function () {
            //HOST
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            //PLAYER
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '.btnVote', App.Player.iVoted);
            App.$doc.on('click', '#btnSubmit',App.Player.onPlayerSubmitClick);
            App.$doc.on('click', '#btnJoinWaitingRoom', App.Player.onJoinWaitingRoomClick);
            App.$doc.on('click', '#btnPlayerStartsGame', App.Player.onPlayerStartGameClick);
        },

        //show intial title screen
        showInitScreen: function() {
            App.$gameArea.html(App.$templateTitleScreen);
        },

       
        /////////////////
        /****HOST CODE */
        Host : {
            players: [], //contains references to player data
            isNewGame: false, //flag to indicate if a new game is starting
            numPlayersInRoom: 0,
            rounds: [],
            numPlayersVoted: 0,

            //handler for "create game" button on title screen
            onCreateClick: function () {
                //console.log('clicked create a game');
                //console.log(IO);
                IO.socket.emit('hostCreateNewGame');
               
            },

            //host screen is displayed
            gameInit: function (data) {
                // IO.socket.emit('hostCreateNewGame');
                App.gameID = data.gameID;
                App.mySocketID = data.mySocketID;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;
                
                App.Host.displayNewGameScreen();
                console.log("game create with id: " + App.gameID);
            },

            //show the host screen with the URL
            displayNewGameScreen : function() {
                //fill game screen with html
                console.log('display joining screen');
                App.$gameArea.html(App.$templateNewGame);

                //display URL
                $('gameURL').text(window.location.href);

                $('#spanNewGameCode').text(App.gameID);

            },

            storeAnswer : function(data) {
                console.log('Datums');
                console.log(data);
                
                App.Host.rounds.push(data);
                App.Host.answerCheck();
                
                
                console.log(App.Host.rounds[App.currentRound]);
            },

            answerCheck : function () {
                var numAnswers = 0;
                for (i in App.Host.rounds.length()) {
                    if (App.Host.rounds[i].round == App.currentRound) {
                        numAnswers ++;
                    }
                }
                if (numAnswers == numPlayersInRoom) {
                    IO.socket.emit('allAnswered', App.gameID)
                }
            },

            /**
             * 
             * @param data{{ gameID: App.gameID, vote: vote, round: App.currentRound}}
             */

            storeVote : function (data) {
                for (i in App.Host.rounds.length()) {
                    if (App.Host.rounds[i].answer == data.vote && data.round == App.currentRound) {
                        App.Host.rounds[i].votes +=1;
                        this.numPlayersVoted ++;//watch out for this :0
                    }
                }
                if (App.Host.numPlayersVoted == App.Host.numPlayersInRoom) {
                    var maxVotes = 0;
                    var leadPlayer = 0; //index for most voted player
                    var slowestSub = 0;
                    var slowPoke = 0;//index for slowest player
                    for (i in this.rounds.length()) {
                        if (this.rounds[i].timeSub > slowestSub && this.rounds[i].round == App.currentRound) {
                            slowPoke = i;
                            slowestSub = this.rounds[i].timeSub;
                        }
                        if (this.rounds[i].votes > maxVotes && this.rounds[i].round == App.currentRound) {//will always pick the FASTER answer b/c answers are stored sequentially
                            leadPlayer = i;
                            maxVotes = this.rounds[i].votes
                        }
                        this.rounds[slowPoke].timesSlow += 1;
                        if (this.rounds[slowPoke].timesSlow == 2) {
                            this.rounds[slowPoke].gremStatus = true;
                            this.rounds[slowPoke].timesSlow = 0;
                            //this.rounds[slowPoke].gremRound +=1; //Do we update this here? feels like it would work since the next time would look back?
                        }
                        this.rounds[leadPlayer].score = 10;
                    }
                    App.Host.numPlayersVoted = 0;
                    App.currentRound +=1;
                    data.round = App.currentRound; //updating round number b/c all have voted

                    IO.socket.emit('allVoted', data);
                }
            },

            updateWaitingScreen : function(data) {
                //if game is a restarted game, show the join screen
                if( App.Host.isNewGame) {
                    App.Host.displayNewGameScreen();
                }

                console.log('host update waiting screen called');

                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player' + data.playerName + 'joined the game.');

                App.Host.players.push(data);
                App.Host.numPlayersInRoom += 1;
                
                
                //show start button once correct num of players entered room
                if(App.Host.numPlayersInRoom == 1){
                   //call host room start in gremgame
                   IO.socket.emit('hostRoomStart', App.gameID); 
                }
            },

            onPlayerStartGameClick : function() {
                console.log('host screen template game pls');
                App.$gameArea.html(App.$templateHostScreen);
            },

            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$templateHostScreen);
                IO.socket.emit('hostStartGame', App.gameID);
                //App.doTextFit('#hostWord');

                // // Begin the on-screen countdown timer
                // var $secondsLeft = $('#hostWord');
                // App.countDown( $secondsLeft, 5, function(){
                //     IO.socket.emit('hostCountdownFinished', App.gameID);
                // });

                // // Display the players' names on screen
                // $('#player1Score')
                //     .find('.playerName')
                //     .html(App.Host.players[0].playerName);

                // $('#player2Score')
                //     .find('.playerName')
                //     .html(App.Host.players[1].playerName);

                // // Set the Score section on screen to 0 for each player.
                // $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                // $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },


        },

        Player : {
            hostSocketID: '',
            myName: '',
            playerAnswer: '',

            //click handler for on JoinClick
            onJoinClick: function () {
                App.$gameArea.html(App.$templateJoinGame);
            },

            //player enters name and gameID and clicks join room
            onJoinWaitingRoomClick: function () {
                console.log('waiting room click');
                var data = {
                    gameID: +($('#inputGameId').val()),
                    playerName: +($('#inputPlayerName').val) || 'anon'
                };
                
                //emit waiting room in this function
                IO.socket.emit('playerJoinGame', data);

                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            

            updateWaitingScreen : function(data) {
                // console.log('io.socket.id is: ' + IO.socket.id);
                // console.log('data.mySocketID: ' + data.mySocketID);

                if(IO.socket.id === data.mySocketID){
                    console.log('player update Waiting Screen called');
                    App.myRole = 'Player';
                    App.gameID = data.gameID;

                    //display waiting room screen
                    App.$gameArea.html(App.$templateWaitingRoom);

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + App.gameID + '. Please wait for game to begin.');

                }
            },

            onPlayerStartGameClick : function() {
                App.$gameArea.html(App.$templatePlayerScreen);

            },

            onPlayerSubmitClick: function() {
                // console.log('Clicked Answer Button');
                var $sub = $("#inputPlayerResponse");      // the tapped button
                console.log($sub);
                var answer = $sub.val(); // The tapped word
                var votes, timesSlow, gremRound, score = 0;
                var gremStatus = false;
                var timeSub = 0;

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameID: App.gameID,
                    playerID: App.mySocketID,
                    answer: answer,
                    round: App.currentRound,
                    votes: votes, 
                    score: score,
                    timesSlow: timesSlow,
                    gremRound: gremRound,
                    gremStatus: gremStatus,
                    timeSub: timeSub
                }
                console.log("sazaahhh");
                IO.socket.emit('playerAnswer',data);
            },

            triggerVote : function() {
                var $list = $('<ul/>').attr('id','ulRoundWords');
                var roundWords = [];

                for (i in App.Host.rounds.length()) {//find the answers from each player in this round
                    if (App.Host.rounds[i].round == App.currentRound) {
                        roundWords.push(App.Host.rounds[i].answer);
                    }
                }
                // Insert a list item for each word in the word list
                // received from the server.
                $.each(roundWords, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnVote')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });

                // Insert the list onto the screen.
                $('#gameArea').html($list);
            },
            
            iVoted : function () {//this player has voted, submits their answer to server to be passed to host
                var $btn = $(this);
                var vote = $btn.val();


                $('#gameArea')
                        .append('<p/>')
                        .text('Thanks For Voting!');

                var data = {
                    gameID: App.gameID,
                    vote: vote,
                    round: App.currentRound
                }

                console.log(data);
                IO.socket.emit('playerVote', data);
            }

            
        },


    };

   


    IO.init();
    App.init();
}($));

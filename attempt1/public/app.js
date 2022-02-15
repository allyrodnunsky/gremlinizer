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
            //IO.socket.on('newPhraseData', IO.onNewPhraseData);
            //IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            //IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function() {
            console.log("IO");
            App.mySocketID = IO.socket.id;
            console.log(App.mySocketID);
            
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

            //handler for "create game" button on title screen
            onCreateClick: function () {
                console.log('clicked create a game');
                console.log(IO);
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
                if(App.Host.numPlayersInRoom ==1){
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
                //App.doTextFit('#hostWord');

                // // Begin the on-screen countdown timer
                // var $secondsLeft = $('#hostWord');
                // App.countDown( $secondsLeft, 5, function(){
                //     IO.socket.emit('hostCountdownFinished', App.gameId);
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
            
        },


    };

   


    IO.init();
    App.init();
}($));

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
<<<<<<< HEAD
            //IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
=======
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
            //IO.socket.on('beginNewGame', IO.beginNewGame );
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

<<<<<<< HEAD
        

        onNewGameCreated : function(data) {
            console.log('onNewGame Create calls game init');
            console.log(data);
            App.Host.gameInit(data);
            
        },
=======
        onNewGameCreated : function(data) {
            console.log('onNewGame Create calls game init');
            //console.log(data);
            App.Host.gameInit(data);
            
        },

        playerJoinedRoom : function(data) {
            console.log('player joined room called');
            App[App.myRole].updateWaitingScreen(data);
        },


>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
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
<<<<<<< HEAD
=======
            App.$templateWaitingRoom = $('#waiting-room-template').html();
>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
        },

        //bind events - events triggered by button clicks
        bindEvents: function () {
            //HOST
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            //PLAYER
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
<<<<<<< HEAD
=======
            App.$doc.on('click', '#btnJoinWaitingRoom', App.Player.onJoinWaitingRoomClick);
>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
        },

        //show intial title screen
        showInitScreen: function() {
            App.$gameArea.html(App.$templateTitleScreen);
        },

       
<<<<<<< HEAD

        //host code
=======
        /////////////////
        /****HOST CODE */
>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
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

<<<<<<< HEAD



        
=======
            updateWaitingScreen : function(data) {
                if( App.Host.isNewGame) {
                    App.Host.displayNewGameScreen();
                }
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player' + data.playerName + 'joined the game.');

                App.Host.players.push(data);
                App.Host.numPlayersInRoom += 1;
            },

>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
        },

        Player : {
            hostSocketID: '',
            myName: '',
            playerAnswer: '',

            //click handler for on JoinClick
            onJoinClick: function () {
                App.$gameArea.html(App.$templateJoinGame);
            },

<<<<<<< HEAD
            //player enters name and gameID and clicks start
            // onPlayerStartClick: function () {

            // },

            // updateWaitingScreen : function(data) {
            //     if(IO.socket.socket.sessionid) === data.mySocketId) {
            //         App.myRole = 'Player';
            //         App.gameID = data.gameID;

            //         $('#playerWaitingMessage')

            //     }
            // },
=======
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
                //bug here
                console.log('io.socket.id is: ' + IO.socket.id);
                console.log('data.mySocketID: ' + data.mySocketID);

                if(IO.socket.id === data.mySocketID){
                    console.log('player update Waiting Screen called');
                    App.myRole = 'Player';
                    App.gameID = data.gameID;

                    //display waiting room screen
                    App.$gameArea.html(App.$templateWaitingRoom);

                }
            },
>>>>>>> 5fb56abbe09b166428bc6747c37b92487e0333da
            
        },


    };

   


    IO.init();
    App.init();
}($));

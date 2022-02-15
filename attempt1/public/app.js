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
            //IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            //IO.socket.on('beginNewGame', IO.beginNewGame );
            //IO.socket.on('newPhraseData', IO.onNewPhraseData);
            //IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            //IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function() {
            console.log("IO");
            App.mySocketID = IO.socket.id;
            //console.log(App.mySocketID);
            
        },

        

        onNewGameCreated : function(data) {
            //console.log('onNewGame Create calls game init');
            //console.log(data);
            App.Host.gameInit(data);
            
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
        },

        //bind events - events triggered by button clicks
        bindEvents: function () {
            //HOST
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            //PLAYER
            App.$doc.on('click', '#btnStart', App.Player.onJoinClick);
        },

        //show intial title screen
        showInitScreen: function() {
            App.$gameArea.html(App.$templateTitleScreen);
        },

       

        //host code
        Host : {
            players: [], //contains references to player data
            isNewGame: false, //flag to indicate if a new game is starting
            numPlayersInRoom: 0,

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




        
        },

        Player : {
            hostSocketID: '',
            myName: '',
            playerAnswer: '',

            //click handler for on JoinClick
            onJoinClick: function () {
                App.$gameArea.html(App.$templateJoinGame);
            },

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
            onPlayerSubmitClick: function() {
                // console.log('Clicked Answer Button');
                var $btn = $("#inputPlayerSub");      // the tapped button
                console.log($btn);
                var answer = $btn.val(); // The tapped word
                let votes, timesSlow, gremRound, score = 0;
                let gremStatus = false;
                let timeSub = 

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound,
                    votes: votes, 
                    score: score,
                    timesSlow: timesSlow,
                    gremRound: gremRound,
                    gremStatus: gremStatus,
                    timeSub: timeSub
                }
                IO.socket.emit('playerAnswer',data);
            },
            
        },


    };

   


    IO.init();
    App.init();
}($));

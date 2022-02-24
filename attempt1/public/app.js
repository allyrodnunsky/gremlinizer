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
            IO.socket.on('nextRoundInit', IO.nextRound );

            //IO.socket.on('beginNewGame', IO.beginNewGame );
            //IO.socket.on('newPhraseData', IO.onNewPhraseData);

            IO.socket.on('storePlayerAnswer', IO.storePlayerAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            
            //IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function() {
            //console.log("IO");
            App.mySocketID = IO.socket.id;
            console.log(App.mySocketID + ' myRole: ' + App.myRole);
            
        },

        onNewGameCreated : function(data) {
            //console.log('onNewGame Create calls game init');
            //console.log(data);
            App.Host.gameInit(data);
        },


        playerJoinedRoom : function(data) {
            //console.log('player joined room called');
            App[App.myRole].updateWaitingScreen(data);
        },

        beginNewGame : function(data) {

            App[App.myRole].gameCountdown(data);
        },

        nextRound : function (data) {
            App[App.myRole].newRound(data);
        },


        storePlayerAnswer : function(data) {
            //console.log('storePlayer helper function')
            if(App.myRole === 'Host') {
                App.Host.storeAnswer(data);
            }
        },

        storePlayerVote : function(data) {
            if(App.myRole === 'Host') {
                App.Host.storeVote(data);
            }
        },

        loadVote : function(data) {
            console.log(App.mySocketID + ' myRole: ' + App.myRole + 'triggerVote');
            if(App.myRole === 'Player') {
                App.Player.triggerVote(data);
            }
        },

        gameOver : function (data) {
            if(App.myRole === 'Host') {
                App.Host.endGame(data);
            }
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
            App.$templateEndGame = $('#game-end-template').html();
        },

        //bind events - events triggered by button clicks
        bindEvents: function () {
            //HOST
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            //PLAYER
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnVote', App.Player.iVoted);
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
                //console.log('display joining screen');
                App.$gameArea.html(App.$templateNewGame);

                //display URL
                $('gameURL').text(window.location.href);

                $('#spanNewGameCode').text(App.gameID);

            },


            //update host waiting screen
            updateWaitingScreen : function(data) {
                //if game is a restarted game, show the join screen
                if( App.Host.isNewGame) {
                    App.Host.displayNewGameScreen();
                }

                //console.log('host update waiting screen called');

                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player' + data.playerName + 'joined the game.');

                //populate players[] with data
                App.Host.players.push(data);
                console.log('my name is: ' + data.playerName);
                App.Host.numPlayersInRoom += 1;
                //console.log('times check');
                
                //show start button once correct num of players entered room
                if(App.Host.numPlayersInRoom == 3){
                   //call host room start in gremgame
                   //console.log('early Num players in room' +App.Host.numPlayersInRoom)
                   IO.socket.emit('hostRoomStart', App.gameID); 
                }
            },

            storeAnswer : function(data) {
                //console.log('Datums');
                console.log('score should be 0 ' + data.score);
                for (let i = 0; i < App.Host.players.length; i++) {
                    console.log('playerID grem status'+App.Host.players[i].playerID + '  ' + App.Host.players[i].gremStatus)
                    if (data.playerID == App.Host.players[i].playerID && App.Host.players[i].gremStatus ==true) {
                        data.timeSub = 0;
                        console.log('set PlayerID: '+ App.Host.players[i].playerID + 'got zoeroed timesub');
                    }
                }
                
                //these show the correct names
                console.log('1 player name: ', App.Host.players[0].playerName);
                console.log('2 player name: ', App.Host.players[1].playerName);

                //this was giving an error bc i
                //console.log(App.Host.players[i].gremStatus + ' had timeSlow on store: ' + data.timesSlow);
                
                App.Host.rounds.push(data);
                console.log(this.rounds[0].score);
                App.Host.answerCheck();
                
                
                //console.log(App.Host.gameID);
            },

            answerCheck : function () {
                var numAnswers = 0;
                var roundAnswers = [];
                console.log('answerCheck running: current round:' +App.currentRound);
                for (let i = 0; i < App.Host.rounds.length; i++) {
                    if (App.Host.rounds[i].round == App.currentRound) {
                        roundAnswers.push(App.Host.rounds[i].answer);
                        numAnswers ++;
                        console.log('answerCheck: '+numAnswers+ '  i:' +i + ' numPlayersInRoom: ' + App.Host.numPlayersInRoom + ' players length:' + App.Host.players.length);
                    }
                }
                if (numAnswers == App.Host.numPlayersInRoom) {
                    console.log('allAnswered');
                    numAnswers = 0;
                    var data = {
                        gameID: App.gameID,
                        roundAnswers: roundAnswers
                    }
                    IO.socket.emit('allAnswered', data);
                }
            },

            /**
             * 
             * @param data{{ gameID: App.gameID, vote: vote, round: App.currentRound}}
             */

            storeVote : function (data) {
                for (let i = 0; i < App.Host.rounds.length; i++) {
                    if (App.Host.rounds[i].answer == data.vote && data.round == App.currentRound && App.Host.rounds[i].round == App.currentRound) {
                        App.Host.rounds[i].votes +=1;//stores the vote from player
                        this.numPlayersVoted ++;//watch out for this :0
                        console.log('numpvoted: '+App.Host.numPlayersVoted);
                    }
                }
                if (App.Host.numPlayersVoted == App.Host.numPlayersInRoom) {
                    console.log('score+gremlinizing!');
                    var gremlins = [];
                    var maxVotes = 0;
                    var leadPlayer = 0; //index for most voted player
                    var slowestSub = 0;
                    var slowPoke = 0;//index for slowest player
                    for (let i = 0; i < App.Host.rounds.length; i++) {
                        if (this.rounds[i].timeSub > slowestSub && this.rounds[i].round == App.currentRound) {
                            slowPoke = i;
                            slowestSub = this.rounds[i].timeSub;
                        }
                        if (this.rounds[i].votes > maxVotes && this.rounds[i].round == App.currentRound) {//will always pick the FASTER answer b/c answers are stored sequentially
                            leadPlayer = i;
                            maxVotes = this.rounds[i].votes
                        }
                    }

                    var slowPlayer = this.rounds[slowPoke].playerID;
                    var bestPlayer = this.rounds[leadPlayer].playerID;
                    this.rounds[leadPlayer].score =10;

                    console.log('winning answer is ' + this.rounds[leadPlayer].answer);
                    console.log('length of players aray' +App.Host.players.length)

                    for (let i = 0; i < App.Host.players.length; i++) {                       
                        
                        if (App.Host.players[i].playerID == slowPlayer) {
                            App.Host.players[i].timesSlow +=1;
                            if (App.Host.players[i].timesSlow == 2) {
                                App.Host.players[i].gremStatus = true;
                                App.Host.players[i].timesSlow =0;
                            }
                        }
                        if (App.Host.players[i].gremStatus == true) {
                            App.Host.players[i].gremRound +=1; 
                            gremlins.push(this.players[i].playerID);
                            if (App.Host.players[i].gremRound == 2) {
                                App.Host.players[i].gremStatus = false;
                                App.Host.players[i].gremRound = 0;
                            }
                        }
                        
                        if (App.Host.players[i].playerID == bestPlayer) {
                            App.Host.players[i].score += 10;
                        }
                        //check this log
                        console.log('players name and times slow' + this.players[i].playerName + ' ||||| ' + this.players[i].timesSlow);
                    }
                    console.log (gremlins[0]);
                    //this.rounds[leadPlayer].score = 10;
                    //console.log(this.rounds[leadPlayer].playerID +'has score'+ this.rounds[leadPlayer].score + '||||||' + this.rounds[slowPoke].playerID + ': is the slowpoke');
                

                    App.Host.numPlayersVoted = 0;
                    App.currentRound +=1;

                    var gremlinData = {
                        gameID: data.gameID,
                        round: App.currentRound,
                        gremlins: gremlins
                    }

                    IO.socket.emit('allVoted', gremlinData);//calls host next round
                }
            },


            onPlayerStartGameClick : function() {
                //console.log('host screen template game pls');
                App.$gameArea.html(App.$templateHostScreen);
            },


            newRound : function (data) {
                App.$gameArea.html(App.$templateHostScreen);
                $('#roundPrompt').html(data.phrase);
            },

            endGame : function (data) {
                var topAnswers = [];
                var temp = [];
                console.log('currentRound at endgame:  ' + App.currentRound);

                App.$gameArea.html(App.$templateEndGame);

                var $fs = $('<p/>');
                var $plrs = $('<ul/>').attr('id','leaders');

                this.players.sort(function(a, b){return b.score - a.score});

                for (let i = 0; i < this.rounds.length; i++) {
                    console.log (this.rounds[i].score);
                    console.log (this.rounds[i].answer);
                    if (this.rounds[i].score == 10) {
                        topAnswers.push(this.rounds[i].answer);
                        //console.log(topAnswers[i]);
                    }
                }
                for (let i = 0; i <topAnswers.length; i++) {
                    temp[i] = data.phrases[i].replace('______', topAnswers[i]);
                    console.log(temp[i]);
                }


                $.each(temp, function(){
                    $fs                                //  <p> </p>           
                        .append(this + '<br>');    //  <p> <br> </p>       //  <p> <br> Story </p>
                });

                $.each(this.players, function(){
                    $plrs                                //  <p> </p>           
                    .append( $('<li/>')             
                            .html(this.playerName + ' Score: ' + this.score)         
                    )
                });
                //console.log($fs);
                $('#storyOutput').html($fs);
                $('#finalLeaderBoard').html($plrs);

                



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
                var data = {
                    gameID: +($('#inputGameId').val()),
                    playerName: $('#inputPlayerName').val() || 'anon',
                    score: 0,
                    timesSlow: 0,
                    gremRound: 0,
                    gremStatus: false,
                    playerID: App.mySocketID,
                    gremLett: []
                };

                console.log('waiting room click: pN' +data.playerName);
                
                ///console.log('playername html input: ', data.playerName);
                //emit waiting room in this function
                IO.socket.emit('playerJoinGame', data);

                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },

            //update player waiting screen
            updateWaitingScreen : function(data) {
                // console.log('io.socket.id is: ' + IO.socket.id);
                // console.log('data.mySocketID: ' + data.mySocketID);

                if(IO.socket.id === data.mySocketID){
                    //console.log('player update Waiting Screen called');
                    App.myRole = 'Player';
                    App.gameID = data.gameID;

                    //display waiting room screen
                    App.$gameArea.html(App.$templateWaitingRoom);

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + App.gameID + '. Please wait for game to begin.');

                }
            },

            gameCountdown : function() {

                // Prepare the game screen with new HTML
                //eliminate all the errors :)
            },

            onPlayerStartGameClick : function() {
                App.$gameArea.html(App.$templatePlayerScreen);
            },

            newRound : function (data) {
                var gremLett1= ["A", "E", "O", "I", "U"];
                var gremLett2= ["S", "D", "V", "X", "F"];
                App.$gameArea.html(App.$templatePlayerScreen);
                App.currentRound = data.round;
                //console.log (data.gremlins[0]);
                //console.log (App.mySocketID);
                for (let i =0; i < data.gremlins.length; i++) {
                    if (data.gremlins[i] == App.mySocketID) {
                        console.log(App.mySocketID +" should be gremlinized");
                        $('#gremlinizedMSG').html(`You've been Gremlinized! <br> No using the letters:`);
                        $('#gremlinizedLTRA').html(gremLett1[i]);
                        $('#gremlinizedLTRB').html(gremLett2[i]);
                    }
                }
            },

            onPlayerSubmitClick: function() {
                // console.log('Clicked Answer Button');
                var $sub = $("#inputPlayerResponse");      // the tapped button
                var $ltr1 = $("#gremlinizedLTRA");
                var $ltr2 = $("#gremlinizedLTRB");
                
                

                //console.log($sub);
                var answer = $sub.val(); // The tapped word
                var l1 = $ltr1.html();
                var l2 = $ltr2.html();
                // console.log('answer' + answer + 'L1, L2'+ l1 + l2);
                // console.log(answer.includes(l1));
                // console.log(answer.includes(l2));
                // console.log(typeof l1);
                // console.log(l1 === '');
                var chkAnswer = answer.toUpperCase();

                if (!(chkAnswer.includes(l1) || chkAnswer.includes(l2))|| l1 === '') {
                    var votes = 0;
                    var timesSlow = 0;
                    var gremRound = 0;
                    var score = 0;
                    var gremStatus = false;
                    var timeSub = 0;
                    console.log('current round on player submit' + App.currentRound);

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
                    //console.log('myRole1'+App.myRole);
                    $('#gameArea').html('<div class="setUp"> Wait For Other Players Submissions </div>');
                    //console.log("sazaahhh");
                    IO.socket.emit('playerAnswer',data);
                }

                else {
                    $('#gremlinizedMSG').html(`Did you misunderstand?? <br> You've been Gremlinized! <br> No using the letters:`);
                }
                
            },


            triggerVote (data) {
                var $list = $('<ul/>').attr('id','ulRoundWords').addClass('setUp');
                var roundWords = data.roundAnswers;
                // Insert a list item for each word in the word list
                // received from the server.
                $.each(roundWords, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>

                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                //.addClass('btnVote')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .attr('id', 'btnVote')
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                                
                            )
                        )

                        .append('<br>')
                });
                //console.log($list);
                

                // Insert the list onto the screen.
                $('#gameArea').html('');
                $('#gameArea').html($list);
            },
            
            iVoted : function () {//this player has voted, submits their answer to server to be passed to host
                var $btn = $(this);
                var vote = $btn.val();

                $('#gameArea').html('');
                $('#gameArea')
                        .append($('<div/>')
                        .text('Thanks For Voting!')
                        .addClass('setUp')
                        );



                var data = {
                    gameID: App.gameID,
                    vote: vote,
                    round: App.currentRound
                }

                console.log('iVoted data: ' +data.vote);
                IO.socket.emit('playerVote', data);
            }

            
        },


    };


    IO.init();
    App.init();
}($));

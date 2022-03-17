// Import the Express module
var express = require('express');

// Import the 'path' module (packaged with Node.js)
var path = require('path');
//var jquery = require('jquery');

// Create a new instance of Express
var app = express();

// Import the Gremlinizer game file.
var grem = require('./gremgame');

// Create a simple Express application
// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static(path.join(__dirname,'public')));

// Create a Node.js based http server on port 8080
var server = require('http').createServer(app);

// Create a Socket.IO server and attach it to the http server
//var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
// io.set('log level',1);
//const express = require("express");
//const { createServer } = require("http");
const { Server } = require("socket.io");

//const app = express();
//const httpServer = createServer(app);
const io = new Server(server, { /* options */ });




// Listen for Socket.IO Connections. Once connected, start the game logic.
io.on('connection', function (socket) {
    //console.log('client connected');
    grem.initGame(io, socket);
});

server.listen(process.env.PORT || 8080);

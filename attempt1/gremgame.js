//Jquery Help https://api.jquery.com
// https://www.w3schools.com/jquery/jquery_ref_overview.asp

var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    console.log("init game ran!")
}
"use strict";
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var qString = require('querystring');
var io = require('socket.io').listen(server);
var firmata = require('firmata');
var plotly = require('plotly')('DavidB', 'r8j18wgs33');
var bmp180 = require('./BMP180');




var initdata = [{x:[], y:[], stream:{token:'9np05kx444', maxpoints:200}}];
var layout = {fileopt : "extend", filename : "Humidity2!"};
var ledPin = 7;
var analogPin = 3;
var data;
var datapress;
var pressureBoard;
var router = express.Router();

app.use(express.static(__dirname));


//var board = new firmata.Board("../../../../../dev/ttyATH0",function(err) {
var board = new firmata.Board("/dev/ttyATH0",function(err) {
    if (err) {
        console.log(err);
        board.reset();
        return;
    } else {
        pressureBoard = new bmp180(board);
        console.log('connected');
        //board.sendI2CConfig();
        //board.pins[board.analogPins[4]];
        
        //board.pinMode(ledPin, board.MODES.OUTPUT);
        //board.pinMode(analogPin,board.MODES.ANALOG);
        //Read analog pin 3
        /*board.analogRead(analogPin, function (val) {  
            data = {x : new Date() , y : val};
        });*/
        
        app.route('/light').get( function (req, res) {
            var value = req.param('value')
            if ((value) == 'HIGH') {
                board.digitalWrite(ledPin, board.HIGH);
            } else {
                board.digitalWrite(ledPin, board.LOW);
            }
            res.status(200);   
        });

        io.sockets.on('connection', function (socket) {
            setInterval(function () {
                socket.broadcast.emit("temperatuur", 'Temp : ' + pressureBoard.getCurrentTemp() + '°C');
            }, 5000);
        });
       
        console.log('Board Ready plotting');
    }
});

app.listen(8080);
console.log('Listening on port 8080 ...');

// initialize the plotly graph
/*{
    if (err) return console.log(err);
    console.log(msg);
    //once it's initialized, create a plotly stream to pipe your data!
    console.log('Check1');
        
    var stream1 = plotly.stream('9np05kx444', function (err, res) 
    {
        console.log(err, res);
        console.log("stream clossed");
        clearInterval(loop);  
    });
    var loop = setInterval(function() {

        var streamObject = JSON.stringify(data);
        if (pressureBoard !== undefined) {
            var streamObject2 = JSON.stringify({ x : new Date(), y : pressureBoard.getCurrentTemp()});
            console.log(streamObject2);
        }
        console.log(streamObject);
        stream1.write(streamObject+'\n');
    },5000);  
});            
*/
            


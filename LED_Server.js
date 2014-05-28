"use strict";
var express = require('express');
var app = express();
var qString = require('querystring');
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

var board = new firmata.Board("/dev/ttyATH0",function(err) {
    if (err) {
        console.log(err);
        board.reset();
        return;
    } else {
        pressureBoard = new bmp180(board);
        console.log('connected to BMP180');
        var io = require('socket.io').listen(app.listen(8080));
        console.log('Listening on port 8080 ...');

        app.use(express.static(__dirname));
        
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
                socket.broadcast.emit("luchtdruk", 'Druk : ' + pressureBoard.getCurrentPress() + 'kPa');
                socket.broadcast.emit("hoogte", 'Hoogte : ' + pressureBoard.getCalculatedAltitude() + 'm');

            }, 10000);
        });
       
        console.log('Board Ready plotting');
    }
});


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
            


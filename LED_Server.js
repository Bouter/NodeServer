"use strict";
var express = require('express');
var app = express();
var qString = require('querystring');
var firmata = require('firmata');
var plotly = require('plotly')('DavidB', 'r8j18wgs33');
var bmp180 = require('./BMP180');
var bodyParser = require('body-parser');

var initdata = [{x:[], y:[], stream:{token:'9np05kx444', maxpoints:200}},
                {x:[], y:[], stream:{token:'3joif1t1q4', maxpoints:200}},
                {x:[], y:[], stream:{token:'97go390uxk', maxpoints:200}}];
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
        io.set('log level', 1); // reduce logging
        console.log('Listening on port 8080 ...');

        app.use(express.static(__dirname));
        app.use(bodyParser());
        
        app.route('/light').post(function (req, res) {
            var value = req.body.value;
            if ((value) == 'HIGH') {
                board.digitalWrite(ledPin, board.HIGH);
                res.status(200);  
            } else {
                board.digitalWrite(ledPin, board.LOW);
                res.status(200);  
            } 
        });

        io.sockets.on('connection', function (socket) {
            setInterval(function () {
                socket.broadcast.emit("temperatuur", 'Temp : ' + pressureBoard.getCurrentTemp() + '°C');
                socket.broadcast.emit("luchtdruk", 'Druk : ' + pressureBoard.getCurrentPress() + 'kPa');
                socket.broadcast.emit("hoogte", 'Hoogte : ' + pressureBoard.getCurrentAltitude() + 'cm');

            }, 10000);
        });
       
        console.log('Board Ready plotting');
    }
});


// initialize the plotly graph
plotly.plot(initdata, layout, function (err, msg) {
    if (err) return console.log(err);
    console.log(msg);
    //once it's initialized, create a plotly stream to pipe your data!
    console.log('Check1');
        
    var streamTemp = plotly.stream('9np05kx444', function (err, res) 
    {
        console.log(err, res);
        console.log("stream clossed");
        clearInterval(loop);  
    });
    var streamPress = plotly.stream('3joif1t1q4', function (err, res) {
        console.log(err, res);
        console.log("stream closed");
    });
    var streamAltitude = plotly.stream('97go390uxk', function (err, res) {
        console.log(err, res);
        console.log("stream closed");
    });

    var loop = setInterval(function() {
        if (pressureBoard !== undefined) {
            var streamObjectTemp = JSON.stringify({ x : new Date(), y : pressureBoard.getCurrentTemp()});
            console.log(streamObjectTemp);
            var streamObjectPress = JSON.stringify({ x : new Date(), y : pressureBoard.getCurrentPress()});
            console.log(streamObjectPress);
            var streamObjectAltitude = JSON.stringify({ x : new Date(), y : pressureBoard.getCurrentAltitude()});
            console.log(streamObjectAltitude);
        }
        streamTemp.write(streamObjectTemp+'\n');
        streamPress.write(streamObjectPress+'\n');
        streamAltitude.write(streamObjectAltitude+'\n');
    },60000);  
});            

            


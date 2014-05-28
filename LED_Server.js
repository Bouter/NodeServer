"use strict";
var express = require('express');
var app = express();
var qString = require('querystring');
var firmata = require('firmata');
var plotly = require('plotly')('DavidB', 'f0103o7ziw');
var bmp180 = require('./BMP180');
var bodyParser = require('body-parser');

var initdata = [{name:"Temp",x:[], y:[], stream:{token:'9np05kx444'}},
                {name:"Airpress",x:[], y:[], stream:{token:'3joif1t1q4'}},
                {name:"Altitude",x:[], y:[], stream:{token:'97go390uxk'}}];
var layout = {fileopt : "overwrite", filename : "Humidity2a!"};
var ledPin = 7;
var analogPin = 3;
var data;
var datapress;
var pressureBoard;
var streamTemp;
var streamPress;
var streamAltitude;
var i = 0;

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

       /* io.sockets.on('connection', function (socket) {
            setInterval(function () {
                socket.broadcast.emit("temperatuur", 'Temp : ' + pressureBoard.getCurrentTemp() + '°C');
                socket.broadcast.emit("luchtdruk", 'Druk : ' + pressureBoard.getCurrentPress() + 'kPa');
                socket.broadcast.emit("hoogte", 'Hoogte : ' + pressureBoard.getCurrentAltitude() + 'cm');

            }, 10000);
        });*/
    
    plotly.plot(initdata, layout, function (err, msg) {
        if (err) return console.log(err);
        console.log(msg);
        //once it's initialized, create a plotly stream to pipe your data!
            
        streamTemp = plotly.stream('9np05kx444', function (err, res) 
        {
            console.log(err, res);
            console.log("stream closed");
            clearInterval(loop);  
        });
        streamPress = plotly.stream('3joif1t1q4', function (err, res) {
            console.log(err, res);
            console.log("stream closed");
        });
        streamAltitude = plotly.stream('97go390uxk', function (err, res) {
            console.log(err, res);
            console.log("stream closed");
        });
        var loop = setInterval(function() {
        if (pressureBoard !== undefined) {
            var streamObjectTemp = JSON.stringify({ x : new Date(), y : Math.round(pressureBoard.getCurrentTemp())});
            console.log(streamObjectTemp);
            streamTemp.write(streamObjectTemp+'\n');
            var streamObjectPress = JSON.stringify({ x : new Date(), y : Math.round(pressureBoard.getCurrentPress())});
            console.log(streamObjectPress);
            streamPress.write(streamObjectPress+'\n');
            var streamObjectAltitude = JSON.stringify({ x : new Date(), y : Math.round(pressureBoard.getCurrentAltitude())});
            console.log(streamObjectAltitude);
            streamAltitude.write(streamObjectAltitude+'\n');
            i++;
        };      
    },360000);             
    }); 

    

        console.log('Board Ready plotting');
    }
});


// initialize the plotly graph



            


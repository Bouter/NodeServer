"use strict";
var express = require('express');
var app = express();
var qString = require('querystring');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var firmata = require('firmata');
var plotly = require('plotly')('DavidB', 'r8j18wgs33');
var bmp180 = require('./BMP180');
var fs = require('fs');
var initdata = [{x:[], y:[], stream:{token:'9np05kx444', maxpoints:200}}];
var layout = {fileopt : "extend", filename : "Humidity2!"};
var ledPin = 7;
var analogPin = 3;
var data;
var datapress;
var pressureBoard;

var board = new firmata.Board("../../../../../dev/ttyATH0",function(err) {
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
        server.listen(8080);
        function app(request, response) {
            var urlObject = qString.parse(request.url.split("?")[1]);

            console.log(urlObject.value);

            if ((urlObject.value) == 'HIGH') {
                board.digitalWrite(ledPin, board.HIGH);
            } else {
                board.digitalWrite(ledPin, board.LOW);
            }

            fs.readFile(__dirname + '/index2.html',
                function(err,data) {
                    if (err) {
                        response.writeHead(500);
                        response.end('Error loading');
                    }
                    
                
            response.writeHead(200);
            response.end(data);
            //response.write("temp: " + pressureBoard.getCurrentTemp() + "C <br>");
            //response.write("pressure: " + pressureBoard.getCurrentPress());
            }
        );
        }

        io.sockets.on('connection', function (socket) {
            socket.on('clientMessage',function(content){
                socket.broadcast.emit("serverMessage", 'Temp : ' + pressureBoard.getCurrentTemp());

            }); 
        });
        console.log('Listening on port 8080 ...');
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
            


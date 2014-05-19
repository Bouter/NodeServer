var qString = require('querystring');
var http = require('http');
var firmata = require('firmata');
var plotly = require('plotly')('DavidB', 'r8j18wgs33');

var initdata = [{x:[], y:[], stream:{token:'9np05kx444', maxpoints:200}}];
var layout = {fileopt : "extend", filename : "Humidity2!"};
var ledPin = 7;
var analogPin = 3;
var data;
var datapress;

var board = new firmata.Board("../../../../../dev/ttyATH0",function(err) {
    if (err) {
        console.log(err);
        board.reset();
        return;
    } else {
        console.log('connected');
        board.sendI2CConfig(500);
        board.pins[board.analogPins[4]];
        board.sendI2CWriteRequest(0x77,[0xF6]);
        board.sendI2CReadRequest(0x77,2,function(press){
            datapress = {x : new Date(), y : press};
            console.log(press);
        });
        board.pinMode(ledPin, board.MODES.OUTPUT);
        board.pinMode(analogPin,board.MODES.ANALOG);
        //Read analog pin 3
        board.analogRead(analogPin, function (val) {  
            data = {x : new Date() , y : val};
        });
       
        http.createServer(function (request, response) {
            var urlObject = qString.parse(request.url.split("?")[1]);

            console.log(urlObject.value);

            if ((urlObject.value) == 'HIGH') {
                board.digitalWrite(ledPin, board.HIGH);
            } else {
                board.digitalWrite(ledPin, board.LOW);
            }
            response.writeHead(200);
            response.write("Hello this is David");
            response.end();
        }).listen(8080);
        console.log('Listening on port 8080 ...');
        console.log('Board Ready plotting');
    }
});

// initialize the plotly graph
plotly.plot(initdata,layout,function (err, msg)
{
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
        var streamObject2 = JSON.stringify(datapress);
        console.log(streamObject);
        console.log(streamObject2);
        stream1.write(streamObject+'\n');
    },5000);  
});            

            


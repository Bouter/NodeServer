console.log('blink start ...');
var plotly = require('plotly')('DavidB', 'z9j0at0kzp');
var data = [{x:[], y:[], stream:{token:'3joif1t1q4', maxpoints:200}}];
var layout = {fileopt : "extend", filename : "Humidity!"};
var ledPin = 7;
var analogPin = 3;
var time = new Date();
var Stream = require('stream');
var Weer_stream = new Stream();
var firmata = require('firmata');
var board = new firmata.Board("../../../../../dev/ttyATH0",function(err) {
    if (err) {
        console.log(err);
        board.reset();
        return;
    } else {
        console.log('connected');
        
        board.pins[board.analogPins[3]];

        //console.log('Firmware: ' + board.firmware.name + '-' + board.firmware.v$

        board.pinMode(ledPin, board.MODES.OUTPUT);
        board.pinMode(analogPin,board.MODES.ANALOG)
        //setInterval(function(){
        board.analogRead(analogPin, function(val){
                //console.log(val);
                //console.log('Read');
                //clearInterval(loop);
           
        
                    var data = {
                    x : time,
                    y : val
                     };
                //console.log(data);
                // write the data to the plotly stream
                //stream.write(JSON.stringify(data)+'\n');
                
                
               // },5000);   
         });
        var strings = require('querystring');
        var http = require('http');
        http.createServer(function(request, response){
            console.log(strings.parse(request.url).value);
            if ((strings.parse(request.url).value) == 'HIGH'){
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
            
    // Set how often to Emit data to Plotly
  setInterval(function() {
    Weer_stream.emit('data', JSON.stringify(data)+'\n');
  }, 5000);


// initialize the plotly graph
plotly.plot(data,layout,function (err, res) {
    if (err)
    {
        console.log(err);
        console.log(res);
    } 
    //once it's initialized, create a plotly stream to pipe your data!
    console.log('Check1');
                

    var stream1 = plotly.stream('3joif1t1q4', function (err, res) {
        if (err) 
        {
            console.log(err);
        }
        else 
        {
            console.log(res);
        }
                    
    });
        //this gets called each time there is a new sensor reading!!
        //setInterval(function() {
            //var streamObject = JSON.stringify(data);
            //console.log(streamObject);
            //stream1.write(streamObject+'\n');
        // },1000);
         Weer_stream.pipe(stream1);      
                //stream1.write(streamObject+'\n');
    
                console.log('check2');

                
});            
   // });
//});

}
});



            


console.log('blink start ...');
var plotly = require('plotly')('DavidB', 'z9j0at0kzp');
var data = [{x:[], y:[], stream:{token:'3joif1t1q4', maxpoints:200}}];
var layout = {fileopt : "extend", filename : "Humidity!"};
var ledPin = 7;
var firmata = require('firmata');
var board = new firmata.Board("../../../../../dev/ttyATH0",function(err) {
    if (err) {
        console.log(err);
        board.reset();
        return;
    } else {
        console.log('connected');
        
        

        //console.log('Firmware: ' + board.firmware.name + '-' + board.firmware.v$

        board.pinMode(ledPin, board.MODES.OUTPUT);
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
        

}
});
board.on("ready", function() {

            console.log('Board Ready plotting');
            // initialize the plotly graph
            plotly.plot(data,layout,function (err, res) {
                if (err) console.log(err);
                    console.log(res);
                //once it's initialized, create a plotly stream
                //to pipe your data!
                console.log('Check1');
                

                var stream = plotly.stream('3joif1t1q4', function (err, res) {
                    if (err) console.log(err);
                    console.log(res);
                    // this gets called each time there is a new sensor reading!!
                //board.analogRead(board.A0, function(val){
                //console.log(val);
                console.log('Read');
                clearInterval(loop);
            });
                var i = 0;
                var loop = setInterval(function(){
                    //var data = {
                   // x : getDateString(),
                    //y : val
                    // };
                //console.log(data);
                // write the data to the plotly stream
                //stream.write(JSON.stringify(data)+'\n');
                var streamObject = JSON.stringify({ x : i, y : i });
                stream.write(streamObject+'\n');
                i++;
                },5000);   
                //});
                console.log('check2');

                
                });
                
   // });
});
function getDateString () {
var time = new Date();
  // 14400000 is (GMT-4 Montreal)
  // for your timezone just multiply +/-GMT by 3600000
  var datestr = new Date(time - 14400000).toISOString().replace(/T/, ' ').repla$
  return datestr;
}

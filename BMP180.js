var app = {
	currentTemp: "",
	init: function (board) {
		app.board = board;
		requestTemperature();
	},
	getCurrentTemp : function () {
		requestTemperature();
		return app.currentTemp;
	},
	
}

var getCalculatedTemperature = function (temp) {
	return temp;
};

var requestTemperature = function () {
	app.board.sendI2CWriteRequest(0x77,[0xF6]);
	app.board.sendI2CReadRequest(0x77,2,function(temp){
		console.log(press);
		app.currentTemp = getCalculatedTemperature(temp);
    });
    
}

module.exports = app;
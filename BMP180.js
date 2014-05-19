var app = {
	init: function (board) {
		app.board = board;
	},
	requestTemperature: function () {
		var datapress;
		app.board.sendI2CWriteRequest(0x77,[0x2E]);
		app.board.sendI2CReadRequest(0x77,2,function(temp){
			var press = app.getCalculatedTemperature(temp);
            datapress = {x : new Date(), y : press};
            console.log(press);
        });
        return datapress;
	}
}

app.prototype.getCalculatedTemperature = function (temp) {
	return temp;
};

exports.module = app;
var getCalculatedTemperature = function (temp) {
	return temp;
};

function Bmp180(board){
	this.board = board;
	this.currentTemp = 0;

	this.requestTemperature();
}

Bmp180.prototype = {
	requestTemperature: function () {
		this.board.sendI2CWriteRequest(0x77,[0xF6]);
		this.board.sendI2CReadRequest(0x77,2,function(temp){
			console.log(temp);
			this.currentTemp = getCalculatedTemperature(temp);
	  	});
	},
	getCurrentTemp: function () {
		this.requestTemperature();
		return this.currentTemp;
	}
}


module.exports = Bmp180;